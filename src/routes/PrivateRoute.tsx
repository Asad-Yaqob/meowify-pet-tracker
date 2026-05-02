import { Navigate, Outlet } from 'react-router';
import { useAuth } from 'src/context/auth/AuthContext';
import Spinner from 'src/views/spinner/Spinner';

const PrivateRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Spinner />;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/portal/login" />;
};

export default PrivateRoute;
