const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Redis key patterns
const redisKeys = {
  session: (userId) => `session:${userId}`,
  aiResponse: (hash) => `ai:response:${hash}`,
  hints: (cardId, level) => `hints:card:${cardId}:level:${level}`,
  explanation: (cardId) => `explanation:card:${cardId}`,
  aiQueue: 'queue:ai:pending',
  tokenUsage: (userId) => `tokens:user:${userId}:daily`,
  popularTopics: 'topics:popular',
  deckGeneration: (topicHash) => `deck:gen:${topicHash}`
};

module.exports = { redis, redisKeys };