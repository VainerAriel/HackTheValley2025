import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import SnowflakeTest from './components/SnowflakeTest';
import Profile from './components/Profile';
import StoryForm from './components/StoryForm';
import VocabularySelector from './components/VocabularySelector';
import StoryDisplay from './components/StoryDisplay';
import { generateStory } from './services/gemini';

const ELEVENLABS_API_KEY = process.env.REACT_APP_ELEVENLABS_API_KEY;

function App() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState(null);
  const [story, setStory] = useState(null);
  const [vocabularyWords, setVocabularyWords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ElevenLabs text-to-speech state
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [text, setText] = useState('Welcome to StoryBridge! Type something to hear it spoken.');

  const handleFormSubmit = (data) => {
    setFormData(data);
    setStep('vocabulary');
  };

  const handleVocabularyBack = () => {
    setStep('form');
  };

  const handleVocabularyGenerate = async (words) => {
    setVocabularyWords(words);
    setLoading(true);
    try {
      const generatedStory = await generateStory({ 
        ...formData, 
        vocabularyWords: words 
      });
      setStory(generatedStory);
      setStep('story');
    } catch (error) {
      console.error('Error generating story:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = () => {
    setStep('form');
    setFormData(null);
    setStory(null);
    setVocabularyWords([]);
  };

  const playAudio = async () => {
    try {
      setIsPlaying(true);
      setError(null);

      const voiceId = 'JBFqnCBsd6RMkjVDRZzb';

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setError('Failed to play audio');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setIsPlaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to StoryBridge
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Create personalized stories for young readers
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">StoryBridge</h1>
            <div className="flex items-center space-x-4">
              <Profile />
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SnowflakeTest />
        
        {step === 'form' && (
          <StoryForm onGenerateStory={handleFormSubmit} loading={loading} />
        )}

        {step === 'vocabulary' && formData && (
          <VocabularySelector
            childName={formData.childName}
            age={formData.age}
            interests={[formData.interest1, formData.interest2, formData.interest3]}
            onBack={handleVocabularyBack}
            onGenerate={handleVocabularyGenerate}
            loading={loading}
          />
        )}

        {step === 'story' && story && (
          <StoryDisplay 
            story={story} 
            onGenerateNew={handleGenerateNew}
            vocabularyWords={vocabularyWords}
            age={formData?.age}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center mt-16 pb-8">
        <p className="text-sm text-gray-500">
          Made with ❤️ for young readers everywhere
        </p>
      </footer>

      {/* ElevenLabs Text-to-Speech Section */}
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
                onClick={playAudio}
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
    </div>
  );
}

export default App;