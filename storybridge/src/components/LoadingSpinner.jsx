import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-blue"></div>
        <p className="mt-4 text-lg text-brand-brown">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
