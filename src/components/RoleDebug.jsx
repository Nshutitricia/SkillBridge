import { useAuth } from '../contexts/AuthContext';

export default function RoleDebug() {
  const { user, isAdmin, loading, userProfile } = useAuth();

  return (
    <div className="p-4 bg-gray-100 border rounded">
      <h3 className="text-lg font-bold mb-2">Role Debug Info</h3>
      <p><strong>User Email:</strong> {user?.email || 'Not logged in'}</p>
      <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
      <p><strong>Is Admin:</strong> {isAdmin ? 'YES' : 'NO'}</p>
      <p><strong>Loading:</strong> {loading ? 'YES' : 'NO'}</p>
      <p><strong>User Profile:</strong> {userProfile ? 'Loaded' : 'Not loaded'}</p>
      <p><strong>Profile ID:</strong> {userProfile?.id || 'N/A'}</p>
    </div>
  );
}
