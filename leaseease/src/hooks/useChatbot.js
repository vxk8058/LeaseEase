import { useCallback, useEffect, useRef, useState } from 'react';
import sampleCars from '../data/sampleCars';
import { speak, preloadAudio, listen } from '../speech';

const QUESTIONS = [
  { key: 'name', prompt: 'Hi there! I am LeaseEase Assistant. May I have your name?' },
  { key: 'buyOrLease', prompt: 'Would you like to buy or lease the car?' },
  { key: 'salary', prompt: 'What is your yearly salary?' },
  { key: 'totalBudget', prompt: 'What is your total budget for the car?' },
  { key: 'creditScore', prompt: 'What is your credit score range?' },
  { key: 'interestRate', prompt: 'What interest rate do you expect (annual percent)?' },
  { key: 'downPayment', prompt: 'How much will you put as a downpayment?' },
  { key: 'loanTerm', prompt: 'Loan term in months?' },
];

function computeMonthly(principal, annualRate, months){
  const P = Number(principal) || 0;
  const r = (Number(annualRate) || 0) / 100 / 12;
  const n = Number(months) || 1;
  if (r <= 0) return (P / n) || 0;
  const monthly = (P * r) / (1 - Math.pow(1 + r, -n));
  return monthly;
}

export function useChatbot(){
  const [messages, setMessages] = useState([]); // {id, role, text}
  const [step, setStep] = useState(0); // index into QUESTIONS, 0 = not started
  const [isTyping, setIsTyping] = useState(false); // TTS playing
  const [isListening, setIsListening] = useState(false);
  const [answers, setAnswers] = useState({});
  const messagesEndRef = useRef(null);

  // scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // preload first question audio
  useEffect(() => {
    preloadAudio(QUESTIONS[0].prompt);
    preloadAudio('This is your estimated monthly payment:');
  }, []);

  const pushAssistant = useCallback(async (text) => {
    const id = Date.now() + Math.random();
    setMessages((m) => [...m, { id, role: 'assistant', text }]);
    try {
      setIsTyping(true);
      await speak(text);
    } catch (err) {
      console.warn('TTS error', err);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const pushUser = useCallback((text) => {
    const id = Date.now() + Math.random();
    setMessages((m) => [...m, { id, role: 'user', text }]);
  }, []);

  const startConversation = useCallback(async () => {
    if (step > 0) return;
    setStep(1);
    await pushAssistant(QUESTIONS[0].prompt);
  }, [step, pushAssistant]);

  // handles captured answer text and advances the flow
  const handleAnswer = useCallback(async (text) => {
    const idx = Math.max(0, step - 1);
    const q = QUESTIONS[idx];
    const value = (text || '').trim();
    setAnswers((s) => ({ ...s, [q.key]: value }));
    pushUser(value || '(no response)');

    const next = idx + 1;
    if (next < QUESTIONS.length){
      setStep(next + 1);
      // preload next
      preloadAudio(QUESTIONS[next].prompt);
      await pushAssistant(QUESTIONS[next].prompt);
    } else {
      // finished: compute payment and show
      const budget = Number((answers.totalBudget || value)) || 0;
      const down = Number(answers.downPayment || 0) || 0;
      const principal = Math.max(0, budget - down);
      const rate = Number(answers.interestRate || 0) || 0;
      const term = Number(value) || 60;
      const m = computeMonthly(principal, rate, term);
      await pushAssistant(`This is your estimated monthly payment: $${Math.round(m)}`);
      // show recommendations
      const matches = getMatches({ ...answers, loanTerm: value });
      await pushAssistant('Based on your responses, here are a few Toyota options:');
      matches.forEach((c) => pushAssistant(`${c.name} — $${c.price.toLocaleString()}`));
      setStep(QUESTIONS.length + 1);
    }
  }, [answers, step, pushUser, pushAssistant]);

  // small helper for matching cars
  function getMatches(answersObj){
    const budget = Number(answersObj.totalBudget) || 30000;
    const affordable = sampleCars.filter(c => c.price <= budget);
    let picks = affordable.length ? affordable : sampleCars.slice().sort((a,b)=>a.price-b.price).slice(0,5);
    picks = picks.sort((a,b)=> Math.abs(a.price - budget) - Math.abs(b.price - budget)).slice(0,5);
    return picks;
  }

  // toggle listening from UI (central mic)
  const toggleListening = useCallback(async () => {
    // if currently speaking, ignore
    if (isTyping) return;

    // if not started, start conversation
    if (step === 0){
      await startConversation();
      return;
    }

    // start listening for answer to current question
    if (isListening) {
      // If already listening, ignore toggle
      return;
    }

    setIsListening(true);
    try {
      const text = await listen({ timeout: 10000 });
      await handleAnswer(text || '');
    } catch (err) {
      console.warn('Listen failed', err);
      // push empty user reply and continue
      await handleAnswer('');
    } finally {
      setIsListening(false);
    }
  }, [isTyping, isListening, step, startConversation, handleAnswer]);

  const voiceSupported = typeof (window.SpeechRecognition || window.webkitSpeechRecognition) !== 'undefined';

  return {
    isTyping,
    isListening,
    toggleListening,
    voiceSupported,
    messages,
    messagesEndRef,
    startConversation,
  };
}

export default useChatbot;


