const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);
router.use(requireAuth);

// Get cards for a deck
router.get('/deck/:deckId', async (req, res) => {
  try {
    // Verify deck ownership
    const deck = await db('decks')
      .where({ id: req.params.deckId, user_id: req.user.id })
      .first();

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    const cards = await db('cards')
      .where({ deck_id: req.params.deckId })
      .select([
        'id', 'front', 'back', 'hint_1', 'hint_2', 'hint_3',
        'explanation', 'difficulty', 'created_at'
      ])
      .orderBy('created_at', 'asc');

    res.json({ cards });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single card
router.get('/:id', async (req, res) => {
  try {
    const card = await db('cards')
      .join('decks', 'cards.deck_id', 'decks.id')
      .where({ 'cards.id': req.params.id, 'decks.user_id': req.user.id })
      .select([
        'cards.id', 'cards.front', 'cards.back', 
        'cards.hint_1', 'cards.hint_2', 'cards.hint_3',
        'cards.explanation', 'cards.difficulty', 'cards.created_at',
        'decks.title as deck_title'
      ])
      .first();

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.json({ card });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new card
router.post('/', [
  body('deck_id').isUUID(),
  body('front').isLength({ min: 1, max: 1000 }).trim(),
  body('back').isLength({ min: 1, max: 1000 }).trim(),
  body('hint_1').optional().isLength({ max: 500 }).trim(),
  body('hint_2').optional().isLength({ max: 500 }).trim(),
  body('hint_3').optional().isLength({ max: 500 }).trim(),
  body('explanation').optional().isLength({ max: 1000 }).trim(),
  body('difficulty').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { 
      deck_id, front, back, hint_1, hint_2, hint_3, 
      explanation, difficulty 
    } = req.body;

    // Verify deck ownership
    const deck = await db('decks')
      .where({ id: deck_id, user_id: req.user.id })
      .first();

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    const [card] = await db('cards')
      .insert({
        deck_id,
        front,
        back,
        hint_1,
        hint_2,
        hint_3,
        explanation,
        difficulty: difficulty || 1
      })
      .returning('*');

    res.status(201).json({ 
      message: 'Card created successfully', 
      card 
    });
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update card
router.put('/:id', [
  body('front').optional().isLength({ min: 1, max: 1000 }).trim(),
  body('back').optional().isLength({ min: 1, max: 1000 }).trim(),
  body('hint_1').optional().isLength({ max: 500 }).trim(),
  body('hint_2').optional().isLength({ max: 500 }).trim(),
  body('hint_3').optional().isLength({ max: 500 }).trim(),
  body('explanation').optional().isLength({ max: 1000 }).trim(),
  body('difficulty').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { front, back, hint_1, hint_2, hint_3, explanation, difficulty } = req.body;

    // Verify card ownership through deck
    const cardExists = await db('cards')
      .join('decks', 'cards.deck_id', 'decks.id')
      .where({ 'cards.id': req.params.id, 'decks.user_id': req.user.id })
      .first();

    if (!cardExists) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const [card] = await db('cards')
      .where({ id: req.params.id })
      .update({
        front,
        back,
        hint_1,
        hint_2,
        hint_3,
        explanation,
        difficulty
      })
      .returning('*');

    res.json({ 
      message: 'Card updated successfully', 
      card 
    });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete card
router.delete('/:id', async (req, res) => {
  try {
    // Verify card ownership through deck
    const cardExists = await db('cards')
      .join('decks', 'cards.deck_id', 'decks.id')
      .where({ 'cards.id': req.params.id, 'decks.user_id': req.user.id })
      .first();

    if (!cardExists) {
      return res.status(404).json({ message: 'Card not found' });
    }

    await db('cards').where({ id: req.params.id }).del();

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Batch create cards
router.post('/batch', [
  body('deck_id').isUUID(),
  body('cards').isArray({ min: 1, max: 50 }),
  body('cards.*.front').isLength({ min: 1, max: 1000 }).trim(),
  body('cards.*.back').isLength({ min: 1, max: 1000 }).trim(),
  body('cards.*.difficulty').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { deck_id, cards } = req.body;

    // Verify deck ownership
    const deck = await db('decks')
      .where({ id: deck_id, user_id: req.user.id })
      .first();

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Prepare cards for insertion
    const cardsToInsert = cards.map(card => ({
      deck_id,
      front: card.front,
      back: card.back,
      hint_1: card.hint_1 || null,
      hint_2: card.hint_2 || null,
      hint_3: card.hint_3 || null,
      explanation: card.explanation || null,
      difficulty: card.difficulty || 1
    }));

    const insertedCards = await db('cards')
      .insert(cardsToInsert)
      .returning('*');

    res.status(201).json({ 
      message: `${insertedCards.length} cards created successfully`, 
      cards: insertedCards 
    });
  } catch (error) {
    console.error('Batch create cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;