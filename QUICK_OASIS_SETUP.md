# 🚀 Quick OASIS Setup Guide

## Prerequisites

1. **OASIS API Running** - Ensure your OASIS API is accessible
2. **Node.js** - Version 14+ installed
3. **MetaBricks Project** - This project cloned and dependencies installed

## Quick Setup Steps

### 1. Update OASIS Configuration

Edit `scripts/create-oasis-site-avatar.js` and update:

```javascript
const OASIS_CONFIG = {
  BASE_URL: 'https://localhost:5002', // Your OASIS API URL
  USE_HTTPS: true, // Set to false if using HTTP
  
  SITE_AVATAR: {
    username: 'metabricks-site', // Change if needed
    email: 'admin@metabricks.com', // Your admin email
    password: 'MetaBricks2024!', // Change to secure password
    // ... other fields
  }
};
```

### 2. Run Setup Script

```bash
# From the meta-bricks-main directory
npm run setup:oasis
```

### 3. Copy Generated Configuration

The script will output a configuration object. Copy this to your MetaBricks site config component.

### 4. Update MetaBricks Wallet Address

In the generated config, update:
```json
"METABRICKS_WALLET_ADDRESS": "YOUR_ACTUAL_SOLANA_WALLET_ADDRESS"
```

## What the Script Does

1. ✅ **Tests OASIS Connection** - Verifies API is accessible
2. ✅ **Creates Site Avatar** - Dedicated avatar for NFT minting
3. ✅ **Gets JWT Token** - Authentication token for API calls
4. ✅ **Tests Authentication** - Verifies token works
5. ✅ **Generates Config** - Ready-to-use configuration

## Troubleshooting

### OASIS API Not Accessible
- Check if OASIS is running
- Verify the BASE_URL in the script
- Check firewall/network settings

### Avatar Creation Fails
- Verify OASIS API endpoints
- Check if avatar already exists
- Review OASIS API logs

### Authentication Fails
- Verify username/password
- Check JWT token expiration
- Review OASIS authentication settings

## Next Steps After Setup

1. **Import Configuration** - Use the site config component
2. **Test Connection** - Use the test buttons in admin panel
3. **Test Minting** - Try minting an NFT with the new flow
4. **Go Live** - Deploy to production when ready

## Security Notes

- 🔒 **Change Default Password** - Update the site avatar password
- 🔒 **Secure JWT Token** - Store token securely, rotate regularly
- 🔒 **Monitor Usage** - Track API calls and set rate limits
- 🔒 **Update Wallet Address** - Use your actual Solana wallet

## Support

If you encounter issues:

1. Check the console output for error details
2. Verify OASIS API is running and accessible
3. Review the OASIS_NFT_MINTING_SETUP.md for detailed information
4. Check OASIS API logs for server-side errors
