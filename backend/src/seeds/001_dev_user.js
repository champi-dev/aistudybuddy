exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('cards').del()
  await knex('decks').del()
  await knex('users').del()
  
  // Insert development users (plain password for dev only)
  const users = await knex('users').insert([
    {
      id: 'd5fd63c3-0b35-4df9-947a-95205b68c8a8',
      username: 'test01',
      email: 'test01@example.com', 
      password_hash: 'password123',
      tokens_used: 0,
      daily_token_limit: 10000
    },
    {
      id: '8b3f2d1e-9c4a-5b6e-7f8d-0123456789ab',
      username: 'test02',
      email: 'test02@example.com',
      password_hash: 'password123', 
      tokens_used: 0,
      daily_token_limit: 10000
    }
  ]).returning('*')
  
  const [user1, user2] = users
  
  console.log('Created dev users with IDs:', user1.id, user2.id)
  
  // Create sample decks for user1 (test01)
  const [deck1, deck2] = await knex('decks').insert([
    {
      title: 'JavaScript Fundamentals',
      description: 'Basic JavaScript concepts and syntax',
      category: 'Programming',
      user_id: user1.id,
      difficulty_level: 1,
      ai_generated: false
    },
    {
      title: 'React Hooks',
      description: 'Understanding React Hooks and their usage',
      category: 'Programming',
      user_id: user1.id,
      difficulty_level: 2,
      ai_generated: false
    }
  ]).returning('*')
  
  // Create different sample decks for user2 (test02)
  const [deck3, deck4] = await knex('decks').insert([
    {
      title: 'Python Basics',
      description: 'Introduction to Python programming',
      category: 'Programming',
      user_id: user2.id,
      difficulty_level: 1,
      ai_generated: false
    },
    {
      title: 'Node.js Fundamentals',
      description: 'Server-side JavaScript with Node.js',
      category: 'Programming',
      user_id: user2.id,
      difficulty_level: 2,
      ai_generated: false
    }
  ]).returning('*')
  
  // Create sample cards for JavaScript deck
  await knex('cards').insert([
    {
      deck_id: deck1.id,
      front: 'What is a variable in JavaScript?',
      back: 'A variable is a container for storing data values. Variables in JavaScript can be declared using var, let, or const.',
      difficulty: 1
    },
    {
      deck_id: deck1.id,
      front: 'What is the difference between let and const?',
      back: 'let allows you to reassign values, while const creates a constant reference that cannot be reassigned. Both are block-scoped.',
      difficulty: 2
    },
    {
      deck_id: deck1.id,
      front: 'What is a function in JavaScript?',
      back: 'A function is a reusable block of code designed to perform a particular task. Functions are defined with the function keyword or as arrow functions.',
      difficulty: 2
    }
  ])
  
  // Create sample cards for React deck (user1)
  await knex('cards').insert([
    {
      deck_id: deck2.id,
      front: 'What is useState hook?',
      back: 'useState is a React Hook that lets you add state to functional components. It returns an array with the current state value and a setter function.',
      difficulty: 2
    },
    {
      deck_id: deck2.id,
      front: 'What is useEffect hook?',
      back: 'useEffect is a React Hook that lets you perform side effects in functional components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount.',
      difficulty: 3
    }
  ])
  
  // Create sample cards for Python deck (user2)
  await knex('cards').insert([
    {
      deck_id: deck3.id,
      front: 'What is a list in Python?',
      back: 'A list is a mutable sequence type in Python that can store multiple items. Lists are created using square brackets and can contain different data types.',
      difficulty: 1
    },
    {
      deck_id: deck3.id,
      front: 'What is the difference between a list and a tuple in Python?',
      back: 'Lists are mutable (can be changed after creation) and use square brackets, while tuples are immutable (cannot be changed) and use parentheses.',
      difficulty: 2
    }
  ])
  
  // Create sample cards for Node.js deck (user2)
  await knex('cards').insert([
    {
      deck_id: deck4.id,
      front: 'What is Node.js?',
      back: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine that allows you to run JavaScript on the server side.',
      difficulty: 1
    },
    {
      deck_id: deck4.id,
      front: 'What is npm?',
      back: 'npm (Node Package Manager) is the default package manager for Node.js that allows you to install, share, and manage dependencies for your Node.js projects.',
      difficulty: 2
    }
  ])
  
  console.log('Created sample decks and cards for both users')
}