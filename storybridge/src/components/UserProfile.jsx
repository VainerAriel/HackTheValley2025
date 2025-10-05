import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const UserProfile = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [profileData, setProfileData] = useState({
    childName: '',
    childGender: '',
    interests: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const interestOptions = [
    'Adventure', 'Animals', 'Space', 'Princesses', 'Superheroes', 'Dinosaurs',
    'Magic', 'Robots', 'Pirates', 'Fairies', 'Cars', 'Nature', 'Sports',
    'Music', 'Art', 'Science', 'Cooking', 'Travel', 'Friendship', 'Family'
  ];

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
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
        setProfileData({
          childName: result.data.childName || '',
          childGender: result.data.childGender || '',
          interests: result.data.interests || []
        });
      } else {
        console.error('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
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
        setMessage('Profile saved successfully! Redirecting to home...');
        // Redirect to home page after successful profile update
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setMessage('Error saving profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-brown-dark mb-2">User Profile</h1>
          <p className="text-gray-600">Manage your child's information and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Child Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child's Name
            </label>
            <input
              type="text"
              value={profileData.childName}
              onChange={(e) => handleInputChange('childName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="Enter your child's name"
            />
          </div>

          {/* Child Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child's Gender
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((option) => (
                <label key={option} className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
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
              Child's Interests (Select all that apply)
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

          {/* Save Button */}
          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={saving || !profileData.childName.trim()}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                saving || !profileData.childName.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-brand-blue hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-center ${
                message.includes('successfully') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;