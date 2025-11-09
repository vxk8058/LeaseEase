import React from 'react';
import './App.css';
import './components/Chatbot.css';

import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import CarsGrid from './components/CarsGrid';
import useChatbot from './hooks/useChatbot';

function App(){
  const {
    isListening,
    toggleListening,
    voiceSupported,
    messages,
    matches,
    messagesEndRef,
  } = useChatbot();

  return (
    <div className="App">
      <div className="chat-shell">
        <ChatHeader />
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
        <div className="cars-container">
          {matches && matches.length > 0 && <CarsGrid cars={matches} />}
        </div>
        <div style={{display:'flex',justifyContent:'center',padding:'28px 0'}}>
          <ChatInput isListening={isListening} onToggleListening={toggleListening} voiceSupported={voiceSupported} />
        </div>
      </div>
    </div>
  );
}

export default App;
