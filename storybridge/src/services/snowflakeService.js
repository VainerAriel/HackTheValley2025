import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Save a story
export async function saveStory(userId, storyText, audioUrl, interests, vocabWords) {
  try {
    const response = await axios.post(`${API_BASE_URL}/stories`, {
      userId,
      storyText,
      audioUrl,
      interests,
      vocabWords
    });
    
    console.log('Story saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving story:', error.response?.data || error.message);
    throw error;
  }
}

// Get all stories for a user
export async function getUserStories(userId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/stories/${userId}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error getting stories:', error.response?.data || error.message);
    throw error;
  }
}

// Get a specific story by ID
export async function getStory(storyId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/story/${storyId}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Error getting story:', error.response?.data || error.message);
    throw error;
  }
}