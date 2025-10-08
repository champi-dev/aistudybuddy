// Complete Flow Test - Backend & Frontend
const API_BASE = 'http://localhost:8000/api';

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
    console.error(`API Error (${response.status}):`, data.message || data);
    throw new Error(data.message || 'API Error');
  }
  
  return data;
}

async function testCompleteFlow() {
  console.log('🚀 Testing Complete Flow - Backend & Frontend\n');
  console.log('=' .repeat(50) + '\n');

  const timestamp = Date.now();
  const testUser = {
    name: 'Complete Test User',
    username: `completetest${timestamp}`,
    email: `completetest${timestamp}@test.com`,
    password: 'password123'
  };

  try {
    // 1. Register new user
    console.log('1️⃣ BACKEND TEST: User Registration');
    const registerRes = await apiCall(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: testUser
    });
    const { token, user } = registerRes;
    console.log(`   ✅ User created: ${user.username}`);
    console.log(`   ✅ Token received: ${token.substring(0, 50)}...`);
    
    // 2. Test authentication
    console.log('\n2️⃣ BACKEND TEST: Authentication Check');
    const decksCheck = await apiCall(`${API_BASE}/decks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   ✅ Auth working - Can fetch decks (found ${decksCheck.length})`);
    
    // 3. Create a deck
    console.log('\n3️⃣ BACKEND TEST: Deck Creation');
    const deckRes = await apiCall(`${API_BASE}/decks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: 'Complete Test Deck',
        description: 'Full flow testing deck',
        category: 'Testing',
        difficulty_level: 2
      }
    });
    const deck = deckRes.deck;
    console.log(`   ✅ Deck created: "${deck.title}"`);
    console.log(`   ✅ Deck ID: ${deck.id}`);
    
    // 4. Add cards to deck
    console.log('\n4️⃣ BACKEND TEST: Card Creation');
    const cardsRes = await apiCall(`${API_BASE}/cards/batch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        deck_id: deck.id,
        cards: [
          { front: 'What is JavaScript?', back: 'A programming language for the web', difficulty: 1 },
          { front: 'What is React?', back: 'A JavaScript library for building UIs', difficulty: 2 },
          { front: 'What is Node.js?', back: 'JavaScript runtime built on V8', difficulty: 2 },
          { front: 'What is Express?', back: 'Web framework for Node.js', difficulty: 3 },
          { front: 'What is MongoDB?', back: 'NoSQL database', difficulty: 3 }
        ]
      }
    });
    console.log(`   ✅ Created ${cardsRes.cards.length} cards`);
    
    // 5. Get deck details
    console.log('\n5️⃣ BACKEND TEST: Fetch Deck Details');
    const deckDetails = await apiCall(`${API_BASE}/decks/${deck.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   ✅ Deck has ${deckDetails.cards.length} cards`);
    
    // 6. Start study session
    console.log('\n6️⃣ BACKEND TEST: Study Session');
    const studyRes = await apiCall(`${API_BASE}/study/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { deckId: deck.id }
    });
    const session = studyRes.session;
    const cards = studyRes.cards;
    console.log(`   ✅ Study session started`);
    console.log(`   ✅ Session ID: ${session.id}`);
    console.log(`   ✅ Cards loaded: ${cards.length}`);
    console.log(`   ✅ First card: "${cards[0].front}"`);
    
    // 7. Submit answers
    console.log('\n7️⃣ BACKEND TEST: Answer Submission');
    for (let i = 0; i < Math.min(3, cards.length); i++) {
      const answerRes = await apiCall(`${API_BASE}/study/answer`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          sessionId: session.id,
          cardId: cards[i].id,
          isCorrect: i % 2 === 0, // Alternate correct/incorrect
          timeSpent: 3000 + (i * 1000),
          hintsUsed: i === 1 ? 1 : 0
        }
      });
      console.log(`   ✅ Answer ${i + 1} submitted (${i % 2 === 0 ? 'correct' : 'incorrect'})`);
    }
    
    // 8. Get analytics
    console.log('\n8️⃣ BACKEND TEST: Analytics');
    const analyticsRes = await apiCall(`${API_BASE}/analytics/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const stats = analyticsRes.totalStats;
    console.log(`   ✅ Total sessions: ${stats.totalSessions}`);
    console.log(`   ✅ Cards studied: ${stats.totalCardsStudied}`);
    console.log(`   ✅ Average accuracy: ${stats.averageAccuracy}%`);
    
    // 9. Test deck list
    console.log('\n9️⃣ BACKEND TEST: Deck List');
    const decksRes = await apiCall(`${API_BASE}/decks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   ✅ User has ${decksRes.length} deck(s)`);
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 ALL BACKEND TESTS PASSED!\n');
    console.log('📝 Test User Credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Deck ID: ${deck.id}`);
    console.log('\n💡 Frontend Test Instructions:');
    console.log('   1. Login with the above credentials');
    console.log('   2. You should see 1 deck with 5 cards');
    console.log('   3. Click "Study" to test the study session');
    console.log('   4. Dark mode toggle should work in Settings');
    console.log('   5. Analytics should show your study progress');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Please check that both backend and frontend are running');
  }
}

testCompleteFlow();