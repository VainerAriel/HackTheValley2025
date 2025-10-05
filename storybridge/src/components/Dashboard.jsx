import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import StoryForm from './StoryForm';
import VocabularySelector from './VocabularySelector';
import StoryDisplay from './StoryDisplay';
import LogoutButton from './LogoutButton';
import { useStoryFlow } from '../hooks/useStoryFlow';
import { saveStory } from '../services/storyService';

const Dashboard = () => {
  const { user } = useAuth0();
  const navigate = useNavigate();

  const {
    step,
    formData,
    story,
    vocabularyWords,
    loading,
    storyId,
    handleFormSubmit,
    handleVocabularyBack,
    handleVocabularyGenerate,
    handleGenerateNew
  } = useStoryFlow();

  const handleVocabularyGenerateWithSave = async (words) => {
    console.log('Generating story with save...', { words, userId: user.sub });
    await handleVocabularyGenerate(words, user.sub);
  };

  const handleBackToForm = () => {
    handleGenerateNew();
  };

  const renderCurrentView = () => {
    switch (step) {
      case 'form':
        return (
          <StoryForm 
            onGenerateStory={handleFormSubmit} 
            loading={loading} 
          />
        );
      
      case 'vocabulary':
        return (
          <VocabularySelector
            childName={formData.childName}
            age={formData.age}
            interests={formData.interests || []}
            onBack={handleVocabularyBack}
            onGenerate={handleVocabularyGenerateWithSave}
            loading={loading}
          />
        );
      
      case 'story':
        return (
          <StoryDisplay 
            story={story} 
            onGenerateNew={handleBackToForm}
            vocabularyWords={vocabularyWords}
            age={formData?.age}
            isFromHistory={false}
            storyId={storyId}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col border-r border-cream-300">
        <div className="p-6 border-b border-cream-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">S</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-brown-dark">StoryBites</h2>
                <p className="text-sm text-gray-600 mt-1">Welcome back!</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <button
            onClick={() => {
              handleGenerateNew();
            }}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              step === 'form' 
                ? 'bg-brand-blue text-white font-semibold shadow-md' 
                : 'text-brand-brown hover:bg-cream-100'
            }`}
          >
            ✨ Generate New Story
          </button>
          
          <button
            onClick={() => navigate('/history')}
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-brand-brown hover:bg-cream-100"
          >
            📚 Story History
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-brand-brown hover:bg-cream-100"
          >
            👤 User Profile
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
