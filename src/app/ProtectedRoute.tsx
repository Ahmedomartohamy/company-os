import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/auth/AuthProvider';

export default function ProtectedRoute() {
  const { loading, session } = useAuth();
  if (loading) return <div className="p-6 text-center">جاري التحميل...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
