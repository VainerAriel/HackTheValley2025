import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import VocabularyModal from './VocabularyModal';
import StoriesModal from './StoriesModal';
import storybitesLogo from '../images/storybites.png';

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
          audience: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
          scope: "openid profile email"
        }
      });

      const response = await fetch(`http://localhost:5000/api/user/${encodeURIComponent(user.sub)}/stats`, {
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
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-600 bg-clip-text text-transparent mb-4">
            {getGreeting()}! 
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Welcome back to your personalized story learning adventure. Ready to discover new words and create amazing stories?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-amber-900 mb-8 text-center">What would you like to do today?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generate New Story */}
            <button
              onClick={() => navigate('/create')}
              className="group bg-gradient-to-r from-orange-600 to-orange-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-60 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">✨</span>
                </div>
                <h4 className="text-xl font-bold mb-2">Generate New Story</h4>
                <p className="text-orange-100 text-sm">
                  Create a personalized story with new vocabulary words
                </p>
              </div>
            </button>

            {/* User Profile */}
            <button
              onClick={() => navigate('/profile')}
              className="group bg-gradient-to-r from-orange-600 to-orange-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-60 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">👤</span>
                </div>
                <h4 className="text-xl font-bold mb-2">User Profile</h4>
                <p className="text-orange-100 text-sm">
                  Manage your profile and learning preferences
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <h3 className="text-2xl font-bold text-amber-900 mb-8 text-center">Learning Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => setShowVocabularyModal(true)}
            className="bg-white rounded-2xl shadow-lg p-8 border border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Words Learned</p>
                {loading ? (
                  <div className="animate-pulse bg-orange-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-4xl font-bold text-orange-600 group-hover:text-orange-700 transition-colors">{stats.wordsLearned}</p>
                )}
              </div>
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <span className="text-2xl">📚</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 group-hover:text-gray-700 transition-colors">
              Click to view all your vocabulary words with definitions!
            </p>
          </button>

          <button
            onClick={() => setShowStoriesModal(true)}
            className="bg-white rounded-2xl shadow-lg p-8 border border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Stories Generated</p>
                {loading ? (
                  <div className="animate-pulse bg-orange-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-4xl font-bold text-orange-700 group-hover:text-orange-800 transition-colors">{stats.storiesGenerated}</p>
                )}
              </div>
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <span className="text-2xl">✨</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 group-hover:text-gray-700 transition-colors">
              Click to view all your created stories!
            </p>
          </button>
        </div>

        {/* Recent Activity or Tips */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-200">
          <h3 className="text-xl font-bold text-amber-900 mb-6">💡 Learning Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-amber-700 text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">Practice Regularly</h4>
                <p className="text-amber-800 text-sm">Generate stories daily to build your vocabulary consistently.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-700 text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">Review Your Stories</h4>
                <p className="text-amber-800 text-sm">Revisit old stories to reinforce vocabulary learning.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-amber-700 text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">Use Audio Features</h4>
                <p className="text-amber-800 text-sm">Listen to your stories to improve pronunciation and comprehension.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-700 text-sm">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">Share Your Progress</h4>
                <p className="text-amber-800 text-sm">Track your learning journey and celebrate your achievements!</p>
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
