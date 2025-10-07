const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAuth } = require('../middleware/auth');
const openaiService = require('../services/openai');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);
router.use(requireAuth);

// Get user's token usage
router.get('/usage', async (req, res) => {
  try {
    const usage = await openaiService.getTokenUsage(req.user.id);
    res.json({ usage });
  } catch (error) {
    console.error('Get token usage error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Generate explanation for incorrect answer
router.post('/explain', [
  body('cardId').isUUID(),
  body('front').isLength({ min: 1, max: 1000 }).trim(),
  body('back').isLength({ min: 1, max: 1000 }).trim(),
  body('userAnswer').optional().isLength({ max: 1000 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { cardId, front, back, userAnswer } = req.body;

    const explanation = await openaiService.generateExplanation(
      cardId, 
      front, 
      back, 
      userAnswer, 
      req.user.id
    );

    res.json({ 
      explanation,
      cardId
    });
  } catch (error) {
    console.error('Generate explanation error:', error);
    
    if (error.message.includes('token limit')) {
      return res.status(429).json({ 
        message: error.message,
        type: 'TOKEN_LIMIT_EXCEEDED'
      });
    }
    
    res.status(500).json({ message: 'Failed to generate explanation' });
  }
});

// Generate progressive hint
router.post('/hint', [
  body('cardId').isUUID(),
  body('level').isInt({ min: 1, max: 3 }),
  body('front').isLength({ min: 1, max: 1000 }).trim(),
  body('back').isLength({ min: 1, max: 1000 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { cardId, level, front, back } = req.body;

    const hint = await openaiService.generateHint(
      cardId, 
      level, 
      front, 
      back, 
      req.user.id
    );

    res.json({ 
      hint,
      level,
      cardId
    });
  } catch (error) {
    console.error('Generate hint error:', error);
    
    if (error.message.includes('token limit')) {
      return res.status(429).json({ 
        message: error.message,
        type: 'TOKEN_LIMIT_EXCEEDED'
      });
    }
    
    res.status(500).json({ message: 'Failed to generate hint' });
  }
});

// Generate quiz from topic
router.post('/generate-quiz', [
  body('topic').isLength({ min: 1, max: 500 }).trim(),
  body('questionCount').isInt({ min: 1, max: 20 }),
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

    const { topic, questionCount, difficulty = 3 } = req.body;

    // Estimate tokens
    const estimatedTokens = questionCount * 60;
    const tokenCheck = await openaiService.checkTokenLimit(req.user.id, estimatedTokens);

    const cards = await openaiService.generateFlashcards(
      topic, 
      questionCount, 
      difficulty, 
      req.user.id
    );

    res.json({ 
      quiz: cards,
      topic,
      tokensUsed: estimatedTokens,
      remainingTokens: tokenCheck.dailyLimit - tokenCheck.currentUsage - estimatedTokens
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    
    if (error.message.includes('token limit')) {
      return res.status(429).json({ 
        message: error.message,
        type: 'TOKEN_LIMIT_EXCEEDED'
      });
    }
    
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
});

// Improve card quality
router.post('/improve-card', [
  body('front').isLength({ min: 1, max: 1000 }).trim(),
  body('back').isLength({ min: 1, max: 1000 }).trim(),
  body('improvementType').isIn(['clarity', 'difficulty', 'accuracy'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { front, back, improvementType } = req.body;

    const improvements = {
      clarity: 'Make this flashcard clearer and easier to understand',
      difficulty: 'Adjust the difficulty level to be more appropriate',
      accuracy: 'Improve the accuracy and correctness of the information'
    };

    const prompt = `${improvements[improvementType]} for this flashcard:

Question: "${front}"
Answer: "${back}"

Return improved version as JSON:
{
  "front": "improved question",
  "back": "improved answer",
  "changes": "brief description of what was improved"
}`;

    const response = await openaiService.getOrGenerateResponse(
      prompt, 
      'improveCard', 
      { 
        maxTokens: 300, 
        temperature: 0.7,
        jsonMode: true,
        cacheTTL: 3600 // 1 hour cache for improvements
      }, 
      req.user.id
    );

    const improvement = JSON.parse(response.content);

    res.json({ 
      improved: improvement,
      original: { front, back },
      improvementType
    });
  } catch (error) {
    console.error('Improve card error:', error);
    
    if (error.message.includes('token limit')) {
      return res.status(429).json({ 
        message: error.message,
        type: 'TOKEN_LIMIT_EXCEEDED'
      });
    }
    
    res.status(500).json({ message: 'Failed to improve card' });
  }
});

module.exports = router;