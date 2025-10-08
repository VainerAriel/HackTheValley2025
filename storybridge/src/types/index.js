// Type definitions and PropTypes for the application
// Note: This is a JavaScript project, so these are for documentation purposes

/**
 * User Profile Type
 * @typedef {Object} UserProfile
 * @property {string} childName - Child's name
 * @property {string} childAge - Child's age
 * @property {string} childPronouns - Child's pronouns
 * @property {string[]} interests - Array of interests
 * @property {boolean} profileCompleted - Whether profile is completed
 */

/**
 * Story Type
 * @typedef {Object} Story
 * @property {string} id - Story ID
 * @property {string} title - Story title
 * @property {string} content - Story text content
 * @property {string[]} vocabularyWords - Array of vocabulary words
 * @property {Object} vocabularyDefinitions - Definitions for vocabulary words
 * @property {string} audioUrl - URL to story audio
 * @property {string} userId - User who created the story
 * @property {string} createdAt - Creation timestamp
 */

/**
 * Vocabulary Word Type
 * @typedef {Object} VocabularyWord
 * @property {string} word - The vocabulary word
 * @property {string} pronunciation - Pronunciation guide
 * @property {string} simple_definition - Simple definition
 * @property {string} example_sentence - Example sentence
 * @property {string[]} synonyms - Array of synonyms
 */

/**
 * Story Form Data Type
 * @typedef {Object} StoryFormData
 * @property {string} childName - Child's name
 * @property {string} age - Child's age
 * @property {string} pronouns - Child's pronouns
 * @property {string[]} interests - Selected interests
 * @property {string[]} customInterests - Custom interests
 */

/**
 * Audio Status Type
 * @typedef {Object} AudioStatus
 * @property {'loading'|'ready'|'playing'|'paused'|'error'} status - Audio status
 * @property {'stored'|'generated'|'preloaded'} source - Audio source
 * @property {number} currentTime - Current playback time
 * @property {number} duration - Total duration
 */

/**
 * Story Generation Settings Type
 * @typedef {Object} StorySettings
 * @property {string} age - Target age group
 * @property {string[]} interests - Selected interests
 * @property {string[]} vocabularyWords - Vocabulary words to include
 * @property {string} length - Story length preference
 * @property {string} style - Story style/tone
 */

// Export types for documentation
export const TYPES = {
  USER_PROFILE: 'UserProfile',
  STORY: 'Story',
  VOCABULARY_WORD: 'VocabularyWord',
  STORY_FORM_DATA: 'StoryFormData',
  AUDIO_STATUS: 'AudioStatus',
  STORY_SETTINGS: 'StorySettings'
};
