/**
 * Test script for OpenAI integration
 * Run with: node test-openai.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// You need to replace this with a real JWT token from login
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE';

async function testDeepAnalysis() {
  console.log('🧪 Testing Deep Sentiment Analysis with AI...\n');

  try {
    const response = await axios.post(
      `${API_URL}/analysis/deep`,
      {
        text: 'This product is absolutely terrible! I hate it so much. Worst purchase ever.',
        saveToDatabase: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    console.log('✅ Deep Analysis Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testCSVColumnDetection() {
  console.log('\n🧪 Testing CSV Upload with AI Column Detection...\n');

  const FormData = require('form-data');
  const fs = require('fs');

  // Create a test CSV file
  const csvContent = `user_comment,rating,timestamp
"This is amazing! Love it!",5,2024-01-01
"Terrible experience, very disappointed",1,2024-01-02
"It's okay, nothing special",3,2024-01-03`;

  fs.writeFileSync('./test.csv', csvContent);

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream('./test.csv'));
    form.append('saveToDatabase', 'false');

    const response = await axios.post(
      `${API_URL}/analysis/csv`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    console.log('✅ CSV Analysis Response:');
    console.log(JSON.stringify(response.data, null, 2));

    // Cleanup
    fs.unlinkSync('./test.csv');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    // Cleanup on error
    if (fs.existsSync('./test.csv')) {
      fs.unlinkSync('./test.csv');
    }
  }
}

// Instructions
console.log('📝 INSTRUCTIONS:');
console.log('1. Login to get a JWT token');
console.log('2. Replace TEST_TOKEN in this file with your token');
console.log('3. Run: node test-openai.js\n');

console.log('💡 To get a token, use this curl command:');
console.log(`curl -X POST ${API_URL}/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"your@email.com\\",\\"password\\":\\"yourpassword\\"}"\n`);

// Uncomment to run tests (after setting token)
// testDeepAnalysis();
// testCSVColumnDetection();
