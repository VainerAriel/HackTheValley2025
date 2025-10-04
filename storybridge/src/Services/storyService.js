const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const saveStory = async (storyData) => {
  try {
    console.log('Sending story data to API:', storyData);
    console.log('API URL:', `${API_BASE_URL}/api/stories`);
    
    const response = await fetch(`${API_BASE_URL}/api/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyData),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Save result:', result);
    return result;
  } catch (error) {
    console.error('Error saving story:', error);
    throw error;
  }
};

export const getUserStories = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stories/${userId}`, {
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
    console.error('Error fetching user stories:', error);
    throw error;
  }
};

export const getStoryById = async (storyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/story/${storyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching story:', error);
    throw error;
  }
};
