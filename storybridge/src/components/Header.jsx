import React from 'react';
import Profile from './Profile.jsx';
import LogoutButton from './LogoutButton.jsx';
import storybitesLogo from '../images/storybites.png';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center p-1">
              <img src={storybitesLogo} alt="StoryBites Logo" className="w-full h-full object-contain" />
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
