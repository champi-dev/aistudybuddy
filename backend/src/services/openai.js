const OpenAI = require('openai');
const crypto = require('crypto');
const db = require('../config/database');
const { redis, redisKeys, isRedisAvailable } = require('../config/redis');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokensPerRequest = parseInt(process.env.OPENAI_MAX_TOKENS_PER_REQUEST) || 1000;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
    // Qwen3 (local Ollama) emits a <think>...</think> reasoning block that
    // wastes tokens and pollutes content, so we disable and strip it.
    this.isReasoningModel = /qwen3/i.test(this.model);
  }

  stripThinking(text) {
    return (text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  // Generate cache key for request
  generateCacheKey(prompt, type, options = {}) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ prompt, type, options }))
      .digest('hex');
    return `${type}:${hash}`;
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

    // Generate new response
    const response = await this.generateResponse(prompt, options);
    const actualTokens = response.usage?.total_tokens || 0;

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
            content: (options.systemPrompt || 'You are a helpful AI assistant that creates educational content. Be concise and accurate.')
              + (this.isReasoningModel ? '\n\n/no_think' : '')
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

      console.log(`[OpenAI] Success! Tokens used: ${completion.usage?.total_tokens ?? 'n/a'}`);
      return {
        content: this.stripThinking(completion.choices[0].message.content),
        usage: completion.usage
      };
    } catch (error) {
      console.error('[OpenAI] API error:', {
        status: error.status,
        code: error.code,
        message: error.message,
        type: error.type
      });
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  // Pull a JSON array out of a model response, tolerating markdown fences and
  // (for the last object) a response truncated mid-object by hitting max_tokens.
  extractJsonArray(rawContent) {
    let text = rawContent.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    }

    const start = text.indexOf('[');
    if (start === -1) throw new Error('No JSON array found in response');
    text = text.slice(start);

    if (text.trim().endsWith(']')) {
      return JSON.parse(text);
    }

    // Truncated mid-object: drop back to the last complete object and close
    // the array there rather than discarding the whole batch.
    const lastComplete = text.lastIndexOf('}');
    if (lastComplete === -1) throw new Error('Response truncated before any complete card');
    return JSON.parse(`${text.slice(0, lastComplete + 1)}]`);
  }

  // Coerce a raw card from the model into the shape the app expects. Small
  // local models regularly send "difficulty": "easy" instead of a number, or
  // put the answer text (not its index) in correct_option — normalize both
  // instead of silently shipping broken cards to the client.
  normalizeCard(card, fallbackDifficulty) {
    if (!card || typeof card !== 'object') return null;

    // Under prompt pressure (e.g. a long "don't repeat these" list) a small
    // local model sometimes drifts to a different but still-valid schema —
    // "question"/"answer" instead of "front"/"back"/"correct_option". Accept
    // the common aliases instead of discarding otherwise-good cards.
    const front = card.front ?? card.question ?? card.prompt;
    let back = card.back ?? card.explanation ?? card.rationale;
    if (typeof front !== 'string' || !front.trim()) return null;

    const options = Array.isArray(card.options) ? card.options.map(String).slice(0, 4) : [];
    if (options.length !== 4) return null;
    // A small model asked for one card at a time sometimes pads with
    // duplicate options (e.g. only 2 distinct choices repeated) — reject
    // rather than ship an unanswerable quiz card.
    const distinctOptions = new Set(options.map((o) => o.toLowerCase().trim()));
    if (distinctOptions.size !== 4) return null;

    let correctIndex = card.correct_option;
    if (correctIndex === undefined) {
      // Some responses only give the answer text (e.g. "answer": "Ribosome")
      // rather than an index into options.
      const answerText = card.answer ?? card.correct_answer ?? card.correctOption;
      if (typeof answerText === 'string') {
        correctIndex = options.findIndex((o) => o.toLowerCase().trim() === answerText.toLowerCase().trim());
        if (!back && correctIndex !== -1) back = `The correct answer is ${answerText}.`;
      }
    }
    if (typeof correctIndex === 'string') {
      const asNumber = Number(correctIndex);
      correctIndex = Number.isInteger(asNumber)
        ? asNumber
        : options.findIndex((o) => o.toLowerCase().trim() === correctIndex.toLowerCase().trim());
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) return null;
    if (typeof back !== 'string' || !back.trim()) return null;

    const difficultyWords = { easy: 1, beginner: 1, medium: 3, intermediate: 3, hard: 5, expert: 5 };
    let difficultyNum = card.difficulty;
    if (typeof difficultyNum === 'string') {
      difficultyNum = difficultyWords[difficultyNum.toLowerCase().trim()] ?? Number(difficultyNum);
    }
    if (!Number.isFinite(difficultyNum) || difficultyNum < 1 || difficultyNum > 5) {
      difficultyNum = fallbackDifficulty;
    }

    // A small model asked for one card at a time reliably puts the correct
    // answer first (ignoring the "mix up position" instruction), which would
    // make every quiz card gameable. Shuffle server-side instead of trusting
    // the model's positioning.
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const shuffledOptions = order.map((i) => options[i]);
    const shuffledCorrectIndex = order.indexOf(correctIndex);

    return {
      front: front.trim().slice(0, 200),
      back: back.trim().slice(0, 200),
      difficulty: Math.round(difficultyNum),
      is_quiz: true,
      options: shuffledOptions,
      correct_option: shuffledCorrectIndex
    };
  }

  // Generate flashcards from topic. Small local models truncate long JSON
  // arrays well before reaching the requested count, so we request cards in
  // small batches and keep batching (deduped by question text) until we
  // actually have `count` valid cards — instead of silently returning fewer
  // cards or (previously) a hardcoded set of unrelated placeholder questions.
  async generateFlashcards(topic, count, difficulty, userId, metadata = {}) {
    const additionalContext = metadata.description ? `\n\nAdditional Context: ${metadata.description}` : '';
    const deckTitle = metadata.title ? `\nDeck Title: ${metadata.title}` : '';

    const BATCH_SIZE = 5;
    const TOKENS_PER_CARD = 260; // generous: observed ~150-290 tokens/card from small local models
    // Worst case the adaptive size shrinks to 2, so budget attempts against
    // that floor rather than the ideal batch size. DEADLINE_MS is the real
    // backstop; this just prevents an unbounded loop if calls return fast.
    const MAX_BATCH_ATTEMPTS = Math.ceil(count / 1) * 3 + 3;
    // Stay well under the frontend's 300s request timeout / nginx's 310s proxy
    // timeout, so a bad run returns a partial-but-honest set instead of being
    // killed mid-flight and losing every card already generated.
    const DEADLINE_MS = 260_000;
    const startedAt = Date.now();

    const buildPrompt = (batchCount, avoid) => `Create exactly ${batchCount} multiple choice quiz questions for the topic "${topic}" at difficulty level ${difficulty}/5.${deckTitle}${additionalContext}
${avoid.length ? `\nDo not repeat these already-used questions: ${avoid.slice(-6).join(' | ')}\n` : ''}
You must return ONLY a JSON array (starting with [ and ending with ]) containing quiz question objects. Do not include any explanatory text, markdown formatting, or other content.

Each quiz question object must have exactly these fields:
- "front": The question (max 200 chars)
- "back": Brief explanation of why the correct answer is correct (max 200 chars)
- "difficulty": A number from 1-5 (NOT a word like "easy")
- "is_quiz": true (boolean)
- "options": Array of exactly 4 answer choices (each max 100 chars)
- "correct_option": The numeric index (0-3) of the correct answer in the options array — NOT the answer text

IMPORTANT:
- Each question must have exactly 4 options
- Only ONE option should be correct
- The other 3 options should be plausible but incorrect
- Mix up the position of the correct answer (don't always make it the same index)
- Keep "back" concise — a short sentence, not a paragraph

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
Count: ${batchCount}
Difficulty: ${difficulty}`;

    const systemPrompt = 'You are a quiz question generator specializing in multiple choice questions. You must return only valid JSON arrays containing quiz objects with is_quiz:true, options array, and a numeric correct_option index. Never include explanatory text or markdown formatting. The response must start with [ and end with ]. Each question must have exactly 4 options with only one correct answer. difficulty must be a number, never a word.';

    const cards = [];
    const seenFronts = new Set();
    let batchAttempts = 0;
    // Shrinks after a batch fails outright (3/3 attempts add nothing) and
    // grows back after a success — a small local model is far more reliable
    // asked for 2-3 cards than 5, so retreat instead of hammering the same
    // ask size into the ground.
    let adaptiveBatchSize = BATCH_SIZE;

    while (cards.length < count && batchAttempts < MAX_BATCH_ATTEMPTS && Date.now() - startedAt < DEADLINE_MS) {
      const remaining = count - cards.length;
      const batchCount = Math.min(adaptiveBatchSize, remaining);
      let batchSucceeded = false;

      // Retry a single batch up to 3 times before moving on / giving up.
      for (let attempt = 1; attempt <= 3 && cards.length < count; attempt++) {
        batchAttempts++;
        try {
          console.log(`Batch attempt ${batchAttempts} (need ${batchCount} more, have ${cards.length}/${count}) for topic: ${topic}`);

          const prompt = buildPrompt(batchCount, Array.from(seenFronts));
          const options = {
            maxTokens: batchCount * TOKENS_PER_CARD + 100,
            temperature: 0.7 + Math.min(attempt - 1, 2) * 0.1, // nudge sampling on retries to break repetition/truncation
            jsonMode: false,
            cacheTTL: 2592000, // safe to cache: the [batch:attempt] suffix below makes every call's key unique
            systemPrompt
          };

          // Cache key must be unique per call, or a stalled batch (one that
          // fails to add any cards) replays the same cached failure forever:
          // `cards.length` stops changing once a batch adds nothing, so it
          // can't be part of the uniqueness key. `batchAttempts` always
          // increments, once per call, so it's safe.
          const response = await this.getOrGenerateResponse(
            `${prompt}\n\n[batch:${batchAttempts}]`,
            'generateCards',
            options,
            userId
          );

          const rawCards = this.extractJsonArray(response.content);
          if (!Array.isArray(rawCards) || rawCards.length === 0) {
            throw new Error('Response contained no cards');
          }

          let addedThisAttempt = 0;
          for (const raw of rawCards) {
            const card = this.normalizeCard(raw, difficulty);
            if (!card) continue;
            const key = card.front.toLowerCase().trim();
            if (seenFronts.has(key)) continue;
            seenFronts.add(key);
            cards.push(card);
            addedThisAttempt++;
            if (cards.length >= count) break;
          }

          console.log(`Batch attempt ${batchAttempts}: added ${addedThisAttempt} valid cards (${cards.length}/${count} total)`);
          if (addedThisAttempt > 0) {
            batchSucceeded = true;
            break; // batch succeeded, move to the next one
          }

          throw new Error('No valid cards survived normalization');
        } catch (error) {
          console.error(`Batch attempt ${batchAttempts} failed:`, error.message);
          if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      if (batchSucceeded) {
        adaptiveBatchSize = Math.min(BATCH_SIZE, adaptiveBatchSize + 1);
      } else {
        adaptiveBatchSize = Math.max(1, adaptiveBatchSize - 1);
      }
    }

    if (cards.length === 0) {
      throw new Error(`Failed to generate any flashcards for "${topic}" after ${batchAttempts} attempts. The AI model may be unavailable — please try again.`);
    }

    // Don't discard real, valid cards just because we fell short of the
    // exact requested count after generous retries — the caller reports the
    // actual count generated, so the user sees an honest number rather than
    // losing everything or getting padded with unrelated placeholder cards.
    if (cards.length < count) {
      console.warn(`Only generated ${cards.length}/${count} flashcards for "${topic}" after ${batchAttempts} batch attempts — returning the partial set.`);
    }

    return cards;
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

}

module.exports = new OpenAIService();