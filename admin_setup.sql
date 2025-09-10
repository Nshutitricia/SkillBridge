-- Admin System Setup for SkillBridge
-- Run this in your Supabase SQL Editor

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role_name VARCHAR(50) NOT NULL CHECK (role_name IN ('admin', 'user', 'moderator')),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_name)
);

-- 2. Create admin_actions table for audit logging
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES user_profiles(id),
  action_type VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES user_profiles(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create user_segments table for user categorization
CREATE TABLE IF NOT EXISTS user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  segment_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES user_profiles(id),
  notification_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_segments_user_id ON user_segments(user_id);

-- 6. Create RLS policies for security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policy for user_roles - only admins can see all roles
CREATE POLICY "Admins can view all user roles" ON user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_name = 'admin' 
      AND ur.is_active = true
    )
  );

-- 8. RLS Policy for admin_actions - only admins can see admin actions
CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_name = 'admin' 
      AND ur.is_active = true
    )
  );

-- 9. RLS Policy for user_segments - only admins can manage segments
CREATE POLICY "Admins can manage user segments" ON user_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_name = 'admin' 
      AND ur.is_active = true
    )
  );

-- 10. RLS Policy for admin_notifications - only admins can see their notifications
CREATE POLICY "Admins can view their notifications" ON admin_notifications
  FOR SELECT USING (admin_id = auth.uid());

-- 11. Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = user_id 
    AND user_roles.role_name = 'admin' 
    AND user_roles.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role_name FROM user_roles 
    WHERE user_roles.user_id = user_id 
    AND user_roles.is_active = true 
    ORDER BY 
      CASE role_name 
        WHEN 'admin' THEN 1 
        WHEN 'moderator' THEN 2 
        WHEN 'user' THEN 3 
        ELSE 4 
      END 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to assign admin role (only for super admins)
CREATE OR REPLACE FUNCTION assign_admin_role(target_user_id UUID, assigned_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the person assigning is an admin
  IF NOT is_admin(assigned_by) THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update the admin role
  INSERT INTO user_roles (user_id, role_name, is_active)
  VALUES (target_user_id, 'admin', true)
  ON CONFLICT (user_id, role_name) 
  DO UPDATE SET is_active = true, created_at = NOW();
  
  -- Log the action
  INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
  VALUES (assigned_by, 'assign_admin_role', target_user_id, 
          jsonb_build_object('assigned_at', NOW()));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create function to remove admin role
CREATE OR REPLACE FUNCTION remove_admin_role(target_user_id UUID, removed_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the person removing is an admin
  IF NOT is_admin(removed_by) THEN
    RETURN FALSE;
  END IF;
  
  -- Update the admin role to inactive
  UPDATE user_roles 
  SET is_active = false 
  WHERE user_id = target_user_id AND role_name = 'admin';
  
  -- Log the action
  INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
  VALUES (removed_by, 'remove_admin_role', target_user_id, 
          jsonb_build_object('removed_at', NOW()));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create view for popular occupations
CREATE OR REPLACE VIEW popular_occupations AS
SELECT 
  o.csv_id,
  o.preferred_label,
  COUNT(ucg.target_occupation_id) as goal_count,
  COUNT(up.current_occupation_id) as current_count,
  (COUNT(ucg.target_occupation_id) + COUNT(up.current_occupation_id)) as total_interest
FROM occupations o
LEFT JOIN user_career_goals ucg ON o.csv_id = ucg.target_occupation_id AND ucg.status = 'active'
LEFT JOIN user_profiles up ON o.csv_id = up.current_occupation_id
GROUP BY o.csv_id, o.preferred_label
ORDER BY total_interest DESC;

-- 16. Create view for user engagement metrics
CREATE OR REPLACE VIEW user_engagement AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users,
  COUNT(CASE WHEN skill_assessment_completed = true THEN 1 END) as completed_assessments,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_onboarding,
  ROUND(
    COUNT(CASE WHEN skill_assessment_completed = true THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as assessment_rate
FROM user_profiles
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 17. Create view for skill gap analysis
CREATE OR REPLACE VIEW skill_gap_analysis AS
SELECT 
  s.csv_id as skill_id,
  s.preferred_label as skill_name,
  COUNT(us.user_id) as users_with_skill,
  COUNT(DISTINCT up.id) as total_users,
  ROUND(
    COUNT(us.user_id)::DECIMAL / 
    NULLIF(COUNT(DISTINCT up.id), 0) * 100, 2
  ) as skill_adoption_rate
FROM skills s
LEFT JOIN user_skills us ON s.csv_id = us.skill_id
LEFT JOIN user_profiles up ON TRUE
GROUP BY s.csv_id, s.preferred_label
ORDER BY skill_adoption_rate ASC;

-- 18. Insert a sample admin user (replace with actual user ID)
-- To make someone an admin, run this query with their user ID:
-- INSERT INTO user_roles (user_id, role_name) VALUES ('USER_ID_HERE', 'admin');

-- 19. Create function to get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM user_profiles),
    'completed_assessments', (SELECT COUNT(*) FROM user_profiles WHERE skill_assessment_completed = true),
    'completed_onboarding', (SELECT COUNT(*) FROM user_profiles WHERE onboarding_completed = true),
    'today_users', (SELECT COUNT(*) FROM user_profiles WHERE DATE(created_at) = CURRENT_DATE),
    'total_occupations', (SELECT COUNT(*) FROM occupations),
    'total_skills', (SELECT COUNT(*) FROM skills),
    'active_career_goals', (SELECT COUNT(*) FROM user_career_goals WHERE status = 'active')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON popular_occupations TO authenticated;
GRANT SELECT ON user_engagement TO authenticated;
GRANT SELECT ON skill_gap_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- Instructions for setting up your first admin:
-- 1. Find your user ID in the user_profiles table
-- 2. Run: INSERT INTO user_roles (user_id, role_name) VALUES ('YOUR_USER_ID', 'admin');
-- 3. You can now access /admin route in your application
