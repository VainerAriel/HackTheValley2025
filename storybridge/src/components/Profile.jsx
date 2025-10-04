import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    isAuthenticated && (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-md mx-auto">
        <div className="flex flex-col items-center text-center">
          <img
            src={user.picture}
            alt={user.name}
            className="w-20 h-20 rounded-full mb-4 border-4 border-gray-200"
          />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{user.name}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
    )
  );
};

export default Profile;
