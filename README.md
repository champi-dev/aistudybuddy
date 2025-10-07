# AI Study Buddy

An intelligent flashcard application that uses OpenAI to generate study materials, explanations, and hints while minimizing token usage through Redis caching and smart batching.

## Features

- 🤖 **AI-Generated Flashcards**: Create study decks from topics, text, or URLs using GPT-3.5-turbo
- 💡 **Progressive Hints**: Smart hint system with 3 levels of assistance
- 🧠 **AI Explanations**: Detailed explanations for incorrect answers
- 📊 **Study Analytics**: Track progress with AI-powered insights
- 🔄 **Smart Caching**: Redis-based caching to minimize API costs
- 🎯 **Spaced Repetition**: Algorithm-based study scheduling
- 📱 **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (persistent storage)
- Redis (caching + job queues)
- OpenAI API (GPT-3.5-turbo)
- Bull (background job processing)
- JWT authentication

### Frontend
- React + Vite
- TailwindCSS
- Zustand (state management)
- React Query (server state)
- Framer Motion (animations)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- OpenAI API key

### Environment Setup

1. **Backend Environment** (`backend/.env`):
```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://studybuddy:securepass@localhost:5432/ai_study_buddy

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Auth
JWT_SECRET=your-super-secure-jwt-secret-key
```

2. **Frontend Environment** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=AI Study Buddy
```

### Installation & Setup

1. **Install Dependencies**:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Database Setup**:
```bash
# Create database
createdb ai_study_buddy

# Run migrations
cd backend
npm run migrate
```

3. **Start Services**:
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start PostgreSQL (if not running as service)
postgres -D /usr/local/var/postgres

# Terminal 3: Start Backend
cd backend
npm run dev

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

4. **Access Application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Usage

### Creating Your First Account

1. Visit http://localhost:5173
2. Click "Sign up" and create an account
3. You'll start with 10,000 daily AI tokens

### Generating AI Flashcards

1. Click "Generate with AI" on the dashboard
2. Choose from three options:
   - **From Topic**: Enter any subject (e.g., "React Hooks", "World War II")
   - **From Text**: Paste text content to extract flashcards from
   - **From URL**: Provide a webpage URL to scrape content
3. Configure difficulty level (1-5) and number of cards (5-50)
4. Review estimated token usage
5. Click "Generate Deck"

### Studying

1. Select a deck from your dashboard
2. Click "Start Studying"
3. Read the question and think of the answer
4. Use hints if needed (up to 3 progressive hints per card)
5. Flip the card to see the answer
6. Rate your performance: Incorrect, Partial, or Correct
7. Get AI explanations for incorrect answers

### Key Features in Detail

#### Smart Token Management
- **Caching**: All AI responses cached for 7-30 days
- **Batching**: Multiple requests processed together
- **Limits**: 10,000 tokens per day per user
- **Optimization**: Aggressive prompt optimization

#### Progressive Hint System
- **Level 1**: Subtle hint
- **Level 2**: Moderate guidance  
- **Level 3**: Strong hint
- All hints cached to prevent re-generation

#### Study Analytics
- Progress tracking
- Study streaks
- Performance insights
- Time spent analysis

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Sign out

### Decks
- `GET /api/decks` - List user's decks
- `POST /api/decks` - Create new deck
- `POST /api/decks/generate` - Generate deck with AI
- `GET /api/decks/:id` - Get deck details

### Study
- `POST /api/study/start` - Start study session
- `POST /api/study/answer` - Submit answer
- `GET /api/study/hint/:cardId/:level` - Get progressive hint
- `POST /api/study/complete/:sessionId` - Complete session

### AI
- `POST /api/ai/explain` - Get explanation for wrong answer
- `POST /api/ai/hint` - Generate hint
- `GET /api/ai/usage` - Check token usage

## Development

### Project Structure
```
ai-study-buddy/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation
│   │   ├── config/          # DB, Redis, queue
│   │   └── migrations/      # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Route components
│   │   ├── hooks/           # Custom hooks
│   │   ├── stores/          # Zustand stores
│   │   └── services/        # API client
│   └── package.json
└── README.md
```

### Adding New Features

1. **Backend**: Add routes in `src/routes/`, business logic in `src/services/`
2. **Frontend**: Add components in `src/components/`, hooks in `src/hooks/`
3. **Database**: Create migrations in `src/migrations/`

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Production Deployment

### Docker Setup
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use secure JWT secret
- Configure production database
- Set up Redis cluster for scaling
- Add rate limiting and monitoring

## Cost Optimization

### Token Usage Estimates
- **Card Generation**: ~100 tokens per card
- **Hints**: ~30 tokens per hint  
- **Explanations**: ~150 tokens per explanation
- **Daily Cost**: ~$0.01 per user with GPT-3.5

### Cost Reduction Strategies
- Aggressive caching (7-30 day TTL)
- Request batching
- Prompt optimization
- Popular content pre-generation

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify database exists

2. **Redis Connection Error**:
   - Start Redis server: `redis-server`
   - Check REDIS_URL in .env

3. **OpenAI API Errors**:
   - Verify OPENAI_API_KEY is set
   - Check account has credits
   - Review rate limits

4. **Frontend Build Issues**:
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version (18+)

### Logs
- Backend logs: Console output in development
- Frontend logs: Browser console
- Database logs: PostgreSQL logs
- Redis logs: Redis server output

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - see LICENSE file for details

---

Built with ❤️ for effective learning through AI-powered flashcards.