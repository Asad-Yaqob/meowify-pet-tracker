import { Navigate } from "react-router";
import { useAuth } from "src/context/auth/AuthContext";
import CardBox from "src/components/shared/CardBox";
import AuthLogin from "../authforms/AuthLogin";
import FullLogo from "src/layouts/full/shared/logo/FullLogo";
import Spinner from "src/views/spinner/Spinner";

const Login = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/portal/dashboard" />;
  }

  return (
    <div className="relative overflow-hidden h-screen bg-lightprimary dark:bg-darkprimary">
      <div className="flex h-full justify-center items-center px-4">
        <CardBox className="md:w-[450px] w-full border-none shadow-xl rounded-2xl bg-card p-8">
          <div className="mx-auto mb-6 flex justify-center">
            <FullLogo />
          </div>
          <AuthLogin />
        </CardBox>
      </div>
    </div>
  );
};

export default Login;
