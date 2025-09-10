import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // If not logged in, redirect to signin
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // If logged in but not admin, redirect to home
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // If admin, show the protected content
  return children;
}
