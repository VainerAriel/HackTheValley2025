import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

function GeminiChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Gemini AI Chat
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your prompt:
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Explain how AI works in a few words..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Response'
            )}
          </button>

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

