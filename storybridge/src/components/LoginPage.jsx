import React from 'react';
import LoginButton from './LoginButton.jsx';
import storybitesLogo from '../images/storybites.png';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-cream-200">
      {/* Header */}
      <header className="bg-amber-100/80 backdrop-blur-sm border-b border-amber-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center p-1">
                <img src={storybitesLogo} alt="StoryBites Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-700 to-amber-800 bg-clip-text text-transparent">StoryBites</h1>
            </div>
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full">
        {/* Hero Content - Full Width */}
        <div className="bg-gradient-to-b from-white to-cream-100 px-8 py-36 text-center border-b border-cream-300">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              Create a Story That Speaks<br />
              <span className="bg-gradient-to-r from-brand-brown to-brand-accent bg-clip-text text-transparent">to Your Child's Heart</span>
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
              className="bg-gradient-to-r from-yellow-700 to-amber-800 hover:from-yellow-800 hover:to-amber-900 text-white font-bold text-lg py-4 px-10 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-2"
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
              <div className="bg-white rounded-2xl shadow-lg border border-cream-300 p-8 text-center hover:shadow-xl hover:border-brand-brown-light transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-brown to-brand-accent rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">✓</span>
                </div>
                <h3 className="text-gray-900 font-bold text-xl mb-3">Customizable Reading</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Choose from multiple readable fonts including OpenDyslexic, with adjustable sizes for optimal reading comfort
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-2xl shadow-lg border border-cream-300 p-8 text-center hover:shadow-xl hover:border-brand-brown-light transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-brown to-brand-accent rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">✓</span>
                </div>
                <h3 className="text-gray-900 font-bold text-xl mb-3">Audio Narration</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Every story includes high-quality audio narration with word highlighting
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-2xl shadow-lg border border-cream-300 p-8 text-center hover:shadow-xl hover:border-brand-brown-light transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-brown to-brand-accent rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">✓</span>
                </div>
                <h3 className="text-gray-900 font-bold text-xl mb-3">Personalized Themes</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Stories based on themes that engage your child with vocabulary learning
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