const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAuth } = require('../middleware/auth');
const openaiService = require('../services/openai');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);
router.use(requireAuth);

// Start study session
router.post('/start', [
  body('deckId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { deckId } = req.body;

    // Verify deck ownership
    const deck = await db('decks')
      .where({ id: deckId, user_id: req.user.id })
      .first();

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Get cards for this deck
    const cards = await db('cards')
      .where({ deck_id: deckId })
      .select(['id', 'front', 'back', 'difficulty', 'is_quiz', 'options', 'correct_option'])
      .orderBy(db.raw('RANDOM()')) // Randomize card order
      .limit(50); // Limit session size

    if (cards.length === 0) {
      return res.status(400).json({ message: 'Deck has no cards' });
    }

    // Create study session
    const [session] = await db('study_sessions')
      .insert({
        user_id: req.user.id,
        deck_id: deckId
      })
      .returning('*');

    // Update deck last_studied
    await db('decks')
      .where({ id: deckId })
      .update({ last_studied: new Date() });

    res.json({
      session: {
        id: session.id,
        deckId: session.deck_id,
        startedAt: session.started_at,
        totalCards: cards.length
      },
      cards: cards.map(card => ({
        id: card.id,
        front: card.front,
        back: card.back,
        difficulty: card.difficulty,
        is_quiz: card.is_quiz || false,
        options: card.options || null,
        correct_option: card.correct_option !== null ? card.correct_option : null
      }))
    });
  } catch (error) {
    console.error('Start study session error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit answer for a card
router.post('/answer', [
  body('sessionId').isUUID(),
  body('cardId').isUUID(),
  body('userAnswer').optional().isLength({ max: 1000 }).trim(),
  body('selectedOption').optional().isInt({ min: 0, max: 5 }),
  body('isCorrect').optional().isBoolean(),
  body('timeSpent').isInt({ min: 0 }),
  body('hintsUsed').optional().isInt({ min: 0, max: 3 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { sessionId, cardId, userAnswer, selectedOption, timeSpent, hintsUsed = 0 } = req.body;
    let { isCorrect } = req.body;

    // Verify session ownership
    const session = await db('study_sessions')
      .where({ id: sessionId, user_id: req.user.id })
      .first();

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    if (session.completed_at) {
      return res.status(400).json({ message: 'Study session already completed' });
    }

    // Verify card belongs to session deck
    const card = await db('cards')
      .where({ id: cardId, deck_id: session.deck_id })
      .first();

    if (!card) {
      return res.status(404).json({ message: 'Card not found in session deck' });
    }
    
    // For quiz cards, determine correctness from selected option
    if (card.is_quiz && selectedOption !== undefined) {
      isCorrect = selectedOption === card.correct_option;
    }

    // Check if this card was already answered in this session
    const existingAttempt = await db('card_attempts')
      .where({ session_id: sessionId, card_id: cardId })
      .first();

    if (existingAttempt) {
      return res.status(400).json({ message: 'Card already answered in this session' });
    }

    // Record the attempt
    await db('card_attempts').insert({
      session_id: sessionId,
      card_id: cardId,
      user_answer: userAnswer || (selectedOption !== undefined ? `Option ${selectedOption}` : null),
      is_correct: isCorrect,
      hints_used: hintsUsed,
      time_spent: timeSpent
    });

    // Update session stats
    await db('study_sessions')
      .where({ id: sessionId })
      .increment('cards_studied', 1)
      .increment('correct_answers', isCorrect ? 1 : 0);

    // Return card back (answer) and explanation if incorrect
    let explanation = null;
    if (!isCorrect) {
      try {
        explanation = await openaiService.generateExplanation(
          cardId,
          card.front,
          card.back,
          userAnswer,
          req.user.id
        );
      } catch (error) {
        console.error('Failed to generate explanation:', error);
        // Don't fail the whole request if explanation fails
      }
    }

    res.json({
      message: 'Answer recorded',
      card: {
        id: card.id,
        front: card.front,
        back: card.back,
        explanation: card.explanation
      },
      aiExplanation: explanation,
      isCorrect,
      sessionStats: {
        cardsStudied: session.cards_studied + 1,
        correctAnswers: session.correct_answers + (isCorrect ? 1 : 0)
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get hint for a card
router.get('/hint/:cardId/:level', async (req, res) => {
  try {
    const { cardId, level } = req.params;
    
    if (![1, 2, 3].includes(parseInt(level))) {
      return res.status(400).json({ message: 'Hint level must be 1, 2, or 3' });
    }

    // Verify card access through user's decks
    const card = await db('cards')
      .join('decks', 'cards.deck_id', 'decks.id')
      .where({ 'cards.id': cardId, 'decks.user_id': req.user.id })
      .select(['cards.id', 'cards.front', 'cards.back', `cards.hint_${level} as stored_hint`])
      .first();

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    let hint = card.stored_hint;

    // If no stored hint, generate one with AI
    if (!hint) {
      try {
        hint = await openaiService.generateHint(
          cardId,
          parseInt(level),
          card.front,
          card.back,
          req.user.id
        );

        // Store the generated hint
        await db('cards')
          .where({ id: cardId })
          .update({ [`hint_${level}`]: hint });
      } catch (error) {
        console.error('Failed to generate hint:', error);
        return res.status(500).json({ message: 'Failed to generate hint' });
      }
    }

    res.json({
      hint,
      level: parseInt(level),
      cardId
    });
  } catch (error) {
    console.error('Get hint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Complete study session
router.post('/complete/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session ownership
    const session = await db('study_sessions')
      .where({ id: sessionId, user_id: req.user.id })
      .first();

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    if (session.completed_at) {
      return res.status(400).json({ message: 'Study session already completed' });
    }

    // Calculate average response time
    const avgResponseTime = await db('card_attempts')
      .where({ session_id: sessionId })
      .avg('time_spent as avg_time')
      .first();

    // Complete the session
    await db('study_sessions')
      .where({ id: sessionId })
      .update({
        completed_at: new Date(),
        avg_response_time: Math.round(avgResponseTime.avg_time || 0)
      });

    // Update deck last_studied timestamp
    await db('decks')
      .where({ id: session.deck_id })
      .update({ last_studied: new Date() });

    // Get session summary
    const summary = await db('study_sessions')
      .where({ id: sessionId })
      .select(['cards_studied', 'correct_answers', 'started_at', 'completed_at', 'avg_response_time'])
      .first();

    const accuracy = summary.cards_studied > 0 
      ? Math.round((summary.correct_answers / summary.cards_studied) * 100) 
      : 0;

    const duration = new Date(summary.completed_at) - new Date(summary.started_at);

    res.json({
      message: 'Study session completed',
      summary: {
        cardsStudied: summary.cards_studied,
        correctAnswers: summary.correct_answers,
        accuracy: `${accuracy}%`,
        duration: Math.round(duration / 1000), // seconds
        averageResponseTime: summary.avg_response_time
      }
    });
  } catch (error) {
    console.error('Complete study session error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get study session details
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await db('study_sessions')
      .join('decks', 'study_sessions.deck_id', 'decks.id')
      .where({ 'study_sessions.id': sessionId, 'study_sessions.user_id': req.user.id })
      .select([
        'study_sessions.*',
        'decks.title as deck_title'
      ])
      .first();

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    // Get all attempts for this session
    const attempts = await db('card_attempts')
      .join('cards', 'card_attempts.card_id', 'cards.id')
      .where({ 'card_attempts.session_id': sessionId })
      .select([
        'card_attempts.*',
        'cards.front',
        'cards.back'
      ])
      .orderBy('card_attempts.attempted_at', 'asc');

    res.json({
      session,
      attempts
    });
  } catch (error) {
    console.error('Get study session error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;