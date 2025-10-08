const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAuth } = require('../middleware/auth');
// const { aiQueue } = require('../config/queue'); // Disabled queue for now
const openaiService = require('../services/openai');
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

    res.json(decks);
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
  body('difficulty').optional().isInt({ min: 1, max: 5 }),
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

    const { title, description, category, difficulty, difficulty_level } = req.body;

    const [deck] = await db('decks')
      .insert({
        user_id: req.user.id,
        title,
        description,
        category,
        difficulty_level: difficulty || difficulty_level || 1
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
  body('topic').optional().isLength({ min: 1, max: 500 }).trim(),
  body('text').optional().isLength({ min: 1, max: 10000 }).trim(),
  body('url').optional().isURL(),
  body('cardCount').isInt({ min: 1, max: 50 }),
  body('difficulty').optional().isInt({ min: 1, max: 5 }),
  body('category').optional().isLength({ max: 100 }).trim(),
  body('type').isIn(['topic', 'text', 'url'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, topic, text, url, cardCount, difficulty = 2, category, type } = req.body;

    // Determine the content based on type
    let content;
    let deckTitle;
    if (type === 'topic') {
      if (!topic) {
        return res.status(400).json({ message: 'Topic is required for topic generation' });
      }
      content = topic;
      deckTitle = title || `${topic} - AI Generated`;
    } else if (type === 'text') {
      if (!text) {
        return res.status(400).json({ message: 'Text content is required for text generation' });
      }
      content = text;
      deckTitle = title || `Text Content - AI Generated`;
    } else if (type === 'url') {
      if (!url) {
        return res.status(400).json({ message: 'URL is required for URL generation' });
      }
      content = url;
      deckTitle = title || `${url} - AI Generated`;
    } else {
      return res.status(400).json({ message: 'Invalid generation type' });
    }

    // Check user token limits - DISABLED FOR NOW
    // const dailyUsage = await db('users')
    //   .where({ id: req.user.id })
    //   .select(['tokens_used', 'daily_token_limit'])
    //   .first();

    const estimatedTokens = cardCount * 100; // Rough estimate
    // if (dailyUsage.tokens_used + estimatedTokens > dailyUsage.daily_token_limit) {
    //   return res.status(429).json({ 
    //     message: 'Daily token limit would be exceeded',
    //     tokensRequired: estimatedTokens,
    //     tokensRemaining: dailyUsage.daily_token_limit - dailyUsage.tokens_used
    //   });
    // }

    // Use a database transaction to ensure atomicity
    const trx = await db.transaction();
    
    try {
      // Create deck first
      const [deck] = await trx('decks')
        .insert({
          user_id: req.user.id,
          title: deckTitle,
          description: `AI-generated flashcards for ${type === 'topic' ? topic : type === 'text' ? 'text content' : 'web content'}`,
          category: category || 'AI Generated',
          difficulty_level: difficulty,
          ai_generated: true,
          source_prompt: content
        })
        .returning('*');

      console.log(`Starting card generation for deck ${deck.id} with ${cardCount} cards...`);
      
      // Generate cards
      const cards = await openaiService.generateFlashcards(
        content,
        cardCount,
        difficulty,
        req.user.id
      );
      
      console.log(`Generated ${cards.length} cards for deck ${deck.id}`);
      
      // Insert cards into database
      if (cards && cards.length > 0) {
        const cardsToInsert = cards.map(card => ({
          deck_id: deck.id,
          front: card.front,
          back: card.back,
          difficulty: card.difficulty || difficulty,
          is_quiz: card.is_quiz || false,
          options: card.options ? JSON.stringify(card.options) : null,
          correct_option: card.correct_option !== undefined ? card.correct_option : null
        }));
        
        await trx('cards').insert(cardsToInsert);
        console.log(`Successfully inserted ${cardsToInsert.length} cards for deck ${deck.id}`);
      } else {
        console.log(`No cards generated for deck ${deck.id}, rolling back transaction`);
        await trx.rollback();
        return res.status(500).json({ message: 'Failed to generate cards. Please try again.' });
      }
      
      // Commit transaction
      await trx.commit();
      
      res.json({
        message: 'Deck generated successfully',
        deck,
        cardsGenerated: cards.length,
        estimatedTokens
      });
    } catch (genError) {
      console.error('Deck generation error:', genError);
      // Rollback transaction on any error
      await trx.rollback();
      throw genError;
    }
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