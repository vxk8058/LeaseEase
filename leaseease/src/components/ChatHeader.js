import React from 'react';

function ChatHeader(){
  return (
    <div className="app-hero">
      <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div className="logo-small" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="12" fill="#ff2b2b" />
            <g transform="translate(12,12)">
              <ellipse cx="20" cy="18" rx="14" ry="10" fill="none" stroke="#fff" strokeWidth="3" />
              <path d="M6 26c4-6 28-6 32 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          </svg>
        </div>
        <h1 style={{color:'#fff',margin:0}}>Toyota LeaseEase Assistant</h1>
        <div style={{color:'#ffdede',marginTop:6}}>Insights, offers, and support for every Toyota journey.</div>
      </div>
    </div>
  );
}

export default ChatHeader;

