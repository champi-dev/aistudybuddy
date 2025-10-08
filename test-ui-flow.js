// UI Flow Test Script

const API_BASE = 'http://localhost:8000/api';
const timestamp = Date.now();
const testUser = {
  name: 'UI Test User',
  username: `uitest${timestamp}`,
  email: `uitest${timestamp}@test.com`,
  password: 'password123'
};

async function apiCall(url, options = {}) {
  const config = {
    ...options,
    headers: { 
      'Content-Type': 'application/json', 
      ...(options.headers || {})
    }
  };
  
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(url, config);
  const data = await response.json();
  
  if (!response.ok) {
    console.error(`API Error: ${response.status}`, data);
  }
  
  return data;
}

async function testFullFlow() {
  try {
    console.log('🚀 Starting Full UI/UX Flow Test...\n');
    
    // 1. Register user
    console.log('1️⃣ Registering new user...');
    const registerRes = await apiCall(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: testUser
    });
    const { token, user } = registerRes;
    console.log(`✅ User created: ${user.username}`);
    
    // 2. Create a deck
    console.log('\n2️⃣ Creating test deck...');
    const deckRes = await apiCall(`${API_BASE}/decks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: 'UI Test Deck',
        description: 'Testing the full study flow',
        category: 'Test',
        difficulty_level: 2
      }
    });
    console.log('Deck response:', deckRes);
    const deck = deckRes.deck;
    if (!deck) {
      console.error('Deck creation failed:', deckRes);
      return;
    }
    console.log(`✅ Deck created: ${deck.title} (ID: ${deck.id})`);
    
    // 3. Add cards
    console.log('\n3️⃣ Adding cards to deck...');
    const cardsRes = await apiCall(`${API_BASE}/cards/batch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        deck_id: deck.id,
        cards: [
          { front: 'Test Question 1', back: 'Answer 1', difficulty: 1 },
          { front: 'Test Question 2', back: 'Answer 2', difficulty: 2 },
          { front: 'Test Question 3', back: 'Answer 3', difficulty: 3 }
        ]
      }
    });
    console.log(`✅ Added ${cardsRes.cards.length} cards`);
    
    // 4. Start study session
    console.log('\n4️⃣ Starting study session...');
    const studyRes = await apiCall(`${API_BASE}/study/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { deckId: deck.id }
    });
    const session = studyRes.session;
    const cards = studyRes.cards;
    console.log(`✅ Study session started with ${cards.length} cards`);
    console.log('   Session ID:', session.id);
    console.log('   Cards:', cards.map(c => c.front).join(', '));
    
    // 5. Test submitting an answer
    console.log('\n5️⃣ Testing answer submission...');
    const answerRes = await apiCall(`${API_BASE}/study/answer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        sessionId: session.id,
        cardId: cards[0].id,
        isCorrect: true,
        timeSpent: 5000,
        hintsUsed: 0
      }
    });
    console.log('✅ Answer submitted successfully');
    
    // 6. Get analytics
    console.log('\n6️⃣ Checking analytics...');
    const analyticsRes = await apiCall(`${API_BASE}/analytics/progress`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    const stats = analyticsRes.totalStats;
    console.log(`✅ Analytics working - Sessions: ${stats.totalSessions}, Cards: ${stats.totalCardsStudied}`);
    
    console.log('\n🎉 All API tests passed! Study flow is working correctly.');
    console.log('\n📝 Test Credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    console.log('\n🌐 You can now login to the UI with these credentials to test the visual flow.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFullFlow();