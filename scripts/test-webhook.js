#!/usr/bin/env node

/**
 * VideoAsk Webhook Testing Script
 * Usage: node scripts/test-webhook.js [production|local]
 */

const https = require('https');
const http = require('http');

const environments = {
  production: {
    host: 'ghac-survey-production.up.railway.app',
    path: '/api/webhooks/videoask/test',
    protocol: 'https'
  },
  local: {
    host: 'localhost',
    port: 4001,
    path: '/api/webhooks/videoask/test',
    protocol: 'http'
  }
};

const env = process.argv[2] || 'production';
const config = environments[env];

if (!config) {
  console.error('Invalid environment. Use: production or local');
  process.exit(1);
}

// Test payload mimicking VideoAsk webhook
const testPayload = {
  event_type: 'form_response',
  event_id: `test-${Date.now()}`,
  interaction_id: `interaction-${Date.now()}`,
  form: {
    form_id: 'test-form-id',
    share_id: 'fcb71j5f2' // Testing with b7 (personal story)
  },
  contact: {
    contact_id: 'test-contact',
    answers: [
      {
        media_url: 'https://cdn.videoask.com/test/sample-video.mp4',
        media_type: 'video',
        transcript: 'This is a test video response transcript.',
        duration: 30
      }
    ]
  }
};

const data = JSON.stringify(testPayload);

const options = {
  hostname: config.host,
  port: config.port,
  path: config.path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'X-Test-Webhook': 'true'
  }
};

console.log(`\n🚀 Testing VideoAsk webhook on ${env} environment...`);
console.log(`URL: ${config.protocol}://${config.host}${config.port ? ':' + config.port : ''}${config.path}`);
console.log(`\nPayload:`, JSON.stringify(testPayload, null, 2));

const protocol = config.protocol === 'https' ? https : http;

const req = protocol.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`\n✅ Response Status: ${res.statusCode}`);
    console.log('Response Headers:', res.headers);
    
    try {
      const jsonResponse = JSON.parse(responseData);
      console.log('Response Body:', JSON.stringify(jsonResponse, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n🎉 Webhook test successful!');
        console.log('The webhook endpoint is working correctly.');
      } else {
        console.log('\n⚠️  Unexpected status code. Check the response for details.');
      }
    } catch (e) {
      console.log('Response Body (raw):', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Error testing webhook:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('Connection refused. Is the server running?');
  }
});

// Send the request
req.write(data);
req.end();

console.log('\n⏳ Waiting for response...');