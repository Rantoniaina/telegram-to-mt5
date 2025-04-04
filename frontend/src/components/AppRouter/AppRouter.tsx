import { useAuth } from '../../context/AuthContext';
import Background from '../Background';
import Dashboard from '../Dashboard';
import SignIn from '../SignIn';

const AppRouter = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <Background>
          <SignIn />
        </Background>
      )}
    </>
  );
};

export default AppRouter;
