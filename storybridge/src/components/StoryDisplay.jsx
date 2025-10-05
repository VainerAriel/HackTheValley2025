import { useEffect, useState, useRef } from 'react';
import { getBatchWordDefinitions } from '../services/gemini';
import { convertTextToSpeech, playAudioFromBlob } from '../services/elevenLabsService';
import './StoryDisplay.css';

function StoryDisplay({ story, onGenerateNew, onBackToHistory, vocabularyWords = [], age, isFromHistory = false, storedVocabDefinitions = {}, storyId = null, preloadedAudio = null, audioPreloadStatus = 'not-found' }) {
  const [wordDefinitions, setWordDefinitions] = useState({});
  const [hoveredWord, setHoveredWord] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState(null);
  const [audioStatus, setAudioStatus] = useState(null); // 'cached', 'generating', 'ready'
  const [audioSource, setAudioSource] = useState(null); // 'stored', 'generated'
  const [highlightedWords, setHighlightedWords] = useState(new Set());
  const [currentSentence, setCurrentSentence] = useState(-1);
  const audioRef = useRef(null);
  const timeoutsRef = useRef([]);

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


  const handleWordHover = (cleanWord, event) => {
    console.log('Hovering over word:', cleanWord);
    console.log('Available definitions:', wordDefinitions);
    
    // Try to find definition with flexible matching
    let definition = wordDefinitions[cleanWord];
    
    // If exact match not found, try to find base form or related forms
    if (!definition) {
      // Try to find the base form by checking if any vocabulary word is contained in the clean word
      const vocabularyWords = Object.keys(wordDefinitions);
      for (const vocabWord of vocabularyWords) {
        if (cleanWord.includes(vocabWord) || vocabWord.includes(cleanWord)) {
          console.log(`Found related word match: ${cleanWord} -> ${vocabWord}`);
          definition = wordDefinitions[vocabWord];
          break;
        }
      }
    }
    
    console.log('Looking for definition:', definition);
    
    if (definition) {
      console.log('Found definition:', definition);
      setHoveredWord(definition);
      
      // Calculate tooltip position
      const rect = event.target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      setTooltipPosition({
        top: rect.top + scrollTop - 10, // Position above the word
        left: rect.left + (rect.width / 2), // Center on the word
      });
    } else {
      console.log('No definition found for word:', cleanWord);
    }
  };

  const handleWordLeave = () => {
    setHoveredWord(null);
  };

  // Highlighting functions
  const getSentences = (text) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const lastMatch = sentences.join('');
    const remaining = text.slice(lastMatch.length).trim();
    if (remaining) {
      sentences.push(remaining);
    }
    return sentences.length > 0 ? sentences : [text];
  };

  const estimateWordTimings = (sentence) => {
    const words = sentence.trim().split(/\s+/);
    const avgWordDuration = 300;
    
    return words.map((word, index) => ({
      word,
      startTime: index * avgWordDuration,
      duration: avgWordDuration
    }));
  };

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  const highlightText = () => {
    const sentences = getSentences(story);
    let cumulativeDelay = 0;

    sentences.forEach((sentence, sentenceIndex) => {
      const wordTimings = estimateWordTimings(sentence);
      let sentenceStartDelay = cumulativeDelay;

      const sentenceTimeout = setTimeout(() => {
        setCurrentSentence(sentenceIndex);
        setHighlightedWords(new Set());
      }, sentenceStartDelay);
      timeoutsRef.current.push(sentenceTimeout);

      wordTimings.forEach((timing, wordIndex) => {
        const addTimeout = setTimeout(() => {
          setHighlightedWords(prev => {
            const newSet = new Set(prev);
            newSet.add(`${sentenceIndex}-${wordIndex}`);
            return newSet;
          });
        }, sentenceStartDelay + timing.startTime);
        timeoutsRef.current.push(addTimeout);

        const removeTimeout = setTimeout(() => {
          setHighlightedWords(prev => {
            const newSet = new Set(prev);
            newSet.delete(`${sentenceIndex}-${wordIndex}`);
            return newSet;
          });
        }, sentenceStartDelay + timing.startTime + timing.duration);
        timeoutsRef.current.push(removeTimeout);
      });

      const sentenceDuration = wordTimings.length * 300 + 400;
      cumulativeDelay += sentenceDuration;

      // Clear everything after last sentence
      if (sentenceIndex === sentences.length - 1) {
        const clearTimeout = setTimeout(() => {
          setCurrentSentence(-1);
          setHighlightedWords(new Set());
        }, cumulativeDelay);
        timeoutsRef.current.push(clearTimeout);
      }
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setHighlightedWords(new Set());
    setCurrentSentence(-1);
    clearAllTimeouts();
  };

  const playAudioWithHighlighting = async (audioBlob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Wait for audio to actually start playing before starting highlighting
    audio.onplay = () => {
      highlightText();
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentSentence(-1);
      setHighlightedWords(new Set());
      clearAllTimeouts();
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = (error) => {
      console.error('Audio error:', error);
      setPlayError('Failed to play audio');
      setIsPlaying(false);
      clearAllTimeouts();
      URL.revokeObjectURL(audioUrl);
    };

    try {
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const handlePlayStory = async () => {
    if (!story) return;
    
    setIsPlaying(true);
    setPlayError(null);
    
    try {
      // FIRST: Check if we have preloaded audio from StoryView
      if (preloadedAudio && audioPreloadStatus === 'loaded') {
        console.log('✅ Using preloaded audio - INSTANT PLAYBACK!');
        setAudioStatus('ready');
        setAudioSource('stored');
        await playAudioWithHighlighting(preloadedAudio);
        return;
      }
      
      // SECOND: If we have a storyId but no preloaded audio, try to fetch it
      setAudioStatus('generating');
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
            await playAudioWithHighlighting(audioBlob);
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
              await playAudioWithHighlighting(audioBlob);
              return;
            }
          }
        } catch (error) {
          console.error('Error generating/storing audio:', error);
        }
      }
      
      // FALLBACK: Generate audio locally (for new stories without storyId)
      console.log('🎵 Generating audio locally - THIS WILL USE API CREDITS');
      console.log('💰 Using Flash model for cost savings (0.5 credits per character)');
      const audioBlob = await convertTextToSpeech(story);
      setAudioStatus('ready');
      setAudioSource('generated');
      await playAudioWithHighlighting(audioBlob);
    } catch (error) {
      console.error('Error playing story:', error);
      setPlayError('Failed to play audio. Please check your ElevenLabs API key.');
      setAudioStatus(null);
      setIsPlaying(false);
    }
  };

  // Parse story and wrap vocabulary words
  const renderStoryWithVocabulary = () => {
    if (!story) return null;

    const paragraphs = story.split('\n').filter(p => p.trim() !== '');
    
    // Helper function to render text with both vocabulary and word highlighting
    const renderTextWithHighlighting = (text, paragraphIndex) => {
      const sentences = getSentences(text);
      let globalSentenceIndex = 0;
      
      // Calculate the starting global sentence index for this paragraph
      for (let i = 0; i < paragraphIndex; i++) {
        const prevParagraph = paragraphs[i];
        const prevSentences = getSentences(prevParagraph);
        globalSentenceIndex += prevSentences.length;
      }
      
      return sentences.map((sentence, sentenceIndex) => {
        const words = sentence.trim().split(/\s+/);
        const isSentenceActive = currentSentence === globalSentenceIndex;
        
        
        const result = (
          <span key={`p${paragraphIndex}-s${sentenceIndex}`}>
            {words.map((word, wordIndex) => {
              const isWordActive = highlightedWords.has(`${globalSentenceIndex}-${wordIndex}`);
              
              // Check if word is wrapped in **word**
              const isVocabWord = word.includes('**');
              
              // Clean the word for display (remove asterisks and punctuation for matching)
              const displayWord = word.replace(/\*\*/g, '');
              const cleanWord = displayWord.replace(/[.,!?;:'"()[\]{}]/g, '').toLowerCase();
              
              // Debug logging
              if (isVocabWord) {
                console.log('Found vocabulary word:', { word, displayWord, cleanWord });
              }
              
              const wordElement = (
                <span
                  key={`p${paragraphIndex}-s${sentenceIndex}-w${wordIndex}`}
                  className={`${
                    isVocabWord 
                      ? 'vocabulary-word' 
                      : `transition-colors duration-100 ${
                          isWordActive 
                            ? 'bg-blue-500' 
                            : isSentenceActive 
                            ? 'bg-blue-100' 
                            : ''
                        }`
                  }`}
                  onMouseEnter={isVocabWord ? (e) => handleWordHover(cleanWord, e) : undefined}
                  onMouseLeave={isVocabWord ? handleWordLeave : undefined}
                  role={isVocabWord ? "button" : undefined}
                  tabIndex={isVocabWord ? 0 : undefined}
                  aria-label={isVocabWord ? `Vocabulary word: ${displayWord}` : undefined}
                >
                  {displayWord}{' '}
                </span>
              );
              
              return wordElement;
            })}
          </span>
        );
        
        globalSentenceIndex++;
        return result;
      });
    };
    
    if (vocabularyWords.length === 0) {
      // No vocabulary words, render plain paragraphs with word highlighting
      return paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-6 last:mb-0">
          {renderTextWithHighlighting(paragraph, index)}
        </p>
      ));
    }

    // With vocabulary words, render paragraphs with both vocabulary and word highlighting
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-6 last:mb-0">
        {renderTextWithHighlighting(paragraph, index)}
      </p>
    ));
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
          <div className="mb-4 p-3 bg-cream-200 border border-brand-blue-light rounded-lg text-center">
            <p className="text-sm text-brand-brown">
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
              <div className="font-bold text-lg text-brand-brown-dark mb-2">
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
                <div className="text-sm text-gray-600 italic mb-3 pl-3 border-l-2 border-brand-blue-light">
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
                      className="text-xs px-2 py-1 bg-cream-200 text-brand-brown rounded-full"
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
                    : 'bg-brand-blue hover:bg-brand-blue-dark hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                } text-white focus:outline-none focus:ring-4 focus:ring-brand-blue-light`}
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
                  </span>
                )}
              </button>

              {/* Stop Button (only show when playing) */}
              {isPlaying && (
                <button
                  onClick={stopAudio}
                  className="px-8 py-4 min-h-[48px] text-lg font-bold rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-300"
                  aria-label="Stop audio playback"
                >
                  ⏹️ Stop
                </button>
              )}

          {/* Audio Status Indicators */}
          {!isPlaying && audioPreloadStatus === 'loaded' && preloadedAudio && (
            <div className="mt-4 text-center">
              <span className="text-sm bg-cream-200 text-brand-blue px-3 py-1 rounded-full animate-pulse">
                🎵 Audio preloaded - Ready for instant playback!
              </span>
            </div>
          )}
          {!isPlaying && audioPreloadStatus === 'loading' && (
            <div className="mt-4 text-center">
              <span className="text-sm bg-cream-200 text-gray-600 px-3 py-1 rounded-full">
                ⏳ Loading audio...
              </span>
            </div>
          )}
          {audioStatus === 'ready' && audioSource === 'stored' && (
            <div className="mt-4 text-center">
              <span className="text-sm bg-cream-200 text-brand-blue-dark px-3 py-1 rounded-full">
                ✅ Audio loaded from storage (No credits used)
              </span>
            </div>
          )}
          {audioStatus === 'ready' && audioSource === 'generated' && (
            <div className="mt-4 text-center">
              <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                ⚠️ Audio generated (Credits used)
              </span>
            </div>
          )}

          {/* Back to History Button (only if viewing from history) */}
          {isFromHistory && onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="px-8 py-4 min-h-[48px] text-lg font-bold rounded-lg bg-brand-brown hover:bg-brand-brown-dark text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-brand-brown-light"
              aria-label="Back to story history"
            >
              ← Back to History
            </button>
          )}

          {/* Generate New Story Button */}
          <button
            onClick={onGenerateNew}
            className="px-8 py-4 min-h-[48px] text-lg font-bold rounded-lg bg-brand-blue hover:bg-brand-blue-dark text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-brand-blue-light"
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
