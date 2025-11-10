import React, { useEffect } from 'react';
import './App.css';
import './components/Chatbot.css';

import { ChatHeader } from './components/ChatHeader';
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

  // remove responses file when the app/window is closed
  useEffect(() => {
    const clearOnExit = () => {
      try {
        const url = '/api/clear-responses';
        if (navigator && navigator.sendBeacon) {
          navigator.sendBeacon(url, '');
        } else {
          fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('beforeunload', clearOnExit);
    return () => window.removeEventListener('beforeunload', clearOnExit);
  }, []);

  return (
    <div className="App">
      <div className="chat-shell">
        <ChatHeader />
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
        <div className="cars-container">
          {matches && matches.length > 0 && <CarsGrid cars={matches} />}
        </div>
        <div style={{display:'flex',justifyContent:'center'}}>
          <ChatInput isListening={isListening} onToggleListening={toggleListening} voiceSupported={voiceSupported} />
        </div>
      </div>
    </div>
  );
}

export default App;
