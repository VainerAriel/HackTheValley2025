import { useEffect, useState } from 'react';
import { getWordDefinition } from '../Services/gemini';
import './StoryDisplay.css';

function StoryDisplay({ story, onGenerateNew, vocabularyWords = [], age }) {
  const [wordDefinitions, setWordDefinitions] = useState({});
  const [hoveredWord, setHoveredWord] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);

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

  // Fetch definitions for vocabulary words
  useEffect(() => {
    if (vocabularyWords.length > 0 && age) {
      fetchDefinitions();
    }
  }, [vocabularyWords, age]);

  const fetchDefinitions = async () => {
    setLoadingDefinitions(true);
    try {
      // Fetch all definitions in parallel
      const definitionPromises = vocabularyWords.map(word => 
        getWordDefinition(word, age)
      );
      const definitions = await Promise.all(definitionPromises);
      
      // Create a map of word -> definition
      const definitionsMap = {};
      definitions.forEach(def => {
        if (def && def.word) {
          definitionsMap[def.word.toLowerCase()] = def;
        }
      });
      
      setWordDefinitions(definitionsMap);
    } catch (error) {
      console.error('Error fetching word definitions:', error);
    } finally {
      setLoadingDefinitions(false);
    }
  };

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

  // Parse story and wrap vocabulary words
  const renderStoryWithVocabulary = () => {
    if (!story) return null;

    const paragraphs = story.split('\n').filter(p => p.trim() !== '');
    
    if (vocabularyWords.length === 0) {
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

        {/* Generate New Story Button */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={onGenerateNew}
            className="px-8 py-4 min-h-[48px] text-lg font-bold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-300"
            aria-label="Generate a new story"
          >
            ✨ Generate New Story
          </button>
        </div>
      </article>
    </div>
  );
}

export default StoryDisplay;
