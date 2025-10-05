import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import StoryReader from './StoryReader';
import { getStoryById } from '../services/storyService';
import LoadingSpinner from './LoadingSpinner';

const StoryView = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preloadedAudio, setPreloadedAudio] = useState(null);
  const [audioPreloadStatus, setAudioPreloadStatus] = useState('loading'); // 'loading', 'loaded', 'not-found'

  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) {
        setError('No story ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading story with ID:', storyId);
        const storyData = await getStoryById(storyId);
        
        if (!storyData) {
          setError('Story not found');
          return;
        }

        // Verify the story belongs to the current user
        if (storyData.USER_ID !== user.sub) {
          setError('You do not have permission to view this story');
          return;
        }

        console.log('StoryView - Full story data from database:', storyData);
        console.log('StoryView - VOCAB_WORDS field:', storyData.VOCAB_WORDS);
        console.log('StoryView - INTERESTS field:', storyData.INTERESTS);
        console.log('StoryView - VOCAB_DEFINITIONS field:', storyData.VOCAB_DEFINITIONS);
        setStory(storyData);
        
        // Preload audio if it exists
        console.log('Preloading audio for story...');
        setAudioPreloadStatus('loading');
        try {
          const API_BASE_URL = process.env.REACT_APP_API_URL || '';
          const audioResponse = await fetch(`${API_BASE_URL}/api/story/${storyId}/audio?t=${Date.now()}`, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (audioResponse.ok) {
            const audioBlob = await audioResponse.blob();
            console.log('Audio preloaded from database - ready for instant playback!');
            console.log('Audio size:', audioBlob.size, 'bytes');
            setPreloadedAudio(audioBlob);
            setAudioPreloadStatus('loaded');
          } else {
            console.log('No audio found in database - will generate on-demand');
            setAudioPreloadStatus('not-found');
          }
        } catch (audioError) {
          console.log('Audio preload failed - will generate on-demand:', audioError.message);
          setAudioPreloadStatus('not-found');
        }
      } catch (error) {
        console.error('Error loading story:', error);
        setError('Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [storyId, user.sub]);

  const handleBackToHistory = () => {
    navigate('/history');
  };

  const handleGenerateNew = () => {
    navigate('/');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md border border-cream-300">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-brand-brown-dark mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/history')}
              className="px-6 py-3 bg-brand-brown text-white font-semibold rounded-lg hover:bg-brand-brown-dark transition-colors"
            >
              Back to History
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Generate New Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md border border-cream-300">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-brand-brown-dark mb-4">Story Not Found</h2>
          <p className="text-gray-600 mb-6">The story you're looking for doesn't exist.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/history')}
              className="px-6 py-3 bg-brand-brown text-white font-semibold rounded-lg hover:bg-brand-brown-dark transition-colors"
            >
              Back to History
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Generate New Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('StoryView - story data:', story);
  console.log('StoryView - vocabulary words:', story.VOCAB_WORDS);
  console.log('StoryView - processed vocab words:', story.VOCAB_WORDS ? story.VOCAB_WORDS.split(',').filter(word => word.trim()) : []);

      return (
        <div className="min-h-screen bg-cream-100">
          <StoryReader
            story={story.STORY_TEXT}
            storyTitle={story.STORY_TITLE}
            onGenerateNew={handleGenerateNew}
            onBackToHistory={handleBackToHistory}
            vocabularyWords={story.VOCAB_WORDS ? story.VOCAB_WORDS.split(',').filter(word => word.trim()) : []}
            age={story.age || '8'}
            isFromHistory={true}
            storedVocabDefinitions={story.VOCAB_DEFINITIONS ? JSON.parse(story.VOCAB_DEFINITIONS) : {}}
            storyId={story.STORY_ID}
            preloadedAudio={preloadedAudio}
            audioPreloadStatus={audioPreloadStatus}
          />
        </div>
      );
};

export default StoryView;
