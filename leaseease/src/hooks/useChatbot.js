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
  // Safer parsing and clear formula using the multiplier approach described.
  const P = parseFloat(principal) || 0;
  const annual = parseFloat(annualRate) || 0;
  const n = Math.max(1, Math.floor(Number(months) || 0));
  const r = annual / 100 / 12; // monthly rate

  if (n <= 0 || P <= 0) return 0;

  // zero (or effectively zero) interest fallback
  if (r <= 0) {
    const flat = P / n;
    return Math.round(flat * 100) / 100;
  }

  // multiplier = r*(1+r)^n / ((1+r)^n - 1)
  const onePlusRpowN = Math.pow(1 + r, n);
  const multiplier = (r * onePlusRpowN) / (onePlusRpowN - 1);
  const monthly = P * multiplier;

  // round to cents
  return Math.round(monthly * 100) / 100;
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
    const raw = (text || '').trim();

    if (!raw) {
      pushUser('(no response)');
      setAwaitingRetry(true);
      await pushAssistant("I didn't get that, please answer again.");
      return;
    }

    // validate and normalize the answer based on question type
    const validation = validateAnswerForKey(q.key, raw, answers);
    if (!validation.ok) {
      // show the raw reply and ask for clarification
      pushUser(raw || '(no response)');
      setAwaitingRetry(true);
      await pushAssistant(validation.message || "I didn't get that, please answer again.");
      return;
    }

    setAwaitingRetry(false);
    const normalized = validation.value;

    // build new answers object (store normalized values)
    const newAnswers = { ...answers, [q.key]: normalized };
    setAnswers(newAnswers);
    // show what the user said (raw transcription) in UI
    pushUser(raw);

    // Log accepted answer to server-side file
    try {
      // use relative path so CRA dev server can proxy to the backend (see package.json proxy)
      fetch('/api/log-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionKey: q.key, questionPrompt: q.prompt, answer: normalized }),
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

  // --- input parsing / validation helpers ---
  const numberWords = {
    zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
    ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19,
    twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90
  };

  function wordsToNumber(text){
    if (!text) return null;
    const cleaned = text.toLowerCase().replace(/-/g,' ').replace(/ and /g,' ');
    // handle decimals 'point'
    if (cleaned.includes('point')){
      const [intPart, fracPart] = cleaned.split('point').map(s=>s.trim());
      const intVal = wordsToNumber(intPart);
      if (intVal === null) return null;
      // fractional: map each token to a single digit if possible
      const fracTokens = fracPart.split(/\s+/);
      let fracStr = '';
      for (const t of fracTokens){
        if (numberWords[t] !== undefined){
          const digit = numberWords[t];
          // only single-digit words make sense here
          fracStr += String(digit % 10);
        } else if (/^\d$/.test(t)){
          fracStr += t;
        } else {
          // can't parse further
          break;
        }
      }
      const fracVal = fracStr ? Number('0.'+fracStr) : 0;
      return intVal + fracVal;
    }

    const tokens = cleaned.match(/\w+/g) || [];
    let total = 0;
    let current = 0;
    for (const tok of tokens){
      if (numberWords[tok] !== undefined){
        current += numberWords[tok];
      } else if (tok === 'hundred'){
        current = current === 0 ? 100 : current * 100;
      } else if (tok === 'thousand'){
        current = current === 0 ? 1000 : current * 1000;
        total += current;
        current = 0;
      } else if (tok === 'million'){
        current = current === 0 ? 1000000 : current * 1000000;
        total += current;
        current = 0;
      } else {
        // unknown token – stop parsing
        break;
      }
    }
    return (total + current) || null;
  }

  function parseNumericInput(raw){
    if (!raw) return null;
    const s = String(raw).toLowerCase().trim();
    // reject obvious time stamps like 7:20
    if (s.includes(':')) return null;
    // handle percent words
    const percentMatch = s.match(/(-?\d+[\d,\.]*)\s*%/);
    if (percentMatch) return Number(percentMatch[1].replace(/,/g,''));
    if (s.includes('percent')){
      const m = s.match(/(-?[\d,\.]+)|([a-z\-\s]+)/);
      if (m){
        const num = m[1] ? Number(m[1].replace(/,/g,'')) : wordsToNumber(m[2]);
        return num === null ? null : num;
      }
    }
    // look for digits first
    const digitMatch = s.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+\.\d+/);
    if (digitMatch) return Number(digitMatch[0].replace(/,/g,''));
    // fallback to words
    const wordNum = wordsToNumber(s);
    return wordNum === null ? null : wordNum;
  }

  function validateAnswerForKey(key, raw, currentAnswers){
    const trimmed = (raw || '').trim();
    if (!trimmed) return { ok: false, message: "I didn't get that, please answer again." };
    switch (key){
      case 'buyOrLease': {
        const r = trimmed.toLowerCase();
        if (r.includes('buy')) return { ok: true, value: 'buy' };
        if (r.includes('lease')) return { ok: true, value: 'lease' };
        return { ok: false, message: 'Please say "buy" or "lease".' };
      }
      case 'salary': {
        const num = parseNumericInput(trimmed);
        if (num === null || isNaN(num) || num < 0) return { ok: false, message: 'Please say your yearly salary as a number, for example 85000.' };
        return { ok: true, value: Math.round(num) };
      }
      case 'totalBudget': {
        const num = parseNumericInput(trimmed);
        if (num === null || isNaN(num) || num <= 0) return { ok: false, message: 'Please state your total budget as a dollar amount, for example 35000.' };
        return { ok: true, value: Math.round(num) };
      }
      case 'creditScore': {
        const num = parseNumericInput(trimmed);
        if (num === null || isNaN(num) || num < 250 || num > 900) return { ok: false, message: 'Please say your credit score as a number, for example 720.' };
        return { ok: true, value: Math.round(num) };
      }
      case 'interestRate': {
        let num = parseNumericInput(trimmed);
        if (num === null || isNaN(num)) return { ok: false, message: 'Please say the interest rate as a percent, for example 6 or 6 percent.' };
        // handle 0.06 -> 6
        if (Math.abs(num) <= 1) num = num * 100;
        if (num <= 0 || num > 100) return { ok: false, message: 'Please provide a realistic annual interest rate (like 6).' };
        return { ok: true, value: Number(num) };
      }
      case 'downPayment': {
        const num = parseNumericInput(trimmed);
        if (num === null || isNaN(num) || num < 0) return { ok: false, message: 'Please state the down payment as a dollar amount, for example 3500.' };
        return { ok: true, value: Math.round(num) };
      }
      case 'loanTerm': {
        const num = parseNumericInput(trimmed);
        if (num === null || isNaN(num)) return { ok: false, message: 'Please say the loan term in months, for example 60.' };
        const months = Math.round(num);
        if (months <= 0 || months > 600) return { ok: false, message: 'Please provide a reasonable term in months (e.g. 36, 48, 60).' };
        return { ok: true, value: months };
      }
      default:
        return { ok: true, value: trimmed };
    }
  }

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


