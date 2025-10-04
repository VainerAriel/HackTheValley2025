import { GoogleGenAI } from '@google/genai';

/**
 * Generate a dyslexia-friendly story for children
 * @param {Object} params - Story generation parameters
 * @param {string} params.childName - Name of the child
 * @param {string} params.age - Age of the child (5-12)
 * @param {string} params.interest1 - First interest
 * @param {string} params.interest2 - Second interest
 * @param {string} params.interest3 - Third interest
 * @returns {Promise<string>} The generated story text
 */
export async function generateStory({ childName, age, interest1, interest2, interest3 }) {
  try {
    // Get API key from environment
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
    }

    // Initialize the Gemini AI client
    const ai = new GoogleGenAI({ apiKey });

    // Create the specialized prompt for dyslexia-friendly stories
    const prompt = `You are a specialized children's story writer creating content for dyslexic learners aged 5-12.

**STORY REQUIREMENTS:**
- Target reader: ${childName}, age ${age}
- Word count: Exactly 450-500 words
- Reading level: Age-appropriate for ${age}-year-olds
- Themes to weave naturally: ${interest1}, ${interest2}, ${interest3}

**CRITICAL FORMATTING FOR DYSLEXIA-FRIENDLY DISPLAY:**
1. Use short sentences (maximum 15 words per sentence)
2. Break content into short paragraphs (3-4 sentences maximum per paragraph)
3. Use simple, active voice
4. Avoid complex sentence structures
5. Include dialogue to break up narrative text
6. Use concrete, descriptive language

**STORY STRUCTURE:**
- **Beginning (100-120 words):** Introduce ${childName} as the protagonist in a relatable setting. Establish the first theme (${interest1}).
- **Middle (200-250 words):** Present a gentle challenge or adventure that incorporates the second theme (${interest2}). Build excitement without fear or anxiety.
- **End (150-180 words):** Resolve the adventure positively, weave in the third theme (${interest3}), and end with a confidence-building message.

**CONTENT GUIDELINES:**
- Make ${childName} brave, curious, and successful
- Include sensory details (sounds, colors, textures)
- Use repetition of key phrases for comprehension
- Avoid idioms, sarcasm, or abstract concepts
- Keep tone warm, encouraging, and empowering
- No scary elements, conflicts, or sad themes

**OUTPUT FORMAT:**
Provide ONLY the story text with proper paragraph breaks. Do not include:
- Title or heading
- "The End" or closing phrases
- Author notes or meta-commentary
- Explanations outside the story

Begin the story directly with the narrative.`;

    // Generate content with specified configuration
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Extract and return the story text
    if (!result || !result.text) {
      throw new Error('No story was generated. Please try again.');
    }

    return result.text;

  } catch (error) {
    // Enhanced error handling
    if (error.message.includes('API key')) {
      throw new Error('API key error: ' + error.message);
    } else if (error.message.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error('Failed to generate story: ' + (error.message || 'Unknown error occurred'));
    }
  }
}

/**
 * Validate story generation parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateStoryParams({ childName, age, interest1, interest2, interest3 }) {
  const errors = [];

  if (!childName || typeof childName !== 'string' || !childName.trim()) {
    errors.push("Child's name is required");
  }

  const ageNum = parseInt(age);
  if (!age || isNaN(ageNum) || ageNum < 5 || ageNum > 12) {
    errors.push('Age must be between 5 and 12');
  }

  if (!interest1 || typeof interest1 !== 'string' || !interest1.trim()) {
    errors.push('Interest 1 is required');
  }

  if (!interest2 || typeof interest2 !== 'string' || !interest2.trim()) {
    errors.push('Interest 2 is required');
  }

  if (!interest3 || typeof interest3 !== 'string' || !interest3.trim()) {
    errors.push('Interest 3 is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

