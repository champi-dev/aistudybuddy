// Script to clear localStorage and set proper auth data
// Run this in the browser console to reset authentication

// Clear all localStorage
localStorage.clear();

// Set correct auth data for newuser
const authData = {
  state: {
    user: {
      id: '88e53ecd-ed3b-4577-9e38-61f1efa7ba57',
      username: 'newuser',
      email: 'newuser@test.com',
      tokensUsed: 532,
      dailyTokenLimit: 10000
    },
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg4ZTUzZWNkLWVkM2ItNDU3Ny05ZTM4LTYxZjFlZmE3YmE1NyIsImVtYWlsIjoibmV3dXNlckB0ZXN0LmNvbSIsImlhdCI6MTc1OTg4Nzg4MywiZXhwIjoxNzYwNDkyNjgzfQ.1LPn1YyNNOxtqCVKE9D5MSPikfi4TLVPxaOEerea2LI',
    isLoading: false
  },
  version: 0
};

// Set the auth storage
localStorage.setItem('auth-storage', JSON.stringify(authData));

// Reload the page
location.reload();

console.log('Cache cleared and auth data reset to newuser');