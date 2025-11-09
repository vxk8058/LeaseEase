export function ConversationTranscript({ messages }) {
  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.sender === 'assistant');
  const latestUser = [...messages]
    .reverse()
    .find((message) => message.sender === 'user');

  return (
    <section className="transcript">
      <div className="transcript-column transcript-column--assistant">
        <div className="transcript-label">LeaseEase</div>
        <div className="transcript-bubble transcript-bubble--assistant">
          {latestAssistant
            ? latestAssistant.text
            : 'Hello, I am your virtual assistant. May I have your name?'}
        </div>
      </div>
      <div className="transcript-column transcript-column--user">
        <div className="transcript-label">You</div>
        <div className="transcript-bubble transcript-bubble--user">
          {latestUser ? latestUser.text : 'Tap the mic to speak and I will translate it here.'}
        </div>
      </div>
    </section>
  );
}

