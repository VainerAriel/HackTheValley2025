import React from 'react';
import Profile from './Profile.jsx';
import LogoutButton from './LogoutButton.jsx';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
            <h1 className="text-3xl font-bold text-brand-brown-dark">StoryBites</h1>
          </div>
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
