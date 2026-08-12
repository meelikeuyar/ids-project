import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-cyber-bg">
        <div className="text-center">
          <h1 className="font-display text-xl text-cyber-red tracking-widest">ACCESS DENIED</h1>
          <p className="font-mono text-xs text-cyber-muted mt-2">
            Required role: {roles.join(' or ')}
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
