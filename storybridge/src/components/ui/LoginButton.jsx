import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <button
      onClick={() => loginWithRedirect()}
      data-login-button
      className="bg-brand-brown hover:bg-brand-brown-dark text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-brand-brown-dark"
    >
      Sign In
    </button>
  );
};

export default LoginButton;
