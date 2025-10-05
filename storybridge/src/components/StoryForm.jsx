import { useState } from 'react';

function StoryForm({ onGenerateStory, loading }) {
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [theme1, setTheme1] = useState('');
  const [theme2, setTheme2] = useState('');
  const [theme3, setTheme3] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!childName.trim()) {
      newErrors.childName = "Child's name is required";
    }
    
    if (!age) {
      newErrors.age = "Please select an age";
    }
    
    if (!theme1.trim()) {
      newErrors.theme1 = "At least one theme is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const themes = [theme1.trim(), theme2.trim(), theme3.trim()].filter(t => t !== '');
      
      onGenerateStory({
        childName: childName.trim(),
        age,
        interest1: themes[0] || '',
        interest2: themes[1] || '',
        interest3: themes[2] || '',
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-cream-300">
        <h2 className="text-3xl font-bold text-center text-brand-brown-dark mb-8">
          Create a Personalized Story
        </h2>

        {/* Child's Name */}
        <div className="mb-6">
          <label 
            htmlFor="childName" 
            className="block text-lg font-semibold text-gray-700 mb-2"
          >
            Child's Name *
          </label>
          <input
            type="text"
            id="childName"
            name="childName"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            disabled={loading}
            className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all ${
              errors.childName 
                ? 'border-red-400 bg-red-50' 
                : 'border-cream-300 focus:border-brand-blue'
            } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder="Enter child's name"
            aria-required="true"
            aria-invalid={errors.childName ? 'true' : 'false'}
            aria-describedby={errors.childName ? 'childName-error' : undefined}
          />
          {errors.childName && (
            <p id="childName-error" className="mt-2 text-sm text-red-600" role="alert">
              {errors.childName}
            </p>
          )}
        </div>

        {/* Age Dropdown */}
        <div className="mb-6">
          <label 
            htmlFor="age" 
            className="block text-lg font-semibold text-gray-700 mb-2"
          >
            Age *
          </label>
          <select
            id="age"
            name="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            disabled={loading}
            className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all ${
              errors.age 
                ? 'border-red-400 bg-red-50' 
                : 'border-cream-300 focus:border-brand-blue'
            } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            aria-required="true"
            aria-invalid={errors.age ? 'true' : 'false'}
            aria-describedby={errors.age ? 'age-error' : undefined}
          >
            <option value="">Select age...</option>
            {[5, 6, 7, 8, 9, 10, 11, 12].map(ageValue => (
              <option key={ageValue} value={ageValue}>
                {ageValue} years old
              </option>
            ))}
          </select>
          {errors.age && (
            <p id="age-error" className="mt-2 text-sm text-red-600" role="alert">
              {errors.age}
            </p>
          )}
        </div>

        {/* Themes Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Story Themes (1-3 themes) *
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose themes that will shape the story's adventure and setting!
          </p>

          {/* Theme 1 */}
          <div className="mb-4">
            <label 
              htmlFor="theme1" 
              className="block text-base font-medium text-gray-700 mb-2"
            >
              Theme 1 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="theme1"
              name="theme1"
              value={theme1}
              onChange={(e) => setTheme1(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all ${
                errors.theme1 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-cream-300 focus:border-brand-blue'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., adventure, friendship, courage, exploration"
              aria-required="true"
              aria-invalid={errors.theme1 ? 'true' : 'false'}
              aria-describedby={errors.theme1 ? 'theme1-error' : undefined}
            />
            {errors.theme1 && (
              <p id="theme1-error" className="mt-2 text-sm text-red-600" role="alert">
                {errors.theme1}
              </p>
            )}
          </div>

          {/* Theme 2 */}
          <div className="mb-4">
            <label 
              htmlFor="theme2" 
              className="block text-base font-medium text-gray-700 mb-2"
            >
              Theme 2 <span className="text-sm text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              id="theme2"
              name="theme2"
              value={theme2}
              onChange={(e) => setTheme2(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all ${
                errors.theme2 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-cream-300 focus:border-brand-blue'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., mystery, nature, teamwork, discovery"
              aria-required="false"
              aria-invalid={errors.theme2 ? 'true' : 'false'}
              aria-describedby={errors.theme2 ? 'theme2-error' : undefined}
            />
            {errors.theme2 && (
              <p id="theme2-error" className="mt-2 text-sm text-red-600" role="alert">
                {errors.theme2}
              </p>
            )}
          </div>

          {/* Theme 3 */}
          <div className="mb-4">
            <label 
              htmlFor="theme3" 
              className="block text-base font-medium text-gray-700 mb-2"
            >
              Theme 3 <span className="text-sm text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              id="theme3"
              name="theme3"
              value={theme3}
              onChange={(e) => setTheme3(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all ${
                errors.theme3 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-cream-300 focus:border-brand-blue'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., magic, science, creativity, kindness"
              aria-required="false"
              aria-invalid={errors.theme3 ? 'true' : 'false'}
              aria-describedby={errors.theme3 ? 'theme3-error' : undefined}
            />
            {errors.theme3 && (
              <p id="theme3-error" className="mt-2 text-sm text-red-600" role="alert">
                {errors.theme3}
              </p>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 min-h-[48px] text-lg font-bold rounded-lg transition-all transform ${
            loading
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
            '✨ Generate Story'
          )}
        </button>
      </form>
    </div>
  );
}

export default StoryForm;

