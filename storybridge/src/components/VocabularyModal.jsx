import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const VocabularyModal = ({ isOpen, onClose }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'alphabetical'

  useEffect(() => {
    if (isOpen && user) {
      fetchVocabulary();
    }
  }, [isOpen, user]);

  const fetchVocabulary = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://api.storybites.vip`,
          scope: "openid profile email"
        }
      });
      const API_BASE_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(user.sub)}/vocabulary-with-definitions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setVocabulary(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedVocabulary = () => {
    let filtered = vocabulary.filter(item => 
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definitions.simple_definition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.word.localeCompare(b.word));
    } else {
      filtered.sort((a, b) => new Date(b.learnedDate) - new Date(a.learnedDate));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Vocabulary Words</h2>
            <p className="text-gray-600 mt-1">
              {vocabulary.length} words learned so far
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
                placeholder="Search words or definitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Most Recent
              </button>
              <button
                onClick={() => setSortBy('alphabetical')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'alphabetical'
                    ? 'bg-orange-600 text-white'
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Loading your vocabulary...</span>
            </div>
          ) : filteredAndSortedVocabulary().length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No words found' : 'No vocabulary words yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start creating stories to build your vocabulary!'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAndSortedVocabulary().map((item, index) => (
                <div key={`${item.word}-${index}`} className="bg-gradient-to-br from-orange-50 to-orange-50 rounded-xl p-6 border border-orange-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {item.word}
                      </h3>
                      {item.definitions.pronunciation && (
                        <p className="text-sm text-orange-600 font-medium mb-2">
                          {item.definitions.pronunciation}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                      {formatDate(item.learnedDate)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Definition</h4>
                      <p className="text-gray-800">
                        {item.definitions.simple_definition}
                      </p>
                    </div>

                    {item.definitions.example_sentence && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Example</h4>
                        <p className="text-gray-800 italic">
                          "{item.definitions.example_sentence}"
                        </p>
                      </div>
                    )}

                    {item.definitions.synonyms && item.definitions.synonyms.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Synonyms</h4>
                        <div className="flex flex-wrap gap-2">
                          {item.definitions.synonyms.map((synonym, idx) => (
                            <span
                              key={idx}
                              className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                            >
                              {synonym}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
              Showing {filteredAndSortedVocabulary().length} of {vocabulary.length} words
            </p>
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
  );
};

export default VocabularyModal;
