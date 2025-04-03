import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SignIn from './SignIn';
import Dashboard from './Dashboard';
import Background from './Background';

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
