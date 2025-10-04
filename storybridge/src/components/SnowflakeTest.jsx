import { saveStory, getUserStories } from '../services/snowflakeService';
import { useAuth0 } from '@auth0/auth0-react';

function SnowflakeTest() {
  const { user } = useAuth0();
  
  const testSave = async () => {
    try {
      await saveStory(
        user.sub, // user ID from Auth0
        'Once upon a time, there was a brave astronaut...',
        'https://example.com/audio.mp3',
        ['space', 'adventure', 'stars'],
        ['astronaut', 'galaxy', 'explore']
      );
      alert('Story saved!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  
  const testLoad = async () => {
    try {
      const stories = await getUserStories(user.sub);
      console.log('Stories:', stories);
      alert(`Found ${stories.length} stories`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  
  return (
    <div className="p-4">
      <button onClick={testSave} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
        Test Save
      </button>
      <button onClick={testLoad} className="bg-green-500 text-white px-4 py-2 rounded">
        Test Load
      </button>
    </div>
  );
}

export default SnowflakeTest;
