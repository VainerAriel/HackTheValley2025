import GeminiChat from './components/GeminiChat';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome to StoryBridge
        </h1>
        <p className="text-lg text-gray-600">
          Powered by Gemini AI
        </p>
      </div>
      <GeminiChat />
    </div>
  );
}

export default App;
