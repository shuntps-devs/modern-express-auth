#!/usr/bin/env node

/**
 * Test script for Resend email configuration
 * Usage: node scripts/test_email_config.js
 */

import dotenv from 'dotenv';
import { emailService } from '../services/index.js';
import { logger } from '../config/index.js';

// Load environment variables
dotenv.config();

const TEST_EMAIL = 'test@example.com'; // Replace with your test email
const TEST_USERNAME = 'TestUser';

async function testEmailConfiguration() {
  console.log('🚀 Testing Resend email configuration\n');

  try {
    // Test 1: Configuration validation
    console.log('📋 Test 1: Validating configuration...');
    const configValid = await emailService.testConfiguration();

    if (configValid) {
      console.log('✅ Configuration is valid\n');
    } else {
      console.log('❌ Configuration is invalid\n');
      return;
    }

    // Test 2: Email verification sending test
    console.log('📧 Test 2: Sending verification email...');
    const verificationToken = `test-token-${Date.now()}`;

    try {
      const result = await emailService.sendEmailVerification(
        TEST_EMAIL,
        TEST_USERNAME,
        verificationToken,
      );

      if (result.success) {
        console.log('✅ Verification email sent successfully');
        console.log(`📨 Message ID: ${result.messageId}`);
        console.log(`📧 Sent to: ${TEST_EMAIL}\n`);
      } else {
        console.log('❌ Failed to send verification email\n');
      }
    } catch (error) {
      console.log(`❌ Error sending email: ${error.message}\n`);
    }

    // Test 3: Welcome email sending test
    console.log('🎉 Test 3: Sending welcome email...');

    try {
      const welcomeResult = await emailService.sendWelcomeEmail(TEST_EMAIL, TEST_USERNAME);

      if (welcomeResult.success) {
        console.log('✅ Welcome email sent successfully');
        console.log(`📨 Message ID: ${welcomeResult.messageId}`);
        console.log(`📧 Sent to: ${TEST_EMAIL}\n`);
      } else {
        console.log('❌ Failed to send welcome email\n');
      }
    } catch (error) {
      console.log(`❌ Error sending email: ${error.message}\n`);
    }

    // Summary
    console.log('📊 Test Summary:');
    console.log('- Configuration: ✅ Valid');
    console.log('- Verification email: Check your inbox');
    console.log('- Welcome email: Check your inbox');
    console.log('\n💡 Check your emails (including spam) to confirm delivery.');
  } catch (error) {
    console.error('❌ General error:', error.message);
    logger.error('Test email configuration failed', { error: error.message });
  }
}

// Function to test environment variables configuration
function checkEnvironmentVariables() {
  console.log('🔧 Checking environment variables...\n');

  const requiredVars = ['RESEND_API_KEY', 'FROM_EMAIL', 'APP_NAME', 'FRONTEND_URL'];

  let allValid = true;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(
        `✅ ${varName}: ${varName === 'RESEND_API_KEY' ? `***${value.slice(-4)}` : value}`,
      );
    } else {
      console.log(`❌ ${varName}: Not defined`);
      allValid = false;
    }
  });

  console.log('');

  if (!allValid) {
    console.log('❌ Some environment variables are missing.');
    console.log('📝 Check your .env file and add the missing variables.\n');
    return false;
  }

  console.log('✅ All environment variables are defined.\n');
  return true;
}

// Main function
async function main() {
  console.log('🔍 Testing Resend Email Configuration');
  console.log(`${'='.repeat(60)}\n`);

  // Check environment variables
  const envValid = checkEnvironmentVariables();

  if (!envValid) {
    console.log('🛑 Stopping test due to missing variables.');
    process.exit(1);
  }

  // Test email configuration
  await testEmailConfiguration();

  console.log(`\n${'='.repeat(60)}`);
  console.log('🏁 Test completed. Check your emails to confirm delivery.');
}

// Execute script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}
