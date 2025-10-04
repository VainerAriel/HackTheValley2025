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

function App() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [step, setStep] = useState('form');
  const [formData,  setFormData] = useState(null);
  const [story, setStory] = useState(null);
  const [vocabularyWords, setVocabularyWords] = useState([]);
  const [loading, setLoading] = useState(false);

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
    </div>
  );
}

export default App;
