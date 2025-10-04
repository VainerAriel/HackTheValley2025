import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { getUserStories } from '../services/storyService';
import LogoutButton from './LogoutButton';

const StoryHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [stories, setStories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Load stories on component mount
  React.useEffect(() => {
    const loadStories = async () => {
      if (!user?.sub) return;
      
      setLoading(true);
      try {
        console.log('Loading story history for user:', user.sub);
        const storiesData = await getUserStories(user.sub);
        console.log('Loaded stories:', storiesData.length, storiesData);
        setStories(storiesData);
      } catch (error) {
        console.error('Error loading story history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, [user?.sub]);

  const handleViewStory = (story) => {
    navigate(`/story/${story.STORY_ID}`);
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || typeof text !== 'string') return 'No story text available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Debug: Log the stories data
  console.log('StoryHistory - stories data:', stories);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading your stories...</span>
          </div>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Stories Yet</h2>
          <p className="text-gray-600 mb-6">
            Start creating personalized stories for your child!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
          >
            ✨ Create Your First Story
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">StoryBridge</h2>
              <p className="text-sm text-gray-600 mt-1">Your Story Collection</p>
            </div>
            <LogoutButton />
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <button
            onClick={() => navigate('/')}
            className="w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors text-gray-600 hover:bg-gray-100"
          >
            ✨ Generate New Story
          </button>
          
          <button
            onClick={() => navigate('/history')}
            className="w-full text-left px-4 py-3 rounded-lg transition-colors bg-purple-100 text-purple-700 font-semibold"
          >
            📚 Story History ({stories.length})
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Story Collection</h1>
              <p className="text-gray-600">Browse and revisit your created stories</p>
            </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.filter(story => story && story.STORY_ID).map((story, index) => (
          <div
            key={story.STORY_ID || index}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
            onClick={() => handleViewStory(story)}
          >
            <div className="p-6">
              {/* Story Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                    Story #{index + 1}
                  </h3>
                  <p className="text-sm text-gray-500">Generated Story</p>
                </div>
                <span className="text-xs text-gray-400">
                  {story.CREATED_AT ? formatDate(story.CREATED_AT) : 'Unknown date'}
                </span>
              </div>

              {/* Story Preview */}
              <div className="mb-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {truncateText(story.STORY_TEXT)}
                </p>
              </div>

              {/* Interests Tags */}
              {story.INTERESTS && story.INTERESTS.trim() && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {story.INTERESTS.split(',').filter(interest => interest.trim()).map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        {interest.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary Words */}
              {story.VOCAB_WORDS && story.VOCAB_WORDS.trim() && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Vocabulary Words:</p>
                  <div className="flex flex-wrap gap-1">
                    {story.VOCAB_WORDS.split(',').filter(word => word.trim()).slice(0, 3).map((word, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {word.trim()}
                      </span>
                    ))}
                    {story.VOCAB_WORDS.split(',').filter(word => word.trim()).length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{story.VOCAB_WORDS.split(',').filter(word => word.trim()).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* View Button */}
              <div className="pt-4 border-t border-gray-100">
                <button className="w-full py-2 text-purple-600 font-semibold text-sm hover:text-purple-700 transition-colors">
                  📖 Read Story
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

            {/* Generate New Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              >
                ✨ Create New Story
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryHistory;
