const ELEVENLABS_API_KEY = process.env.REACT_APP_ELEVENLABS_API_KEY;
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

export const convertTextToSpeech = async (text) => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key is not configured');
  }

  if (!text || !text.trim()) {
    throw new Error('Text is required for speech conversion');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_multilingual_v2',
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.blob();
};

export const playAudioFromBlob = (audioBlob) => {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error('Failed to play audio'));
    };

    audio.play().catch(reject);
  });
};
