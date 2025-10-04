import { useEffect } from 'react';
import './StoryDisplay.css';

function StoryDisplay({ story, onGenerateNew }) {
  // Load OpenDyslexic font
  useEffect(() => {
    // Create link element for the font if it doesn't exist
    const existingLink = document.querySelector('link[href*="opendyslexic"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  if (!story) {
    return null;
  }

  // Split story into paragraphs
  const paragraphs = story.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <article 
        className="dyslexia-friendly-story bg-[#FFF8E7] rounded-2xl shadow-2xl p-8 md:p-12"
        aria-label="Generated story"
      >
        {/* Story Content */}
        <div 
          className="story-content max-w-[700px] mx-auto"
          role="article"
        >
          {paragraphs.map((paragraph, index) => (
            <p 
              key={index}
              className="mb-6 last:mb-0"
            >
              {paragraph}
            </p>
          ))}
        </div>

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

