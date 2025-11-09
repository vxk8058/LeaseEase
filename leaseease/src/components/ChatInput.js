import React from 'react';

function ChatInput({ isListening, onToggleListening, voiceSupported }){
  return (
    <div style={{position:'relative',height:120}}>
      <div style={{textAlign:'center',marginTop:8}}>
        <button
          className={`center-mic${isListening ? ' is-listening' : ''}`}
          onClick={onToggleListening}
          disabled={!voiceSupported}
          aria-label="Toggle speak"
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" fill="#fff" />
            <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z" fill="#fff" opacity="0.9" />
          </svg>
        </button>
      </div>
      <div style={{textAlign:'center',marginTop:12}}>
        {!voiceSupported ? (
          <div className="small-note">Speech recognition unavailable — please use a supported browser.</div>
        ) : (
          <div className="small-note">Tap the mic to speak and I will translate it here.</div>
        )}
      </div>
    </div>
  );
}

export default ChatInput;

