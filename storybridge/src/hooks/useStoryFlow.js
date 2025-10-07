import { useState } from 'react';
import { generateStory, generateStoryTitle } from '../services/gemini.js';
import { getBatchWordDefinitions } from '../services/gemini.js';
import { convertTextToSpeech } from '../services/elevenLabsService.js';
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
      console.log('Generating story title...');
      const title = await generateStoryTitle(generatedStory);
      setStoryTitle(title);
      console.log('Generated title:', title);
      
      setStep('story');
      
      // Save the story if userId is provided
      if (userId && generatedStory && formData) {
        try {
          console.log('Auto-saving story after generation...');
          
          // Fetch vocabulary definitions in a single batch call
          console.log('Fetching vocabulary definitions in batch...');
          const vocabDefinitions = await getBatchWordDefinitions(words, formData.age);
          console.log('Vocabulary definitions fetched:', vocabDefinitions);
          setVocabularyDefinitions(vocabDefinitions);
          
          // Save story first to get storyId
          console.log('Saving story to database...');
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
          console.log('Story auto-saved successfully with vocabulary definitions!', saveResult);
          
          // Store storyId for use in StoryDisplay
          if (saveResult && saveResult.data && saveResult.data.id) {
            savedStoryId = saveResult.data.id;
            setStoryId(saveResult.data.id);
            console.log('Generating and storing audio immediately for storyId:', saveResult.data.id);
            try {
              const API_BASE_URL = process.env.REACT_APP_API_URL || '';
              const audioResponse = await fetch(`${API_BASE_URL}/api/story/${saveResult.data.id}/generate-audio`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              
              if (audioResponse.ok) {
                console.log('Audio generated and stored immediately - ready for instant playback!');
              } else {
                console.log('Audio generation failed, will generate on-demand');
              }
            } catch (error) {
              console.error('Error generating audio immediately:', error);
              console.log('Will generate on-demand when user clicks play');
            }
          } else {
            console.log('No storyId returned, audio will be generated on-demand');
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
