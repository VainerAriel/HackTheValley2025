# 📚 StoryBites - AI-Powered Story Generation Platform

A dyslexia-friendly story generation platform that creates personalized stories for children using AI, with audio narration and vocabulary learning features.

## 🏗️ Project Structure

```
storybridge/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 ui/                    # Reusable UI components
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── LoginButton.jsx
│   │   │   └── LogoutButton.jsx
│   │   ├── 📁 layout/                # Layout components
│   │   │   ├── HomePage.jsx
│   │   │   └── LoginPage.jsx
│   │   └── 📁 features/              # Feature-specific components
│   │       ├── Dashboard.jsx         # Story creation interface
│   │       ├── StoryReader.jsx        # Interactive story display
│   │       ├── StoryView.jsx          # Story viewer wrapper
│   │       ├── StoryForm.jsx          # Story topic selection
│   │       ├── ProfileSetup.jsx       # User onboarding
│   │       ├── UserProfile.jsx        # User settings
│   │       ├── StoriesModal.jsx       # Story library browser
│   │       ├── VocabularyModal.jsx    # Vocabulary browser
│   │       └── VocabularySelector.jsx # Word selection
│   ├── 📁 hooks/                      # Custom React hooks
│   │   └── useStoryFlow.js           # Story generation workflow
│   ├── 📁 services/                  # API client services
│   │   ├── gemini.js                 # Google AI integration
│   │   ├── elevenLabsService.js      # Text-to-speech client
│   │   ├── storyService.js           # Story CRUD operations
│   │   └── vocabularyService.js      # Vocabulary management
│   ├── 📁 utils/                     # Utility functions
│   │   └── index.js                  # Common utilities
│   ├── 📁 constants/                 # Application constants
│   │   └── index.js                  # Configuration constants
│   ├── 📁 types/                     # Type definitions
│   │   └── index.js                  # JSDoc type definitions
│   ├── 📁 styles/                    # CSS styles
│   │   └── global.css                # Global styles
│   ├── 📁 assets/                    # Static assets
│   │   ├── 📁 images/                # Image files
│   │   └── 📁 icons/                 # Icon files
│   ├── App.js                        # Main application component
│   └── index.js                      # React entry point
├── 📁 api/                           # Vercel API Routes (Backend)
│   ├── _utils.js                     # Shared utilities
│   ├── elevenLabsService.js          # Server-side TTS service
│   ├── 📁 stories/                   # Story management endpoints
│   ├── 📁 story/[storyId]/           # Individual story operations
│   └── 📁 user/[userId]/             # User management endpoints
├── 📁 public/                        # Static public files
├── package.json                      # Dependencies and scripts
├── vercel.json                       # Vercel deployment config
├── tailwind.config.js                # Tailwind CSS configuration
└── postcss.config.js                 # PostCSS configuration
```

## 🎯 Component Organization

### **UI Components** (`src/components/ui/`)
- **Reusable, generic components** used throughout the app
- **Examples**: LoadingSpinner, LoginButton, LogoutButton
- **Purpose**: Basic building blocks for the interface

### **Layout Components** (`src/components/layout/`)
- **Page-level components** that define the overall structure
- **Examples**: HomePage, LoginPage
- **Purpose**: Main page layouts and routing structure

### **Feature Components** (`src/components/features/`)
- **Business logic components** for specific features
- **Examples**: Dashboard, StoryReader, ProfileSetup
- **Purpose**: Core functionality of the application

## 🔧 Services & Utilities

### **Services** (`src/services/`)
- **API client functions** for external services
- **Examples**: Gemini AI, ElevenLabs, Story API, Vocabulary API
- **Purpose**: Handle external API communications

### **Utils** (`src/utils/`)
- **Reusable utility functions**
- **Examples**: Text optimization, date formatting, error handling
- **Purpose**: Common functionality used across components

### **Constants** (`src/constants/`)
- **Application configuration and constants**
- **Examples**: API URLs, font options, story settings
- **Purpose**: Centralized configuration management

### **Types** (`src/types/`)
- **JSDoc type definitions** for documentation
- **Examples**: UserProfile, Story, VocabularyWord
- **Purpose**: Type safety and documentation

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Create .env.local file with:
   REACT_APP_AUTH0_DOMAIN=your-auth0-domain
   REACT_APP_AUTH0_CLIENT_ID=your-client-id
   REACT_APP_API_URL=your-api-url
   REACT_APP_GEMINI_API_KEY=your-gemini-key
   REACT_APP_ELEVENLABS_API_KEY=your-elevenlabs-key
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

## 🏗️ Architecture

- **Frontend**: React with Tailwind CSS
- **Backend**: Vercel API Routes (Serverless Functions)
- **Database**: Snowflake
- **Authentication**: Auth0
- **AI Services**: Google Gemini AI, ElevenLabs
- **Deployment**: Vercel

## 📱 Features

- **AI Story Generation**: Personalized stories based on child's interests
- **Audio Narration**: Text-to-speech with sentence highlighting
- **Vocabulary Learning**: Interactive word definitions and examples
- **Dyslexia-Friendly Design**: OpenDyslexic font, adjustable sizing
- **User Profiles**: Personalized settings and preferences
- **Story Library**: Save and manage generated stories

## 🎨 Design Principles

- **Accessibility First**: Dyslexia-friendly design
- **Component-Based**: Modular, reusable components
- **Clean Architecture**: Separation of concerns
- **Type Safety**: JSDoc type definitions
- **Performance**: Optimized for speed and efficiency
