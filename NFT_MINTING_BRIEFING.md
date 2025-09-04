# 🚀 **COMPLETE NFT MINTING BRIEFING FOR NEXT AGENT**

## **🎯 MISSION OVERVIEW**
Test the complete MetaBricks NFT minting flow from frontend to blockchain, ensuring NFTs display with correct images in user wallets.

**✅ PINATA IS NOW WORKING** - All 432 metadata files successfully uploaded with current credentials!

---

## **✅ WHAT'S BEEN ACCOMPLISHED**

### **1. Pinata Integration - COMPLETE**
- **432 metadata files successfully uploaded** to Pinata ✅
- **Group ID**: `0198fa7b-41b6-7dd5-9e00-bc3120f9e3ec`
- **All metadata accessible** and working ✅
- **Image URLs fixed** - no more broken links ✅
- **Current Working Credentials**:
  - API Key: `3e5fb97332d629f94989`
  - Secret: `1ddb40666bc3eba58924b92094f85fac46ab58d3fba56f0a4e17e192dc7393b7`
  - Private Group: `metabricks_jsons`

### **2. MetaBricks Configuration - UPDATED**
- **`metabricks-config.service.ts` updated** with working metadata URLs ✅
- **Sample working URLs** for each brick type (from current upload):
  - **Regular**: `https://gateway.pinata.cloud/ipfs/QmYtFD9zD8oBwcc4PKhPmhgXvqvi7DNLEcfyBYpvHhAuLY`
  - **Industrial**: `https://gateway.pinata.cloud/ipfs/QmXsv1bnPU3ybyQKKnQ7929YUmsUSdeEGxyX9Tj7vo5Mnz`
  - **Legendary**: `https://gateway.pinata.cloud/ipfs/QmWXYMjqeu5w1nUsaVuTpRuVZMM4f1G2G2GkzZtJnEGuq3`
- **Total Files**: ✅ **432 metadata files successfully uploaded to Pinata**
- **Organization**: All files organized in private group `metabricks_jsons`

### **3. Frontend Compilation - FIXED**
- **Header component errors resolved** ✅
- **Duplicate functions removed** ✅
- **Template method calls fixed** ✅
- **Site now compiles successfully** ✅

---

## **🔑 CRITICAL CREDENTIALS & CONFIGURATION**

### **OASIS API**
- **Base URL**: `https://localhost:5002/api`
- **Site Avatar ID**: `5f7daa80-160e-4213-9e81-94500390f31e`
- **Site Avatar Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmN2RhYTgwLTE2MGUtNDIxMy05ZTgxLTk0NTAwMzkwZjMxZSIsIm5iZiI6MTc1NjU1Njg1MywiZXhwIjoxNzU2NTU3NzUzLCJpYXQiOjE3NTY1NTY4NTN9.I6so4YCguLE-XueAX6_dqfsJGEuCDU_z5v5J5rp-l8w`

**⚠️ IMPORTANT**: JWT tokens expire after 24 hours. If you get authentication errors, you'll need to get a fresh token.

### **Pinata (IPFS) - CURRENT WORKING CREDENTIALS**
- **API Key**: `3e5fb97332d629f94989`
- **Secret Key**: `1ddb40666bc3eba58924b92094f85fac46ab58d3fba56f0a4e17e192dc7393b7`
- **Private Group ID**: `0198fa7b-41b6-7dd5-9e00-bc3120f9e3ec`
- **Status**: ✅ **WORKING** - All 432 metadata files successfully uploaded
- **Gateway**: `https://gateway.pinata.cloud/ipfs/`

### **Solana Configuration**
- **Network**: Devnet
- **RPC URL**: `https://api.devnet.solana.com`
- **User Wallet**: `FXD4ebDGGDG3L345MD2DYRQ4rxhuswJFZ1o3EASsQxhS` (Phantom)

---

## **🎯 COMPLETE NFT MINTING FLOW TO TEST**

### **Phase 1: Frontend Setup & Wallet Connection**
1. **Start MetaBricks frontend**
   ```bash
   cd meta-bricks-main
   npm run start
   ```
2. **Navigate to** `http://localhost:4200`
3. **Connect Phantom wallet** through the header
4. **Verify wallet address** is displayed correctly

### **Phase 2: OASIS Avatar Authentication**
1. **Ensure OASIS API is running** on `https://localhost:5002`
2. **Verify site avatar is authenticated** using the token above
3. **Check API health** at `https://localhost:5002/swagger`

### **Phase 3: Brick Selection & NFT Minting**
1. **Click on any brick** in the MetaBricks wall
2. **Trigger the minting flow** through the UI
3. **Monitor network requests** for `Solana/Mint` API call
4. **Verify NFT creation** on Solana Devnet

**🔧 PROVEN WORKING COMMAND** (use this exact format):
```bash
curl -X POST "https://localhost:5002/api/Solana/Mint" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "Title": "MetaBrick #425",
    "Symbol": "MBRICK",
    "JSONUrl": "https://gateway.pinata.cloud/ipfs/Qmag8SxBHha1K6zvxqqYANjVza1HmPbSwempw2LpFW6X88",
    "MintWalletAddress": "FXD4ebDGGDG3L345MD2DYRQ4rxhuswJFZ1o3EASsQxhS",
    "MintedByAvatarId": "5f7daa80-160e-4213-9e81-94500390f31e",
    "ImageUrl": "https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq",
    "ThumbnailUrl": "https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq",
    "Price": 0.1,
    "NumberToMint": 1,
    "StoreNFTMetaDataOnChain": false
  }'
```

**🎯 NEW MINTING TARGET - LEGENDARY BRICK #425:**
- **Type**: Legendary MetaBrick
- **JSON URL**: `https://gateway.pinata.cloud/ipfs/Qmag8SxBHha1K6zvxqqYANjVza1HmPbSwempw2LpFW6X88`
- **Image URL**: `https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq`
- **Perks**: Token Airdrop (Guaranteed), TGE Discount (10%), Mystery Perk #14
- **Status**: Ready for minting and transfer testing
```

**⚠️ CRITICAL**: The API expects these exact parameter names:
- `Title` (not `name`)
- `JSONUrl` (not `MetadataUrl`) 
- `ImageUrl` (not `image`)
- `ThumbnailUrl` (not `thumbnail`)
- `Price` (not `price`)
- `NumberToMint` (not `amount`)

### **Phase 4: NFT Transfer to User Wallet**
1. **Check OASIS wallet** - NFT should be minted there first
2. **Use `send-nft` endpoint** to transfer to user's Phantom wallet
3. **Verify transfer success** - NFT appears in user's wallet
4. **Check image display** - should now be visible with correct metadata

**🔧 PROVEN WORKING TRANSFER COMMAND**:
```bash
curl -X POST "https://localhost:5002/api/Nft/send-nft" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "FromWalletAddress": "JxaMk9kPXoUkUKVJZD6BohRsCS2apMnrQMKtvqfoxfu",
    "ToWalletAddress": "FXD4ebDGGDG3L345MD2DYRQ4rxhuswJFZ1o3EASsQxhS",
    "TokenAddress": "7BpdFpH3snfVJ28RpKVFUjAcms2og7zsRFrRpRWMmXce",
    "FromProviderType": "SOLANAOASIS",
    "ToProviderType": "SOLANAOASIS",
    "Amount": 1
  }'
```

**📍 CRITICAL ADDRESSES**:
- **OASIS Wallet**: `JxaMk9kPXoUkUKVJZD6BohRsCS2apMnrQMKtvqfoxfu`
- **User Phantom Wallet**: `FXD4ebDGGDG3L345MD2DYRQ4rxhuswJFZ1o3EASsQxhS`
- **NFT Mint Address**: `7BpdFpH3snfVJ28RpKVFUjAcms2og7zsRFrRpRWMmXce`

---

## **🔍 TESTING CHECKLIST**

### **✅ Frontend Functionality**
- [ ] Site loads without errors
- [ ] Wallet connection modal works
- [ ] Phantom wallet connects successfully
- [ ] Wallet address displays correctly

### **✅ OASIS API Integration**
- [ ] API responds to health checks
- [ ] Site avatar authentication works
- [ ] `Solana/Mint` endpoint accessible
- [ ] `send-nft` endpoint functional

### **✅ NFT Creation & Transfer**
- [ ] NFT mints to OASIS wallet successfully
- [ ] NFT transfers to user wallet without errors
- [ ] Transaction appears on Solana Devnet explorer
- [ ] NFT metadata is correct and accessible

### **✅ Image Display (CRITICAL)**
- [ ] NFT image displays in Phantom wallet
- [ ] Image shows correctly on Solana explorer
- [ ] Metadata URLs point to working Pinata files
- [ ] No more broken image links

---

## **🔄 JWT TOKEN MANAGEMENT**

### **Getting a Fresh JWT Token**

If you encounter authentication errors (401 Unauthorized), the JWT token has likely expired. Here's how to get a new one:

#### **Method 1: Use the Existing Script (Recommended)**
```bash
cd meta-bricks-main/src/app/components/metabricks-nfts
node create-oasis-site-avatar.js
```

This script will:
1. **Create a new site avatar** if needed
2. **Authenticate the avatar** automatically
3. **Output the new JWT token** to use

#### **Method 2: Manual API Authentication**
```bash
# Step 1: Authenticate the site avatar
curl -X POST "https://localhost:5002/api/avatar/authenticate" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "metabricks_admin",
    "password": "Uppermall1!"
  }'

# Step 2: Extract the JWT token from the response
# Step 3: Update the metabricks-config.service.ts file
```

#### **Method 3: Check Token Expiration**
```bash
# Decode the JWT token to check expiration
# Use jwt.io or similar tool to decode the token
# Look for the "exp" field (expiration timestamp)
```

### **Updating Configuration with New Token**

Once you have a new JWT token:

1. **Update `metabricks-config.service.ts`**:
   ```typescript
   SITE_AVATAR_TOKEN: 'YOUR_NEW_JWT_TOKEN_HERE'
   ```

2. **Update this briefing document** with the new token

3. **Restart the frontend** if it's running

---

## **🚨 POTENTIAL ISSUES TO WATCH**

### **1. Frontend Compilation**
- **Watch for TypeScript errors** during build
- **Check browser console** for runtime errors
- **Verify component loading** without crashes

### **2. API Authentication**
- **JWT token expiration** - may need refresh (see JWT Token Management above)
- **CORS issues** between frontend and API
- **Network connectivity** to localhost:5002

**🔍 JWT Token Troubleshooting**:
- **Error 401 Unauthorized** → Token expired, get new one
- **Error 403 Forbidden** → Check avatar permissions
- **Error 500 Internal Server Error** → Check OASIS API logs

### **3. Solana Transactions**
- **RPC rate limiting** on Devnet
- **Transaction confirmation delays**
- **Wallet connection timeouts**

### **4. Image Display**
- **Pinata gateway access** - ensure public
- **Metadata URL resolution** - verify working
- **Wallet image caching** - may need refresh

---

## **🎯 SUCCESS CRITERIA**

### **Primary Goal**: **NFT images display correctly in user wallets**
1. **Complete minting flow works** end-to-end
2. **NFTs transfer successfully** from OASIS to user
3. **Images are visible** in Phantom wallet
4. **Metadata URLs are accessible** and working

### **Secondary Goals**:
- **Frontend runs smoothly** without errors
- **API integration is stable** and reliable
- **User experience is seamless** from click to NFT
- **System is ready for production** testing

---

## **📚 RESOURCES & FILES**

### **Key Configuration Files**
- `meta-bricks-main/src/app/services/metabricks-config.service.ts` - Main config
- `meta-bricks-main/src/app/components/common/header/header.component.ts` - Fixed header
- `meta-bricks-main/src/app/components/common/header/header.component.html` - Fixed template

### **API Endpoints to Test**
- `POST /api/Solana/Mint` - Create NFT
- `POST /api/Nft/send-nft` - Transfer NFT
- `GET /api/avatar/authenticate` - Verify auth

### **Working Metadata Examples**
- **Brick #22** (Industrial): `QmXsv1bnPU3ybyQKKnQ7929YUmsUSdeEGxyX9Tj7vo5Mnz`
- **Brick #284** (Regular): `QmYtFD9zD8oBwcc4PKhPmhgXvqvi7DNLEcfyBYpvHhAuLY`
- **Brick #305** (Regular): `QmWXYMjqeu5w1nUsaVuTpRuVZMM4f1G2G2GkzZtJnEGuq3`

### **Current Pinata Status**
- **Total Files Uploaded**: 432 metadata JSONs ✅
- **Private Group**: `metabricks_jsons` (ID: `0198fa7b-41b6-7dd5-9e00-bc3120f9e3ec`)
- **All Files Accessible**: Via `https://gateway.pinata.cloud/ipfs/[CID]`
- **Organization**: Files organized and tagged for easy management

---

## **🚀 NEXT STEPS FOR AGENT**

1. **Start the frontend** and verify it loads
2. **Test wallet connection** with Phantom
3. **Attempt complete NFT minting flow**
4. **Verify NFT images display correctly**
5. **Document any issues** encountered
6. **Report success/failure** with detailed logs

---

## **📋 QUICK START COMMANDS**

```bash
# Navigate to project
cd meta-bricks-main

# Install dependencies (if needed)
npm install

# Start frontend
npm run start

# Check OASIS API (in another terminal)
curl https://localhost:5002/swagger
```

## **🔑 JWT TOKEN QUICK REFERENCE**

```bash
# Check if token is expired
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://localhost:5002/api/avatar/authenticate"

# Get new token quickly
cd src/app/components/metabricks-nfts
node create-oasis-site-avatar.js

# Test API health
curl "https://localhost:5002/swagger"
```

---

## **🔗 USEFUL LINKS**

- **Frontend**: `http://localhost:4200`
- **OASIS API**: `https://localhost:5002`
- **API Docs**: `https://localhost:5002/swagger`
- **Solana Explorer**: `https://explorer.solana.com/?cluster=devnet`

## **📁 META BRICK JSON CATALOG**

- **Complete MetaBrick Collection**: `meta-bricks-main/src/app/components/metabricks-nfts/metabricks-collection-viewer.html`
- **Total Bricks**: 432 (all uploaded to Pinata)
- **Upload Date**: 2025-08-30T10:26:10.817Z
- **Pinata Private Group**: `metabricks_jsons`
- **Contains**: All IPFS URLs for MetaBrick JSON metadata files
- **Features**: Search, filter by type (regular/industrial/legendary), copy URL functionality

---

**🎯 AGENT MISSION**: **Get the complete NFT minting flow working with visible images!**

The hard work is done - Pinata is working, metadata is uploaded, config is updated, and frontend compiles. Now it's time to test the complete user experience! 🎉

---

## **🚨 CRITICAL TROUBLESHOOTING: Parameter Validation Errors**

### **🚨 If You Get "Value cannot be null. (Parameter 's')" Error:**

**❌ WRONG PARAMETER NAMES** (what we used before):
```json
{
  "MintWalletAddress": "...",
  "MintedByAvatarId": "...",
  "MetadataUrl": "..."
}
```

**✅ CORRECT PARAMETER NAMES** (what the API expects):
```json
{
  "Title": "MetaBrick #284",
  "Symbol": "MBRICK", 
  "JSONUrl": "...",
  "MintWalletAddress": "...",
  "MintedByAvatarId": "...",
  "ImageUrl": "...",
  "ThumbnailUrl": "...",
  "Price": 0.1,
  "NumberToMint": 1,
  "StoreNFTMetaDataOnChain": false
}
```

**🔍 Key Differences**:
- `MetadataUrl` → `JSONUrl`
- Must include `Title`, `Symbol`, `ImageUrl`, `ThumbnailUrl`
- Must include `Price`, `NumberToMint`, `StoreNFTMetaDataOnChain`

**💡 Why This Happened**: The API expects specific parameter names that are different from what we initially used. The "Parameter 's'" error occurs when the API can't parse the request because it's missing required fields or using wrong field names.

---

*Document created: August 30, 2025*  
*Status: Ready for testing*  
*Priority: HIGH - NFT image display is critical*
