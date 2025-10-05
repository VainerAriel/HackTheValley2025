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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [showVocabularyPanel, setShowVocabularyPanel] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [selectedFont, setSelectedFont] = useState(() => {
    return localStorage.getItem('storyFont') || 'OpenDyslexic';
  });
  
  // Sentence-based audio state
  const [sentenceAudioData, setSentenceAudioData] = useState(null);
  const [sentenceAudioSegments, setSentenceAudioSegments] = useState([]);
  const [currentPlayingSentence, setCurrentPlayingSentence] = useState(-1);
  const [sentenceAudioStatus, setSentenceAudioStatus] = useState(null);
  
  const audioRef = useRef(null);
  const timeoutsRef = useRef([]);
  const storyRef = useRef(null);
  const highlightIntervalRef = useRef(null);

  // Font size options
  const fontSizes = {
    small: '16px',
    medium: '20px',
    large: '24px',
    xlarge: '28px'
  };

  // Font options
  const fontOptions = [
    { name: 'OpenDyslexic', value: 'OpenDyslexic', description: 'Designed for dyslexia' },
    { name: 'Verdana', value: 'Verdana', description: 'Highly readable' },
    { name: 'Arial', value: 'Arial', description: 'Clean & simple' },
    { name: 'Georgia', value: 'Georgia', description: 'Elegant serif' },
    { name: 'Comic Sans MS', value: 'Comic Sans MS', description: 'Friendly & rounded' }
  ];

  // Save font preference
  useEffect(() => {
    localStorage.setItem('storyFont', selectedFont);
  }, [selectedFont]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Get font family string
  const getFontFamily = () => {
    if (selectedFont === 'OpenDyslexic') {
      return `'OpenDyslexic', 'Comic Sans MS', 'Arial', sans-serif`;
    }
    return `'${selectedFont}', sans-serif`;
  };

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

  // Load sentence audio data
  const loadSentenceAudioData = async (storyId) => {
    try {
      console.log('🎵 Loading sentence audio data for story:', storyId);
      const response = await fetch(`http://localhost:5000/api/story/${storyId}/sentence-audio?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSentenceAudioData(data.data);
        console.log('✅ Sentence audio data loaded:', data.data.sentenceCount, 'sentences');
        return data.data;
      } else {
        console.log('Sentence audio not found (404)');
        return null;
      }
    } catch (error) {
      console.error('Error loading sentence audio data:', error);
      return null;
    }
  };

  // Generate sentence audio segments using word timing estimation
  const generateSentenceAudioSegments = async (sentenceData) => {
    try {
      console.log('🎯 Generating precise sentence segments using word timing estimation');
      
      // Convert base64 combined audio to blob
      const combinedAudioBlob = new Blob([
        Uint8Array.from(atob(sentenceData.combinedAudio), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      // Create audio element to get duration
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(combinedAudioBlob);
      audio.src = audioUrl;
      
      return new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          const totalDuration = audio.duration;
          URL.revokeObjectURL(audioUrl);
          
          console.log(`📊 Total audio duration: ${totalDuration.toFixed(2)}s`);
          
          // Calculate precise timing for each sentence using word estimation
          const segments = [];
          let currentTime = 0;
          
          // Calculate total characters for proportional distribution
          const totalCharacters = sentenceData.sentences.reduce((total, sentence) => total + sentence.length, 0);
          const timePerCharacter = totalDuration / totalCharacters;
          
          console.log(`📊 Total characters: ${totalCharacters}, Time per character: ${timePerCharacter.toFixed(3)}s`);
          
          sentenceData.sentences.forEach((sentence, index) => {
            // Use proportional duration based on character count
            const estimatedDuration = sentence.length * timePerCharacter;
            
            const segment = {
              sentence,
              startTime: currentTime,
              endTime: currentTime + estimatedDuration,
              duration: estimatedDuration
            };
            
            segments.push(segment);
            currentTime += estimatedDuration;
            
            console.log(`📝 Sentence ${index}: "${sentence.substring(0, 30)}..." (${estimatedDuration.toFixed(2)}s at ${currentTime.toFixed(2)}s)`);
          });
          
          // No timing adjustment needed with proportional distribution
          
          setSentenceAudioSegments(segments);
          console.log(`✅ Generated ${segments.length} precise sentence segments`);
          resolve(segments);
        });
        
        audio.addEventListener('error', () => {
          console.error('Error loading audio metadata');
          URL.revokeObjectURL(audioUrl);
          resolve([]);
        });
      });
    } catch (error) {
      console.error('Error generating sentence segments:', error);
      return [];
    }
  };

  const estimateWordTimings = (sentence) => {
    const words = sentence.trim().split(/\s+/);
    
    return words.map((word, index) => {
      // Base duration based on word length (slowed down significantly for better readability)
      const baseDuration = Math.max(500, word.length * 120); // Minimum 500ms, 120ms per character
      
      // Adjust for word complexity
      let duration = baseDuration;
      
      // Longer words get slightly more time per character
      if (word.length > 6) {
        duration = Math.max(750, word.length * 120);
      }
      
      // Shorter words get a bit more time for natural speech
      if (word.length <= 3) {
        duration = Math.max(600, duration);
      }
      
      // Adjust for punctuation (words ending with punctuation get more time)
      if (/[.!?]$/.test(word)) {
        duration += 200; // Extra time for "sentence endings"
      } else if (/[,;:]$/.test(word)) {
        duration += 100; // Slight pause for commas/semicolons
      }
      
      // Calculate start time based on previous words (slowed down significantly)
      const startTime = index === 0 ? 0 : words.slice(0, index).reduce((total, prevWord) => {
        const prevDuration = Math.max(500, prevWord.length * 120);
        return total + prevDuration;
      }, 0);
      
      return {
        word,
        startTime,
        duration: Math.round(duration)
      };
    });
  };

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    // Clear highlight interval if it exists
    if (highlightIntervalRef.current) {
      clearInterval(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }
  };

  const highlightText = () => {
    const sentences = getSentences(story);
    let cumulativeDelay = 0;
    let globalWordIndex = 0;


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

      // Calculate total sentence duration based on actual word timings
      const totalWordDuration = wordTimings.reduce((total, timing) => total + timing.duration, 0);
      const sentenceDuration = totalWordDuration + 800; // 800ms rest at end of sentence for natural pause
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
    // Stop any audio elements
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Clear all timeouts and intervals
    clearAllTimeouts();
    
    // Reset all audio and highlighting state
    setIsPlaying(false);
    setHighlightedWords(new Set());
    setCurrentSentence(-1);
    setCurrentPlayingSentence(-1);
    setPlayError(null);
    
    // Clear any audio URLs to prevent memory leaks
    if (audioRef.current && audioRef.current.src) {
      URL.revokeObjectURL(audioRef.current.src);
    }
    
    console.log('🛑 Audio stopped and state reset');
  };

  // Stop any currently playing audio before starting new audio
  const stopCurrentAudio = () => {
    if (audioRef.current && !audioRef.current.paused) {
      console.log('🛑 Stopping current audio before starting new audio');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    clearAllTimeouts();
    setHighlightedWords(new Set());
    setCurrentSentence(-1);
    setCurrentPlayingSentence(-1);
  };

  const playAudioWithHighlighting = async (audioBlob) => {
    stopCurrentAudio(); // Stop any currently playing audio
    
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

    // Wait for audio to be ready to play
    await new Promise((resolve, reject) => {
      const handleCanPlay = () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
        resolve();
      };
      
      const handleError = (error) => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
        reject(error);
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      // If already loaded, resolve immediately
      if (audio.readyState >= 3) {
        handleCanPlay();
      }
    });

    // Small delay to ensure audio is fully ready
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log('🎵 Attempting to play fallback audio...');
      await audio.play();
      console.log('✅ Fallback audio is now playing!');
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  // Detect sections (paragraphs) in the story
  const getSections = (text) => {
    return text.split('\n').filter(p => p.trim() !== '');
  };


  // Get section start sentence indices
  const getSectionStartSentences = () => {
    if (!story) return [];
    
    const sections = getSections(story);
    const sectionStarts = [];
    let currentSentenceIndex = 0;
    
    sections.forEach((section, sectionIndex) => {
      const sectionSentences = getSentences(section);
      sectionStarts.push({
        sectionIndex,
        sentenceIndex: currentSentenceIndex,
        sectionText: section.substring(0, 50) + '...'
      });
      currentSentenceIndex += sectionSentences.length;
    });
    
    console.log('📊 Total sections found:', sectionStarts.length);
    return sectionStarts;
  };

  // Play a specific sentence with provided segments - avoids state timing issues
  const playSentenceBasedAudioWithSegments = async (startSentenceIndex = 0, audioData, segments) => {
    if (!audioData || !segments.length) {
      console.log('No sentence audio data or segments available');
      return;
    }
    
    stopCurrentAudio(); // Stop any currently playing audio
    
    console.log(`🎵 Playing sentence ${startSentenceIndex} with provided segments`);
    
    try {
      setIsPlaying(true);
      setPlayError(null);
      
      
      // Use the same global sentence index as the rendering system
      setCurrentSentence(startSentenceIndex);
      setCurrentPlayingSentence(startSentenceIndex);
      console.log(`🎯 Highlighting sentence ${startSentenceIndex}: "${segments[startSentenceIndex]?.sentence.substring(0, 50)}..."`);
      
      // Highlight all words in this sentence
      highlightWordsInSentenceWithSegments(startSentenceIndex, segments);
      
      // Convert base64 combined audio to blob
      const combinedAudioBlob = new Blob([
        Uint8Array.from(atob(audioData.combinedAudio), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      // Create audio element
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(combinedAudioBlob);
      audio.src = audioUrl;
      audioRef.current = audio; // Store reference for stop functionality
      
      // Set start time to the beginning of the specified sentence
      const startSegment = segments[startSentenceIndex];
      if (startSegment) {
        // Add systematic offset to account for timing mismatch
        const offsetTime = Math.max(0, startSegment.startTime - 1.0);
        console.log(`🎯 TIMING ISSUE: Playing sentence ${startSentenceIndex} at ${offsetTime.toFixed(2)}s (was ${startSegment.startTime.toFixed(2)}s): "${startSegment.sentence.substring(0, 50)}..."`);
        audio.currentTime = offsetTime;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Wait for audio to be ready to play
      await new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (error) => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          reject(error);
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        
        // If already loaded, resolve immediately
        if (audio.readyState >= 3) {
          handleCanPlay();
        }
      });
      
      // Small delay to ensure audio is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Play the audio
      console.log('🎵 Attempting to play audio...');
      await audio.play();
      console.log('✅ Audio is now playing!');
      
      // Simple approach: just highlight the sentence we're playing and stay there
      console.log(`🎯 Staying on sentence ${startSentenceIndex} until audio moves naturally`);
      
      // Set up simple highlighting that only updates when we actually move to a different sentence
      let lastHighlightedSentence = startSentenceIndex;
      const updateHighlighting = () => {
        const currentTime = audio.currentTime;
        
        console.log(`⏰ Audio time: ${currentTime.toFixed(2)}s, Currently highlighting: ${lastHighlightedSentence}`);
        
        // Find which sentence should be highlighted based on audio time
        let currentSentenceIndex = -1;
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          console.log(`📊 Sentence ${i}: ${segment.startTime.toFixed(2)}s - ${segment.endTime.toFixed(2)}s`);
          
          if (currentTime >= segment.startTime && currentTime < segment.endTime) {
            currentSentenceIndex = i;
            console.log(`✅ Audio time ${currentTime.toFixed(2)}s falls in sentence ${i}`);
            break;
          }
        }
        
        // Only update if we've actually moved to a different sentence
        if (currentSentenceIndex !== -1 && currentSentenceIndex !== lastHighlightedSentence) {
          console.log(`🎯 Audio naturally moved to sentence ${currentSentenceIndex}: "${segments[currentSentenceIndex]?.sentence.substring(0, 50)}..."`);
          setCurrentSentence(currentSentenceIndex);
          setCurrentPlayingSentence(currentSentenceIndex);
          highlightWordsInSentenceWithSegments(currentSentenceIndex, segments);
          lastHighlightedSentence = currentSentenceIndex;
        } else if (currentSentenceIndex === -1) {
          console.log(`❌ No sentence found for audio time ${currentTime.toFixed(2)}s`);
        } else {
          console.log(`⏸️ Staying on sentence ${currentSentenceIndex} (no change)`);
        }
      };
      
      // Update highlighting every 500ms to avoid jumping
      const highlightInterval = setInterval(updateHighlighting, 500);
      highlightIntervalRef.current = highlightInterval;
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
        clearInterval(highlightInterval);
        highlightIntervalRef.current = null;
        setIsPlaying(false);
        setCurrentPlayingSentence(-1);
        setCurrentSentence(-1);
        setHighlightedWords(new Set());
        console.log(`✅ Finished playing sentence ${startSentenceIndex}`);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(audioUrl);
        clearInterval(highlightInterval);
        highlightIntervalRef.current = null;
        setPlayError('Failed to play sentence audio');
        setIsPlaying(false);
        setCurrentPlayingSentence(-1);
      });
      
    } catch (error) {
      console.error('Error playing sentence-based audio:', error);
      setPlayError('Failed to play sentence audio');
      setIsPlaying(false);
      setCurrentPlayingSentence(-1);
    }
  };

  // Play a specific sentence - simple approach (uses state)
  const playSentenceBasedAudio = async (startSentenceIndex = 0) => {
    if (!sentenceAudioData || !sentenceAudioSegments.length) {
      console.log('No sentence audio data available');
      return;
    }
    
    stopCurrentAudio(); // Stop any currently playing audio
    
    console.log(`🎵 Playing sentence ${startSentenceIndex}`);
    
    try {
      setIsPlaying(true);
      setPlayError(null);
      
      
      // Use the same global sentence index as the rendering system
      setCurrentSentence(startSentenceIndex);
      setCurrentPlayingSentence(startSentenceIndex);
      console.log(`🎯 Highlighting sentence ${startSentenceIndex}: "${sentenceAudioSegments[startSentenceIndex]?.sentence.substring(0, 50)}..."`);
      
      // Highlight all words in this sentence
      highlightWordsInSentence(startSentenceIndex);
      
      // Convert base64 combined audio to blob
      const combinedAudioBlob = new Blob([
        Uint8Array.from(atob(sentenceAudioData.combinedAudio), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      // Create audio element
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(combinedAudioBlob);
      audio.src = audioUrl;
      audioRef.current = audio; // Store reference for stop functionality
      
      // Set start time to the beginning of the specified sentence
      const startSegment = sentenceAudioSegments[startSentenceIndex];
      if (startSegment) {
        console.log(`⏰ Starting at time ${startSegment.startTime}s for sentence: "${startSegment.sentence.substring(0, 50)}..."`);
        audio.currentTime = startSegment.startTime;
      }
      
      // Wait for audio to be ready to play
      await new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (error) => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          reject(error);
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        
        // If already loaded, resolve immediately
        if (audio.readyState >= 3) {
          handleCanPlay();
        }
      });
      
      // Small delay to ensure audio is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Play the audio
      console.log('🎵 Attempting to play audio...');
      await audio.play();
      console.log('✅ Audio is now playing!');
      
      // Simple approach: just highlight the sentence we're playing and stay there
      console.log(`🎯 Staying on sentence ${startSentenceIndex} until audio moves naturally`);
      
      // Set up simple highlighting that only updates when we actually move to a different sentence
      let lastHighlightedSentence = startSentenceIndex;
      const updateHighlighting = () => {
        const currentTime = audio.currentTime;
        
        console.log(`⏰ Audio time: ${currentTime.toFixed(2)}s, Currently highlighting: ${lastHighlightedSentence}`);
        
        // Find which sentence should be highlighted based on audio time
        let currentSentenceIndex = -1;
        for (let i = 0; i < sentenceAudioSegments.length; i++) {
          const segment = sentenceAudioSegments[i];
          console.log(`📊 Sentence ${i}: ${segment.startTime.toFixed(2)}s - ${segment.endTime.toFixed(2)}s`);
          
          if (currentTime >= segment.startTime && currentTime < segment.endTime) {
            currentSentenceIndex = i;
            console.log(`✅ Audio time ${currentTime.toFixed(2)}s falls in sentence ${i}`);
            break;
          }
        }
        
        // Only update if we've actually moved to a different sentence
        if (currentSentenceIndex !== -1 && currentSentenceIndex !== lastHighlightedSentence) {
          console.log(`🎯 Audio naturally moved to sentence ${currentSentenceIndex}: "${sentenceAudioSegments[currentSentenceIndex]?.sentence.substring(0, 50)}..."`);
          setCurrentSentence(currentSentenceIndex);
          setCurrentPlayingSentence(currentSentenceIndex);
          highlightWordsInSentence(currentSentenceIndex);
          lastHighlightedSentence = currentSentenceIndex;
        } else if (currentSentenceIndex === -1) {
          console.log(`❌ No sentence found for audio time ${currentTime.toFixed(2)}s`);
        } else {
          console.log(`⏸️ Staying on sentence ${currentSentenceIndex} (no change)`);
        }
      };
      
      // Update highlighting every 500ms to avoid jumping
      const highlightInterval = setInterval(updateHighlighting, 500);
      highlightIntervalRef.current = highlightInterval;
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
        clearInterval(highlightInterval);
        highlightIntervalRef.current = null;
        setIsPlaying(false);
        setCurrentPlayingSentence(-1);
        setCurrentSentence(-1);
        setHighlightedWords(new Set());
        console.log(`✅ Finished playing sentence ${startSentenceIndex}`);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(audioUrl);
        clearInterval(highlightInterval);
        highlightIntervalRef.current = null;
        setPlayError('Failed to play sentence audio');
        setIsPlaying(false);
        setCurrentPlayingSentence(-1);
      });
      
    } catch (error) {
      console.error('Error playing sentence-based audio:', error);
      setPlayError('Failed to play sentence audio');
      setIsPlaying(false);
      setCurrentPlayingSentence(-1);
    }
  };

  // Simple word highlighting - highlight all words in a sentence (uses state)
  const highlightWordsInSentence = (sentenceIndex) => {
    if (!sentenceAudioSegments[sentenceIndex]) {
      console.log(`❌ No audio segment found for sentence ${sentenceIndex}`);
      return;
    }
    
    const segment = sentenceAudioSegments[sentenceIndex];
    const words = segment.sentence.trim().split(/\s+/);
    const newHighlightedWords = new Set();
    
    console.log(`🎯 Highlighting words for sentence ${sentenceIndex}: "${segment.sentence.substring(0, 50)}..."`);
    console.log(`📝 Words: ${words.length} words`);
    
    words.forEach((word, wordIndex) => {
      newHighlightedWords.add(`${sentenceIndex}-${wordIndex}`);
      console.log(`📝 Word ${wordIndex}: "${word}" -> key: ${sentenceIndex}-${wordIndex}`);
    });
    
    console.log(`🎯 Setting highlighted words:`, Array.from(newHighlightedWords));
    setHighlightedWords(newHighlightedWords);
  };

  // Simple word highlighting - highlight all words in a sentence (uses provided segments)
  const highlightWordsInSentenceWithSegments = (sentenceIndex, segments) => {
    if (!segments[sentenceIndex]) {
      console.log(`❌ No audio segment found for sentence ${sentenceIndex}`);
      return;
    }
    
    const segment = segments[sentenceIndex];
    const words = segment.sentence.trim().split(/\s+/);
    const newHighlightedWords = new Set();
    
    console.log(`🎯 Highlighting words for sentence ${sentenceIndex}: "${segment.sentence.substring(0, 50)}..."`);
    console.log(`📝 Words: ${words.length} words`);
    
    words.forEach((word, wordIndex) => {
      newHighlightedWords.add(`${sentenceIndex}-${wordIndex}`);
      console.log(`📝 Word ${wordIndex}: "${word}" -> key: ${sentenceIndex}-${wordIndex}`);
    });
    
    console.log(`🎯 Setting highlighted words:`, Array.from(newHighlightedWords));
    setHighlightedWords(newHighlightedWords);
  };

  // Play audio from a specific sentence (for individual sentence replay)
  const playFromSentence = async (sentenceIndex) => {
    console.log(`🎯 SECTION CLICK: Starting sentence ${sentenceIndex}`);
    
    // If we have sentence audio data and segments, use the segments-based function
    if (sentenceAudioData && sentenceAudioSegments.length > 0) {
      await playSentenceBasedAudioWithSegments(sentenceIndex, sentenceAudioData, sentenceAudioSegments);
    } else {
      // Fallback to state-based function
      await playSentenceBasedAudio(sentenceIndex);
    }
  };

  const handlePlayStory = async () => {
    if (!story) return;
    
    stopCurrentAudio(); // Stop any currently playing audio
    
    setIsPlaying(true);
    setPlayError(null);
    
    try {
      // First try to load sentence audio data
      if (storyId) {
        const sentenceData = await loadSentenceAudioData(storyId);
        if (sentenceData) {
          console.log('✅ Using sentence audio data');
          setSentenceAudioStatus('ready');
          const segments = await generateSentenceAudioSegments(sentenceData);
          
          // Start sentence-based playback from the beginning (first sentence)
          console.log('🎯 Starting story playback from first sentence (index 0)');
          await playSentenceBasedAudioWithSegments(0, sentenceData, segments);
          return;
        }
      }
      
      // Fallback to old audio system
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
          console.log('🎵 Generating and storing sentence audio in database - THIS WILL USE API CREDITS');
          console.log('💰 Using Flash model for cost savings (0.5 credits per character)');
          
          const generateResponse = await fetch(`http://localhost:5000/api/story/${storyId}/generate-audio`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (generateResponse.ok) {
            console.log('✅ Sentence audio generated and stored in database');
            
            // Load the newly generated sentence audio
            const sentenceData = await loadSentenceAudioData(storyId);
            if (sentenceData) {
              setSentenceAudioStatus('ready');
              const segments = await generateSentenceAudioSegments(sentenceData);
              console.log('🎯 Starting newly generated audio from first sentence (index 0)');
              await playSentenceBasedAudioWithSegments(0, sentenceData, segments);
              return;
            }
          }
        } catch (error) {
          console.error('Error generating/storing sentence audio:', error);
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
        const currentGlobalIndex = globalSentenceIndex; // Capture the current index
        const words = sentence.trim().split(/\s+/);
        const isSentenceActive = currentSentence === currentGlobalIndex;
        const isCurrentlyPlaying = currentPlayingSentence === currentGlobalIndex;
        
        // Debug logging
        if (isSentenceActive || isCurrentlyPlaying) {
          console.log(`🎨 RENDERING: Paragraph ${paragraphIndex}, Sentence ${sentenceIndex}, Global Index ${currentGlobalIndex}`);
          console.log(`🎨 Sentence: "${sentence.substring(0, 50)}..."`);
          console.log(`🎨 Current sentence state: ${currentSentence}, Playing: ${currentPlayingSentence}`);
        }
        
        const result = (
          <span key={`p${paragraphIndex}-s${sentenceIndex}`} className="sentence-container relative group">
            {words.map((word, wordIndex) => {
              const isWordActive = highlightedWords.has(`${currentGlobalIndex}-${wordIndex}`);
              
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
                            ? 'bg-orange-500' 
                            : isSentenceActive 
                            ? 'bg-orange-100' 
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
            
            {/* Section play button - only show at section starts */}
            {sentenceAudioData && sentenceAudioSegments.length > 0 && (() => {
              const sectionStarts = getSectionStartSentences();
              const isSectionStart = sectionStarts.some(section => section.sentenceIndex === currentGlobalIndex);
              
              if (isSectionStart) {
                const sectionInfo = sectionStarts.find(section => section.sentenceIndex === currentGlobalIndex);
                return (
                  <button
                    onClick={() => playFromSentence(currentGlobalIndex)}
                    className={`absolute -left-8 top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                      isCurrentlyPlaying 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    title={`Play section ${sectionInfo.sectionIndex + 1}: ${sectionInfo.sectionText}`}
                    disabled={isPlaying && !isCurrentlyPlaying}
                  >
                    {isCurrentlyPlaying ? '⏸' : '▶'}
                  </button>
                );
              }
              return null;
            })()}
          </span>
        );
        
        globalSentenceIndex++; // Increment after processing
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
              onClick={() => setShowVocabularyPanel(!showVocabularyPanel)}
              className="control-button"
              title="Toggle vocabulary panel"
            >
              Vocabulary: {showVocabularyPanel ? 'On ' : 'Off'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="control-button"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
            >
              <span style={{ fontSize: '1.5em' }}>
                {isFullscreen ? '\uF3DE' : '⛶'}
              </span>
            </button>
            <button
              onClick={() => setFontSize(fontSize === 'xlarge' ? 'large' : fontSize === 'large' ? 'medium' : fontSize === 'medium' ? 'small' : 'small')}
              className="control-button"
              title="Decrease font size"
              style={{ background: 'linear-gradient(135deg, #c4a57b, #d4b896)' }}
            >
              a
            </button>
            
            <button
              onClick={() => setFontSize(fontSize === 'small' ? 'medium' : fontSize === 'medium' ? 'large' : fontSize === 'large' ? 'xlarge' : 'xlarge')}
              className="control-button"
              title="Increase font size"
              style={{ background: 'linear-gradient(135deg, #a88f6c, #b89968)' }}
            >
              A
            </button>
            

          
            <button
              onClick={() => setShowFontSelector(!showFontSelector)}
              className="control-button"
              title="Change font"
              style={{ fontFamily: getFontFamily(), background: 'linear-gradient(135deg, #8b7355, #6b543e)' }}
            >
              Font: {selectedFont}
            </button>
          </div>

          
          
        </div>

        {/* Font Selector Dropdown */}
        {showFontSelector && (
          <div className="font-selector-dropdown">
            <div className="font-selector-header">
              <h4>Choose Font</h4>
              <button onClick={() => setShowFontSelector(false)}>×</button>
            </div>
            <div className="font-options">
              {fontOptions.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
                    setSelectedFont(font.value);
                    setShowFontSelector(false);
                  }}
                  className={`font-option ${selectedFont === font.value ? 'selected' : ''}`}
                  style={{ fontFamily: font.value === 'OpenDyslexic' ? `'OpenDyslexic', 'Comic Sans MS', 'Arial', sans-serif` : `'${font.value}', sans-serif` }}
                >
                  <div className="font-name">{font.name}</div>
                  <div className="font-description">{font.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
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
          style={{ 
            fontSize: fontSizes[fontSize],
            fontFamily: getFontFamily()
          }}
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
        <button onClick={() => {
          stopAudio(); // Stop any playing audio before navigating
          window.location.href = '/';
        }} className="nav-button home-button">
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