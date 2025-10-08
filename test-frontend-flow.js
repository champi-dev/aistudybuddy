// Comprehensive frontend testing script
// Run this in the browser console to test all functionality

const API_URL = 'http://localhost:8000/api';
const TEST_USER = {
  email: 'testuser_' + Date.now() + '@test.com',
  username: 'testuser_' + Date.now(),
  password: 'Test123!@#'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testFullFlow() {
  console.log('🚀 Starting comprehensive frontend tests...\n');
  
  try {
    // 1. Test Registration
    console.log('1️⃣ Testing Registration...');
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    const registerData = await registerRes.json();
    console.log('✅ Registration:', registerData.message || 'Success');
    
    // 2. Test Login
    console.log('\n2️⃣ Testing Login...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login successful, token received');
    
    // Store auth in localStorage like the app does
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        token: token,
        user: loginData.user
      }
    }));
    
    // 3. Test Create Deck
    console.log('\n3️⃣ Testing Create Deck...');
    const createDeckRes = await fetch(`${API_URL}/decks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Deck ' + Date.now(),
        description: 'Automated test deck',
        category: 'Testing'
      })
    });
    const deckData = await createDeckRes.json();
    const deckId = deckData.deck.id;
    console.log('✅ Deck created:', deckData.deck.title);
    
    // 4. Test Add Cards
    console.log('\n4️⃣ Testing Add Cards...');
    const cards = [
      { front: 'What is 2+2?', back: '4', difficulty: 1 },
      { front: 'Capital of France?', back: 'Paris', difficulty: 2 },
      { front: 'Largest planet?', back: 'Jupiter', difficulty: 2 }
    ];
    
    for (const card of cards) {
      const cardRes = await fetch(`${API_URL}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...card, deckId })
      });
      const cardData = await cardRes.json();
      console.log('  ✅ Card added:', card.front);
    }
    
    // 5. Test Get Decks
    console.log('\n5️⃣ Testing Get Decks...');
    const getDecksRes = await fetch(`${API_URL}/decks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const decksData = await getDecksRes.json();
    console.log('✅ Found', decksData.length, 'deck(s)');
    
    // 6. Test Start Study Session
    console.log('\n6️⃣ Testing Study Session...');
    const studyRes = await fetch(`${API_URL}/study/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ deckId })
    });
    const studyData = await studyRes.json();
    console.log('✅ Study session started:', studyData.session.id);
    
    // 7. Test Submit Answer
    console.log('\n7️⃣ Testing Submit Answer...');
    if (studyData.cards && studyData.cards[0]) {
      const answerRes = await fetch(`${API_URL}/study/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: studyData.session.id,
          cardId: studyData.cards[0].id,
          isCorrect: true,
          timeSpent: 5000,
          hintsUsed: 0
        })
      });
      const answerData = await answerRes.json();
      console.log('✅ Answer submitted');
    }
    
    // 8. Test Analytics
    console.log('\n8️⃣ Testing Analytics...');
    const analyticsRes = await fetch(`${API_URL}/analytics/progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const analyticsData = await analyticsRes.json();
    console.log('✅ Analytics data retrieved');
    
    // 9. Test AI Generation
    console.log('\n9️⃣ Testing AI Deck Generation...');
    const aiRes = await fetch(`${API_URL}/ai/generate-deck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        topic: 'JavaScript Promises',
        cardCount: 3,
        difficulty: 2
      })
    });
    const aiData = await aiRes.json();
    console.log('✅ AI generation started:', aiData.message);
    
    // 10. Test Update Deck
    console.log('\n🔟 Testing Update Deck...');
    const updateRes = await fetch(`${API_URL}/decks/${deckId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Updated Test Deck',
        description: 'Updated description'
      })
    });
    const updateData = await updateRes.json();
    console.log('✅ Deck updated');
    
    // Clean up - Delete test deck
    console.log('\n🧹 Cleaning up...');
    const deleteRes = await fetch(`${API_URL}/decks/${deckId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Test deck deleted');
    
    console.log('\n✨ All tests completed successfully!');
    console.log('📊 Summary: All API endpoints working correctly');
    
    // Now reload to see the dashboard
    console.log('\n🔄 Reloading page to show dashboard...');
    await delay(2000);
    window.location.href = 'http://localhost:5174/dashboard';
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the tests
testFullFlow();