const ELEVENLABS_API_KEY = process.env.REACT_APP_ELEVENLABS_API_KEY;
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

// Optimize text for TTS (remove extra whitespace, normalize)
const optimizeTextForTTS = (text) => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .replace(/[^\w\s.,!?;:'"-]/g, '') // Remove special characters that might cause issues
    .substring(0, 5000); // Limit to 5000 characters to reduce costs
};

const convertTextToSpeech = async (text) => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key is not configured');
  }

  if (!text || !text.trim()) {
    throw new Error('Text is required for speech conversion');
  }

  // Optimize text for TTS
  const optimizedText = optimizeTextForTTS(text);
  console.log('🎵 Generating audio for text (length:', optimizedText.length, 'chars) using Flash model for cost savings');
  console.log('💰 Estimated credits needed:', Math.ceil(optimizedText.length * 0.5), 'credits (Flash model: 0.5 per character)');

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_22050_32`, // Lower quality = less credits
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: optimizedText,
        model_id: 'eleven_flash_v2_5', // Flash model - much cheaper and faster
        voice_settings: {
          stability: 0.4, // Lower stability for faster processing
          similarity_boost: 0.4, // Lower similarity for faster processing
          style: 0.0,
          use_speaker_boost: false // Disabled for cost savings
        }
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.blob();
};

module.exports = { convertTextToSpeech };
