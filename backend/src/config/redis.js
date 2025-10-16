const Redis = require('ioredis');

let redis = null;
let redisAvailable = false;

// Only connect to Redis if REDIS_URL is provided
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
    reconnectOnError: () => false
  });

  redis.on('connect', () => {
    console.log('✅ Connected to Redis');
    redisAvailable = true;
  });

  redis.on('error', (err) => {
    console.warn('⚠️  Redis not available, running without cache:', err.message);
    redisAvailable = false;
  });

  // Try to connect
  redis.connect().catch((err) => {
    console.warn('⚠️  Redis connection failed, continuing without cache');
    redisAvailable = false;
  });
} else {
  console.log('ℹ️  No REDIS_URL provided, running without cache');
}

// Helper to check if Redis is available
const isRedisAvailable = () => redisAvailable;

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

module.exports = { redis, redisKeys, isRedisAvailable };