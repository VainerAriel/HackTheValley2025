import React, { useState, useRef } from 'react';
import { convertTextToSpeech, playAudioFromBlob } from '../services/elevenLabsService';

const TextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [text, setText] = useState('Welcome to StoryBridge! Type something to hear it spoken.');
  const [highlightedWords, setHighlightedWords] = useState(new Set());
  const [currentSentence, setCurrentSentence] = useState(-1);
  const audioRef = useRef(null);
  const timeoutsRef = useRef([]);

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
    const avgWordDuration = 290;
    
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
    const sentences = getSentences(text);
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

      const sentenceDuration = wordTimings.length * 290 + 200;
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

  const renderText = () => {
    const sentences = getSentences(text);
    
    return sentences.map((sentence, sentenceIndex) => {
      const words = sentence.trim().split(/\s+/);
      const isSentenceActive = currentSentence === sentenceIndex;
      
      return (
        <span key={sentenceIndex}>
          {words.map((word, wordIndex) => {
            const isWordActive = highlightedWords.has(`${sentenceIndex}-${wordIndex}`);
            
            return (
              <span
                key={`${sentenceIndex}-${wordIndex}`}
                className={`transition-colors duration-100 ${
                  isWordActive 
                    ? 'bg-yellow-400' 
                    : isSentenceActive 
                    ? 'bg-yellow-50' 
                    : ''
                }`}
              >
                {word}{' '}
              </span>
            );
          })}
        </span>
      );
    });
  };

  const handlePlayAudio = async () => {
    try {
      setIsPlaying(true);
      setError(null);
      setHighlightedWords(new Set());
      setCurrentSentence(-1);
      clearAllTimeouts();

      const audioBlob = await convertTextToSpeech(text);
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

      audio.onerror = () => {
        setError('Failed to play audio');
        setIsPlaying(false);
        clearAllTimeouts();
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setIsPlaying(false);
    }
  };

  return (
    <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              🌉 Text-to-Speech
            </h2>
            <p className="text-lg text-gray-600">
              Transform your text into natural speech with ElevenLabs API
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your text:
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows="4"
                placeholder="Type something to convert to speech..."
                disabled={isPlaying}
              />
            </div>

            {text && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Preview:</h3>
                <p className="text-gray-700 text-base leading-relaxed">
                  {renderText()}
                </p>
              </div>
            )}

            {text.trim() && (
              <div className="flex gap-3">
                <button
                  onClick={handlePlayAudio}
                  disabled={isPlaying}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                    isPlaying
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {isPlaying ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Playing...
                    </span>
                  ) : (
                    '🎵 Play Audio'
                  )}
                </button>
                
                {isPlaying && (
                  <button
                    onClick={stopAudio}
                    className="px-6 py-4 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-200"
                  >
                    Stop
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Powered by ElevenLabs AI • Built with React & Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
