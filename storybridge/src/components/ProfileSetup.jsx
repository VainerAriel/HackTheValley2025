import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const ProfileSetup = ({ onComplete }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [profileData, setProfileData] = useState({
    childName: '',
    childAge: '',
    childPronouns: '',
    interests: []
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const commonInterests = [
    'Adventure', 'Animals', 'Magic', 'Superheroes', 'Friendship', 
    'Nature', 'Space', 'Art', 'Music'
  ];
  
  const [customInterests, setCustomInterests] = useState([]);
  const [newCustomInterest, setNewCustomInterest] = useState('');
  
  // Load existing profile data if editing
  useEffect(() => {
    if (user) {
      loadExistingProfile();
    }
  }, [user]);
  
  const loadExistingProfile = async () => {
    if (!user) return;
    
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
        console.log('📋 Loaded profile data:', result.data);
        
        const interests = result.data.interests || [];
        const commonInterestsList = ['Adventure', 'Animals', 'Magic', 'Superheroes', 'Friendship', 'Nature', 'Space', 'Art', 'Music'];
        
        // Separate common interests from custom interests
        const customInterests = interests.filter(interest => !commonInterestsList.includes(interest));
        
        const newProfileData = {
          childName: result.data.childName || '',
          childAge: result.data.childAge || '',
          childPronouns: result.data.childPronouns || '',
          interests: interests
        };
        
        console.log('📋 Setting profile data:', newProfileData);
        console.log('📋 Setting custom interests:', customInterests);
        
        setProfileData(newProfileData);
        setCustomInterests(customInterests);
      }
    } catch (error) {
      console.error('Error loading existing profile:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterestToggle = (interest) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleAddCustomInterest = () => {
    const trimmedInterest = newCustomInterest.trim();
    
    // Check if it matches one of the common interests (case-insensitive)
    const matchingCommonInterest = commonInterests.find(interest => 
      interest.toLowerCase() === trimmedInterest.toLowerCase()
    );
    
    if (matchingCommonInterest) {
      // If it matches a common interest, check that checkbox instead
      if (!profileData.interests.includes(matchingCommonInterest)) {
        setProfileData(prev => ({
          ...prev,
          interests: [...prev.interests, matchingCommonInterest]
        }));
      }
      setNewCustomInterest('');
      return;
    }
    
    // Only add as custom interest if it doesn't match any common interest
    if (trimmedInterest && customInterests.length < 5 && !customInterests.some(interest => interest.toLowerCase() === trimmedInterest.toLowerCase())) {
      setCustomInterests(prev => [...prev, trimmedInterest]);
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, trimmedInterest]
      }));
      setNewCustomInterest('');
    }
  };

  const handleRemoveCustomInterest = (interest) => {
    setCustomInterests(prev => prev.filter(i => i !== interest));
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileData.childName.trim()) {
      setError('Please enter your child\'s name');
      return;
    }

    if (!profileData.childAge) {
      setError('Please enter your child\'s age');
      return;
    }

    if (!profileData.childPronouns) {
      setError('Please select your child\'s pronouns');
      return;
    }

    if (profileData.interests.length === 0) {
      setError('Please select at least one interest');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
          scope: "openid profile email"
        }
      });

      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          childName: profileData.childName.trim(),
          childAge: profileData.childAge,
          childPronouns: profileData.childPronouns,
          interests: profileData.interests,
          profileCompleted: true
        })
      });

      if (response.ok) {
        // Profile saved successfully
        setError('');
        setSaving(false);
        
        // Redirect to home page after successful profile setup
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setError('Error saving profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">👤</span>
            </div>
            <h1 className="text-3xl font-bold text-brand-brown-dark mb-2">Welcome to StoryBites!</h1>
            <p className="text-gray-600">Let's set up your child's profile to create personalized stories</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Child Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your child's name? *
              </label>
              <input
                type="text"
                value={profileData.childName}
                onChange={(e) => handleInputChange('childName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-lg"
                placeholder="Enter your child's name"
                required
              />
            </div>

            {/* Child Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your child's age group? *
              </label>
              <select
                value={profileData.childAge}
                onChange={(e) => handleInputChange('childAge', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-lg"
                required
              >
                <option value="">Select age group</option>
                <option value="2-3">2-3 years (Toddler)</option>
                <option value="4-5">4-5 years (Preschool)</option>
                <option value="6-7">6-7 years (Early Elementary)</option>
                <option value="8-9">8-9 years (Elementary)</option>
                <option value="10-11">10-11 years (Upper Elementary)</option>
                <option value="12-13">12-13 years (Middle School)</option>
                <option value="14-15">14-15 years (High School)</option>
                <option value="16-18">16-18 years (Teen)</option>
              </select>
            </div>

            {/* Child Pronouns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What are your child's pronouns? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['he/him', 'she/her'].map((option) => (
                  <label key={option} className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    profileData.childPronouns === option
                      ? 'border-brand-blue bg-blue-50 text-brand-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="childPronouns"
                      value={option}
                      checked={profileData.childPronouns === option}
                      onChange={(e) => handleInputChange('childPronouns', e.target.value)}
                      className="mr-2 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="font-medium">{option}</span>
                  </label>
                ))}
                <div className="col-span-2">
                  <label className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all w-full ${
                    profileData.childPronouns === 'they/them'
                      ? 'border-brand-blue bg-blue-50 text-brand-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="childPronouns"
                      value="they/them"
                      checked={profileData.childPronouns === 'they/them'}
                      onChange={(e) => handleInputChange('childPronouns', e.target.value)}
                      className="mr-2 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="font-medium">they/them</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What does your child like? (Select all that apply) *
              </label>
              
              {/* Common Interests */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {commonInterests.map((interest) => (
                  <label
                    key={interest}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      profileData.interests.includes(interest)
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={profileData.interests.includes(interest)}
                      onChange={() => handleInterestToggle(interest)}
                      className="mr-2 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="text-sm font-medium">{interest}</span>
                  </label>
                ))}
              </div>

              {/* Custom Interests */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add custom interests (up to 5):
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newCustomInterest}
                    onChange={(e) => setNewCustomInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomInterest()}
                    placeholder="Enter custom interest"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    disabled={customInterests.length >= 5}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomInterest}
                     disabled={!newCustomInterest.trim() || customInterests.length >= 5 || customInterests.some(interest => interest.toLowerCase() === newCustomInterest.trim().toLowerCase()) || commonInterests.some(interest => interest.toLowerCase() === newCustomInterest.trim().toLowerCase())}
                    className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                
                {/* Display custom interests */}
                {customInterests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomInterest(interest)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={saving}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-brand-blue hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {saving ? 'Setting up profile...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;