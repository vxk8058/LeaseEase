import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import sampleCars from '../data/sampleCars';
import { speak, preloadAudio, listen } from '../speech';

const QUESTIONS = [
  { key: 'name', prompt: 'Hi there! I am LeaseEase Assistant. May I have your name?' },
  { key: 'buyOrLease', prompt: 'Would you like to buy or lease the car?' },
  { key: 'salary', prompt: 'What is your yearly salary?' },
  { key: 'totalBudget', prompt: 'What is your total budget for the car?' },
  { key: 'creditScore', prompt: 'What is your credit score?' },
  { key: 'interestRate', prompt: 'What interest rate do you expect (annual percent)?' },
  { key: 'downPayment', prompt: 'How much will you put as a downpayment?' },
  { key: 'loanTerm', prompt: 'Loan term in months?' },
];

function computeMonthly(principal, annualRate, months) {
  const P = Number(principal) || 0;
  const r = (Number(annualRate) || 0) / 100 / 12;
  const n = Number(months) || 1;
  if (r <= 0) return (P / n) || 0;
  const monthly = (P * r) / (1 - Math.pow(1 + r, -n));
  return monthly;
}

export function useChatbot() {
  // Keep exactly two visible bubbles by tracking assistantText and userText
  const [assistantText, setAssistantText] = useState(QUESTIONS[0].prompt);
  const [userText, setUserText] = useState('Tap the mic to speak and I will translate it here.');
  const [step, setStep] = useState(0); // 0 = not started, 1..N are question indexes+1
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [answers, setAnswers] = useState({});
  const [matches, setMatches] = useState([]);
  const [awaitingRetry, setAwaitingRetry] = useState(false);

  const messagesEndRef = useRef(null);

  // preload first question audio and common phrases
  useEffect(() => {
    preloadAudio(QUESTIONS[0].prompt);
    preloadAudio('This is your estimated monthly payment:');
  }, []);

  const pushAssistant = useCallback(async (text) => {
    setAssistantText(text);
    setIsTyping(true);
    try {
      await speak(text);
    } catch (err) {
      console.warn('TTS failed', err);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const pushUser = useCallback((text) => {
    setUserText(text || '(no response)');
  }, []);

  // small helper for matching cars
  const getMatches = useCallback((answersObj) => {
    const budget = Number(answersObj.totalBudget) || 30000;
    const affordable = sampleCars.filter((c) => c.price <= budget);
    let picks = affordable.length ? affordable : sampleCars.slice().sort((a, b) => a.price - b.price).slice(0, 5);
    picks = picks.sort((a, b) => Math.abs(a.price - budget) - Math.abs(b.price - budget)).slice(0, 5);
    return picks;
  }, []);

  const startConversation = useCallback(async () => {
    setStep(1);
    await pushAssistant(QUESTIONS[0].prompt);
  }, [pushAssistant]);

  // handles captured answer text and advances the flow
  const handleAnswer = useCallback(async (text) => {
    const idx = Math.max(0, step - 1);
    const q = QUESTIONS[idx];
    const value = (text || '').trim();

    if (!value) {
      pushUser('(no response)');
      setAwaitingRetry(true);
      await pushAssistant("I didn't get that, please answer again.");
      return;
    } else {
      setAwaitingRetry(false);
    }

    // build new answers object (so we can use it synchronously)
    const newAnswers = { ...answers, [q.key]: value };
    setAnswers(newAnswers);
    pushUser(value);

    // Log accepted (non-empty) answer to server-side file (non-blocking)
    try {
      fetch('http://localhost:5001/api/log-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionKey: q.key, questionPrompt: q.prompt, answer: value }),
      }).catch((e) => {
        // swallow errors — logging is best-effort
        console.warn('Failed to log response', e);
      });
    } catch (e) {
      console.warn('Failed to call log endpoint', e);
    }

    const next = idx + 1;
    if (next < QUESTIONS.length) {
      setStep(next + 1);
      // preload next prompt
      preloadAudio(QUESTIONS[next].prompt);
      await pushAssistant(QUESTIONS[next].prompt);
    } else {
      // finished: compute payment and show
      const budget = Number(newAnswers.totalBudget) || 0;
      const down = Number(newAnswers.downPayment || 0) || 0;
      const principal = Math.max(0, budget - down);
      const rate = Number(newAnswers.interestRate || 0) || 0;
      const term = Number(newAnswers.loanTerm || 60) || 60;
      const m = computeMonthly(principal, rate, term);

      await pushAssistant(`This is your estimated monthly payment: $${Math.round(m)}`);
      await pushAssistant('Based on your responses, here are a few Toyota options:');
      const found = getMatches(newAnswers);
      setMatches(found);
      // inform user that recommendations are shown below
      await pushAssistant('I found a few Toyota options — see the list below.');
      setStep(QUESTIONS.length + 1);
    }
  }, [answers, step, pushUser, pushAssistant, getMatches]);

  // toggle listening from UI (central mic)
  const toggleListening = useCallback(async () => {
    if (isTyping) return;

    if (step === 0) {
      await startConversation();
      return;
    }

    if (isListening) return;

    setIsListening(true);
    try {
      const text = await listen({ timeout: 15000 });
      const finalText = (text || '').trim();
      await handleAnswer(finalText);
    } catch (err) {
      console.warn('Listen failed', err);
      await handleAnswer('');
    } finally {
      setIsListening(false);
    }
  }, [isTyping, isListening, step, startConversation, handleAnswer]);

  const voiceSupported = typeof (window.SpeechRecognition || window.webkitSpeechRecognition) !== 'undefined';

  const messages = useMemo(() => [
    { id: 'assistant', role: 'assistant', text: assistantText },
    { id: 'user', role: 'user', text: userText },
  ], [assistantText, userText]);

  return {
    isTyping,
    isListening,
    toggleListening,
    voiceSupported,
    messages,
    matches,
    messagesEndRef,
    startConversation,
    awaitingRetry,
  };
}

export default useChatbot;


