#!/usr/bin/env node

/**
 * Automatic setup script for Resend
 * Usage: node scripts/setup_resend.js
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Interface for questions
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask a question
function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

// Function to update .env file
function updateEnvFile(config) {
  const envPath = path.join(projectRoot, '.env');
  let envContent = '';

  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add variables
  const envVars = {
    RESEND_API_KEY: config.apiKey,
    FROM_EMAIL: config.fromEmail,
    APP_NAME: config.appName,
    FRONTEND_URL: config.frontendUrl,
  };

  Object.entries(envVars).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  fs.writeFileSync(envPath, `${envContent.trim()}\n`);
  console.log('✅ .env file updated successfully');
}

// Main setup function
async function setupResend() {
  console.log('🚀 Automatic Resend Configuration Setup');
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Step 1: Collect information
    console.log('📋 Step 1: Information collection\n');

    const resendApiKey = await question('🔑 Enter your Resend API key (re_...): ');
    if (!resendApiKey.startsWith('re_')) {
      console.log('❌ API key must start with "re_"');
      process.exit(1);
    }

    const fromEmail =
      (await question('📧 Sender email [onboarding@resend.dev]: ')) || 'onboarding@resend.dev';
    const appName =
      (await question('🏷️  Application name [Express Auth API]: ')) || 'Express Auth API';
    const frontendUrl =
      (await question('🌐 Frontend URL [http://localhost:3000]: ')) || 'http://localhost:3000';

    // Step 2: Update .env file
    console.log('\n📝 Step 2: Updating .env file...');

    const config = {
      apiKey: resendApiKey,
      fromEmail,
      appName,
      frontendUrl,
    };

    updateEnvFile(config);

    // Step 3: Verify configuration
    console.log('\n🔍 Step 3: Configuration verification...');

    // Create temporary test file
    const testScript = `
import dotenv from 'dotenv';
dotenv.config();

console.log('Configuration loaded:');
console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Defined' : '❌ Missing');
console.log('- FROM_EMAIL:', process.env.FROM_EMAIL || '❌ Missing');
console.log('- APP_NAME:', process.env.APP_NAME || '❌ Missing');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Missing');
`;

    const tempTestFile = path.join(projectRoot, 'temp_test.js');
    fs.writeFileSync(tempTestFile, testScript);

    // Execute test
    const { exec } = await import('child_process');
    exec(`node ${tempTestFile}`, (error, stdout, _stderr) => {
      if (error) {
        console.log('❌ Test error:', error.message);
      } else {
        console.log(stdout);
      }

      // Clean up temporary file
      fs.unlinkSync(tempTestFile);

      // Step 4: Final instructions
      console.log('\n🎯 Step 4: Next steps');
      console.log('='.repeat(40));
      console.log('1. 🌐 Configure your domain in Resend (optional):');
      console.log('   - Go to https://resend.com/domains');
      console.log('   - Add your custom domain');
      console.log('   - Configure DNS records (SPF, DKIM)');
      console.log('   - Verify the domain');
      console.log('');
      console.log('2. 🧪 Test the configuration:');
      console.log('   npm run dev');
      console.log('   node scripts/test_email_config.js');
      console.log('');
      console.log('3. 📧 Test registration:');
      console.log('   curl -X POST http://localhost:5000/api/auth/register \\');
      console.log('     -H "Content-Type: application/json" \\');
      console.log(
        '     -d \'{"username":"test","email":"test@example.com","password":"Test123!"}\'',
      );
      console.log('');
      console.log('✅ Resend configuration completed successfully!');

      rl.close();
    });
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Function to check prerequisites
function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');

  // Check that we are in the correct directory
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found. Make sure you are in the project directory.');
    return false;
  }

  // Check that email service exists
  const emailServicePath = path.join(projectRoot, 'services', 'email_service.js');
  if (!fs.existsSync(emailServicePath)) {
    console.log('❌ Email service not found. Is the email verification implementation complete?');
    return false;
  }

  console.log('✅ Prerequisites verified\n');
  return true;
}

// Main entry point
async function main() {
  console.log('🔧 Resend Configuration Assistant');
  console.log('📧 Email Verification Setup');
  console.log(`${'='.repeat(60)}\n`);

  if (!checkPrerequisites()) {
    process.exit(1);
  }

  const proceed = await question('Do you want to continue with the configuration? (y/N): ');
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    console.log('Configuration cancelled.');
    rl.close();
    return;
  }

  await setupResend();
}

// Execute script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    rl.close();
    process.exit(1);
  });
}
