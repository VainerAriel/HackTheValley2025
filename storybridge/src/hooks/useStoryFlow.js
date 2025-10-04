import { useState } from 'react';
import { generateStory } from '../services/gemini';

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

  const handleVocabularyGenerate = async (words) => {
    setVocabularyWords(words);
    setLoading(true);
    try {
      const generatedStory = await generateStory({ 
        ...formData, 
        vocabularyWords: words 
      });
      setStory(generatedStory);
      setStep('story');
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
