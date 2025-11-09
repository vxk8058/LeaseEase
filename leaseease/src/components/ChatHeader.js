import React from 'react';

function ChatHeader(){
  return (
    <div className="app-hero">
      <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div className="logo-small">TOY</div>
        <h1 style={{color:'#fff',margin:0}}>Toyota LeaseEase Assistant</h1>
        <div style={{color:'#ffdede',marginTop:6}}>Insights, offers, and support for every Toyota journey.</div>
      </div>
    </div>
  );
}

export default ChatHeader;

