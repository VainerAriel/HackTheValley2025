const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const saveStory = async (storyData) => {
  try {
    
    const response = await fetch(`${API_BASE_URL}/api/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyData),
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error saving story:', error);
    throw error;
  }
};

export const getUserStories = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stories/${encodeURIComponent(userId)}`, {
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

export const deleteStory = async (storyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/story/${storyId}/delete`, {
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
    console.error('Error deleting story:', error);
    throw error;
  }
};