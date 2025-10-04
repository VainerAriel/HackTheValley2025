import { useState, useEffect } from 'react';
import { suggestVocabularyWords } from '../Services/gemini';

function VocabularySelector({ childName, age, interests, onBack, onGenerate, loading }) {
  const [suggestedWords, setSuggestedWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [customWords, setCustomWords] = useState(['', '', '']);
  const [useCustom, setUseCustom] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [error, setError] = useState('');
  const [showSkipOption, setShowSkipOption] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [age, interests]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    setError('');
    try {
      const words = await suggestVocabularyWords(age, interests);
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

  const handleWordToggle = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else if (selectedWords.length < 3) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleCustomWordChange = (index, value) => {
    const newCustomWords = [...customWords];
    newCustomWords[index] = value;
    setCustomWords(newCustomWords);
  };

  const handleGenerate = () => {
    if (useCustom) {
      const filledWords = customWords.filter(w => w.trim() !== '');
      if (filledWords.length === 3) {
        onGenerate(filledWords);
      }
    } else {
      if (selectedWords.length === 3) {
        onGenerate(selectedWords);
      }
    }
  };

  const handleSkip = () => {
    onGenerate([]);
  };

  const canGenerate = useCustom 
    ? customWords.filter(w => w.trim() !== '').length === 3
    : selectedWords.length === 3;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Choose 3 Challenge Words for {childName}
          </h2>
          <p className="text-lg text-gray-600">
            These words will be woven into the story with definitions
          </p>
        </div>

        {/* Toggle Between Suggested and Custom */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border-2 border-purple-300 p-1 bg-purple-50">
            <button
              onClick={() => setUseCustom(false)}
              disabled={loadingSuggestions || suggestedWords.length === 0}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                !useCustom
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-700 hover:bg-purple-100'
              } ${(loadingSuggestions || suggestedWords.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Use Suggested Words
            </button>
            <button
              onClick={() => setUseCustom(true)}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                useCustom
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-700 hover:bg-purple-100'
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
                  className="animate-spin h-12 w-12 text-purple-600 mb-4" 
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
                <div className="mb-4 text-center">
                  <p className="text-sm text-gray-600">
                    Select <span className="font-bold text-purple-600">{3 - selectedWords.length}</span> more word{3 - selectedWords.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestedWords.map((wordObj, index) => {
                    const isSelected = selectedWords.includes(wordObj.word);
                    return (
                      <button
                        key={index}
                        onClick={() => handleWordToggle(wordObj.word)}
                        disabled={!isSelected && selectedWords.length >= 3}
                        className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 text-left ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg'
                            : 'bg-white border-gray-300 hover:border-purple-400 text-gray-800'
                        } ${!isSelected && selectedWords.length >= 3 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
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
                        <p className={`text-sm ${isSelected ? 'text-purple-100' : 'text-gray-600'}`}>
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
              Enter 3 words you'd like {childName} to learn in the story
            </p>
            <div className="space-y-4">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <label 
                    htmlFor={`custom-word-${index}`}
                    className="block text-base font-medium text-gray-700 mb-2"
                  >
                    Challenge Word {index + 1}
                  </label>
                  <input
                    type="text"
                    id={`custom-word-${index}`}
                    value={customWords[index]}
                    onChange={(e) => handleCustomWordChange(index, e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 min-h-[48px] text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder={`e.g., ${['magnificent', 'curious', 'adventure'][index]}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 py-3 px-6 min-h-[48px] text-lg font-semibold rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          
          {showSkipOption && (
            <button
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 py-3 px-6 min-h-[48px] text-lg font-semibold rounded-lg border-2 border-purple-300 text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
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
              '✨ Generate Story'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VocabularySelector;

