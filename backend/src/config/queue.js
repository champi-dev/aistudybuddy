const Queue = require('bull');
const { redis } = require('./redis');

// Create queue for AI processing
const aiQueue = new Queue('AI processing', {
  redis: {
    port: redis.options.port,
    host: redis.options.host,
    password: redis.options.password
  }
});

// Batch processor for OpenAI requests
class BatchProcessor {
  constructor() {
    this.queue = [];
    this.timer = null;
    this.processing = false;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...request, resolve, reject });
      
      if (!this.timer && !this.processing) {
        this.timer = setTimeout(() => this.process(), 1000);
      }
    });
  }

  async process() {
    if (this.queue.length === 0 || this.processing) return;
    
    this.processing = true;
    this.timer = null;
    
    const batch = this.queue.splice(0, 10); // Process up to 10 requests at once
    
    try {
      await this.processBatch(batch);
    } catch (error) {
      console.error('Batch processing error:', error);
      batch.forEach(item => item.reject(error));
    }
    
    this.processing = false;
    
    // Process remaining items if any
    if (this.queue.length > 0) {
      setTimeout(() => this.process(), 100);
    }
  }

  async processBatch(batch) {
    console.log(`Processing batch of ${batch.length} AI requests`);
    
    try {
      const openaiService = require('../services/openai');
      const db = require('../config/database');
      
      for (const item of batch) {
        try {
          if (item.type === 'generateCards') {
            const cards = await openaiService.generateFlashcards(
              item.topic,
              item.count,
              item.difficulty,
              item.userId
            );
            
            // Insert cards into database
            if (item.deckId && cards.length > 0) {
              const cardsToInsert = cards.map(card => ({
                deck_id: item.deckId,
                front: card.front,
                back: card.back,
                difficulty: card.difficulty || item.difficulty
              }));
              
              console.log(`Inserting ${cardsToInsert.length} cards for deck ${item.deckId}:`, cardsToInsert);
              await db('cards').insert(cardsToInsert);
              console.log(`Successfully inserted ${cardsToInsert.length} cards`);
            } else {
              console.log(`Skipping card insertion: deckId=${item.deckId}, cards.length=${cards.length}`);
            }
            
            item.resolve({ cards, message: 'Cards generated successfully' });
          } else {
            item.resolve({ message: 'Processed', type: item.type });
          }
        } catch (error) {
          console.error(`Error processing item ${item.id}:`, error);
          item.reject(error);
        }
      }
    } catch (error) {
      console.error('Batch processing error:', error);
      batch.forEach(item => item.reject(error));
    }
  }

  combinePrompts(batch) {
    return batch.map((item, index) => 
      `${index + 1}. ${item.prompt}`
    ).join('\n\n');
  }

  distributeResponses(response, batch) {
    // Parse and distribute AI responses back to original requests
    const responses = response.split('\n\n');
    batch.forEach((item, index) => {
      if (responses[index]) {
        item.resolve({ content: responses[index], tokens: 50 });
      } else {
        item.reject(new Error('No response for request'));
      }
    });
  }
}

const batchProcessor = new BatchProcessor();

// Queue processors
aiQueue.process('generateCards', async (job) => {
  const { deckId, userId, topic, count, difficulty } = job.data;
  console.log(`Generating ${count} cards for topic: ${topic} (deckId: ${deckId})`);
  
  // Process card generation
  return batchProcessor.add({
    type: 'generateCards',
    deckId,
    userId,
    topic,
    count,
    difficulty,
    id: job.id
  });
});

aiQueue.process('generateHint', async (job) => {
  const { cardId, level, front, back } = job.data;
  console.log(`Generating hint level ${level} for card: ${cardId}`);
  
  return batchProcessor.add({
    type: 'generateHint',
    cardId,
    level,
    front,
    back,
    id: job.id
  });
});

aiQueue.process('generateExplanation', async (job) => {
  const { cardId, front, back, userAnswer } = job.data;
  console.log(`Generating explanation for card: ${cardId}`);
  
  return batchProcessor.add({
    type: 'generateExplanation',
    cardId,
    front,
    back,
    userAnswer,
    id: job.id
  });
});

// Queue event handlers
aiQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

aiQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

module.exports = { aiQueue, batchProcessor };