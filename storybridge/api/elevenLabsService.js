const https = require('https');

const convertTextToSpeech = async (text) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.REACT_APP_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      reject(new Error('ElevenLabs API key not found'));
      return;
    }

    const postData = JSON.stringify({
      text: text,
      model_id: "eleven_flash_v2_5", // Using Flash model for cost savings
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true
      }
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      port: 443,
      path: '/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', // Default voice ID
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    };


    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`ElevenLabs API error: ${res.statusCode} ${res.statusMessage}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const audioBuffer = Buffer.concat(chunks);
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        resolve(audioBlob);
      });
    });

    req.on('error', (error) => {
      console.error('ElevenLabs API request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

module.exports = {
  convertTextToSpeech
};
