import { useState } from 'react';
import StoryForm from './components/StoryForm';
import VocabularySelector from './components/VocabularySelector';
import StoryDisplay from './components/StoryDisplay';
import { generateStory } from './Services/gemini';

function App() {
  const [step, setStep] = useState('form'); // 'form' | 'vocabulary' | 'story'
  const [formData, setFormData] = useState(null);
  const [vocabularyWords, setVocabularyWords] = useState([]);
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormSubmit = (data) => {
    setFormData(data);
    setError('');
    setStep('vocabulary');
  };

  const handleVocabularyBack = () => {
    setStep('form');
  };

  const handleVocabularyGenerate = async (selectedWords) => {
    setVocabularyWords(selectedWords);
    setLoading(true);
    setError('');
    setStory('');

    try {
      // Prepare story generation parameters
      const storyParams = {
        childName: formData.childName,
        age: formData.age,
        interest1: formData.interest1,
        interest2: formData.interest2,
        interest3: formData.interest3,
        vocabularyWords: selectedWords,
      };

      const generatedStory = await generateStory(storyParams);
      setStory(generatedStory);
      setStep('story');
    } catch (err) {
      // If story generation fails with vocabulary, try once without vocabulary
      if (selectedWords.length > 0) {
        console.warn('Story generation with vocabulary failed, retrying without vocabulary words...');
        try {
          const storyParamsWithoutVocab = {
            childName: formData.childName,
            age: formData.age,
            interest1: formData.interest1,
            interest2: formData.interest2,
            interest3: formData.interest3,
            vocabularyWords: [],
          };
          const generatedStory = await generateStory(storyParamsWithoutVocab);
          setStory(generatedStory);
          setVocabularyWords([]); // Clear vocabulary words since they weren't used
          setStep('story');
          setError('Story generated successfully, but vocabulary words could not be included.');
        } catch (retryErr) {
          setError(retryErr.message || 'An error occurred while generating the story');
          console.error('Error generating story (retry):', retryErr);
        }
      } else {
        setError(err.message || 'An error occurred while generating the story');
        console.error('Error generating story:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = () => {
    setStory('');
    setVocabularyWords([]);
    setFormData(null);
    setError('');
    setStep('form');
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
        
        {/* Step Indicator */}
        {step !== 'story' && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <div className={`flex items-center ${step === 'form' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === 'form' ? 'bg-purple-600 text-white' : 'bg-gray-300 text-white'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Story Details</span>
            </div>
            
            <div className="w-8 h-1 bg-gray-300"></div>
            
            <div className={`flex items-center ${step === 'vocabulary' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === 'vocabulary' ? 'bg-purple-600 text-white' : 'bg-gray-300 text-white'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Vocabulary</span>
            </div>
            
            <div className="w-8 h-1 bg-gray-300"></div>
            
            <div className="flex items-center text-gray-400">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-gray-300 text-white">
                3
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Your Story</span>
            </div>
          </div>
        )}
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 px-4">
          <div 
            className={`${
              error.includes('successfully') 
                ? 'bg-yellow-50 border-yellow-300' 
                : 'bg-red-50 border-red-300'
            } border-2 rounded-lg p-4 shadow-md`}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg 
                  className={`h-6 w-6 ${
                    error.includes('successfully') ? 'text-yellow-600' : 'text-red-600'
                  }`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={error.includes('successfully') 
                      ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    }
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-semibold ${
                  error.includes('successfully') ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {error.includes('successfully') ? 'Warning' : 'Error Generating Story'}
                </h3>
                <p className={`mt-1 text-sm ${
                  error.includes('successfully') ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {error}
                </p>
              </div>
            </div>
          </div>
      </div>
      )}

      {/* Main Content */}
      <main>
        {step === 'form' && (
          <StoryForm onGenerateStory={handleFormSubmit} loading={false} />
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
    </div>
  );
}

export default App;
