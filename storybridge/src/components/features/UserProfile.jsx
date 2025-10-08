import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../ui/LogoutButton.jsx';
import storybitesLogo from '../../assets/images/storybites.png';

const UserProfile = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    childName: '',
    childAge: '',
    childPronouns: '',
    interests: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const commonInterests = [
    'Adventure', 'Animals', 'Magic', 'Superheroes', 'Friendship', 
    'Nature', 'Space', 'Art', 'Music'
  ];
  
  const [customInterests, setCustomInterests] = useState([]);
  const [newCustomInterest, setNewCustomInterest] = useState('');

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://api.storybites.vip`,
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
        
        const interests = result.data.interests || [];
        const commonInterestsList = ['Adventure', 'Animals', 'Magic', 'Superheroes', 'Friendship', 'Nature', 'Space', 'Art', 'Music'];
        
        // Separate common interests from custom interests
        const commonInterests = interests.filter(interest => commonInterestsList.includes(interest));
        const customInterests = interests.filter(interest => !commonInterestsList.includes(interest));
        
        const newProfileData = {
          childName: result.data.childName || '',
          childAge: result.data.childAge || '',
          childPronouns: result.data.childPronouns || '',
          interests: interests
        };
        
        
        setProfileData(newProfileData);
        setCustomInterests(customInterests);
      } else {
        console.error('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getAccessTokenSilently]);

  useEffect(() => {
    loadProfileData();
  }, [user, loadProfileData]);

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
    if (trimmedInterest && customInterests.length < 10 && !customInterests.some(interest => interest.toLowerCase() === trimmedInterest.toLowerCase())) {
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

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: `https://api.storybites.vip`,
          scope: "openid profile email"
        }
      });

      const API_BASE_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 shadow-sm border-b border-amber-300 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center p-1">
                  <img src={storybitesLogo} alt="StoryBites Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-700 to-amber-800 bg-clip-text text-transparent">StoryBites</h1>
                  <p className="text-sm text-amber-800">User Profile</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <span className="text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 shadow-sm border-b border-amber-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center p-1">
                <img src={storybitesLogo} alt="StoryBites Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-700 to-amber-800 bg-clip-text text-transparent">StoryBites</h1>
                <p className="text-sm text-amber-800">User Profile</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {/* Placeholder for future logout button if needed */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-200 sticky top-24 z-40">
              <h3 className="text-lg font-semibold text-amber-900 mb-4">Navigation</h3>
              <nav className="space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-amber-800 hover:bg-amber-50 hover:text-amber-900"
                >
                  Home
                </button>
                
                <button
                  onClick={() => navigate('/create')}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-amber-800 hover:bg-amber-50 hover:text-amber-900"
                >
                  Generate a Story
                </button>
                
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-yellow-700 to-yellow-800 text-white font-semibold shadow-md"
                >
                  User Info
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">User Profile</h2>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your child's name"
            />
          </div>

          {/* Child Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child's Age Group
            </label>
            <select
              value={profileData.childAge}
              onChange={(e) => handleInputChange('childAge', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child's Pronouns
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['he/him', 'she/her', 'they/them'].map((option) => (
                <label key={option} className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  profileData.childPronouns === option
                    ? 'border-yellow-700 bg-gradient-to-r from-yellow-700 to-amber-800 text-white shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}>
                  <input
                    type="radio"
                    name="childPronouns"
                    value={option}
                    checked={profileData.childPronouns === option}
                    onChange={(e) => handleInputChange('childPronouns', e.target.value)}
                    className="mr-2 text-yellow-700 focus:ring-yellow-700"
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
            
            {/* Common Interests */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {commonInterests.map((interest) => (
                <label
                  key={interest}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    profileData.interests.includes(interest)
                      ? 'border-yellow-700 bg-gradient-to-r from-yellow-700 to-amber-800 text-white shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={profileData.interests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                    className="mr-2 text-yellow-700 focus:ring-yellow-700"
                  />
                  <span className="text-sm font-medium">{interest}</span>
                </label>
              ))}
            </div>

            {/* Custom Interests */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add custom interests (up to 10):
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCustomInterest}
                  onChange={(e) => setNewCustomInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomInterest()}
                  placeholder="Enter custom interest"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  disabled={customInterests.length >= 10}
                />
                <button
                  type="button"
                  onClick={handleAddCustomInterest}
                  disabled={!newCustomInterest.trim() || customInterests.length >= 10 || customInterests.some(interest => interest.toLowerCase() === newCustomInterest.trim().toLowerCase()) || commonInterests.some(interest => interest.toLowerCase() === newCustomInterest.trim().toLowerCase())}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-700 to-amber-800 text-white rounded-xl hover:from-yellow-800 hover:to-amber-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium"
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
                      className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-medium"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomInterest(interest)}
                        className="ml-2 text-amber-700 hover:text-amber-900 font-bold text-lg"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={saving || !profileData.childName.trim()}
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                saving || !profileData.childName.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-700 to-amber-800 hover:from-yellow-800 hover:to-amber-900 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            
            {message && (
              <div className={`mt-4 p-4 rounded-xl text-center font-medium ${
                message.includes('successfully') 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;