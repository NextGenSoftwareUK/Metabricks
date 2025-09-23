# Heroku HTTP Blocking Error Report - MetaBricks NFT Minting

## 🚨 **Critical Issue Summary**
**Problem**: Heroku platform blocks outbound HTTP requests, preventing authentication with the OASIS API which only supports HTTP (no HTTPS available).

**Impact**: NFT minting functionality completely broken on Heroku deployment.

---

## 📋 **System Overview**

### **Application Stack**
- **Frontend**: Angular 15 (deployed on Netlify)
- **Backend**: Node.js/Express (deployed on Heroku)
- **External API**: OASIS API at `http://oasisweb4.one` (HTTP-only)
- **Blockchain**: Solana/Arbitrum NFT minting via OASIS API

### **Current Deployment Status**
- ✅ Frontend: Working perfectly on Netlify
- ✅ Backend: Deployed and running on Heroku
- ❌ **NFT Minting**: Broken due to HTTP blocking

---

## 🔍 **Detailed Investigation Results**

### **Root Cause Analysis**
Heroku's security policies block outbound HTTP requests, but the OASIS API only supports HTTP (no HTTPS available).

### **Evidence Collected**

#### 1. **HTTP Connectivity Test from Heroku**
```bash
# Test endpoint: /test-http-connectivity
curl https://metabricks-backend-api-66e7d2abb038.herokuapp.com/test-http-connectivity
```

**Result**: 
```json
{
  "success": false,
  "message": "HTTP connectivity test failed",
  "error": "stream has been aborted",
  "errorCode": "ERR_BAD_RESPONSE",
  "tests": {
    "httpbin": {
      "success": false,
      "error": "stream has been aborted"
    },
    "oasis": {
      "success": false,
      "error": "stream has been aborted"
    }
  }
}
```

#### 2. **OASIS API Accessibility Tests**
```bash
# HTTP version (works locally, fails on Heroku)
curl -X POST http://oasisweb4.one/api/avatar/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"metabricks_admin","password":"Uppermall1!"}'

# HTTPS version (doesn't exist)
curl -X POST https://oasisweb4.one/api/avatar/authenticate
# Result: Connection refused
```

#### 3. **Alternative OASIS API Endpoints**
- `https://staging-api.oasisplatform.world` → Redirects to parking page
- `https://api.oasisplatform.world` → Redirects to parking page
- `http://44.202.138.7:8080` → Connection timeout

---

## 🛠️ **Technical Details**

### **Current Backend Configuration**
```javascript
// OASIS API Configuration
const OASIS_API_URL = process.env.OASIS_API_URL || 'http://oasisweb4.one';
const SITE_AVATAR_USERNAME = process.env.SITE_AVATAR_USERNAME || 'metabricks_admin';
const SITE_AVATAR_PASSWORD = process.env.SITE_AVATAR_PASSWORD || 'Uppermall1!';
const SITE_AVATAR_ID = '89d907a8-5859-4171-b6c5-621bfe96930d';
```

### **Authentication Flow**
1. Backend attempts to authenticate with OASIS API
2. Heroku blocks the HTTP request
3. Authentication fails with "stream has been aborted" error
4. NFT minting cannot proceed

### **Error Messages**
```
❌ OASIS authentication failed: stream has been aborted
❌ Axios authentication failed, trying curl fallback...
❌ All authentication methods failed
❌ NFT minting failed: Unable to authenticate with OASIS API - production deployment requires valid authentication
```

---

## 🎯 **NFT Minting Requirements**

### **OASIS API Request Format**
```javascript
const oasisRequest = {
  Title: mintData.brickName || `MetaBrick #${mintData.brickId}`,
  Description: `MetaBrick NFT: ${mintData.brickName}`,
  Symbol: 'MBRICK',
  OnChainProvider: { value: 3, name: 'SolanaOASIS' },
  OffChainProvider: { value: 23, name: 'MongoDBOASIS' },
  NFTOffChainMetaType: { value: 3, name: 'ExternalJsonURL' },
  NFTStandardType: { value: 2, name: 'SPL' },
  JSONMetaDataURL: metadataUrl,
  ImageUrl: 'https://gateway.pinata.cloud/ipfs/...',
  ThumbnailUrl: 'https://gateway.pinata.cloud/ipfs/...',
  Price: 0.02,
  NumberToMint: 1,
  StoreNFTMetaDataOnChain: false,
  MintedByAvatarId: SITE_AVATAR_ID,
  SendToAddressAfterMinting: mintData.walletAddress,
  WaitTillNFTSent: true,
  WaitForNFTToSendInSeconds: 60,
  AttemptToSendEveryXSeconds: 5
};
```

### **Authentication Requirements**
- **Endpoint**: `http://oasisweb4.one/api/avatar/authenticate`
- **Method**: POST
- **Body**: `{"username":"metabricks_admin","password":"Uppermall1!"}`
- **Response**: JWT token for subsequent requests

---

## 💡 **Potential Solutions**

### **Option 1: Proxy/Webhook Service**
- Deploy a separate service that can access HTTP APIs
- Heroku backend calls the proxy service
- Proxy service handles OASIS API communication

### **Option 2: Different Hosting Platform**
- Move backend to a platform that allows HTTP requests
- Options: Railway, Render, DigitalOcean, AWS EC2

### **Option 3: Queue-Based System**
- Store NFT requests in a queue
- Process requests via a separate service
- Return immediate response to users

### **Option 4: Alternative API**
- Find an HTTPS version of the OASIS API
- Currently unavailable (all tested endpoints redirect to parking pages)

---

## 🔧 **Current Workarounds Implemented**

### **Improved Error Handling**
```javascript
// In production, provide meaningful error messages
if (process.env.NODE_ENV === 'production') {
  throw new Error('Unable to connect to OASIS API. This may be due to network restrictions. Please try again later or contact support.');
}
```

### **Fallback Authentication**
- Development: Uses mock tokens for testing
- Production: Fails gracefully with user-friendly error messages

---

## 📊 **Testing Results**

### **Local Environment**
- ✅ HTTP requests work perfectly
- ✅ OASIS API authentication successful
- ✅ NFT minting functional
- ✅ End-to-end flow working

### **Heroku Environment**
- ✅ Backend deployment successful
- ✅ Health endpoint working
- ❌ HTTP requests blocked
- ❌ OASIS API authentication fails
- ❌ NFT minting broken

---

## 🎯 **Immediate Next Steps Needed**

1. **Choose a solution approach** from the options above
2. **Implement the chosen solution**
3. **Test the complete end-to-end flow**
4. **Deploy and verify functionality**

---

## 📞 **Support Information**

### **Deployment URLs**
- **Frontend**: https://metabricks.netlify.app
- **Backend**: https://metabricks-backend-api-66e7d2abb038.herokuapp.com
- **Health Check**: https://metabricks-backend-api-66e7d2abb038.herokuapp.com/health

### **Test Endpoints**
- **HTTP Connectivity Test**: https://metabricks-backend-api-66e7d2abb038.herokuapp.com/test-http-connectivity
- **NFT Minting**: https://metabricks-backend-api-66e7d2abb038.herokuapp.com/api/mint-nft

### **Repository**
- **Location**: `/Volumes/Storage/OASIS_CLEAN/meta-bricks-main`
- **Backend**: `backend/server.js`
- **Frontend**: `src/app/`

---

## 🤔 **Questions for AI Assistant**

1. **What's the best approach** to solve this Heroku HTTP blocking issue?
2. **Are there any Heroku-specific configurations** that might allow HTTP requests?
3. **What are the pros/cons** of each potential solution?
4. **How can we implement a proxy service** most efficiently?
5. **Are there any alternative hosting platforms** that would work better for this use case?

---

**Created**: September 23, 2025  
**Status**: Critical - NFT minting completely broken  
**Priority**: High - Core functionality affected
