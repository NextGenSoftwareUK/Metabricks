🚀 NFT MINTING BRIEFING - DEVELOPER HANDOFF

🎯 MISSION OVERVIEW
Complete guide for minting Solana NFTs via the OASIS API. This document contains everything needed to successfully mint NFTs with correct metadata and images.

✅ CURRENT STATUS: FULLY OPERATIONAL - Solana NFT minting verified working on devnet.oasisweb4.one

---

🌐 WHAT IS OASIS WEB4?

OASIS WEB4 is a comprehensive blockchain infrastructure platform that provides unified APIs for interacting with multiple blockchain networks. 

It serves as a middleware layer that abstracts the complexity of different blockchain protocols, allowing developers to mint NFTs, manage digital assets, and interact with various blockchains through a single, standardized API interface. 

The platform supports multiple providers including Solana, Ethereum, Polygon, and others, with built-in features for NFT minting, metadata management, IPFS integration, and cross-chain operations. 

OASIS WEB4 enables developers to build blockchain applications without needing to understand the specific technical details of each individual blockchain network.

---

---

🌐 PRODUCTION API ENDPOINTS

Devnet Environment (Current)
• Base URL: http://devnet.oasisweb4.one
• Swagger UI: http://devnet.oasisweb4.one/swagger/index.html
• Authentication: POST http://devnet.oasisweb4.one/api/avatar/authenticate
• NFT Minting: POST http://devnet.oasisweb4.one/api/nft/mint-nft
• Provider Registration: POST http://devnet.oasisweb4.one/api/provider/register-provider-type/SolanaOASIS
• Provider Activation: POST http://devnet.oasisweb4.one/api/provider/activate-provider/SolanaOASIS

Local Development
• Base URL: https://localhost:5004 (HTTPS with port 5004)
• Swagger UI: https://localhost:5004/swagger/index.html

---

🔑 AUTHENTICATION & CREDENTIALS

Site Avatar Credentials
• Username: metabricks_admin
• Password: Uppermall1!
• Avatar ID: 89d907a8-5859-4171-b6c5-621bfe96930d

Pinata (IPFS) Credentials
• API Key: 3e5fb97332d629f94989
• Secret Key: 1ddb40666bc3eba58924b92094f85fac46ab58d3fba56f0a4e17e192dc7393b7
• Private Group ID: 0198fa7b-41b6-7dd5-9e00-bc3120f9e3ec
• Gateway: https://gateway.pinata.cloud/ipfs/

---

🚨 CRITICAL: MANDATORY SETUP STEPS

Step 1: Authenticate
curl -X POST "http://devnet.oasisweb4.one/api/avatar/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"username":"metabricks_admin","password":"Uppermall1!"}'

Step 2: Register SolanaOASIS Provider
curl -X POST "http://devnet.oasisweb4.one/api/provider/register-provider-type/SolanaOASIS" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -X POST

Step 3: Activate SolanaOASIS Provider
curl -X POST "http://devnet.oasisweb4.one/api/provider/activate-provider/SolanaOASIS" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -X POST

Step 4: Verify Provider Status
curl -X GET "http://devnet.oasisweb4.one/api/provider/get-all-registered-providers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

✅ Expected Response: Both MongoDBOASIS and SolanaOASIS should show "isProviderActivated": true

---

🎯 WORKING NFT MINTING REQUEST FORMAT

✅ PRODUCTION VERIFIED FORMAT (USE EXACTLY - NO DEVIATIONS)

{
  "Title": "MetaBrick Test NFT",
  "Description": "Test NFT minted via devnet.oasisweb4.one",
  "Symbol": "MBRICK",
  "OnChainProvider": {"value": 3, "name": "SolanaOASIS"},
  "OffChainProvider": {"value": 23, "name": "MongoDBOASIS"},
  "NFTOffChainMetaType": {"value": 3, "name": "ExternalJsonURL"},
  "NFTStandardType": {"value": 2, "name": "SPL"},
  "JSONMetaDataURL": "https://gateway.pinata.cloud/ipfs/Qmag8SxBHha1K6zvxqqYANjVza1HmPbSwempw2LpFW6X88",
  "ImageUrl": "https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq",
  "ThumbnailUrl": "https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq",
  "Price": 0.02,
  "NumberToMint": 1,
  "StoreNFTMetaDataOnChain": false,
  "MintedByAvatarId": "89d907a8-5859-4171-b6c5-621bfe96930d",
  "SendToAddressAfterMinting": "85ArqfA2fy8spGcMGsSW7cbEJAWj26vewmmoG2bwkgT9",
  "WaitTillNFTSent": true,
  "WaitForNFTToSendInSeconds": 60,
  "AttemptToSendEveryXSeconds": 5
}

🔧 Complete Minting Command
curl -X POST "http://devnet.oasisweb4.one/api/nft/mint-nft" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "Title": "Devnet Test NFT",
    "Description": "Test NFT minted via devnet.oasisweb4.one",
    "Symbol": "TEST",
    "OnChainProvider": {"value": 3, "name": "SolanaOASIS"},
    "OffChainProvider": {"value": 23, "name": "MongoDBOASIS"},
    "NFTOffChainMetaType": {"value": 3, "name": "ExternalJsonURL"},
    "NFTStandardType": {"value": 2, "name": "SPL"},
    "JSONMetaDataURL": "https://gateway.pinata.cloud/ipfs/Qmag8SxBHha1K6zvxqqYANjVza1HmPbSwempw2LpFW6X88",
    "ImageUrl": "https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq",
    "ThumbnailUrl": "https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq",
    "Price": 0.02,
    "NumberToMint": 1,
    "StoreNFTMetaDataOnChain": false,
    "MintedByAvatarId": "89d907a8-5859-4171-b6c5-621bfe96930d",
    "SendToAddressAfterMinting": "85ArqfA2fy8spGcMGsSW7cbEJAWj26vewmmoG2bwkgT9",
    "WaitTillNFTSent": true,
    "WaitForNFTToSendInSeconds": 60,
    "AttemptToSendEveryXSeconds": 5
  }'

---

✅ SUCCESS RESPONSE FORMAT

Expected Success Response
{
  "resultsCount": 0,
  "errorCount": 0,
  "warningCount": 0,
  "savedCount": 0,
  "loadedCount": 0,
  "deletedCount": 0,
  "hasAnyHolonsChanged": false,
  "isError": false,
  "isWarning": false,
  "isSaved": true,
  "isLoaded": false,
  "isDeleted": false,
  "message": "Successfully minted the NFT on the SolanaOASIS provider...",
  "result": {
    "oasisnft": {
      "nftTokenAddress": "HFLigKMovfHGeCPTvJ14KJYZy9QgxynvH294tAX64MTg",
      "mintTransactionHash": "4QVm3F47j6ABsSEx2tr3cxJVBKTcY5VP2ceRUjbposeZpFZ3GqBnA3gw1bcpPKYfdnTgQNTdD7hkkUgnX95qpN22",
      "sendNFTTransactionHash": "2uUCAapUkF5rhLhUbo2pKt3a4sgnXKU8ZjUf1ktgLk9DHYouZmzA97eNeJZAnoKqFW6R2RDRDwaaqPj9ckCsqJbq",
      "title": "Devnet Test NFT",
      "symbol": "TEST",
      "price": 0.02,
      "mintedOn": "2025-09-26T12:05:43.2225276+00:00"
    },
    "transactionResult": "4QVm3F47j6ABsSEx2tr3cxJVBKTcY5VP2ceRUjbposeZpFZ3GqBnA3gw1bcpPKYfdnTgQNTdD7hkkUgnX95qpN22"
  }
}

Key Success Indicators
• "isError": false → SUCCESS
• "isSaved": true → NFT SAVED
• "mintTransactionHash" → MINT TRANSACTION
• "sendNFTTransactionHash" → TRANSFER TRANSACTION
• "nftTokenAddress" → NFT ADDRESS

---

🔍 BLOCKCHAIN VERIFICATION

Verify NFT on Solana Explorer
• Devnet Explorer: https://explorer.solana.com/?cluster=devnet
• Transaction URL: https://explorer.solana.com/tx/YOUR_TRANSACTION_HASH?cluster=devnet
• NFT Address URL: https://explorer.solana.com/address/YOUR_NFT_ADDRESS?cluster=devnet

Verify NFT Account
curl -s "https://api.devnet.solana.com" -X POST -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getAccountInfo",
  "params": [
    "YOUR_NFT_ADDRESS",
    {
      "encoding": "jsonParsed"
    }
  ]
}'

---

🚨 CRITICAL PARAMETER REQUIREMENTS

✅ MANDATORY PARAMETERS (ALL REQUIRED)
• OnChainProvider: {"value": 3, "name": "SolanaOASIS"}
• OffChainProvider: {"value": 23, "name": "MongoDBOASIS"}
• NFTOffChainMetaType: {"value": 3, "name": "ExternalJsonURL"}
• NFTStandardType: {"value": 2, "name": "SPL"}
• Title (capital T) → MANDATORY
• Symbol (capital S) → MANDATORY
• JSONMetaDataURL → MANDATORY (not jsonUrl)
• ImageUrl → MANDATORY (not imageUrl)
• ThumbnailUrl → MANDATORY (not thumbnailUrl)

❌ FORBIDDEN PARAMETERS (WILL CAUSE FAILURE)
• ProviderType → FAILS (use OnChainProvider + OffChainProvider)
• mintWalletAddress → FAILS (use SendToAddressAfterMinting)
• jsonUrl → FAILS (use JSONMetaDataURL)
• imageUrl → FAILS (use ImageUrl)
• thumbnailUrl → FAILS (use ThumbnailUrl)

---

🔧 COMMON ERRORS & SOLUTIONS

❌ Error: "The JSON value could not be converted to NextGenSoftware.Utilities.EnumValue"
✅ Solution: Use enum objects instead of strings:

// ❌ WRONG - String format
"OnChainProvider": "SolanaOASIS"

// ✅ CORRECT - Enum object format  
"OnChainProvider": {"value": 3, "name": "SolanaOASIS"}

❌ Error: "Object reference not set to an instance of an object"
✅ Solution: Ensure SolanaOASIS provider is registered and activated before minting

❌ Error: "401 Unauthorized"
✅ Solution: Re-authenticate to get fresh JWT token

❌ Error: "Provider not activated"
✅ Solution: Run provider activation command and restart API

---

🎯 VERIFIED WORKING EXAMPLES

✅ Latest Successful Test (September 2025)
• NFT Address: HFLigKMovfHGeCPTvJ14KJYZy9QgxynvH294tAX64MTg
• Mint Transaction: 4QVm3F47j6ABsSEx2tr3cxJVBKTcY5VP2ceRUjbposeZpFZ3GqBnA3gw1bcpPKYfdnTgQNTdD7hkkUgnX95qpN22
• Send Transaction: 2uUCAapUkF5rhLhUbo2pKt3a4sgnXKU8ZjUf1ktgLk9DHYouZmzA97eNeJZAnoKqFW6R2RDRDwaaqPj9ckCsqJbq
• Sent To: 85ArqfA2fy8spGcMGsSW7cbEJAWj26vewmmoG2bwkgT9
• API Endpoint: http://devnet.oasisweb4.one/api/nft/mint-nft
• Status: ✅ FULLY OPERATIONAL

---

📋 METABRICKS INTEGRATION

Working Metadata URLs
• Regular Bricks: https://gateway.pinata.cloud/ipfs/QmYtFD9zD8oBwcc4PKhPmhgXvqvi7DNLEcfyBYpvHhAuLY
• Industrial Bricks: https://gateway.pinata.cloud/ipfs/QmXsv1bnPU3ybyQKKnQ7929YUmsUSdeEGxyX9Tj7vo5Mnz
• Legendary Bricks: https://gateway.pinata.cloud/ipfs/QmWXYMjqeu5w1nUsaVuTpRuVZMM4f1G2G2GkzZtJnEGuq3

Image URLs
• Regular: https://gateway.pinata.cloud/ipfs/bafkreigqsyyi6qumiq544of4kzwfgffohvnvq36usivstvrfyw52u5qxf4
• Industrial: https://gateway.pinata.cloud/ipfs/bafkreiav6vreyevxu5l7c43ze64oaopgvsi23xx6jfmg4zjlytfqppvtka
• Legendary: https://gateway.pinata.cloud/ipfs/bafkreibhok44eomzkubmt3e2kzxip3w3b4pclixvgff5q7awhfa7kwlwsq

---

🚀 QUICK START CHECKLIST

Before Minting NFT:
☐ Authenticate and get JWT token
☐ Register SolanaOASIS provider
☐ Activate SolanaOASIS provider
☐ Verify provider status shows "isProviderActivated": true
☐ Use PascalCase field names
☐ Use enum objects with {"value": X, "name": "Y"} format
☐ Ensure recipient wallet address is valid Solana address

Required Enum Values:
• OnChainProvider: {"value": 3, "name": "SolanaOASIS"}
• OffChainProvider: {"value": 23, "name": "MongoDBOASIS"}
• NFTOffChainMetaType: {"value": 3, "name": "ExternalJsonURL"}
• NFTStandardType: {"value": 2, "name": "SPL"}

Required Field Names (PascalCase):
• Title (not title)
• OnChainProvider (not onChainProvider)
• OffChainProvider (not offChainProvider)
• NFTOffChainMetaType (not nftOffChainMetaType)
• NFTStandardType (not nftStandardType)

---

🎯 SUCCESS CRITERIA

Primary Goal: NFT images display correctly in user wallets
1. Complete minting flow works end-to-end
2. NFTs transfer successfully from OASIS to user
3. Images are visible in Phantom wallet
4. Metadata URLs are accessible and working

Secondary Goals:
• API integration is stable and reliable
• User experience is seamless from click to NFT
• System is ready for production testing

---

🔗 USEFUL LINKS

• Devnet API: http://devnet.oasisweb4.one
• Swagger UI: http://devnet.oasisweb4.one/swagger/index.html
• Solana Explorer: https://explorer.solana.com/?cluster=devnet
• Pinata Gateway: https://gateway.pinata.cloud/ipfs/

---

🚨 CRITICAL FINAL WARNING

⚠️ THIS IS THE ONLY WORKING APPROACH

❌ DO NOT ATTEMPT ANY OF THESE:
• Using old endpoints (/api/Solana/Mint)
• Using old parameter names (jsonUrl, mintWalletAddress)
• Skipping provider registration
• Using different provider combinations
• Modifying the request format

✅ ONLY USE THIS EXACT PROCESS:
1. Register SolanaOASIS provider (mandatory)
2. Activate SolanaOASIS provider (mandatory)
3. Use exact parameter format (no substitutions)
4. Use /api/nft/mint-nft endpoint (only working endpoint)
5. Use http://devnet.oasisweb4.one (current working URL)

🚀 READY FOR PRODUCTION: This process is 100% verified and ready for live MetaBrick minting!

---

Document created: September 26, 2025
Status: ✅ SOLANA NFT MINTING FULLY OPERATIONAL ON DEVNET.OASISWEB4.ONE
Priority: PRODUCTION READY - Complete end-to-end NFT minting system
