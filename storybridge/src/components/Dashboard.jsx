import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import StoryForm from './StoryForm';
import VocabularySelector from './VocabularySelector';
import StoryReader from './StoryReader';
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
    storyTitle,
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
    const result = await handleVocabularyGenerate(words, user.sub);
    
    // After story is generated and saved, navigate to the story view
    if (result && result.storyId) {
      navigate(`/story/${result.storyId}`);
    }
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
            userId={user?.sub}
          />
        );
      
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">StoryBites</h1>
                <p className="text-sm text-gray-600">Create your personalized story</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h3>
              <nav className="space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  🏠 Home
                </button>
                
                <button
                  onClick={() => {
                    handleGenerateNew();
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    step === 'form' 
                      ? 'bg-blue-600 text-white font-semibold shadow-md' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  ✨ Generate a Story
                </button>
                
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  👤 User Info
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[600px]">
              <div className="p-8">
                {renderCurrentView()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
