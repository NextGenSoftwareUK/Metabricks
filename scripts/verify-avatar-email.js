#!/usr/bin/env node

/**
 * Script to manually verify an avatar's email using a verification token
 * Usage: node verify-avatar-email.js <verification_token>
 */

const https = require('https');
const http = require('http');

// Configuration
const OASIS_CONFIG = {
  BASE_URL: 'https://localhost:5002',
  USE_HTTPS: true
};

// Helper function to make HTTP/HTTPS requests
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    // For HTTPS, ignore self-signed certificate errors
    if (isHttps) {
      requestOptions.rejectUnauthorized = false;
    }

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Verify email with token
async function verifyEmail(token) {
  console.log('📧 Verifying email with token...');
  console.log('   Token:', token.substring(0, 20) + '...');
  
  try {
    const verifyData = {
      token: token
    };
    
    const response = await makeRequest(`${OASIS_CONFIG.BASE_URL}/api/Avatar/verify-email`, {
      method: 'POST'
    }, verifyData);
    
    if (response.status === 200) {
      console.log('✅ Email verification successful!');
      console.log('   Response:', response.data);
      return true;
    } else {
      console.log('❌ Email verification failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying email:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ Usage: node verify-avatar-email.js <verification_token>');
    console.log('   Example: node verify-avatar-email.js ABC123DEF456...');
    process.exit(1);
  }
  
  console.log('🔐 Avatar Email Verification');
  console.log('=' .repeat(40));
  
  const success = await verifyEmail(token);
  
  if (success) {
    console.log('\n🎉 Email verification completed successfully!');
    console.log('   The avatar can now authenticate.');
  } else {
    console.log('\n💥 Email verification failed!');
    console.log('   Check the token and try again.');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Verification failed:', error.message);
    process.exit(1);
  });
}

module.exports = { verifyEmail };
