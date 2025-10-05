import React, { useState, useEffect, useRef } from 'react';
import { getBatchWordDefinitions } from '../services/gemini';
import { convertTextToSpeech, playAudioFromBlob } from '../services/elevenLabsService';
import './StoryReader.css';

const StoryReader = ({ 
  story, 
  storyTitle, 
  onGenerateNew, 
  onBackToHistory, 
  vocabularyWords = [], 
  age, 
  isFromHistory = false, 
  storedVocabDefinitions = {}, 
  storyId = null, 
  preloadedAudio = null, 
  audioPreloadStatus = 'not-found' 
}) => {
  const [wordDefinitions, setWordDefinitions] = useState({});
  const [hoveredWord, setHoveredWord] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState(null);
  const [audioStatus, setAudioStatus] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [highlightedWords, setHighlightedWords] = useState(new Set());
  const [currentSentence, setCurrentSentence] = useState(-1);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [showVocabularyPanel, setShowVocabularyPanel] = useState(false);
  
  const audioRef = useRef(null);
  const timeoutsRef = useRef([]);
  const storyRef = useRef(null);
  const progressRef = useRef(null);

  // Font size options
  const fontSizes = {
    small: '16px',
    medium: '20px',
    large: '24px',
    xlarge: '28px'
  };

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

  // Load vocabulary definitions
  useEffect(() => {
    const loadDefinitions = async () => {
      console.log('Loading definitions for vocabulary words:', vocabularyWords);
      console.log('Stored vocab definitions:', storedVocabDefinitions);
      
      setLoadingDefinitions(true);
      try {
        if (Object.keys(storedVocabDefinitions).length > 0) {
          console.log('Using stored vocabulary definitions');
          setWordDefinitions(storedVocabDefinitions);
        } else if (vocabularyWords.length > 0 && age) {
          console.log('Fetching definitions from API in batch...');
          const definitionsMap = await getBatchWordDefinitions(vocabularyWords, age);
          console.log('Word definitions loaded from API:', definitionsMap);
          setWordDefinitions(definitionsMap);
        }
      } catch (error) {
        console.error('Error loading word definitions:', error);
      } finally {
        setLoadingDefinitions(false);
      }
    };

    if (Object.keys(wordDefinitions).length === 0) {
      loadDefinitions();
    }
  }, [vocabularyWords, age, storedVocabDefinitions]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (storyRef.current && progressRef.current) {
        const storyHeight = storyRef.current.scrollHeight;
        const scrollTop = storyRef.current.scrollTop;
        const clientHeight = storyRef.current.clientHeight;
        const progress = Math.min(100, (scrollTop / (storyHeight - clientHeight)) * 100);
        setReadingProgress(progress);
      }
    };

    const storyElement = storyRef.current;
    if (storyElement) {
      storyElement.addEventListener('scroll', handleScroll);
      return () => storyElement.removeEventListener('scroll', handleScroll);
    }
  }, [story]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle word hover for vocabulary
  const handleWordHover = (cleanWord, event) => {
    let definition = wordDefinitions[cleanWord];
    
    if (!definition) {
      const vocabularyWords = Object.keys(wordDefinitions);
      for (const vocabWord of vocabularyWords) {
        if (cleanWord.includes(vocabWord) || vocabWord.includes(cleanWord)) {
          definition = wordDefinitions[vocabWord];
          break;
        }
      }
    }
    
    if (definition) {
      setHoveredWord(definition);
      
      const rect = event.target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      setTooltipPosition({
        top: rect.top + scrollTop - 10,
        left: rect.left + (rect.width / 2),
      });
    }
  };

  const handleWordLeave = () => {
    setHoveredWord(null);
  };


  // Audio and highlighting functions
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
      if (preloadedAudio && audioPreloadStatus === 'loaded') {
        console.log('✅ Using preloaded audio - INSTANT PLAYBACK!');
        setAudioStatus('ready');
        setAudioSource('stored');
        await playAudioWithHighlighting(preloadedAudio);
        return;
      }
      
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

  // Render story with vocabulary and highlighting
  const renderStoryWithVocabulary = () => {
    if (!story) return null;

    const paragraphs = story.split('\n').filter(p => p.trim() !== '');
    
    const renderTextWithHighlighting = (text, paragraphIndex) => {
      const sentences = getSentences(text);
      let globalSentenceIndex = 0;
      
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
              
              const isVocabWord = word.includes('**');
              const displayWord = word.replace(/\*\*/g, '');
              const cleanWord = displayWord.replace(/[.,!?;:'"()[\]{}]/g, '').toLowerCase();
              
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
      return paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-6 last:mb-0">
          {renderTextWithHighlighting(paragraph, index)}
        </p>
      ));
    }

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
    <div className={`story-reader-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header with controls */}
      <div className="story-reader-header">
        <div className="story-reader-controls">
          <div className="control-group">
            <button
              onClick={() => setFontSize(fontSize === 'xlarge' ? 'large' : fontSize === 'large' ? 'medium' : fontSize === 'medium' ? 'small' : 'small')}
              className="control-button"
              title="Decrease font size"
            >
              a
            </button>
            
            <button
              onClick={() => setFontSize(fontSize === 'small' ? 'medium' : fontSize === 'medium' ? 'large' : fontSize === 'large' ? 'xlarge' : 'xlarge')}
              className="control-button"
              title="Increase font size"
            >
              A
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="control-button"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? '⤓' : '⤢'}
            </button>
            
            <button
              onClick={() => setShowVocabularyPanel(!showVocabularyPanel)}
              className="control-button"
              title="Toggle vocabulary panel"
            >
              📚
            </button>
          </div>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${readingProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{Math.round(readingProgress)}%</span>
          </div>
        </div>
      </div>

      {/* Main reading area */}
      <div className="story-reader-main">
        {/* Vocabulary panel */}
        {showVocabularyPanel && (
          <div className="vocabulary-panel">
            <div className="vocabulary-panel-header">
              <h3>Vocabulary Words</h3>
              <button onClick={() => setShowVocabularyPanel(false)}>×</button>
            </div>
            <div className="vocabulary-list">
              {Object.entries(wordDefinitions).map(([word, definition]) => (
                <div key={word} className="vocabulary-item">
                  <div className="vocabulary-word-header">
                    <span className="vocabulary-word-text">{word}</span>
                  </div>
                  <div className="vocabulary-definition">{definition.simple_definition}</div>
                  {definition.example_sentence && (
                    <div className="vocabulary-example">"{definition.example_sentence}"</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story content */}
        <div 
          ref={storyRef}
          className="story-content-area"
          style={{ fontSize: fontSizes[fontSize] }}
        >
          <article
            className="story-article"
          >
            {/* Story Title */}
            {storyTitle && (
              <div className="story-title-section">
                <h1 className="story-title">{storyTitle}</h1>
                <div className="title-underline"></div>
              </div>
            )}

            {/* Story Content */}
            <div className="story-text">
              {renderStoryWithVocabulary()}
            </div>
          </article>
        </div>
      </div>

      {/* Audio controls */}
      <div className="audio-controls">
        <button
          onClick={handlePlayStory}
          disabled={isPlaying}
          className={`play-button ${isPlaying ? 'playing' : ''}`}
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
            <span>🔊 Play Story</span>
          )}
        </button>

        {isPlaying && (
          <button onClick={stopAudio} className="stop-button">
            ⏹️ Stop
          </button>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="story-navigation">
        <button onClick={() => window.location.href = '/'} className="nav-button home-button">
          🏠 Home
        </button>
      </div>

      {/* Vocabulary tooltip */}
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
            <div className="tooltip-arrow"></div>
            
            <div className="tooltip-word">
              {hoveredWord.word}
            </div>
            
            {hoveredWord.pronunciation && (
              <div className="tooltip-pronunciation">
                {hoveredWord.pronunciation}
              </div>
            )}
            
            <div className="tooltip-definition">
              {hoveredWord.simple_definition}
            </div>
            
            {hoveredWord.example_sentence && (
              <div className="tooltip-example">
                "{hoveredWord.example_sentence}"
              </div>
            )}
            
            {hoveredWord.synonyms && hoveredWord.synonyms.length > 0 && (
              <div className="tooltip-synonyms">
                <span className="synonyms-label">Similar words:</span>
                {hoveredWord.synonyms.map((syn, idx) => (
                  <span key={idx} className="synonym-tag">
                    {syn}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Error message */}
      {playError && (
        <div className="error-message">
          <p>{playError}</p>
        </div>
      )}
    </div>
  );
};

export default StoryReader;
