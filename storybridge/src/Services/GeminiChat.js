import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

function GeminiChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Theme selection states
  const [theme1, setTheme1] = useState('');
  const [theme2, setTheme2] = useState('');
  const [theme3, setTheme3] = useState('');
  
  const themeOptions = [
    'magical',
    'fantasy',
    'dinosaurs',
    'adventure',
    'comedy',
    'superheros',
    'princesses'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Initialize the Gemini AI client
      // The API key is set via REACT_APP_GEMINI_API_KEY environment variable
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
      }

      const ai = new GoogleGenAI({ apiKey });

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });
      
      setResponse(result.text);
    } catch (err) {
      setError(err.message || 'An error occurred while generating content');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStory = () => {
    if (!theme1.trim() || !theme2.trim() || !theme3.trim()) {
      setError('Please select or enter all three themes');
      return;
    }
    
    const storyPrompt = `Write a short story for kids based on the theme: ${theme1}, ${theme2}, and ${theme3}.
Make it fun, educational, and under 500 words with a clear beginning, middle, and end.`;
    
    setPrompt(storyPrompt);
    // Trigger the generate function with the new prompt
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Story Generator for Kids
        </h2>

        <div className="space-y-6">
          {/* Theme Selection Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Choose Your Story Themes
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select three themes from the dropdown or type your own custom themes
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Theme 1 */}
              <div>
                <label htmlFor="theme1" className="block text-sm font-medium text-gray-700 mb-2">
                  Theme 1
                </label>
                <input
                  list="themeOptions1"
                  id="theme1"
                  value={theme1}
                  onChange={(e) => setTheme1(e.target.value)}
                  placeholder="Select or type..."
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <datalist id="themeOptions1">
                  {themeOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>

              {/* Theme 2 */}
              <div>
                <label htmlFor="theme2" className="block text-sm font-medium text-gray-700 mb-2">
                  Theme 2
                </label>
                <input
                  list="themeOptions2"
                  id="theme2"
                  value={theme2}
                  onChange={(e) => setTheme2(e.target.value)}
                  placeholder="Select or type..."
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <datalist id="themeOptions2">
                  {themeOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>

              {/* Theme 3 */}
              <div>
                <label htmlFor="theme3" className="block text-sm font-medium text-gray-700 mb-2">
                  Theme 3
                </label>
                <input
                  list="themeOptions3"
                  id="theme3"
                  value={theme3}
                  onChange={(e) => setTheme3(e.target.value)}
                  placeholder="Select or type..."
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <datalist id="themeOptions3">
                  {themeOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>
            </div>

            <button
              onClick={handleGenerateStory}
              disabled={loading}
              className={`w-full mt-4 py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Story...
                </span>
              ) : (
                '✨ Generate Story'
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {response && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Response:</h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GeminiChat;

