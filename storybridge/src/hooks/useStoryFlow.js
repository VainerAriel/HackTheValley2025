import { useState } from 'react';
import { generateStory, generateStoryTitle } from '../services/gemini.js';
import { getBatchWordDefinitions } from '../services/gemini.js';
import { saveStory } from '../services/storyService';

export const useStoryFlow = () => {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState(null);
  const [story, setStory] = useState(null);
  const [storyTitle, setStoryTitle] = useState(null);
  const [vocabularyWords, setVocabularyWords] = useState([]);
  const [vocabularyDefinitions, setVocabularyDefinitions] = useState({});
  const [loading, setLoading] = useState(false);
  const [storyId, setStoryId] = useState(null);

  const handleFormSubmit = (data) => {
    setFormData(data);
    setStep('vocabulary');
  };

  const handleVocabularyBack = () => {
    setStep('form');
  };

  const handleVocabularyGenerate = async (words, userId = null) => {
    setVocabularyWords(words);
    setLoading(true);
    let savedStoryId = null;
    
    try {
      const generatedStory = await generateStory({ 
        ...formData, 
        vocabularyWords: words 
      });
      setStory(generatedStory);
      
      // Generate a title for the story
      const title = await generateStoryTitle(generatedStory);
      setStoryTitle(title);
      
      setStep('story');
      
      // Save the story if userId is provided
      if (userId && generatedStory && formData) {
        try {
          
          // Fetch vocabulary definitions in a single batch call
          const vocabDefinitions = await getBatchWordDefinitions(words, formData.age);
          setVocabularyDefinitions(vocabDefinitions);
          
          // Save story first to get storyId
          const saveResult = await saveStory({
            userId: userId,
            storyText: generatedStory,
            title: title,
            interests: formData.interests || [],
            vocabWords: words,
            childName: formData.childName,
            age: formData.age,
            vocabDefinitions: vocabDefinitions
          });
          
          // Add vocabulary words to user's vocabulary list
          if (saveResult && saveResult.data && saveResult.data.id) {
            try {
              const API_BASE_URL = process.env.REACT_APP_API_URL || '';
              
              // Add vocabulary words to user's vocabulary list

              // Add each vocabulary word to the user's vocabulary list
              for (const word of words) {
                const response = await fetch(`${API_BASE_URL}/api/user/${userId}/vocabulary`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    word: word,
                    storyId: saveResult.data.id
                  })
                });
                
                if (!response.ok) {
                  console.error('Failed to add vocabulary word:', word, response.status, response.statusText);
                } else {
                }
              }
            } catch (error) {
              console.error('Error adding vocabulary words to user list:', error);
            }
          }
          
          // Store storyId for use in StoryDisplay
          if (saveResult && saveResult.data && saveResult.data.id) {
            savedStoryId = saveResult.data.id;
            setStoryId(saveResult.data.id);
          } else {
          }
        } catch (error) {
          console.error('Error auto-saving story:', error);
          console.error('Error details:', error.message);
          // Don't throw error here, just log it
        }
      }
    } catch (error) {
      console.error('Error generating story:', error);
    } finally {
      setLoading(false);
    }
    
    // Return the storyId for navigation
    return { storyId: savedStoryId };
  };

  const handleGenerateNew = () => {
    setStep('form');
    setFormData(null);
    setStory(null);
    setStoryTitle(null);
    setVocabularyWords([]);
    setVocabularyDefinitions({});
    setStoryId(null);
  };

  return {
    step,
    formData,
    story,
    storyTitle,
    vocabularyWords,
    vocabularyDefinitions,
    loading,
    storyId,
    handleFormSubmit,
    handleVocabularyBack,
    handleVocabularyGenerate,
    handleGenerateNew
  };
};
