// Test Quiz Feature - Creates quiz cards with multiple choice options
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

async function testQuizFlow() {
  console.log('🎯 Testing Quiz Feature - Multiple Choice Cards\n');
  console.log('=' .repeat(50) + '\n');

  const timestamp = Date.now();
  const testUser = {
    name: 'Quiz Test User',
    username: `quiztest${timestamp}`,
    email: `quiztest${timestamp}@test.com`,
    password: 'password123'
  };

  try {
    // 1. Register user
    console.log('1️⃣ Creating test user...');
    const registerRes = await apiCall(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: testUser
    });
    const { token, user } = registerRes;
    console.log(`   ✅ User created: ${user.username}`);
    
    // 2. Create a quiz deck
    console.log('\n2️⃣ Creating quiz deck...');
    const deckRes = await apiCall(`${API_BASE}/decks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: 'JavaScript Quiz',
        description: 'Test your JavaScript knowledge with multiple choice questions',
        category: 'Programming',
        difficulty_level: 2
      }
    });
    const deck = deckRes.deck;
    console.log(`   ✅ Quiz deck created: "${deck.title}"`);
    console.log(`   ✅ Deck ID: ${deck.id}`);
    
    // 3. Add quiz cards with multiple choice
    console.log('\n3️⃣ Creating quiz cards with multiple choice options...');
    const quizCards = [
      {
        front: 'What is the output of: console.log(typeof null)?',
        back: 'In JavaScript, typeof null returns "object" due to a historical bug that was kept for backward compatibility.',
        is_quiz: true,
        options: ['"null"', '"undefined"', '"object"', '"number"'],
        correct_option: 2,
        difficulty: 2
      },
      {
        front: 'Which method creates a new array with all elements that pass a test?',
        back: 'The filter() method creates a new array with all elements that pass the test implemented by the provided function.',
        is_quiz: true,
        options: ['.map()', '.filter()', '.reduce()', '.forEach()'],
        correct_option: 1,
        difficulty: 2
      },
      {
        front: 'What does the "===" operator do in JavaScript?',
        back: 'The === operator checks for strict equality, meaning both value and type must be the same.',
        is_quiz: true,
        options: [
          'Assigns a value',
          'Checks value equality only',
          'Checks value and type equality',
          'Performs type coercion'
        ],
        correct_option: 2,
        difficulty: 1
      },
      {
        front: 'Which of these is NOT a JavaScript data type?',
        back: 'Float is not a JavaScript data type. JavaScript has only one number type that represents both integers and floating-point numbers.',
        is_quiz: true,
        options: ['String', 'Boolean', 'Float', 'Symbol'],
        correct_option: 2,
        difficulty: 2
      },
      {
        front: 'What is a closure in JavaScript?',
        back: 'A closure is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned.',
        is_quiz: true,
        options: [
          'A function that has access to outer scope variables',
          'A way to close browser windows',
          'A method to end loops',
          'A type of error handling'
        ],
        correct_option: 0,
        difficulty: 3
      }
    ];
    
    // Also add some regular flashcards for comparison
    const flashcards = [
      {
        front: 'What is hoisting in JavaScript?',
        back: 'Hoisting is JavaScript\'s default behavior of moving declarations to the top of their scope.',
        is_quiz: false,
        difficulty: 3
      },
      {
        front: 'Explain the event loop',
        back: 'The event loop is a mechanism that allows JavaScript to perform non-blocking operations by offloading operations to the system kernel whenever possible.',
        is_quiz: false,
        difficulty: 4
      }
    ];
    
    const allCards = [...quizCards, ...flashcards];
    
    const cardsRes = await apiCall(`${API_BASE}/cards/batch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        deck_id: deck.id,
        cards: allCards
      }
    });
    console.log(`   ✅ Created ${cardsRes.cards.length} cards total`);
    console.log(`   ✅ Quiz cards: ${quizCards.length}`);
    console.log(`   ✅ Flashcards: ${flashcards.length}`);
    
    // 4. Start study session
    console.log('\n4️⃣ Starting study session with mixed cards...');
    const studyRes = await apiCall(`${API_BASE}/study/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { deckId: deck.id }
    });
    const session = studyRes.session;
    const cards = studyRes.cards;
    console.log(`   ✅ Study session started`);
    console.log(`   ✅ Session ID: ${session.id}`);
    console.log(`   ✅ Total cards in session: ${cards.length}`);
    
    // Show card types
    const quizCardsInSession = cards.filter(c => c.is_quiz);
    const flashcardsInSession = cards.filter(c => !c.is_quiz);
    console.log(`   ✅ Quiz cards in session: ${quizCardsInSession.length}`);
    console.log(`   ✅ Flashcards in session: ${flashcardsInSession.length}`);
    
    // 5. Demonstrate quiz card answering
    console.log('\n5️⃣ Testing quiz card answers...');
    
    // Find a quiz card to test
    const quizCard = quizCardsInSession[0];
    if (quizCard) {
      console.log(`\n   📝 Quiz Question: "${quizCard.front}"`);
      const options = typeof quizCard.options === 'string' ? JSON.parse(quizCard.options) : quizCard.options;
      console.log('   Options:');
      options.forEach((opt, idx) => {
        const marker = idx === quizCard.correct_option ? '✅' : '  ';
        console.log(`     ${marker} ${String.fromCharCode(65 + idx)}. ${opt}`);
      });
      
      // Submit correct answer
      console.log('\n   Submitting correct answer...');
      await apiCall(`${API_BASE}/study/answer`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          sessionId: session.id,
          cardId: quizCard.id,
          selectedOption: quizCard.correct_option,
          timeSpent: 5000,
          hintsUsed: 0
        }
      });
      console.log('   ✅ Correct answer submitted and auto-evaluated');
      
      // Test wrong answer on another quiz card
      if (quizCardsInSession.length > 1) {
        const quizCard2 = quizCardsInSession[1];
        console.log(`\n   📝 Quiz Question 2: "${quizCard2.front}"`);
        const wrongOption = quizCard2.correct_option === 0 ? 1 : 0;
        
        console.log('   Submitting wrong answer...');
        await apiCall(`${API_BASE}/study/answer`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            sessionId: session.id,
            cardId: quizCard2.id,
            selectedOption: wrongOption,
            timeSpent: 3000,
            hintsUsed: 0
          }
        });
        console.log('   ✅ Wrong answer submitted and auto-evaluated');
      }
    }
    
    // 6. Test regular flashcard
    console.log('\n6️⃣ Testing regular flashcard...');
    const flashcard = flashcardsInSession[0];
    if (flashcard) {
      console.log(`   📝 Flashcard: "${flashcard.front}"`);
      console.log(`   💡 Answer: "${flashcard.back}"`);
      
      await apiCall(`${API_BASE}/study/answer`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          sessionId: session.id,
          cardId: flashcard.id,
          isCorrect: true,
          timeSpent: 4000,
          hintsUsed: 0
        }
      });
      console.log('   ✅ Flashcard answer submitted (self-evaluated)');
    }
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 QUIZ FEATURE TEST COMPLETE!\n');
    console.log('📋 Summary:');
    console.log(`   • Created ${quizCards.length} quiz cards with multiple choice`);
    console.log(`   • Created ${flashcards.length} regular flashcards`);
    console.log('   • Quiz cards auto-evaluate based on selected option');
    console.log('   • Flashcards use self-evaluation (flip & rate)');
    console.log('\n🔑 Test Credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Deck ID: ${deck.id}`);
    console.log('\n💡 UI Testing Instructions:');
    console.log('   1. Login with the above credentials');
    console.log('   2. Go to the JavaScript Quiz deck');
    console.log('   3. Click Study to see the mixed quiz/flashcard experience');
    console.log('   4. Quiz cards will show multiple choice options');
    console.log('   5. Flashcards will show the flip interface');
    console.log('\n✨ Features to Notice:');
    console.log('   • Quiz cards show A, B, C, D options');
    console.log('   • Selected options are highlighted');
    console.log('   • Correct/incorrect feedback after submission');
    console.log('   • Auto-advance after answering');
    console.log('   • Explanations shown for wrong answers');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Please ensure backend is running on port 8000');
  }
}

testQuizFlow();