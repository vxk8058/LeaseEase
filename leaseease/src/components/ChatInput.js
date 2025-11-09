export function ChatInput({ isListening, onToggleListening, voiceSupported }) {
  return (
    <div className="chat-input-bar">
      <button
        type="button"
        className={`mic-button ${isListening ? 'mic-button--active' : ''}`}
        onClick={onToggleListening}
        disabled={!voiceSupported}
        aria-live="polite"
      >
        <span className="sr-only">
          {voiceSupported
            ? isListening
              ? 'Stop voice message'
              : 'Start voice message'
            : 'Voice input not supported'}
        </span>
        <span className="mic-icon" aria-hidden="true">
          <span className="mic-head" />
          <span className="mic-stem" />
          <span className="mic-base" />
          <span className="mic-pulse" />
        </span>
      </button>
      {!voiceSupported && (
        <p className="speech-warning">
          Voice input is not available in this browser. Try Chrome on desktop for best results.
        </p>
      )}
    </div>
  );
}

