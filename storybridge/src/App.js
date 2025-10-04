import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SnowflakeTest from './components/SnowflakeTest.jsx';
import StoryForm from './components/StoryForm.jsx';
import VocabularySelector from './components/VocabularySelector.jsx';
import StoryDisplay from './components/StoryDisplay.jsx';
import TextToSpeech from './components/TextToSpeech.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import LoginPage from './components/LoginPage.jsx';
import { useStoryFlow } from './hooks/useStoryFlow.js';

function App() {
  const { isAuthenticated, isLoading } = useAuth0();
  const {
    step,
    formData,
    story,
    vocabularyWords,
    loading,
    handleFormSubmit,
    handleVocabularyBack,
    handleVocabularyGenerate,
    handleGenerateNew
  } = useStoryFlow();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

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

      <Footer />
      <TextToSpeech />
    </div>
  );
}

export default App;