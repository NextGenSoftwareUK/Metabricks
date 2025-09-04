# 🚀 **PINATA INTEGRATION CONTEXT DOCUMENT**

## **🎯 MISSION**
Get Pinata working to upload 432 MetaBrick metadata files so the NFT images display correctly in user wallets.

## **🔑 CRITICAL API CREDENTIALS**

### **Pinata API Keys (NEW - User's Current Credentials)**
```
PINATA_API_KEY=1ea18297422c74af48de
PINATA_SECRET_KEY=446eee142b8f3c0a7883f8846031101c66bbf9c250576495028727db34187abf
JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmMTg4ODA1Ny0yZDRhLTQ1MzMtOWI4ZS0wZGMxYjEwNmM4YzMiLCJlbWFpbCI6Im1heC5nZXJzaGZpZWxkMUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMWVhMTgyOTc0MjJjNzRhZjQ4ZGUiLCJzY29wZWRLZXlTZWNyZXQiOiI0NDZlZWUxNDJiOGYzYzBhNzg4M2Y4ODQ2MDMxMTAxYzY2YmJmOWMyNTA1NzY0OTUwMjg3MjdkYjM0MTg3YWJmIiwiZXhwIjoxNzg4MDQ4NTQ1fQ.zpUuivPNlMr2uzUaCPRVFtFUnJSlQEkjuQVB0AXNSt8
```

### **Pinata API Keys (OLD - Previous Credentials)**
```
PINATA_API_KEY=158156e0c27a05f29636
PINATA_SECRET_API_KEY=vIZ-ipxtXBaHQNtWN2EEaeD_yXHevPezOiwkkGMy4c_zzgwx1BPtvBWGeiehHKa9
```

### **Custom Pinata Gateway**
```
GATEWAY_URL=https://tomato-calm-flamingo-61.mypinata.cloud
```

## **📁 PROJECT STRUCTURE**

### **Current Working Directory**
```
/Volumes/Storage space 1/OASIS_CLEAN/meta-bricks-main/src/app/components/metabricks-nfts/
```

### **Key Files**
- `upload-to-pinata-simple.js` - Main upload script (currently has 403 error)
- `test-simple.js` - Simple authentication test script
- `.env` - Environment file with credentials
- `assets/images/` - Contains the 3 brick PNG files
- `assets/metadata/` - Contains 432 JSON metadata files

### **Brick Image Files (Already on Pinata)**
```
Regular_Brick_1.png → bafkreigqsyyi6qumiq544of4kzwfgffohvnvq36usivstvrfyw52u5qxf4
Industrial_Brick_1.png → bafkreiav6vreyevxu5l7c43ze64oaopgvsi23xx6jfmg4zjlytfqppvtka
Legendary_Brick_1.png → bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq
```

## **🚨 CURRENT ISSUES**

### **Primary Problem: 403 Authentication Error**
- **Error**: `HTTP 403: [object Object]` when trying to upload metadata
- **Location**: `upload-to-pinata-simple.js` line ~117
- **Context**: JWT token authentication failing

### **Secondary Problem: Image Display**
- **Issue**: NFT images not showing in Phantom wallet
- **Root Cause**: Metadata URLs pointing to inaccessible Pinata folders
- **Solution**: Upload new metadata with correct, accessible image URLs

## **🔍 DEBUGGING STEPS TO TAKE**

### **1. Test JWT Authentication**
```bash
cd /Volumes/Storage\ space\ 1/OASIS_CLEAN/meta-bricks-main/src/app/components/metabricks-nfts/
node test-simple.js
```

### **2. Verify API Key Permissions**
- Check if API key has upload permissions
- Verify JWT token hasn't expired
- Test with both old and new credentials

### **3. Test Different Authentication Methods**
- Try API key + secret instead of JWT
- Test with different endpoints
- Check rate limiting

### **4. Examine Error Response**
- Add better error logging to see actual 403 response
- Check Pinata API documentation for 403 causes

## **📋 WHAT NEEDS TO BE UPLOADED**

### **Total Files**: 432 metadata JSON files
- **Regular Bricks**: #1-361 (361 files)
- **Industrial Bricks**: #362-421 (60 files)  
- **Legendary Bricks**: #422-432 (11 files)

### **Each Metadata File Contains**:
- Brick name, description, attributes
- Image URL (currently broken)
- Perks and benefits
- Verification hash

## **🎯 SUCCESS CRITERIA**

1. **✅ Pinata authentication working** (no more 403 errors)
2. **✅ All 432 metadata files uploaded** to Pinata
3. **✅ New metadata URLs working** and accessible
4. **✅ NFT images displaying** in Phantom wallet
5. **✅ MetaBricks config updated** with new URLs

## **🔧 AVAILABLE TOOLS**

### **Scripts**
- `upload-to-pinata-simple.js` - Main upload script (needs fixing)
- `test-simple.js` - Authentication test
- `upload_to_pinata.js` - Alternative upload script
- `upload-to-pinata-complete.js` - Complete version

### **Dependencies**
- `fs-extra` - File operations
- `https` - Built-in HTTP client
- `dotenv` - Environment variables

## **📚 RESOURCES**

### **Pinata API Documentation**
- Base URL: `https://api.pinata.cloud`
- Endpoints: `/pinning/pinJSONToIPFS`, `/pinning/pinFileToIPFS`
- Authentication: JWT Bearer token or API key + secret

### **Current Working URLs**
- Regular: `https://gateway.pinata.cloud/ipfs/bafkreigqsyyi6qumiq544of4kzwfgffohvnvq36usivstvrfyw52u5qxf4`
- Industrial: `https://gateway.pinata.cloud/ipfs/bafkreiav6vreyevxu5l7c43ze64oaopgvsi23xx6jfmg4zjlytfqppvtka`
- Legendary: `https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5g7awhfa7kwlwsq`

## **🚀 IMMEDIATE NEXT STEPS**

1. **Debug the 403 error** - Find out why JWT authentication is failing
2. **Test alternative auth methods** - Try API key + secret combination
3. **Get metadata uploads working** - Fix the authentication issue
4. **Upload all 432 files** - Batch upload the metadata
5. **Update MetaBricks config** - Use new working URLs

## **⚠️ IMPORTANT NOTES**

- **Don't delete existing files** - The brick images are already uploaded
- **Focus on metadata uploads** - That's where the 403 error is occurring
- **Test incrementally** - Start with 1 file, then scale up
- **Preserve existing structure** - Don't break the working parts

---

**🎯 AGENT GOAL**: Get Pinata working so we can upload the metadata and fix the NFT image display issue!
