export function MessageBubble({ message }) {
  const date = new Date(message.timestamp);
  const timestamp = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isUser = message.sender === 'user';

  return (
    <article className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-metadata">
        <span className="message-sender">{isUser ? 'You' : 'LeaseEase'}</span>
        <time dateTime={date.toISOString()}>{timestamp}</time>
      </div>
      <p>{message.text}</p>
    </article>
  );
}

