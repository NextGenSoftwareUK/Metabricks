# OASIS HTTPS Proxy Deployment Guide

This guide provides multiple solutions to fix the Heroku HTTP blocking issue with the OASIS API.

## 🚨 **Problem Summary**
Heroku blocks outbound HTTP requests, but the OASIS API only supports HTTP (no HTTPS). This breaks NFT minting functionality.

## 💡 **Solution Options**

### **Option 1: Cloudflare Worker (Recommended - Fastest)**

**Pros**: No DNS changes, deploys in minutes, free tier available
**Cons**: Another component to maintain

#### Steps:
1. **Create Cloudflare Account** (if you don't have one)
2. **Go to Workers & Pages Dashboard**
3. **Create a new Worker**
4. **Copy the code** from `oasis-https-proxy-worker.js`
5. **Deploy the worker**
6. **Get your worker URL** (e.g., `https://oasis-proxy.yourworker.workers.dev`)
7. **Update Heroku environment variable**:
   ```bash
   heroku config:set OASIS_API_URL=https://oasis-proxy.yourworker.workers.dev
   ```

#### Security (Optional):
- Uncomment the secret key authentication in the worker
- Set `PROXY_SECRET` in worker environment
- Add `x-oasis-proxy-key` header to your backend requests

---

### **Option 2: Node.js Proxy on Render/Fly (Self-hosted)**

**Pros**: Full control, can add custom features
**Cons**: More setup, need to manage uptime

#### Steps:
1. **Create account** on Render or Fly.io
2. **Create new web service**
3. **Upload files**: `oasis-proxy-server.js` and `oasis-proxy-package.json`
4. **Rename package.json**: `mv oasis-proxy-package.json package.json`
5. **Set environment variables** (optional):
   - `PROXY_SHARED_SECRET=your-secret-key`
6. **Deploy and get HTTPS URL**
7. **Update Heroku environment variable**:
   ```bash
   heroku config:set OASIS_API_URL=https://your-proxy.onrender.com
   ```

---

### **Option 3: Quick Patch (Test First)**

**Pros**: No external dependencies, tests if it's an axios issue
**Cons**: May not work if Heroku truly blocks HTTP

#### Steps:
1. **Deploy the updated backend** with native HTTP client
2. **Test the current deployment**:
   ```bash
   curl -X POST https://metabricks-backend-api-66e7d2abb038.herokuapp.com/api/mint-nft \
     -H "Content-Type: application/json" \
     -d '{"walletAddress":"85ArqfA2fy8spGcMGsSW7cbEJAWj26vewmmoG2bwkgT9","brickId":"Brick 1","brickName":"MetaBrick #1","brickType":"regular","paymentNetwork":"solana"}'
   ```

---

## 🔧 **Implementation Steps**

### **Step 1: Choose Your Solution**
- **Fastest**: Cloudflare Worker
- **Most Control**: Node.js Proxy
- **Quick Test**: Deploy updated backend

### **Step 2: Deploy Chosen Solution**

#### For Cloudflare Worker:
```bash
# 1. Deploy worker (follow steps above)
# 2. Get worker URL: https://oasis-proxy.yourworker.workers.dev

# 3. Update Heroku config
heroku config:set OASIS_API_URL=https://oasis-proxy.yourworker.workers.dev

# 4. Restart Heroku app
heroku restart
```

#### For Node.js Proxy:
```bash
# 1. Deploy to Render/Fly (follow steps above)
# 2. Get proxy URL: https://your-proxy.onrender.com

# 3. Update Heroku config
heroku config:set OASIS_API_URL=https://your-proxy.onrender.com

# 4. Restart Heroku app
heroku restart
```

### **Step 3: Test the Solution**

```bash
# Test authentication
curl https://metabricks-backend-api-66e7d2abb038.herokuapp.com/test-http-connectivity

# Test NFT minting
curl -X POST https://metabricks-backend-api-66e7d2abb038.herokuapp.com/api/mint-nft \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"85ArqfA2fy8spGcMGsSW7cbEJAWj26vewmmoG2bwkgT9","brickId":"Brick 1","brickName":"MetaBrick #1","brickType":"regular","paymentNetwork":"solana"}'
```

---

## 🛡️ **Security Considerations**

### **Path Allowlisting**
All proxy solutions only allow specific OASIS API paths:
- `/api/avatar/authenticate`
- `/api/nft/mint-nft`
- `/api/provider/register-provider`
- `/api/provider/activate-provider`

### **Optional Authentication**
Add shared secret authentication:
```javascript
// In your backend, add header:
headers: {
  'x-oasis-proxy-key': 'your-secret-key'
}
```

### **Rate Limiting**
Consider adding rate limiting to prevent abuse:
- Cloudflare Workers: Built-in rate limiting
- Node.js Proxy: Add express-rate-limit middleware

---

## 📊 **Testing Checklist**

- [ ] Proxy responds to health check
- [ ] Authentication endpoint works
- [ ] NFT minting endpoint works
- [ ] Error handling works correctly
- [ ] CORS headers are set properly
- [ ] Security headers are in place

---

## 🔍 **Troubleshooting**

### **Common Issues**

1. **"Path not allowed" error**
   - Check if the path is in the ALLOWED_PATHS list
   - Verify the request URL is correct

2. **"Missing proxy key" error**
   - Set PROXY_SHARED_SECRET environment variable
   - Add x-oasis-proxy-key header to requests

3. **502 Bad Gateway**
   - Check if OASIS API is accessible
   - Verify proxy configuration

4. **CORS errors**
   - Ensure CORS headers are set in proxy
   - Check if frontend is calling the correct URL

### **Debug Commands**

```bash
# Check Heroku config
heroku config

# Check Heroku logs
heroku logs --tail

# Test proxy directly
curl https://your-proxy-url.com/health

# Test OASIS API through proxy
curl -X POST https://your-proxy-url.com/api/avatar/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"metabricks_admin","password":"Uppermall1!"}'
```

---

## 🎯 **Expected Results**

After successful implementation:
- ✅ Backend can authenticate with OASIS API
- ✅ NFT minting works end-to-end
- ✅ No more "stream has been aborted" errors
- ✅ All functionality restored

---

**Next Steps**: Choose your preferred solution and follow the implementation steps. The Cloudflare Worker is recommended for fastest deployment.
