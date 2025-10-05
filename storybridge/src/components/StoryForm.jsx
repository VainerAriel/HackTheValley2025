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
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('StoryForm loaded profile data:', result.data);
        
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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Loading your child's profile...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Create a Story for {profileData.childName}
        </h2>
        <p className="text-gray-600">Let's create a personalized adventure!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Child Info Display */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-50 rounded-xl p-6 border border-orange-100">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {profileData.childName} ({profileData.childAge})
            </h3>
            <p className="text-gray-600">
              We'll create a personalized story based on {profileData.childName}'s interests
            </p>
          </div>
        </div>

        {/* Story Topics Selection */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            What would you like the story to be about? *
          </h3>
          <p className="text-gray-600 mb-6">
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
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedTopics.includes(interest)
                        ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(interest)}
                      onChange={() => handleTopicToggle(interest)}
                      className="mr-3 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-medium">{interest}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom Topic Input */}
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Add your own topic:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTopic())}
                disabled={loading}
                className={`flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="e.g., space adventure, underwater mystery, magical forest"
              />
              <button
                type="button"
                onClick={handleAddCustomTopic}
                disabled={!customTopic.trim() || loading}
                className={`px-6 py-3 font-medium rounded-xl transition-all duration-200 ${
                  !customTopic.trim() || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected Topics Display */}
          {selectedTopics.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Selected Topics:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic)}
                      className="ml-2 text-orange-600 hover:text-orange-800 font-bold text-lg"
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
          className={`w-full py-4 text-lg font-bold rounded-xl transition-all duration-200 transform ${
            loading || selectedTopics.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
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
            `Generate Story for ${profileData.childName}`
          )}
        </button>
      </form>
    </div>
  );
}

export default StoryForm;

