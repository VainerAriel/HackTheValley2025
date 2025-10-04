import React from 'react';
import LoginButton from './LoginButton.jsx';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to StoryBridge
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Create personalized stories for young readers
        </p>
        <LoginButton />
      </div>
    </div>
  );
};

export default LoginPage;
