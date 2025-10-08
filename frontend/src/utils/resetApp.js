// Complete application reset utility
// This ensures all cached data is cleared and app uses fresh data

export const resetApplication = () => {
  console.log('🔄 Resetting application...');
  
  // Clear ALL localStorage
  localStorage.clear();
  
  // Clear ALL sessionStorage
  sessionStorage.clear();
  
  // Clear IndexedDB if exists
  if (window.indexedDB) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
      });
    }).catch(() => {
      // Ignore errors
    });
  }
  
  // Clear cookies for localhost
  document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Force reload without cache
  window.location.reload(true);
};

// Auto-reset on development if needed
if (import.meta.env.DEV) {
  // Check for invalid test data
  const authData = localStorage.getItem('auth-storage');
  if (authData && authData.includes('test05')) {
    console.warn('⚠️ Found old test data, resetting...');
    resetApplication();
  }
  
  // Check for physics-deck-id in any stored data
  const allKeys = Object.keys(localStorage);
  for (const key of allKeys) {
    const value = localStorage.getItem(key);
    if (value && value.includes('physics-deck-id')) {
      console.warn('⚠️ Found invalid deck ID, resetting...');
      resetApplication();
      break;
    }
  }
}

export default resetApplication;