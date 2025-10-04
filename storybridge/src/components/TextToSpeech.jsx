import React, { useState } from 'react';
import { convertTextToSpeech, playAudioFromBlob } from '../services/elevenLabsService';

const TextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [text, setText] = useState('Welcome to StoryBridge! Type something to hear it spoken.');

  const handlePlayAudio = async () => {
    try {
      setIsPlaying(true);
      setError(null);

      const audioBlob = await convertTextToSpeech(text);
      await playAudioFromBlob(audioBlob);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              🌉 Text-to-Speech
            </h2>
            <p className="text-lg text-gray-600">
              Transform your text into natural speech with ElevenLabs API
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your text:
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows="4"
                placeholder="Type something to convert to speech..."
              />
            </div>

            <button
              onClick={handlePlayAudio}
              disabled={isPlaying || !text.trim()}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                isPlaying || !text.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isPlaying ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Playing...
                </span>
              ) : (
                '🎵 Play Audio'
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Powered by ElevenLabs AI • Built with React & Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
