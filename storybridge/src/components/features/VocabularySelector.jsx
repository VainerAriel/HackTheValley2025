import { useState, useEffect } from 'react';
import { suggestVocabularyWords } from '../../services/gemini.js';
import { getUserVocabulary } from '../../services/vocabularyService.js';

function VocabularySelector({ childName, age, interests, onBack, onGenerate, loading, userId }) {
  // Note: 'interests' param name kept for backward compatibility with existing code
  const themes = interests;
  const [suggestedWords, setSuggestedWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [customWords, setCustomWords] = useState(['', '', '']);
  const [useCustom, setUseCustom] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [error, setError] = useState('');
  const [showSkipOption, setShowSkipOption] = useState(false);
  const [usedWords, setUsedWords] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      setError('');
      try {
        // Fetch previously used vocabulary words if userId is provided
        let excludeWords = [];
        if (userId) {
          try {
            excludeWords = await getUserVocabulary(userId);
            setUsedWords(excludeWords);
          } catch (vocabError) {
            console.warn('Could not fetch used vocabulary words:', vocabError);
            // Continue without excluding words if fetch fails
          }
        }
        
        const words = await suggestVocabularyWords(age, themes, excludeWords);
        setSuggestedWords(words);
        setShowSkipOption(false);
      } catch (err) {
        console.error('Error fetching word suggestions:', err);
        setError('Unable to load word suggestions. You can add your own words below or skip this step.');
        setShowSkipOption(true);
        setUseCustom(true);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [age, themes, userId]);

  const handleGetNewSuggestions = async () => {
    setLoadingSuggestions(true);
    setError('');
    try {
      // Get new suggestions with excluded words
      const newWords = await suggestVocabularyWords(age, themes, usedWords);
      
      // Keep selected words and replace unselected ones
      const selectedWordStrings = selectedWords.map(w => w.toLowerCase());
      const currentlySelected = suggestedWords.filter(w => 
        selectedWordStrings.includes(w.word.toLowerCase())
      );
      
      // Get new words that aren't already selected
      const newUnselectedWords = newWords.filter(w => 
        !selectedWordStrings.includes(w.word.toLowerCase())
      );
      
      // Combine: selected words first, then new suggestions
      const combinedWords = [...currentlySelected, ...newUnselectedWords].slice(0, 8);
      
      setSuggestedWords(combinedWords);
      setShowSkipOption(false);
    } catch (err) {
      console.error('Error fetching new word suggestions:', err);
      setError('Unable to load new suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleWordToggle = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else if (selectedWords.length < 5) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleCustomWordChange = (index, value) => {
    const newCustomWords = [...customWords];
    newCustomWords[index] = value;
    setCustomWords(newCustomWords);
  };

  const addCustomWordField = () => {
    if (customWords.length < 5) {
      setCustomWords([...customWords, '']);
    }
  };

  const removeCustomWordField = (index) => {
    if (customWords.length > 3) {
      const newCustomWords = customWords.filter((_, i) => i !== index);
      setCustomWords(newCustomWords);
    }
  };

  const handleGenerate = () => {
    if (useCustom) {
      const filledWords = customWords.filter(w => w.trim() !== '');
      if (filledWords.length >= 3 && filledWords.length <= 5) {
        onGenerate(filledWords);
      }
    } else {
      if (selectedWords.length >= 3 && selectedWords.length <= 5) {
        onGenerate(selectedWords);
      }
    }
  };

  const handleSkip = () => {
    onGenerate([]);
  };

  const canGenerate = useCustom 
    ? customWords.filter(w => w.trim() !== '').length >= 3 && customWords.filter(w => w.trim() !== '').length <= 5
    : selectedWords.length >= 3 && selectedWords.length <= 5;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-cream-300">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-700 to-amber-800 bg-clip-text text-transparent mb-2">
            Choose 3-5 Challenge Words for {childName}
          </h2>
          <p className="text-lg text-gray-600">
            These words will be woven into the story with definitions
          </p>
          {usedWords.length > 0 && (
            <div className="mt-4 p-3 bg-cream-100 border border-cream-400 rounded-lg shadow-sm">
              <p className="text-sm text-brand-brown-dark">
                We've excluded {usedWords.length} previously used words to give you fresh vocabulary options!
              </p>
            </div>
          )}
        </div>

        {/* Toggle Between Suggested and Custom */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border-2 border-cream-400 p-1 bg-cream-100">
            <button
              onClick={() => setUseCustom(false)}
              disabled={loadingSuggestions || suggestedWords.length === 0}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                !useCustom
                  ? 'bg-gradient-to-r from-yellow-700 to-amber-800 text-white shadow-md'
                  : 'text-gray-700 hover:bg-cream-200'
              } ${(loadingSuggestions || suggestedWords.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Use Suggested Words
            </button>
            <button
              onClick={() => setUseCustom(true)}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                useCustom
                  ? 'bg-gradient-to-r from-yellow-700 to-amber-800 text-white shadow-md'
                  : 'text-gray-700 hover:bg-cream-200'
              }`}
            >
              Use My Own Words
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Suggested Words Section */}
        {!useCustom && (
          <div className="mb-8">
            {loadingSuggestions ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg 
                  className="animate-spin h-12 w-12 text-orange-600 mb-4" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-gray-600 text-lg">Finding perfect words for {childName}...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {selectedWords.length < 3 ? (
                      <>Select <span className="font-bold text-yellow-800">{3 - selectedWords.length}</span> more word{3 - selectedWords.length !== 1 ? 's' : ''} (minimum)</>
                    ) : selectedWords.length < 5 ? (
                      <>Selected <span className="font-bold text-yellow-800">{selectedWords.length}</span> words (can add {5 - selectedWords.length} more)</>
                    ) : (
                      <>Selected <span className="font-bold text-yellow-800">{selectedWords.length}</span> words (maximum reached)</>
                    )}
                  </p>
                  
                  {/* Get New Suggestions Button */}
                  <button
                    onClick={handleGetNewSuggestions}
                    disabled={loadingSuggestions}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border-2 border-cream-400 text-gray-700 hover:bg-cream-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Keep selected words and get new suggestions for the rest"
                  >
                    <svg 
                      className={`w-4 h-4 ${loadingSuggestions ? 'animate-spin' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                      />
                    </svg>
                    Get New Suggestions
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestedWords.map((wordObj, index) => {
                    const isSelected = selectedWords.includes(wordObj.word);
                    return (
                      <button
                        key={index}
                        onClick={() => handleWordToggle(wordObj.word)}
                        disabled={!isSelected && selectedWords.length >= 5}
                        className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 text-left ${
                          isSelected
                            ? 'bg-gradient-to-r from-yellow-700 to-amber-800 border-yellow-700 text-white shadow-lg'
                            : 'bg-white border-cream-300 hover:border-amber-300 text-gray-800'
                        } ${!isSelected && selectedWords.length >= 5 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-lg font-bold">
                            {wordObj.word}
                          </span>
                          {isSelected && (
                            <svg 
                              className="w-6 h-6 flex-shrink-0" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <p className={`text-sm ${isSelected ? 'text-amber-100' : 'text-gray-600'}`}>
                          {wordObj.simple_definition}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Custom Words Section */}
        {useCustom && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Add Your Own Challenge Words
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Enter 3-5 words you'd like {childName} to learn in the story
            </p>
            <div className="space-y-4">
              {customWords.map((word, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <label 
                      htmlFor={`custom-word-${index}`}
                      className="block text-base font-medium text-gray-700 mb-2"
                    >
                      Challenge Word {index + 1} {index >= 3 && <span className="text-sm text-gray-500">(optional)</span>}
                    </label>
                    <input
                      type="text"
                      id={`custom-word-${index}`}
                      value={word}
                      onChange={(e) => handleCustomWordChange(index, e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 min-h-[48px] text-lg border-2 border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 transition-all"
                      placeholder={`e.g., ${['magnificent', 'curious', 'adventure', 'explore', 'vibrant'][index]}`}
                    />
                  </div>
                  {index >= 3 && customWords.length > 3 && (
                    <button
                      onClick={() => removeCustomWordField(index)}
                      disabled={loading}
                      className="mt-9 px-3 py-3 min-h-[48px] text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title="Remove this word field"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              {customWords.length < 5 && (
                <button
                  onClick={addCustomWordField}
                  disabled={loading}
                  className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Another Word (up to 5 total)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
              onClick={onBack}
            disabled={loading}
            className="flex-1 py-3 px-6 min-h-[48px] text-lg font-semibold rounded-lg border-2 border-cream-300 text-gray-700 hover:bg-cream-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          
          {showSkipOption && (
            <button
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 py-3 px-6 min-h-[48px] text-lg font-semibold rounded-lg border-2 border-cream-400 text-gray-700 hover:bg-cream-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip Vocabulary
            </button>
          )}
          
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className={`flex-1 py-3 px-6 min-h-[48px] text-lg font-bold rounded-lg transition-all transform ${
              !canGenerate || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-700 to-amber-800 hover:from-yellow-800 hover:to-amber-900 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
            } text-white`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg 
                  className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating Story...
              </span>
            ) : (
              'Generate Story'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VocabularySelector;

