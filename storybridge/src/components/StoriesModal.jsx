import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { deleteStory } from '../services';

const StoriesModal = ({ isOpen, onClose }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'alphabetical'
  const [deletingStoryId, setDeletingStoryId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchStories();
    }
  }, [isOpen, user]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
          scope: "openid profile email"
        }
      });

      const response = await fetch(`http://localhost:5000/api/stories/${encodeURIComponent(user.sub)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStories(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStories = () => {
    let filtered = stories.filter(story => 
      story.STORY_TITLE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.STORY_TEXT?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.INTERESTS?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => (a.STORY_TITLE || '').localeCompare(b.STORY_TITLE || ''));
    } else {
      filtered.sort((a, b) => new Date(b.CREATED_AT) - new Date(a.CREATED_AT));
    }

    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStoryPreview = (text, maxLength = 150) => {
    if (!text) return 'No preview available';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getStoryInterests = (interests) => {
    if (!interests) return [];
    return interests.split(',').filter(interest => interest.trim()).slice(0, 3);
  };

  const getStoryVocabWords = (vocabWords) => {
    if (!vocabWords) return [];
    return vocabWords.split(',').filter(word => word.trim()).slice(0, 5);
  };

  const handleViewStory = (storyId) => {
    navigate(`/story/${storyId}`);
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Story Library</h2>
            <p className="text-gray-600 mt-1">
              {stories.length} stories created so far
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-amber-600 hover:text-amber-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Sort Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search stories by title, content, or interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-gradient-to-r from-yellow-700 to-amber-800 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Most Recent
              </button>
              <button
                onClick={() => setSortBy('alphabetical')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'alphabetical'
                    ? 'bg-gradient-to-r from-yellow-700 to-amber-800 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                A-Z
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-700"></div>
              <span className="ml-3 text-gray-600">Loading your stories...</span>
            </div>
          ) : filteredAndSortedStories().length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No stories found' : 'No stories yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start creating stories to build your library!'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAndSortedStories().map((story, index) => (
                <div key={`${story.STORY_ID}-${index}`} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {story.STORY_TITLE || 'Untitled Story'}
                      </h3>
                      <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full inline-block">
                        {formatDate(story.CREATED_AT)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewStory(story.STORY_ID)}
                      className="ml-4 px-4 py-2 bg-gradient-to-r from-yellow-700 to-amber-800 text-white rounded-lg hover:from-yellow-800 hover:to-amber-900 transition-colors text-sm font-medium"
                    >
                      Read
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
                      <p className="text-gray-800 text-sm leading-relaxed">
                        {getStoryPreview(story.STORY_TEXT)}
                      </p>
                    </div>

                    {getStoryInterests(story.INTERESTS).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {getStoryInterests(story.INTERESTS).map((interest, idx) => (
                            <span
                              key={idx}
                              className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full"
                            >
                              {interest.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {getStoryVocabWords(story.VOCAB_WORDS).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Vocabulary Words</h4>
                        <div className="flex flex-wrap gap-2">
                          {getStoryVocabWords(story.VOCAB_WORDS).map((word, idx) => (
                            <span
                              key={idx}
                              className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                            >
                              {word.trim()}
                            </span>
                          ))}
                          {getStoryVocabWords(story.VOCAB_WORDS).length > 5 && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{getStoryVocabWords(story.VOCAB_WORDS).length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-amber-200">
                      <div className="text-xs text-gray-500">
                        ID: {story.STORY_ID?.substring(0, 8)}...
                      </div>
                      <button
                        onClick={(e) => handleDeleteClick(story.STORY_ID, e)}
                        disabled={deletingStoryId === story.STORY_ID}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-sm font-medium rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingStoryId === story.STORY_ID ? '🗑️ Deleting...' : '🗑️ Delete Story'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredAndSortedStories().length} of {stories.length} stories
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/create')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
              >
                Create New Story
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-yellow-700 to-amber-800 text-white rounded-lg hover:from-yellow-800 hover:to-amber-900 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-200">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Delete Story?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this story? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
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

export default StoriesModal;
