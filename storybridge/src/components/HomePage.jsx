import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import VocabularyModal from './VocabularyModal';
import StoriesModal from './StoriesModal';
import storybitesLogo from '../images/storybites.png';
import bookImage from '../images/book.png';

const HomePage = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ wordsLearned: 0, storiesGenerated: 0 });
  const [loading, setLoading] = useState(true);
  const [showVocabularyModal, setShowVocabularyModal] = useState(false);
  const [showStoriesModal, setShowStoriesModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://api.storybites.vip`,
          scope: "openid profile email"
        }
      });
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(user.sub)}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDisplayName = () => {
    return user?.name || user?.nickname || user?.email || 'User';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 shadow-sm border-b border-amber-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center p-1">
                <img src={storybitesLogo} alt="StoryBites Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-700 to-amber-800 bg-clip-text text-transparent">StoryBites</h1>
                <p className="text-sm text-amber-800">Your personalized learning journey</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-medium text-gray-900">{getDisplayName()}</p>
              </div>
              <div className="flex items-center space-x-2">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-12 bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {getGreeting()}, {getDisplayName()}
              </h2>
              <p className="text-lg text-gray-600">
                Continue your personalized learning journey with interactive stories and vocabulary building.
              </p>
            </div>
            <div className="flex-shrink-0 mr-4">
              <img 
                src={bookImage} 
                alt="Story Book" 
                className="w-48 h-48 object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generate New Story */}
            <button
              onClick={() => navigate('/create')}
              className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md border border-gray-200 hover:border-orange-400 transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Create New Story</h4>
                  <p className="text-sm text-gray-600">
                    Generate a personalized story with vocabulary words
                  </p>
                </div>
              </div>
            </button>

            {/* User Profile */}
            <button
              onClick={() => navigate('/profile')}
              className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md border border-gray-200 hover:border-orange-400 transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Manage Profile</h4>
                  <p className="text-sm text-gray-600">
                    Update your profile and learning preferences
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => setShowVocabularyModal(true)}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md border border-gray-200 hover:border-orange-400 transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Vocabulary Words</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stats.wordsLearned}</p>
                )}
                <p className="text-sm text-gray-600">
                  View all words with definitions
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowStoriesModal(true)}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md border border-gray-200 hover:border-orange-400 transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Stories Created</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stats.storiesGenerated}</p>
                )}
                <p className="text-sm text-gray-600">
                  Browse your story library
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Learning Tips */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Learning Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Read & Listen Together</h4>
                <p className="text-gray-600 text-sm">Follow along with the audio as you read to strengthen word recognition and comprehension.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Explore New Topics</h4>
                <p className="text-gray-600 text-sm">Choose different story themes to expand your vocabulary and spark curiosity.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Pause & Practice</h4>
                <p className="text-gray-600 text-sm">Stop after tricky words to repeat them aloud and boost pronunciation confidence.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Reflect & Retell</h4>
                <p className="text-gray-600 text-sm">Summarize stories in your own words to deepen understanding and improve memory.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vocabulary Modal */}
      <VocabularyModal 
        isOpen={showVocabularyModal} 
        onClose={() => setShowVocabularyModal(false)} 
      />

      {/* Stories Modal */}
      <StoriesModal 
        isOpen={showStoriesModal} 
        onClose={() => setShowStoriesModal(false)} 
      />
    </div>
  );
};

export default HomePage;
