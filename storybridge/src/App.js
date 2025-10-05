import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import LoginPage from './components/LoginPage.jsx';
import HomePage from './components/HomePage.jsx';
import Dashboard from './components/Dashboard.jsx';
import StoryView from './components/StoryView.jsx';
import UserProfile from './components/UserProfile.jsx';
import ProfileSetup from './components/ProfileSetup.jsx';

function App() {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
  const [profileCompleted, setProfileCompleted] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkProfileCompletion();
    }
  }, [isAuthenticated, user]);

  const checkProfileCompletion = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
          scope: "openid profile email"
        }
      });
      const API_BASE_URL = process.env.REACT_APP_API_URL || '';

      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setProfileCompleted(result.data.profileCompleted === true);
      } else {
        // If profile doesn't exist, show setup
        setProfileCompleted(false);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setProfileCompleted(false);
    }
  };

  const handleProfileComplete = () => {
    // After profile setup, reload to get the fresh token with updated claims
    window.location.reload();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show profile setup if profile is not completed
  if (profileCompleted === false) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  // Still checking profile status
  if (profileCompleted === null) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/story/:storyId" element={<StoryView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;