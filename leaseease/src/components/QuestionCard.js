import React, {useState, useEffect} from 'react';
import {speak, listen, preloadAudio} from '../speech';
import './QuestionCard.css';

export default function QuestionCard({question, example, onAnswer, placeholder = ''}){
  const [listening, setListening] = useState(false);
  const [lastAnswer, setLastAnswer] = useState('');
  const [hasSpoken, setHasSpoken] = useState(false);

  // Preload audio when component mounts
  useEffect(() => {
    preloadAudio(question);
  }, [question]);

  // Speak question once when component mounts
  useEffect(() => {
    if (!hasSpoken) {
      speak(question).then(() => setHasSpoken(true));
    }
  }, [question, hasSpoken]);

  async function handleClick() {
    if (listening) return; // Prevent multiple clicks
    setListening(true);
    try {
      const text = await listen();
      setLastAnswer(text);
      if (onAnswer && text) onAnswer(text);
    } catch (err) {
      console.warn('Listen error:', err);
    } finally {
      setListening(false);
    }
  }

  return (
    <div className="qe-card">
      <div className="qe-bubble">{question}</div>
      <div className="qe-center">
        <button 
          className="qe-mic" 
          onClick={handleClick} 
          disabled={listening}
          aria-label={listening ? 'Listening...' : 'Speak'}>
          {listening ? '●' : '🎤'}
        </button>
        <div className="qe-example">{example}</div>
      </div>
      <div className="qe-answer">{lastAnswer || placeholder}</div>
    </div>
  );
}
