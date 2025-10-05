import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { getUserStories, deleteStory } from '../services/storyService';
import LogoutButton from './LogoutButton';
import storybitesLogo from '../images/storybites.png';

const StoryHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [stories, setStories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingStoryId, setDeletingStoryId] = React.useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(null);

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

  const handleDeleteStory = async (storyId) => {
    try {
      setDeletingStoryId(storyId);
      await deleteStory(storyId);
      
      // Remove the story from the local state
      setStories(prevStories => prevStories.filter(story => story.STORY_ID !== storyId));
      setShowDeleteConfirm(null);
      
      console.log('Story deleted successfully');
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story. Please try again.');
    } finally {
      setDeletingStoryId(null);
    }
  };

  const handleDeleteClick = (storyId, event) => {
    event.stopPropagation(); // Prevent triggering the story view
    setShowDeleteConfirm(storyId);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
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
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-cream-300">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
            <span className="ml-3 text-gray-600">Loading your stories...</span>
          </div>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-cream-300">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-brand-brown-dark mb-4">No Stories Yet</h2>
          <p className="text-gray-600 mb-6">
            Start creating personalized stories for your child!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            ✨ Create Your First Story
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col border-r border-cream-300 sticky top-0 h-screen z-40" style={{top: '6rem'}}>
        <div className="p-6 border-b border-cream-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center p-1">
                <img src={storybitesLogo} alt="StoryBites Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-brown-dark">StoryBites</h2>
                <p className="text-sm text-gray-600 mt-1">Your Story Collection</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <button
            onClick={() => navigate('/')}
            className="w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors text-brand-brown hover:bg-cream-100"
          >
            ✨ Generate New Story
          </button>
          
          <button
            onClick={() => navigate('/history')}
            className="w-full text-left px-4 py-3 rounded-lg transition-colors bg-brand-blue text-white font-semibold shadow-md"
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
              <h1 className="text-3xl font-bold text-brand-brown-dark mb-2">Your Story Collection</h1>
              <p className="text-gray-600">Browse and revisit your created stories</p>
            </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.filter(story => story && story.STORY_ID).map((story, index) => (
          <div
            key={story.STORY_ID || index}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer group border border-cream-300"
            onClick={() => handleViewStory(story)}
          >
            <div className="p-6">
              {/* Story Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-brand-brown-dark group-hover:text-brand-blue transition-colors">
                    {story.STORY_TITLE || `Story #${index + 1}`}
                  </h3>
                  <p className="text-sm text-gray-500">Personalized Story</p>
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

              {/* Themes Tags */}
              {story.INTERESTS && story.INTERESTS.trim() && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {story.INTERESTS.split(',').filter(theme => theme.trim()).map((theme, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-cream-200 text-brand-brown text-xs rounded-full"
                      >
                        {theme.trim()}
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
                        className="px-2 py-1 bg-blue-100 text-brand-blue-dark text-xs rounded"
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

              {/* Action Buttons */}
              <div className="pt-4 border-t border-cream-200">
                <button 
                  className="w-full py-2 text-brand-blue font-semibold text-sm hover:text-brand-blue-dark transition-colors mb-2"
                  onClick={() => handleViewStory(story)}
                >
                  📖 Read Story
                </button>
                <button 
                  className="w-full py-2 text-red-600 font-semibold text-sm hover:text-red-700 transition-colors"
                  onClick={(e) => handleDeleteClick(story.STORY_ID, e)}
                  disabled={deletingStoryId === story.STORY_ID}
                >
                  {deletingStoryId === story.STORY_ID ? '🗑️ Deleting...' : '🗑️ Delete Story'}
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
                className="px-8 py-4 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                ✨ Create New Story
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 border border-cream-300">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-brand-brown-dark mb-4">
                Delete Story?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this story? This action cannot be undone.
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCancelDelete}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteStory(showDeleteConfirm)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Delete Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryHistory;
