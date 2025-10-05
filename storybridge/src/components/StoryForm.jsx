import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

function StoryForm({ onGenerateStory, loading }) {
  const { user, getAccessTokenSilently } = useAuth0();
  const [profileData, setProfileData] = useState({
    childName: '',
    childAge: '',
    childPronouns: '',
    interests: []
  });
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [errors, setErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);

  // Load profile data on component mount
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
          scope: "openid profile email"
        }
      });

      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📋 StoryForm loaded profile data:', result.data);
        
        const newProfileData = {
          childName: result.data.childName || '',
          childAge: result.data.childAge || '',
          childPronouns: result.data.childPronouns || '',
          interests: result.data.interests || []
        };
        
        setProfileData(newProfileData);
      } else {
        console.error('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (selectedTopics.length === 0) {
      newErrors.topics = "Please select at least one story topic";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTopicToggle = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleAddCustomTopic = () => {
    const trimmedTopic = customTopic.trim();
    if (trimmedTopic && !selectedTopics.includes(trimmedTopic)) {
      setSelectedTopics(prev => [...prev, trimmedTopic]);
      setCustomTopic('');
    }
  };

  const handleRemoveTopic = (topic) => {
    setSelectedTopics(prev => prev.filter(t => t !== topic));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Pass all available profile data to the story generation
      onGenerateStory({
        childName: profileData.childName,
        age: profileData.childAge,
        childPronouns: profileData.childPronouns,
        interests: selectedTopics, // Use selected topics as the interests
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-cream-300">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading your child's profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-cream-300">
        <h2 className="text-3xl font-bold text-center text-brand-brown-dark mb-8">
          Create a Story for {profileData.childName}
        </h2>

        {/* Child Info Display */}
        <div className="mb-8 p-4 bg-cream-50 rounded-lg border border-cream-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-brand-brown-dark mb-2">
              {profileData.childName} ({profileData.childAge})
            </h3>
            <p className="text-sm text-gray-600">
              We'll create a personalized story based on {profileData.childName}'s interests
            </p>
          </div>
        </div>

        {/* Story Topics Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            What would you like the story to be about? *
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose from {profileData.childName}'s interests or add your own topics
          </p>

          {/* Child's Interests as Suggestions */}
          {profileData.interests.length > 0 && (
            <div className="mb-6">
              <h4 className="text-base font-medium text-gray-700 mb-3">
                {profileData.childName}'s Interests:
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profileData.interests.map((interest) => (
                  <label
                    key={interest}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTopics.includes(interest)
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(interest)}
                      onChange={() => handleTopicToggle(interest)}
                      className="mr-2 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="text-sm font-medium">{interest}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom Topic Input */}
          <div className="mb-4">
            <label className="block text-base font-medium text-gray-700 mb-2">
              Add your own topic:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTopic())}
                disabled={loading}
                className={`flex-1 px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all border-cream-300 focus:border-brand-blue ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="e.g., space adventure, underwater mystery, magical forest"
              />
              <button
                type="button"
                onClick={handleAddCustomTopic}
                disabled={!customTopic.trim() || loading}
                className={`px-6 py-3 min-h-[48px] text-lg font-semibold rounded-lg transition-all ${
                  !customTopic.trim() || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-brand-blue hover:bg-brand-blue-dark text-white'
                }`}
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected Topics Display */}
          {selectedTopics.length > 0 && (
            <div className="mb-4">
              <h4 className="text-base font-medium text-gray-700 mb-3">
                Selected Topics:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {errors.topics && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {errors.topics}
            </p>
          )}
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={loading || selectedTopics.length === 0}
          className={`w-full py-4 min-h-[48px] text-lg font-bold rounded-lg transition-all transform ${
            loading || selectedTopics.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-brand-blue hover:bg-brand-blue-dark hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
          } text-white`}
          aria-busy={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg 
                className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating Story...
            </span>
          ) : (
            `✨ Generate Story for ${profileData.childName}`
          )}
        </button>
      </form>
    </div>
  );
}

export default StoryForm;

