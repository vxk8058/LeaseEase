import React from 'react';

function ChatInput({ isListening, onToggleListening, voiceSupported }){
  return (
    <div style={{position:'relative',height:120}}>
      <div style={{textAlign:'center',marginTop:8}}>
        <button className="center-mic" onClick={onToggleListening} disabled={!voiceSupported} aria-label="Toggle speak">
          {isListening ? '●' : '🎤'}
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

