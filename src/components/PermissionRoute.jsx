import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContextNew';
import { usePermissions } from '../hooks/usePermissions';

const PermissionRoute = ({ children, permission, deniedRoles = [] }) => {
  const { user, loading } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (deniedRoles.includes(user.role) || (permission && !can(permission))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-2">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tu rol actual: <strong className="text-gray-900">{user.role}</strong>
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default PermissionRoute;
