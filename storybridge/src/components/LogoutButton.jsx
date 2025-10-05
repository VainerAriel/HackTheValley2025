import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="w-full bg-brand-brown hover:bg-brand-brown-dark text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-brand-brown-dark"
    >
      Log Out
    </button>
  );
};

export default LogoutButton;
