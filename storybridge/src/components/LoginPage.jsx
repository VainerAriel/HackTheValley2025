import React from 'react';
import LoginButton from './LoginButton.jsx';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="bg-white border-b border-cream-300 shadow-sm">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-2xl shadow-xl border border-cream-300 overflow-hidden">
          {/* Hero Content */}
          <div className="px-8 py-16 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-brand-brown-dark mb-6 leading-tight">
              Create a Story That Speaks<br />
              <span className="text-brand-blue">to Your Child's Heart</span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
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

          {/* Features Section */}
          <div className="bg-cream-100 px-8 py-10 border-t border-cream-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex items-start space-x-3">
                <span className="text-brand-blue text-2xl flex-shrink-0">✓</span>
                <span className="text-brand-brown text-lg">Dyslexia-friendly formatting</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-brand-blue text-2xl flex-shrink-0">✓</span>
                <span className="text-brand-brown text-lg">Audio narration included</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-brand-blue text-2xl flex-shrink-0">✓</span>
                <span className="text-brand-brown text-lg">Based on their interests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Built with love for young readers and their families
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
