const OpenAI = require('openai');
const crypto = require('crypto');
const db = require('../config/database');
const { redis, redisKeys, isRedisAvailable } = require('../config/redis');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokensPerRequest = parseInt(process.env.OPENAI_MAX_TOKENS_PER_REQUEST) || 1000;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
  }

  // Generate cache key for request
  generateCacheKey(prompt, type, options = {}) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ prompt, type, options }))
      .digest('hex');
    return `${type}:${hash}`;
  }

  // Check and update user token usage
  async checkTokenLimit(userId, estimatedTokens) {
    const user = await db('users')
      .where({ id: userId })
      .select(['tokens_used', 'daily_token_limit'])
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Check daily token usage from Redis if available
    let dailyUsage = 0;
    if (isRedisAvailable() && redis) {
      try {
        dailyUsage = await redis.get(redisKeys.tokenUsage(userId)) || 0;
      } catch (error) {
        console.warn('Redis unavailable for limit check:', error.message);
      }
    }
    const currentUsage = parseInt(dailyUsage);

    // Token limit check disabled
    // if (currentUsage + estimatedTokens > user.daily_token_limit) {
    //   throw new Error(`Daily token limit exceeded. Used: ${currentUsage}, Limit: ${user.daily_token_limit}, Required: ${estimatedTokens}`);
    // }

    return { currentUsage, dailyLimit: user.daily_token_limit };
  }

  // Update token usage
  async updateTokenUsage(userId, tokensUsed) {
    // Update Redis (daily counter with 24h TTL) if available
    if (isRedisAvailable() && redis) {
      try {
        const dailyKey = redisKeys.tokenUsage(userId);
        const currentUsage = await redis.get(dailyKey) || 0;
        const newUsage = parseInt(currentUsage) + tokensUsed;
        await redis.setex(dailyKey, 86400, newUsage); // 24 hours TTL
      } catch (error) {
        console.warn('Redis unavailable for token tracking:', error.message);
      }
    }

    // Update database (persistent record)
    await db('users')
      .where({ id: userId })
      .increment('tokens_used', tokensUsed);

    return tokensUsed;
  }

  // Get or generate AI response with caching
  async getOrGenerateResponse(prompt, type, options = {}, userId = null) {
    const cacheKey = this.generateCacheKey(prompt, type, options);

    // Check cache first (only if Redis is available)
    if (isRedisAvailable() && redis) {
      try {
        const cached = await redis.get(redisKeys.aiResponse(cacheKey));
        if (cached) {
          const response = JSON.parse(cached);
          console.log(`Cache hit for ${type}:`, cacheKey);
          return response;
        }
      } catch (error) {
        console.warn('Cache read error:', error);
      }
    }

    // Estimate tokens for the request
    const estimatedTokens = Math.min(
      Math.ceil(prompt.length / 4) + (options.maxTokens || 200),
      this.maxTokensPerRequest
    );

    // Check token limits if userId provided - DISABLED
    // if (userId) {
    //   await this.checkTokenLimit(userId, estimatedTokens);
    // }

    // Generate new response
    const response = await this.generateResponse(prompt, options);
    
    // Update token usage
    const actualTokens = response.usage?.total_tokens || estimatedTokens;
    if (userId) {
      await this.updateTokenUsage(userId, actualTokens);
    }

    // Cache the response
    const cacheData = {
      content: response.content,
      tokens: actualTokens,
      timestamp: new Date().toISOString()
    };

    // Only cache if Redis is available
    if (isRedisAvailable() && redis) {
      try {
        const ttl = options.cacheTTL || 604800; // 7 days default
        await redis.setex(redisKeys.aiResponse(cacheKey), ttl, JSON.stringify(cacheData));

        // Also store in database for longer-term caching
        await db('ai_cache').insert({
          cache_key: cacheKey,
          request_type: type,
          request_hash: crypto.createHash('md5').update(prompt).digest('hex'),
          response: JSON.stringify(cacheData),
          tokens_used: actualTokens,
          expires_at: new Date(Date.now() + ttl * 1000)
        }).onConflict('cache_key').merge();
      } catch (error) {
        console.warn('Cache write error:', error);
      }
    }

    return cacheData;
  }

  // Generate response from OpenAI
  async generateResponse(prompt, options = {}) {
    try {
      console.log(`[OpenAI] Sending request to model: ${this.model}`);
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || 'You are a helpful AI assistant that creates educational content. Be concise and accurate.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || Math.min(500, this.maxTokensPerRequest),
        temperature: options.temperature || this.temperature,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined
      });

      console.log(`[OpenAI] Success! Tokens used: ${completion.usage.total_tokens}`);
      return {
        content: completion.choices[0].message.content,
        usage: completion.usage
      };
    } catch (error) {
      console.error('[OpenAI] API error:', {
        status: error.status,
        code: error.code,
        message: error.message,
        type: error.type
      });
      // Return fallback response if API fails
      if (error.status === 401 || error.status === 503) {
        console.warn('[OpenAI] Using fallback questions due to API error');
        return {
          content: this.generateFallbackQuizzes(options.fallbackTopic || 'general', options.fallbackCount || 5),
          usage: { total_tokens: 100 }
        };
      }
      throw new Error(`AI service error: ${error.message}`);
    }
  }
  
  // Generate fallback quiz questions when API fails
  generateFallbackQuizzes(topic, count) {
    const fallbackQuizzes = {
      general: [
        {
          front: "What is 2 + 2?",
          back: "The sum of 2 and 2 equals 4.",
          difficulty: 1,
          is_quiz: true,
          options: ["3", "4", "5", "6"],
          correct_option: 1
        },
        {
          front: "What is the capital of France?",
          back: "Paris has been the capital of France since medieval times.",
          difficulty: 2,
          is_quiz: true,
          options: ["London", "Berlin", "Paris", "Madrid"],
          correct_option: 2
        },
        {
          front: "Which planet is closest to the Sun?",
          back: "Mercury is the innermost planet in our solar system.",
          difficulty: 2,
          is_quiz: true,
          options: ["Venus", "Mercury", "Earth", "Mars"],
          correct_option: 1
        },
        {
          front: "What year did World War II end?",
          back: "World War II ended in 1945 with the surrender of Japan.",
          difficulty: 3,
          is_quiz: true,
          options: ["1943", "1944", "1945", "1946"],
          correct_option: 2
        },
        {
          front: "What is the largest ocean on Earth?",
          back: "The Pacific Ocean covers about 63 million square miles.",
          difficulty: 2,
          is_quiz: true,
          options: ["Atlantic", "Pacific", "Indian", "Arctic"],
          correct_option: 1
        }
      ]
    };
    
    return JSON.stringify(fallbackQuizzes.general.slice(0, count));
  }

  // Generate flashcards from topic
  async generateFlashcards(topic, count, difficulty, userId, metadata = {}) {
    const additionalContext = metadata.description ? `\n\nAdditional Context: ${metadata.description}` : '';
    const deckTitle = metadata.title ? `\nDeck Title: ${metadata.title}` : '';

    const prompt = `Create exactly ${count} multiple choice quiz questions for the topic "${topic}" at difficulty level ${difficulty}/5.${deckTitle}${additionalContext}

You must return ONLY a JSON array (starting with [ and ending with ]) containing quiz question objects. Do not include any explanatory text, markdown formatting, or other content.

Each quiz question object must have exactly these fields:
- "front": The question (max 200 chars)
- "back": Brief explanation of why the correct answer is correct (max 200 chars)
- "difficulty": Number from 1-5
- "is_quiz": true (boolean)
- "options": Array of exactly 4 answer choices (each max 100 chars)
- "correct_option": The index (0-3) of the correct answer in the options array

IMPORTANT: 
- Each question must have exactly 4 options
- Only ONE option should be correct
- The other 3 options should be plausible but incorrect
- Mix up the position of the correct answer (don't always make it the same index)

Example response:
[
  {
    "front": "What is the capital of France?",
    "back": "Paris has been France's capital since 987 AD and is its largest city.",
    "difficulty": 2,
    "is_quiz": true,
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correct_option": 2
  }
]

Topic: ${topic}
Count: ${count}
Difficulty: ${difficulty}`;

    const options = {
      maxTokens: Math.min(count * 250, 16000), // Increased token limit to support up to 50 cards
      temperature: 0.7,
      jsonMode: false,
      cacheTTL: 2592000,
      systemPrompt: 'You are a quiz question generator specializing in multiple choice questions. You must return only valid JSON arrays containing quiz objects with is_quiz:true, options array, and correct_option index. Never include explanatory text or markdown formatting. The response must start with [ and end with ]. Each question must have exactly 4 options with only one correct answer.',
      fallbackTopic: topic,
      fallbackCount: count
    };

    // Try up to 3 times to get a valid response
    for (let attempt = 1; attempt <= 3; attempt++) {
      let response = null;
      try {
        console.log(`Attempt ${attempt} to generate flashcards for topic: ${topic}`);
        
        response = await this.getOrGenerateResponse(prompt, 'generateCards', options, userId);
        
        console.log('Raw OpenAI response:', response.content);
        
        // Check if response is truncated by looking for incomplete JSON
        const content = response.content.trim();
        if (!content.endsWith(']') && !content.endsWith('}]')) {
          console.warn(`Attempt ${attempt}: Response appears truncated, retrying...`);
          if (attempt < 3) continue;
        }
        
        // Try to clean up the response if it has markdown formatting
        let jsonString = content;
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.slice(7);
        }
        if (jsonString.endsWith('```')) {
          jsonString = jsonString.slice(0, -3);
        }
        jsonString = jsonString.trim();
        
        // Try to fix incomplete JSON by finding the last complete object
        if (!jsonString.endsWith(']')) {
          console.log('Attempting to fix incomplete JSON...');
          const lastCompleteObjectIndex = jsonString.lastIndexOf('}');
          if (lastCompleteObjectIndex !== -1) {
            jsonString = jsonString.substring(0, lastCompleteObjectIndex + 1) + ']';
            console.log('Fixed JSON:', jsonString);
          }
        }
        
        console.log('Cleaned JSON string:', jsonString);
        
        const cards = JSON.parse(jsonString);
        if (!Array.isArray(cards)) {
          console.error('Parsed data is not an array:', cards);
          throw new Error('Response is not an array');
        }
        
        if (cards.length === 0) {
          throw new Error('No cards generated');
        }
        
        // Ensure all cards are quiz format and valid
        const quizCards = cards
          .filter(card => card.front && card.back) // Filter out incomplete cards
          .map(card => ({
            ...card,
            is_quiz: true,
            options: card.options || [],
            correct_option: card.correct_option !== undefined ? card.correct_option : 0
          }));
        
        if (quizCards.length === 0) {
          throw new Error('No valid cards generated');
        }
        
        console.log(`Successfully generated ${quizCards.length} flashcards`);
        return quizCards.slice(0, count);
        
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        console.error('Raw response was:', response?.content || 'No response');
        
        if (attempt === 3) {
          console.log('All attempts failed, using fallback questions');
          // Return fallback questions if all attempts fail
          const fallbackCards = JSON.parse(this.generateFallbackQuizzes(topic, count));
          return fallbackCards.slice(0, count);
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Generate progressive hint
  async generateHint(cardId, level, front, back, userId) {
    const hintDescriptions = {
      1: 'very subtle hint that doesn\'t give away the answer',
      2: 'moderate hint that provides some guidance',
      3: 'strong hint that makes the answer more obvious'
    };

    const prompt = `For this flashcard question: "${front}"
Answer: "${back}"

Provide a level ${level} hint (${hintDescriptions[level]}).

Return ONLY the hint text, maximum 100 characters.`;

    const options = {
      maxTokens: 50,
      temperature: 0.6,
      cacheTTL: 2592000 // 30 days
    };

    const response = await this.getOrGenerateResponse(
      prompt, 
      `hint_${level}`, 
      options, 
      userId
    );

    return response.content.trim();
  }

  // Generate explanation for incorrect answer
  async generateExplanation(cardId, front, back, userAnswer, userId) {
    const prompt = `Question: "${front}"
Correct answer: "${back}"
User's answer: "${userAnswer || 'No answer provided'}"

Explain why the correct answer is right and what the user might have missed. Be encouraging and educational.

Maximum 300 characters.`;

    const options = {
      maxTokens: 100,
      temperature: 0.5,
      cacheTTL: 604800 // 7 days
    };

    const response = await this.getOrGenerateResponse(
      prompt, 
      'explanation', 
      options, 
      userId
    );

    return response.content.trim();
  }

  // Get user's token usage stats
  async getTokenUsage(userId) {
    const user = await db('users')
      .where({ id: userId })
      .select(['tokens_used', 'daily_token_limit', 'created_at'])
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Get today's usage from Redis if available, otherwise use 0
    let todayUsage = 0;
    if (isRedisAvailable() && redis) {
      try {
        todayUsage = await redis.get(redisKeys.tokenUsage(userId)) || 0;
      } catch (error) {
        console.warn('Redis unavailable for token usage, using default:', error.message);
        todayUsage = 0;
      }
    }

    return {
      totalTokensUsed: user.tokens_used,
      todayTokensUsed: parseInt(todayUsage),
      dailyLimit: user.daily_token_limit,
      remainingToday: user.daily_token_limit - parseInt(todayUsage),
      memberSince: user.created_at
    };
  }
}

module.exports = new OpenAIService();