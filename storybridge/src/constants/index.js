// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Auth0 Configuration
export const AUTH0_CONFIG = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN,
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
  redirectUri: process.env.REACT_APP_AUTH0_REDIRECT_URI,
  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  scope: 'openid profile email'
};

// Common Interests
export const COMMON_INTERESTS = [
  'Adventure',
  'Animals', 
  'Magic',
  'Superheroes',
  'Friendship',
  'Nature',
  'Space',
  'Art',
  'Music'
];

// Font Options for Dyslexia Support
export const FONT_OPTIONS = [
  { name: 'OpenDyslexic', value: 'OpenDyslexic' },
  { name: 'Verdana', value: 'Verdana' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS' }
];

// Font Size Options
export const FONT_SIZE_OPTIONS = [
  { name: 'Small', value: 'text-sm' },
  { name: 'Medium', value: 'text-base' },
  { name: 'Large', value: 'text-lg' },
  { name: 'Extra Large', value: 'text-xl' },
  { name: 'XXL', value: 'text-2xl' }
];

// Story Generation Settings
export const STORY_SETTINGS = {
  MIN_VOCAB_WORDS: 3,
  MAX_VOCAB_WORDS: 5,
  STORY_LENGTH: {
    SHORT: 150,
    MEDIUM: 300,
    LONG: 500
  }
};

// Audio Settings
export const AUDIO_SETTINGS = {
  VOICE_ID: process.env.REACT_APP_ELEVENLABS_VOICE_ID || 'default',
  MODEL: 'eleven_flash_v2', // Cost-effective model
  OUTPUT_FORMAT: 'mp3_22050_32'
};
