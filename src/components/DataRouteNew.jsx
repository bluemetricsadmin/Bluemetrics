import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContextNew';

const DataRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario tiene rol 'admin', permitir acceso completo
  if (user.role === 'admin') {
    return children;
  }

  // Si el usuario tiene rol 'datos', permitir acceso solo a secciones de datos
  if (user.role === 'datos') {
    return children;
  }
  // Si el usuario tiene rol 'datos', permitir acceso solo a secciones de datos
  if (user.role === 'water') {
    return children;
    
  }

  // Para otros roles, denegar acceso
  return <Navigate to="/dashboard" replace />;
};

export default DataRoute;
