// Centralized test data configuration
// This file manages all test/demo data to prevent hardcoded IDs

export const TEST_USER = {
  id: '88e53ecd-ed3b-4577-9e38-61f1efa7ba57',
  username: 'newuser',
  email: 'newuser@test.com',
  tokensUsed: 532,
  dailyTokenLimit: 10000
};

export const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg4ZTUzZWNkLWVkM2ItNDU3Ny05ZTM4LTYxZjFlZmE3YmE1NyIsImVtYWlsIjoibmV3dXNlckB0ZXN0LmNvbSIsImlhdCI6MTc1OTg4Nzg4MywiZXhwIjoxNzYwNDkyNjgzfQ.1LPn1YyNNOxtqCVKE9D5MSPikfi4TLVPxaOEerea2LI';

export const VALID_DECK_IDS = {
  pythonBasics: 'a3d40a96-291e-4f4b-816b-d9afd001b738',
  myFirstDeck: '045a1e89-1510-47e3-887e-0bde40cf8177'
};

// Remove any invalid test deck IDs
export const INVALID_DECK_IDS = [
  'physics-deck-id',
  'test-deck-id',
  'mock-deck-id'
];

export const isValidDeckId = (deckId) => {
  // UUID v4 regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(deckId);
};

export const cleanupInvalidDeckId = (deckId) => {
  if (!deckId || INVALID_DECK_IDS.includes(deckId) || !isValidDeckId(deckId)) {
    console.warn(`Invalid deck ID detected: ${deckId}. Redirecting to dashboard.`);
    return null;
  }
  return deckId;
};