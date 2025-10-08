import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Debug: Log environment variables
console.log('REACT_APP_AUTH0_DOMAIN:', process.env.REACT_APP_AUTH0_DOMAIN);
console.log('REACT_APP_AUTH0_CLIENT_ID:', process.env.REACT_APP_AUTH0_CLIENT_ID);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: `https://api.storybites.vip`,
        scope: "openid profile email read:current_user update:current_user_metadata"
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);