import { useCallback, useEffect, useRef, useState } from 'react';

import { createAssistantReply, initialMessages } from '../utils/responses';

export function useChatbot() {
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const submitMessage = useCallback(
    (rawText) => {
      const trimmed = rawText.trim();
      if (!trimmed) {
        return;
      }

      appendMessage({
        id: `user-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toISOString(),
      });

      setIsTyping(true);

      setTimeout(() => {
        const response = createAssistantReply(trimmed);

        appendMessage({
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: response,
          timestamp: new Date().toISOString(),
        });

        setIsTyping(false);
      }, 600);
    },
    [appendMessage]
  );

  const handleRecognitionResult = useCallback(
    (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      submitMessage(transcript);
    },
    [submitMessage]
  );

  const handleRecognitionError = useCallback((event) => {
    console.error('Speech recognition error:', event.error);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = handleRecognitionResult;
    recognition.onerror = handleRecognitionError;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [handleRecognitionError, handleRecognitionResult]);

  const toggleListening = () => {
    if (!voiceSupported || !recognitionRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return {
    isTyping,
    isListening,
    toggleListening,
    voiceSupported,
    messages,
    messagesEndRef,
  };
}

