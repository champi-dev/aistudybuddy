#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Run this before deploying to ensure all required environment variables are set
 */

const requiredVars = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
];

const optionalVars = [
  'FRONTEND_URL',
  'OPENAI_MODEL',
  'OPENAI_MAX_TOKENS_PER_REQUEST',
  'OPENAI_TEMPERATURE',
  'JWT_EXPIRE',
  'BCRYPT_ROUNDS',
  'RATE_LIMIT_WINDOW',
  'RATE_LIMIT_MAX',
  'DAILY_TOKEN_LIMIT',
  'MAX_TOKENS_PER_REQUEST',
];

let hasErrors = false;
let hasWarnings = false;

console.log('🔍 Validating environment variables...\n');

// Check required variables
console.log('Required Variables:');
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`  ❌ ${varName} - MISSING`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    let value = process.env[varName];
    if (varName.includes('SECRET') || varName.includes('KEY')) {
      value = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    } else if (varName.includes('URL')) {
      // Show domain only
      try {
        const url = new URL(value);
        value = `${url.protocol}//${url.host}/...`;
      } catch (e) {
        value = 'Invalid URL format';
      }
    }
    console.log(`  ✅ ${varName} - ${value}`);
  }
});

// Check optional variables
console.log('\nOptional Variables:');
optionalVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`  ⚠️  ${varName} - Not set (using default)`);
    hasWarnings = true;
  } else {
    console.log(`  ✅ ${varName} - ${process.env[varName]}`);
  }
});

// Validate JWT_SECRET strength
if (process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET.length < 32) {
    console.log('\n⚠️  WARNING: JWT_SECRET should be at least 32 characters long');
    hasWarnings = true;
  }
  if (process.env.JWT_SECRET.includes('change') || process.env.JWT_SECRET.includes('example')) {
    console.log('\n❌ ERROR: JWT_SECRET appears to be a placeholder value');
    hasErrors = true;
  }
}

// Validate OPENAI_API_KEY format
if (process.env.OPENAI_API_KEY) {
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('\n⚠️  WARNING: OPENAI_API_KEY should start with "sk-"');
    hasWarnings = true;
  }
}

// Validate NODE_ENV
if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
  console.log('\n⚠️  WARNING: NODE_ENV should be one of: development, production, test');
  hasWarnings = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Validation failed! Please set all required environment variables.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Validation passed with warnings. Please review optional variables.');
  process.exit(0);
} else {
  console.log('✅ All environment variables are properly configured!');
  process.exit(0);
}
