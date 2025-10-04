import { useState } from 'react';
import StoryForm from './components/StoryForm';
import StoryDisplay from './components/StoryDisplay';
import { generateStory } from './Services/gemini';

function App() {
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateStory = async (formData) => {
    setLoading(true);
    setError('');
    setStory('');

    try {
      const generatedStory = await generateStory(formData);
      setStory(generatedStory);
    } catch (err) {
      setError(err.message || 'An error occurred while generating the story');
      console.error('Error generating story:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = () => {
    setStory('');
    setError('');
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-8 px-4">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-3">
          StoryBridge
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 font-medium">
          Personalized Stories for Young Readers
        </p>
        <p className="text-base md:text-lg text-gray-500 mt-2">
          Dyslexia-friendly stories powered by AI ✨
        </p>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 px-4">
          <div 
            className="bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-md"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg 
                  className="h-6 w-6 text-red-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">
                  Error Generating Story
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        {!story ? (
          <StoryForm onGenerateStory={handleGenerateStory} loading={loading} />
        ) : (
          <StoryDisplay story={story} onGenerateNew={handleGenerateNew} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center mt-16 pb-8">
        <p className="text-sm text-gray-500">
          Made with ❤️ for young readers everywhere
        </p>
      </footer>
    </div>
  );
}

export default App;
