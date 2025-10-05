import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const ProfileSetup = ({ onComplete }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [profileData, setProfileData] = useState({
    childName: '',
    childGender: '',
    interests: []
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const interestOptions = [
    'Adventure', 'Animals', 'Space', 'Princesses', 'Superheroes', 'Dinosaurs',
    'Magic', 'Robots', 'Pirates', 'Fairies', 'Cars', 'Nature', 'Sports',
    'Music', 'Art', 'Science', 'Cooking', 'Travel', 'Friendship', 'Family'
  ];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileData.childName.trim()) {
      setError('Please enter your child\'s name');
      return;
    }

    if (!profileData.childGender) {
      setError('Please select your child\'s gender');
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
          childGender: profileData.childGender,
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

            {/* Child Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What's your child's gender? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((option) => (
                  <label key={option} className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    profileData.childGender === option
                      ? 'border-brand-blue bg-blue-50 text-brand-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="childGender"
                      value={option}
                      checked={profileData.childGender === option}
                      onChange={(e) => handleInputChange('childGender', e.target.value)}
                      className="mr-2 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="font-medium">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What does your child like? (Select all that apply) *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interestOptions.map((interest) => (
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