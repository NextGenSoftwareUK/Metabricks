#!/usr/bin/env node

/**
 * Simple test script to verify OASIS connection
 * Run this to check if your OASIS API is accessible
 */

const https = require('https');
const http = require('http');

// Configuration - Update these values
const OASIS_CONFIG = {
  BASE_URL: 'https://localhost:5002', // Your OASIS API URL
  USE_HTTPS: true // Set to false if using HTTP
};

// Helper function to make HTTP/HTTPS requests
function makeRequest(url, options = {}) {
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

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }

    req.end();
  });
}

// Test OASIS API endpoints
async function testOASISEndpoints() {
  console.log('🧪 Testing OASIS API endpoints...\n');
  
  const endpoints = [
    { path: '/api/health', description: 'Health Check' },
    { path: '/api/avatar', description: 'Avatar List' },
    { path: '/api/auth/login', description: 'Auth Endpoint' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.description} (${endpoint.path})...`);
      
      const response = await makeRequest(`${OASIS_CONFIG.BASE_URL}${endpoint.path}`);
      
      if (response.status === 200) {
        console.log(`  ✅ ${endpoint.description}: OK (${response.status})`);
      } else if (response.status === 401) {
        console.log(`  ⚠️  ${endpoint.description}: Requires Auth (${response.status})`);
      } else if (response.status === 404) {
        console.log(`  ❌ ${endpoint.description}: Not Found (${response.status})`);
      } else {
        console.log(`  ❓ ${endpoint.description}: Status ${response.status}`);
      }
      
      // Show response data for health endpoint
      if (endpoint.path === '/api/health' && response.data) {
        console.log(`     Response: ${JSON.stringify(response.data)}`);
      }
      
    } catch (error) {
      console.log(`  ❌ ${endpoint.description}: Error - ${error.message}`);
    }
    
    console.log('');
  }
}

// Test connection with timeout
async function testConnection() {
  console.log('🔍 Testing OASIS API connection...\n');
  
  try {
    // Set a timeout for the connection test
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
    
    const connectionPromise = makeRequest(`${OASIS_CONFIG.BASE_URL}/api/health`);
    
    const response = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (response.status === 200) {
      console.log('✅ OASIS API connection successful!');
      console.log(`   URL: ${OASIS_CONFIG.BASE_URL}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      return true;
    } else {
      console.log('❌ OASIS API connection failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      return false;
    }
    
  } catch (error) {
    if (error.message === 'Connection timeout') {
      console.log('❌ OASIS API connection timeout');
      console.log('   The API is not responding within 10 seconds');
    } else {
      console.log('❌ OASIS API connection error:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check if OASIS API is running');
    console.log('   2. Verify the BASE_URL in the script');
    console.log('   3. Check firewall/network settings');
    console.log('   4. Ensure the API is accessible from this machine');
    
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 OASIS Connection Test');
  console.log('=' .repeat(40));
  console.log(`Target URL: ${OASIS_CONFIG.BASE_URL}`);
  console.log(`Protocol: ${OASIS_CONFIG.USE_HTTPS ? 'HTTPS' : 'HTTP'}`);
  console.log('=' .repeat(40));
  console.log('');
  
  // Test basic connection
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('\n' + '=' .repeat(40));
    console.log('✅ Connection successful! Testing endpoints...');
    console.log('=' .repeat(40));
    
    // Test endpoints
    await testOASISEndpoints();
    
    console.log('🎉 All tests completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run setup:oasis');
    console.log('   2. Create the site avatar');
    console.log('   3. Configure MetaBricks');
    
  } else {
    console.log('\n❌ Cannot proceed without OASIS API connection');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testConnection,
  testOASISEndpoints
};
