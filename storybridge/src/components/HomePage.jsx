import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import VocabularyModal from './VocabularyModal';
import StoriesModal from './StoriesModal';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">StoryBites</h1>
                <p className="text-sm text-gray-600">Your personalized learning journey</p>
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {getGreeting()}! 👋
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome back to your personalized story learning adventure. Ready to discover new words and create amazing stories?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => setShowVocabularyModal(true)}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Words Learned</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-4xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">{stats.wordsLearned}</p>
                )}
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-2xl">📚</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4 group-hover:text-gray-600 transition-colors">
              Click to view all your vocabulary words with definitions!
            </p>
          </button>

          <button
            onClick={() => setShowStoriesModal(true)}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Stories Generated</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-4xl font-bold text-green-600 group-hover:text-green-700 transition-colors">{stats.storiesGenerated}</p>
                )}
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">✨</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4 group-hover:text-gray-600 transition-colors">
              Click to view all your created stories!
            </p>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">What would you like to do today?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generate New Story */}
            <button
              onClick={() => navigate('/create')}
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">✨</span>
                </div>
                <h4 className="text-xl font-bold mb-2">Generate New Story</h4>
                <p className="text-blue-100 text-sm">
                  Create a personalized story with new vocabulary words
                </p>
              </div>
            </button>

            {/* User Profile */}
            <button
              onClick={() => navigate('/profile')}
              className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">👤</span>
                </div>
                <h4 className="text-xl font-bold mb-2">User Profile</h4>
                <p className="text-purple-100 text-sm">
                  Manage your profile and learning preferences
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity or Tips */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">💡 Learning Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Practice Regularly</h4>
                <p className="text-gray-600 text-sm">Generate stories daily to build your vocabulary consistently.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Review Your Stories</h4>
                <p className="text-gray-600 text-sm">Revisit old stories to reinforce vocabulary learning.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Use Audio Features</h4>
                <p className="text-gray-600 text-sm">Listen to your stories to improve pronunciation and comprehension.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 text-sm">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Share Your Progress</h4>
                <p className="text-gray-600 text-sm">Track your learning journey and celebrate your achievements!</p>
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
