import { useState } from 'react';

function StoryForm({ onGenerateStory, loading }) {
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [interest1, setInterest1] = useState('');
  const [interest2, setInterest2] = useState('');
  const [interest3, setInterest3] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!childName.trim()) {
      newErrors.childName = "Child's name is required";
    }
    
    if (!age) {
      newErrors.age = "Please select an age";
    }
    
    if (!interest1.trim()) {
      newErrors.interest1 = "Interest 1 is required";
    }
    
    if (!interest2.trim()) {
      newErrors.interest2 = "Interest 2 is required";
    }
    
    if (!interest3.trim()) {
      newErrors.interest3 = "Interest 3 is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onGenerateStory({
        childName: childName.trim(),
        age,
        interest1: interest1.trim(),
        interest2: interest2.trim(),
        interest3: interest3.trim(),
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Create a Special Story
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
            className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
              errors.childName 
                ? 'border-red-400 bg-red-50' 
                : 'border-gray-300 focus:border-purple-500'
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
            className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
              errors.age 
                ? 'border-red-400 bg-red-50' 
                : 'border-gray-300 focus:border-purple-500'
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

        {/* Interests Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Three Favorite Interests *
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            These will be woven into the story to make it extra special!
          </p>

          {/* Interest 1 */}
          <div className="mb-4">
            <label 
              htmlFor="interest1" 
              className="block text-base font-medium text-gray-700 mb-2"
            >
              Interest 1
            </label>
            <input
              type="text"
              id="interest1"
              name="interest1"
              value={interest1}
              onChange={(e) => setInterest1(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.interest1 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-gray-300 focus:border-purple-500'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., dinosaurs, space, soccer"
              aria-required="true"
              aria-invalid={errors.interest1 ? 'true' : 'false'}
              aria-describedby={errors.interest1 ? 'interest1-error' : undefined}
            />
            {errors.interest1 && (
              <p id="interest1-error" className="mt-2 text-sm text-red-600" role="alert">
                {errors.interest1}
              </p>
            )}
          </div>

          {/* Interest 2 */}
          <div className="mb-4">
            <label 
              htmlFor="interest2" 
              className="block text-base font-medium text-gray-700 mb-2"
            >
              Interest 2
            </label>
            <input
              type="text"
              id="interest2"
              name="interest2"
              value={interest2}
              onChange={(e) => setInterest2(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.interest2 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-gray-300 focus:border-purple-500'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., dinosaurs, space, soccer"
              aria-required="true"
              aria-invalid={errors.interest2 ? 'true' : 'false'}
              aria-describedby={errors.interest2 ? 'interest2-error' : undefined}
            />
            {errors.interest2 && (
              <p id="interest2-error" className="mt-2 text-sm text-red-600" role="alert">
                {errors.interest2}
              </p>
            )}
          </div>

          {/* Interest 3 */}
          <div className="mb-4">
            <label 
              htmlFor="interest3" 
              className="block text-base font-medium text-gray-700 mb-2"
            >
              Interest 3
            </label>
            <input
              type="text"
              id="interest3"
              name="interest3"
              value={interest3}
              onChange={(e) => setInterest3(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 min-h-[48px] text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.interest3 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-gray-300 focus:border-purple-500'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., dinosaurs, space, soccer"
              aria-required="true"
              aria-invalid={errors.interest3 ? 'true' : 'false'}
              aria-describedby={errors.interest3 ? 'interest3-error' : undefined}
            />
            {errors.interest3 && (
              <p id="interest3-error" className="mt-2 text-sm text-red-600" role="alert">
                {errors.interest3}
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
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
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

