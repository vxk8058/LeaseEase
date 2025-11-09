export const initialMessages = [
  {
    id: 'welcome',
    sender: 'assistant',
    text: 'Hi there! I am LeaseEase Assistant. Ask me anything about your leasing journey.',
    timestamp: new Date().toISOString(),
  },
];

export function createAssistantReply(userInput) {
  const normalized = userInput.toLowerCase();

  if (normalized.includes('rent') || normalized.includes('lease')) {
    return "For lease questions, make sure to review your agreement's terms, duration, and renewal options. I can help break those down if you share more details.";
  }

  if (normalized.includes('maintenance') || normalized.includes('repair')) {
    return 'Maintenance issues should be reported in writing to your landlord or property manager. Include photos, dates, and a clear description to speed things up.';
  }

  if (normalized.includes('payment') || normalized.includes('deposit')) {
    return 'Security deposits are usually returned minus documented damages within the timeframe defined in your lease. Always request a move-in and move-out inspection checklist.';
  }

  return "I'm here to help with leasing questions like rent, deposits, maintenance, and tenant rights. Share a bit more and I'll get you resources.";
}

