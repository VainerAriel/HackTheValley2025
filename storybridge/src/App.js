import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import SnowflakeTest from './components/SnowflakeTest';
import Profile from './components/Profile';

function App() {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Welcome to StoryBridge
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your clean React app with Tailwind CSS and Auth0 is ready!
          </p>
        </div>
        
        {isAuthenticated ? (
          <div className="space-y-6">
            <Profile />
            <SnowflakeTest />
            <LogoutButton />
          </div>
        ) : (
          <LoginButton />
        )}
      </div>
    </div>
  );
}

export default App;
