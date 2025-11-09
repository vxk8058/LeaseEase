import React, {useState, useEffect} from 'react';
import './App.css';
import QuestionCard from './components/QuestionCard';
import CarsGrid from './components/CarsGrid';
import sampleCars from './data/sampleCars';
import {speak, preloadAudio} from './speech';

const QUESTIONS = [
  { key: 'name', prompt: 'What is your name?', example: 'e.g. Sam' },
  { key: 'buyOrLease', prompt: 'Would you like to buy or lease the car?', example: 'e.g. lease' },
  { key: 'salary', prompt: 'What is your yearly salary?', example: 'e.g. 60000' },
  { key: 'totalBudget', prompt: 'What is your total budget for the car?', example: 'e.g. 30000' },
  { key: 'creditScore', prompt: 'What is your credit score range?', example: 'e.g. 725' },
  { key: 'interestRate', prompt: 'What interest rate do you expect (annual %)?', example: 'e.g. 4.0' },
  { key: 'downPayment', prompt: 'How much will you put as a downpayment?', example: 'e.g. 5000' },
  { key: 'loanTerm', prompt: 'Loan term in months?', example: 'e.g. 60' },
];

function computeMonthly(principal, annualRate, months){
  const P = Number(principal) || 0;
  const r = (Number(annualRate) || 0) / 100 / 12;
  const n = Number(months) || 1;
  if (r <= 0) return (P / n) || 0;
  const monthly = (P * r) / (1 - Math.pow(1 + r, -n));
  return monthly;
}

function App(){
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [monthly, setMonthly] = useState(null);

  // Preload audio for next question
  useEffect(() => {
    if (step > 0 && step <= QUESTIONS.length) {
      const nextIdx = step;
      if (nextIdx < QUESTIONS.length) {
        preloadAudio(QUESTIONS[nextIdx].prompt);
      }
    }
  }, [step]);

  // Preload first question and payment message
  useEffect(() => {
    preloadAudio(QUESTIONS[0].prompt);
    preloadAudio("This is your estimated monthly payment:");
  }, []);

  async function startConversation(){
    setStep(1); // show first question card
  }

  async function handleAnswer(text){
    const idx = Math.max(0, step - 1);
    const q = QUESTIONS[idx];
    const value = text || '';
    setAnswers((s) => ({...s, [q.key]: value}));

    // move to next step
    const next = idx + 1;
    if (next < QUESTIONS.length){
      // speak next question
      await speak(QUESTIONS[next].prompt);
      setStep(next + 1);
    } else {
      // finished questions; compute monthly
      // determine principal: use budget minus downpayment when available
      const budget = Number(answers.totalBudget || answers.totalBudget === 0 ? answers.totalBudget : value) || 0;
      const down = Number(answers.downPayment || 0) || 0;
      const principal = Math.max(0, budget - down);
      const rate = Number(answers.interestRate || 0) || 0;
      const term = Number(value) || 60;
      const m = computeMonthly(principal, rate, term);
      setMonthly(m);
      setStep(QUESTIONS.length + 1);
      await speak(`This is your estimated monthly payment: $${Math.round(m)}`);
    }
  }

  function getMatches(){
    const budget = Number(answers.totalBudget) || 30000;
    // pick cars with price <= budget, else pick cheapest 5
    const affordable = sampleCars.filter(c => c.price <= budget);
    let picks = affordable.length ? affordable : sampleCars.slice().sort((a,b)=>a.price-b.price).slice(0,5);
    // sort by closeness to budget
    picks = picks.sort((a,b)=> Math.abs(a.price - budget) - Math.abs(b.price - budget)).slice(0,5);
    return picks;
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="app-container">
          <div className="hero">
            <div className="stage-title">LeaseEase — Toyota shopper</div>
            {step === 0 && (
              <div>
                <button className="home-mic" onClick={startConversation}>🎤</button>
                <div className="continue-note">Click to start conversation</div>
              </div>
            )}
          </div>

          {/* Question flow */}
          {step > 0 && step <= QUESTIONS.length && (
            <QuestionCard
              question={QUESTIONS[step-1].prompt}
              example={QUESTIONS[step-1].example}
              onAnswer={handleAnswer}
            />
          )}

          {/* monthly result */}
          {step === QUESTIONS.length + 1 && (
            <div className="result-card">
              <div>This is your estimated monthly payment:</div>
              <div className="monthly">${monthly ? monthly.toFixed(2) : '0.00'}</div>
              <div className="continue-note">Tap the mic below to have recommendations read aloud.</div>
              <div style={{marginTop:14}}>
                <button className="home-mic" onClick={async ()=>{ await speak(`Your estimated payment is ${Math.round(monthly)} dollars per month.`); setStep(QUESTIONS.length+2); }}>🎤</button>
              </div>
            </div>
          )}

          {/* cars recommendations */}
          {step === QUESTIONS.length + 2 && (
            <div>
              <div style={{textAlign:'left',margin:'8px 10%'}}>Based on your responses, here are a few Toyota options:</div>
              <CarsGrid cars={getMatches()} />
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
