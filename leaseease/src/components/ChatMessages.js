import React from 'react';

export default function ChatMessages({ messages, messagesEndRef }){
  return (
    <div className="chat-stage">
      {messages.map((m) => (
        m.role === 'assistant' ? (
          <div key={m.id} className="assistant-bubble">{m.text}</div>
        ) : (
          <div key={m.id} className="user-bubble">{m.text}</div>
        )
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
