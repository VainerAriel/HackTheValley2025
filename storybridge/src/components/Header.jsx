import React from 'react';
import Profile from './Profile.jsx';
import LogoutButton from './LogoutButton.jsx';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-3xl font-bold text-gray-900">StoryBridge</h1>
          <div className="flex items-center space-x-4">
            <Profile />
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
