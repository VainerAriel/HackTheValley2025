import { useEffect, useState } from 'react';
import { getBatchWordDefinitions } from '../services/gemini';
import { convertTextToSpeech, playAudioFromBlob } from '../services/elevenLabsService';
import './StoryDisplay.css';

function StoryDisplay({ story, onGenerateNew, onBackToHistory, vocabularyWords = [], age, isFromHistory = false, storedVocabDefinitions = {}, storyId = null }) {
  const [wordDefinitions, setWordDefinitions] = useState({});
  const [hoveredWord, setHoveredWord] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState(null);
  const [audioStatus, setAudioStatus] = useState(null); // 'cached', 'generating', 'ready'
  const [audioSource, setAudioSource] = useState(null); // 'stored', 'generated'

  // Load OpenDyslexic font
  useEffect(() => {
    const existingLink = document.querySelector('link[href*="opendyslexic"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // Load vocabulary definitions (either from storage or fetch them)
  useEffect(() => {
    const loadDefinitions = async () => {
      console.log('Loading definitions for vocabulary words:', vocabularyWords);
      console.log('Stored vocab definitions:', storedVocabDefinitions);
      
      setLoadingDefinitions(true);
      try {
        // If we have stored definitions, use them
        if (Object.keys(storedVocabDefinitions).length > 0) {
          console.log('Using stored vocabulary definitions');
          setWordDefinitions(storedVocabDefinitions);
        } else if (vocabularyWords.length > 0 && age) {
          // Otherwise, fetch definitions from API in a single batch call
          console.log('Fetching definitions from API in batch...');
          const definitionsMap = await getBatchWordDefinitions(vocabularyWords, age);
          console.log('Word definitions loaded from API:', definitionsMap);
          setWordDefinitions(definitionsMap);
        } else {
          console.log('No vocabulary words, age, or stored definitions provided:', { vocabularyWords, age, storedVocabDefinitions });
        }
      } catch (error) {
        console.error('Error loading word definitions:', error);
      } finally {
        setLoadingDefinitions(false);
      }
    };

    // Only load if we haven't already loaded definitions
    if (Object.keys(wordDefinitions).length === 0) {
      loadDefinitions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabularyWords, age, storedVocabDefinitions]);

  const handleWordHover = (word, event) => {
    const definition = wordDefinitions[word.toLowerCase()];
    if (definition) {
      setHoveredWord(definition);
      
      // Calculate tooltip position
      const rect = event.target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      setTooltipPosition({
        top: rect.top + scrollTop - 10, // Position above the word
        left: rect.left + (rect.width / 2), // Center on the word
      });
    }
  };

  const handleWordLeave = () => {
    setHoveredWord(null);
  };

  const handlePlayStory = async () => {
    if (!story) return;
    
    setIsPlaying(true);
    setPlayError(null);
    setAudioStatus('generating');
    
    try {
      // If we have a storyId, try to get stored audio first
      if (storyId) {
        try {
          console.log('Attempting to load stored audio for story ID:', storyId);
          const response = await fetch(`http://localhost:5000/api/story/${storyId}/audio?t=${Date.now()}`, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          if (response.ok) {
            const audioBlob = await response.blob();
            console.log('✅ Stored audio loaded from database - NO API CREDITS USED!');
            setAudioStatus('ready');
            setAudioSource('stored');
            await playAudioFromBlob(audioBlob);
            return;
          } else {
            console.log('Stored audio not found (404), will generate and store audio');
          }
        } catch (error) {
          console.log('Error loading stored audio:', error.message);
          console.log('Will generate and store audio as fallback');
        }
        
        // Try to generate and store audio in database
        try {
          console.log('🎵 Generating and storing audio in database - THIS WILL USE API CREDITS');
          console.log('💰 Using Flash model for cost savings (0.5 credits per character)');
          
          const generateResponse = await fetch(`http://localhost:5000/api/story/${storyId}/generate-audio`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (generateResponse.ok) {
            console.log('✅ Audio generated and stored in database');
            
            // Now try to get the stored audio
            const audioResponse = await fetch(`http://localhost:5000/api/story/${storyId}/audio?t=${Date.now()}`, {
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            if (audioResponse.ok) {
              const audioBlob = await audioResponse.blob();
              console.log('✅ Stored audio loaded from database after generation - NO ADDITIONAL CREDITS USED!');
              setAudioStatus('ready');
              setAudioSource('stored');
              await playAudioFromBlob(audioBlob);
              return;
            }
          }
        } catch (error) {
          console.error('Error generating/storing audio:', error);
        }
      }
      
      // Fallback: Generate audio locally (for new stories without storyId)
      console.log('🎵 Generating audio locally - THIS WILL USE API CREDITS');
      console.log('💰 Using Flash model for cost savings (0.5 credits per character)');
      const audioBlob = await convertTextToSpeech(story);
      setAudioStatus('ready');
      setAudioSource('generated');
      await playAudioFromBlob(audioBlob);
    } catch (error) {
      console.error('Error playing story:', error);
      setPlayError('Failed to play audio. Please check your ElevenLabs API key.');
      setAudioStatus(null);
    } finally {
      setIsPlaying(false);
    }
  };

  // Parse story and wrap vocabulary words
  const renderStoryWithVocabulary = () => {
    if (!story) return null;

    console.log('Rendering story with vocabulary words:', vocabularyWords);
    const paragraphs = story.split('\n').filter(p => p.trim() !== '');
    
    if (vocabularyWords.length === 0) {
      console.log('No vocabulary words to highlight');
      // No vocabulary words, render plain paragraphs
      return paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-6 last:mb-0">
          {paragraph}
        </p>
      ));
    }

    // Create a regex pattern for vocabulary words (case-insensitive)
    const vocabPattern = new RegExp(
      `\\b(${vocabularyWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
      'gi'
    );

    return paragraphs.map((paragraph, pIndex) => {
      const parts = [];
      let lastIndex = 0;
      let match;

      // Find all vocabulary word matches
      const regex = new RegExp(vocabPattern);
      while ((match = regex.exec(paragraph)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(paragraph.slice(lastIndex, match.index));
        }

        // Add the vocabulary word with special span
        const word = match[0];
        parts.push(
          <span
            key={`${pIndex}-${match.index}`}
            className="vocabulary-word"
            onMouseEnter={(e) => handleWordHover(word, e)}
            onMouseLeave={handleWordLeave}
            role="button"
            tabIndex={0}
            aria-label={`Vocabulary word: ${word}`}
          >
            {word}
          </span>
        );

        lastIndex = regex.lastIndex;
      }

      // Add remaining text
      if (lastIndex < paragraph.length) {
        parts.push(paragraph.slice(lastIndex));
      }

      return (
        <p key={pIndex} className="mb-6 last:mb-0">
          {parts.length > 0 ? parts : paragraph}
        </p>
      );
    });
  };

  if (!story) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <article 
        className="dyslexia-friendly-story bg-[#FFF8E7] rounded-2xl shadow-2xl p-8 md:p-12"
        aria-label="Generated story"
      >
        {/* Vocabulary Loading Indicator */}
        {loadingDefinitions && vocabularyWords.length > 0 && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
            <p className="text-sm text-purple-700">
              Loading vocabulary definitions...
            </p>
          </div>
        )}

        {/* Story Content */}
        <div 
          className="story-content max-w-[700px] mx-auto"
          role="article"
        >
          {renderStoryWithVocabulary()}
        </div>

        {/* Vocabulary Tooltip */}
        {hoveredWord && (
          <div
            className="vocabulary-tooltip"
            style={{
              position: 'absolute',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 1000,
            }}
          >
            <div className="tooltip-content">
              {/* Arrow */}
              <div className="tooltip-arrow"></div>
              
              {/* Word */}
              <div className="font-bold text-lg text-purple-800 mb-2">
                {hoveredWord.word}
              </div>
              
              {/* Pronunciation */}
              {hoveredWord.pronunciation && (
                <div className="text-sm italic text-gray-600 mb-2">
                  {hoveredWord.pronunciation}
                </div>
              )}
              
              {/* Definition */}
              <div className="text-base text-gray-800 mb-3">
                {hoveredWord.simple_definition}
              </div>
              
              {/* Example Sentence */}
              {hoveredWord.example_sentence && (
                <div className="text-sm text-gray-600 italic mb-3 pl-3 border-l-2 border-purple-300">
                  "{hoveredWord.example_sentence}"
                </div>
              )}
              
              {/* Synonyms */}
              {hoveredWord.synonyms && hoveredWord.synonyms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-gray-700">Similar words:</span>
                  {hoveredWord.synonyms.map((syn, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Play Button */}
              <button
                onClick={handlePlayStory}
                disabled={isPlaying}
                className={`px-8 py-4 min-h-[48px] text-lg font-bold rounded-lg transition-all transform ${
                  isPlaying
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                } text-white focus:outline-none focus:ring-4 focus:ring-green-300`}
                aria-label={isPlaying ? "Playing story..." : "Play story audio"}
              >
                {isPlaying ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {audioStatus === 'generating' ? 'Generating Audio...' : 'Playing...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    🔊 Play Story
                    {audioStatus === 'ready' && audioSource === 'stored' && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">(Stored - No Credits)</span>
                    )}
                    {audioStatus === 'ready' && audioSource === 'generated' && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">(Generated - Credits Used)</span>
                    )}
                  </span>
                )}
              </button>

          {/* Back to History Button (only if viewing from history) */}
          {isFromHistory && onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="px-8 py-4 min-h-[48px] text-lg font-bold rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-300"
              aria-label="Back to story history"
            >
              ← Back to History
            </button>
          )}

          {/* Generate New Story Button */}
          <button
            onClick={onGenerateNew}
            className="px-8 py-4 min-h-[48px] text-lg font-bold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-300"
            aria-label="Generate a new story"
          >
            ✨ Generate New Story
          </button>
        </div>

        {/* Play Error Message */}
        {playError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-700 text-sm">{playError}</p>
          </div>
        )}
      </article>
    </div>
  );
}

export default StoryDisplay;
