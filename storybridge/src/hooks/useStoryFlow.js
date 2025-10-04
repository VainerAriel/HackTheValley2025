import { useState } from 'react';
import { generateStory } from '../services/gemini';
import { getBatchWordDefinitions } from '../services/gemini';
import { saveStory } from '../services/storyService';

export const useStoryFlow = () => {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState(null);
  const [story, setStory] = useState(null);
  const [vocabularyWords, setVocabularyWords] = useState([]);
  const [loading, setLoading] = useState(false);

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
    try {
      const generatedStory = await generateStory({ 
        ...formData, 
        vocabularyWords: words 
      });
      setStory(generatedStory);
      setStep('story');
      
      // Save the story if userId is provided
      if (userId && generatedStory && formData) {
        try {
          console.log('Auto-saving story after generation...');
          
          // Fetch vocabulary definitions in a single batch call
          console.log('Fetching vocabulary definitions in batch...');
          const vocabDefinitions = await getBatchWordDefinitions(words, formData.age);
          console.log('Vocabulary definitions fetched:', vocabDefinitions);
          
          await saveStory({
            userId: userId,
            storyText: generatedStory,
            interests: [formData.interest1, formData.interest2, formData.interest3],
            vocabWords: words,
            childName: formData.childName,
            age: formData.age,
            vocabDefinitions: vocabDefinitions
          });
          console.log('Story auto-saved successfully with vocabulary definitions!');
        } catch (error) {
          console.error('Error auto-saving story:', error);
          // Don't throw error here, just log it
        }
      }
    } catch (error) {
      console.error('Error generating story:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = () => {
    setStep('form');
    setFormData(null);
    setStory(null);
    setVocabularyWords([]);
  };

  return {
    step,
    formData,
    story,
    vocabularyWords,
    loading,
    handleFormSubmit,
    handleVocabularyBack,
    handleVocabularyGenerate,
    handleGenerateNew
  };
};
