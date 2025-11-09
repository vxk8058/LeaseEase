import './App.css';
import './components/Chatbot.css';

import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { useChatbot } from './hooks/useChatbot';

function App() {
  const {
    isTyping,
    isListening,
    toggleListening,
    voiceSupported,
    messages,
    messagesEndRef,
  } = useChatbot();

  return (
    <div className="App">
      <div className="chat-shell">
        <ChatHeader />
        <ChatInput
          isListening={isListening}
          onToggleListening={toggleListening}
          voiceSupported={voiceSupported}
        />
      </div>
    </div>
  );
}

export default App;
