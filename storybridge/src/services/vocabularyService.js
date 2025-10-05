const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/**
 * Get user's used vocabulary words
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} Array of used vocabulary words
 */
export const getUserVocabulary = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(userId)}/vocabulary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error getting user vocabulary:', error);
    throw error;
  }
};

/**
 * Add vocabulary words for a story
 * @param {string} userId - User ID
 * @param {Array<string>} words - Array of vocabulary words
 * @param {string} storyId - Story ID (optional)
 * @returns {Promise<Object>} Response object
 */
export const addUserVocabulary = async (userId, words, storyId = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(userId)}/vocabulary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        words,
        storyId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding user vocabulary:', error);
    throw error;
  }
};

/**
 * Remove vocabulary words for a story
 * @param {string} userId - User ID
 * @param {string} storyId - Story ID
 * @returns {Promise<Object>} Response object
 */
export const removeUserVocabulary = async (userId, storyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(userId)}/vocabulary/story/${storyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error removing user vocabulary:', error);
    throw error;
  }
};
