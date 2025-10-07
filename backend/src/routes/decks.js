const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAuth } = require('../middleware/auth');
const { aiQueue } = require('../config/queue');
const crypto = require('crypto');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);
router.use(requireAuth);

// Get all decks for user
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = db('decks')
      .where({ user_id: req.user.id })
      .select([
        'id', 'title', 'description', 'category', 
        'difficulty_level', 'ai_generated', 'created_at', 'last_studied'
      ])
      .orderBy('last_studied', 'desc')
      .orderBy('created_at', 'desc');

    if (category) {
      query = query.where({ category });
    }

    if (search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`);
      });
    }

    const decks = await query;

    // Get card counts for each deck
    for (let deck of decks) {
      const cardCount = await db('cards')
        .where({ deck_id: deck.id })
        .count('id as count')
        .first();
      deck.cardCount = parseInt(cardCount.count);
    }

    res.json({ decks });
  } catch (error) {
    console.error('Get decks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single deck with cards
router.get('/:id', async (req, res) => {
  try {
    const deck = await db('decks')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    const cards = await db('cards')
      .where({ deck_id: deck.id })
      .select(['id', 'front', 'back', 'difficulty', 'created_at'])
      .orderBy('created_at', 'asc');

    res.json({ deck, cards });
  } catch (error) {
    console.error('Get deck error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new deck
router.post('/', [
  body('title').isLength({ min: 1, max: 255 }).trim(),
  body('description').optional().isLength({ max: 1000 }).trim(),
  body('category').optional().isLength({ max: 100 }).trim(),
  body('difficulty_level').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, description, category, difficulty_level } = req.body;

    const [deck] = await db('decks')
      .insert({
        user_id: req.user.id,
        title,
        description,
        category,
        difficulty_level: difficulty_level || 1
      })
      .returning('*');

    res.status(201).json({ 
      message: 'Deck created successfully', 
      deck 
    });
  } catch (error) {
    console.error('Create deck error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update deck
router.put('/:id', [
  body('title').optional().isLength({ min: 1, max: 255 }).trim(),
  body('description').optional().isLength({ max: 1000 }).trim(),
  body('category').optional().isLength({ max: 100 }).trim(),
  body('difficulty_level').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, description, category, difficulty_level } = req.body;

    const [deck] = await db('decks')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({
        title,
        description,
        category,
        difficulty_level
      })
      .returning('*');

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    res.json({ 
      message: 'Deck updated successfully', 
      deck 
    });
  } catch (error) {
    console.error('Update deck error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete deck
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db('decks')
      .where({ id: req.params.id, user_id: req.user.id })
      .del();

    if (!deleted) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Delete deck error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Generate deck from AI
router.post('/generate', [
  body('topic').isLength({ min: 1, max: 500 }).trim(),
  body('cardCount').isInt({ min: 1, max: 50 }),
  body('difficulty').optional().isInt({ min: 1, max: 5 }),
  body('category').optional().isLength({ max: 100 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { topic, cardCount, difficulty = 2, category } = req.body;

    // Check user token limits
    const dailyUsage = await db('users')
      .where({ id: req.user.id })
      .select(['tokens_used', 'daily_token_limit'])
      .first();

    const estimatedTokens = cardCount * 100; // Rough estimate
    if (dailyUsage.tokens_used + estimatedTokens > dailyUsage.daily_token_limit) {
      return res.status(429).json({ 
        message: 'Daily token limit would be exceeded',
        tokensRequired: estimatedTokens,
        tokensRemaining: dailyUsage.daily_token_limit - dailyUsage.tokens_used
      });
    }

    // Create deck first
    const deckTitle = `${topic} - AI Generated`;
    const [deck] = await db('decks')
      .insert({
        user_id: req.user.id,
        title: deckTitle,
        description: `AI-generated flashcards for ${topic}`,
        category: category || 'AI Generated',
        difficulty_level: difficulty,
        ai_generated: true,
        source_prompt: topic
      })
      .returning('*');

    // Queue AI generation job
    const job = await aiQueue.add('generateCards', {
      deckId: deck.id,
      userId: req.user.id,
      topic,
      count: cardCount,
      difficulty
    }, {
      attempts: 3,
      backoff: 'exponential',
      delay: 2000
    });

    res.status(202).json({
      message: 'Deck generation started',
      deck,
      jobId: job.id,
      estimatedTokens
    });
  } catch (error) {
    console.error('Generate deck error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get deck generation status
router.get('/generate/status/:jobId', async (req, res) => {
  try {
    const job = await aiQueue.getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const isCompleted = await job.isCompleted();
    const isFailed = await job.isFailed();
    const isActive = await job.isActive();
    const isWaiting = await job.isWaiting();

    let status = 'unknown';
    if (isCompleted) status = 'completed';
    else if (isFailed) status = 'failed';
    else if (isActive) status = 'processing';
    else if (isWaiting) status = 'waiting';

    res.json({
      status,
      progress: job.progress(),
      result: isCompleted ? job.returnvalue : null,
      error: isFailed ? job.failedReason : null
    });
  } catch (error) {
    console.error('Get generation status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;