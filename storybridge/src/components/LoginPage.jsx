import React from 'react';
import LoginButton from './LoginButton.jsx';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="bg-cream-100 border-b border-cream-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">S</span>
              </div>
              <h1 className="text-2xl font-bold text-brand-brown-dark">StoryBites</h1>
            </div>
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full">
        {/* Hero Content - Full Width */}
        <div className="bg-white px-8 py-36 text-center border-b border-cream-300">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-brand-brown-dark mb-8 leading-tight">
              Create a Story That Speaks<br />
              <span className="text-brand-blue">to Your Child's Heart</span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-14 max-w-2xl mx-auto leading-relaxed">
              Personalized audiobooks designed<br />
              for dyslexic learners
            </p>

            <button
              onClick={() => {
                const loginBtn = document.querySelector('[data-login-button]');
                if (loginBtn) loginBtn.click();
              }}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-lg py-4 px-10 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-2"
            >
              Create Your First Story
              <span className="text-2xl">→</span>
            </button>
          </div>
        </div>

        {/* Features Section - Individual Bubbles */}
        <div className="px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white rounded-2xl shadow-lg border border-cream-300 p-8 text-center hover:shadow-xl transition-shadow">
                <div className="text-brand-blue text-5xl mb-4">✓</div>
                <h3 className="text-brand-brown-dark font-bold text-xl mb-3">Dyslexia-Friendly</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Specially formatted for easy reading with OpenDyslexic font
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-2xl shadow-lg border border-cream-300 p-8 text-center hover:shadow-xl transition-shadow">
                <div className="text-brand-blue text-5xl mb-4">✓</div>
                <h3 className="text-brand-brown-dark font-bold text-xl mb-3">Audio Narration</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Every story includes high-quality audio narration
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-2xl shadow-lg border border-cream-300 p-8 text-center hover:shadow-xl transition-shadow">
                <div className="text-brand-blue text-5xl mb-4">✓</div>
                <h3 className="text-brand-brown-dark font-bold text-xl mb-3">Personalized Themes</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Stories based on themes that engage your child
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default LoginPage;
