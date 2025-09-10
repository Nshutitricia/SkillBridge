
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkUserRole = (user) => {
      if (!user) {
        setIsAdmin(false);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      console.log('Checking role for user:', user.email, user.id);

      // Get user profile first
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data: profile, error: profileError }) => {
          if (isMounted) {
            if (profileError) {
              console.error('Error fetching user profile:', profileError);
              console.log('Profile error details:', profileError);
              
              // If it's a permission error, try a different approach
              if (profileError.code === 'PGRST301' || profileError.message.includes('permission') || profileError.code === 'PGRST205') {
                console.log('Permission/RLS error - trying alternative approach');
                // Try to get role from user metadata
                const userRole = user.user_metadata?.role || user.app_metadata?.role;
                console.log('User role from metadata:', userRole);
                setIsAdmin(userRole === 'admin');
                setUserProfile(null);
              } else {
                setIsAdmin(false);
                setUserProfile(null);
              }
              setLoading(false);
              return;
            }

            setUserProfile(profile);
            console.log('User profile loaded:', profile);

            // Check if user role is admin
            const isUserAdmin = profile.role === 'admin';
            console.log('User role from profile:', profile.role);
            console.log('Is admin:', isUserAdmin);
            
            setIsAdmin(isUserAdmin);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error('Error checking user role:', err);
            setIsAdmin(false);
            setUserProfile(null);
            setLoading(false);
          }
        });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setUser(data?.session?.user || null);
        checkUserRole(data?.session?.user);
      }
    });

    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.log('Auth timeout - setting loading to false');
        setLoading(false);
      }
    }, 5000);
    
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user || null);
        checkUserRole(session?.user);
      }
    });
    
    return () => {
      isMounted = false;
      clearTimeout(timeout);
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Function to get redirect path based on user role
  const getRedirectPath = () => {
    if (!user) return '/signin';
    if (isAdmin) return '/admin/dashboard';
    return '/home';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      setUser, 
      isAdmin, 
      userProfile, 
      getRedirectPath 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
