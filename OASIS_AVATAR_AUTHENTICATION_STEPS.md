# OASIS Avatar Authentication Steps

## Overview
This document provides the exact steps required to create and authenticate an OASIS avatar for use with the OASIS NFT API. This is essential for minting NFTs and interacting with the OASIS platform.

## Prerequisites
- Access to an OASIS API endpoint
- Basic understanding of REST API calls
- A tool to make HTTP requests (Postman, curl, or similar)

## Step-by-Step Authentication Process

### Step 1: Verify OASIS API Health
**Endpoint:** `GET /health`
**Purpose:** Confirm the OASIS API is accessible and running

```bash
curl -X GET "https://your-oasis-api-url/health"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Step 2: Create a New Avatar
**Endpoint:** `POST /api/avatar`
**Purpose:** Create a new avatar account in the OASIS system

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "your-avatar-name",
  "email": "your-email@example.com",
  "password": "your-secure-password",
  "avatarType": "User",
  "createdOASISType": "OASISAPIREST",
  "acceptTerms": true
}
```

**Field Descriptions:**
- `username`: Unique identifier for your avatar (required)
- `email`: Valid email address (required)
- `password`: Minimum 6 characters (required)
- `avatarType`: Either "User" or "Wizard" (required)
- `createdOASISType`: Must be "OASISAPIREST" for API access (required)
- `acceptTerms`: Must be true to accept terms (required)

**Example cURL:**
```bash
curl -X POST "https://your-oasis-api-url/api/avatar" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "metabricks-site",
    "email": "admin@metabricks.com",
    "password": "securepassword123",
    "avatarType": "User",
    "createdOASISType": "OASISAPIREST",
    "acceptTerms": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "avatar": {
    "id": "generated-avatar-id",
    "avatarId": "generated-avatar-id",
    "username": "metabricks-site",
    "email": "admin@metabricks.com",
    "avatarType": "User",
    "createdOASISType": "OASISAPIREST"
  }
}
```

**Important:** Save the `id` or `avatarId` from the response - this is your Avatar ID.

### Step 3: Authenticate the Avatar
**Endpoint:** `POST /api/auth/login`
**Purpose:** Obtain a JWT authentication token for the created avatar

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "your-avatar-name",
  "password": "your-secure-password"
}
```

**Example cURL:**
```bash
curl -X POST "https://your-oasis-api-url/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "metabricks-site",
    "password": "securepassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "avatar": {
    "id": "your-avatar-id",
    "username": "metabricks-site"
  }
}
```

**Important:** Save the `token` from the response - this is your JWT Authentication Token.

### Step 4: Verify Authentication
**Endpoint:** `GET /api/avatar`
**Purpose:** Confirm the JWT token is valid and the avatar is authenticated

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example cURL:**
```bash
curl -X GET "https://your-oasis-api-url/api/avatar" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response:**
```json
{
  "success": true,
  "avatar": {
    "id": "your-avatar-id",
    "username": "metabricks-site",
    "email": "admin@metabricks.com",
    "avatarType": "User"
  }
}
```

## Required Credentials Summary

After completing the above steps, you will have:

1. **Avatar ID:** The unique identifier for your OASIS avatar
2. **JWT Token:** The authentication token for API access
3. **API Base URL:** The base URL of your OASIS API

## Configuration Format

These credentials should be configured in your application as:

```json
{
  "OASIS": {
    "SITE_AVATAR_ID": "your-avatar-id",
    "SITE_AVATAR_TOKEN": "your-jwt-token",
    "API_BASE_URL": "https://your-oasis-api-url"
  }
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Username is required", "Password must be at least 6 characters"]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "Username already exists"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Security Considerations

1. **Password Strength:** Use a strong, unique password
2. **Token Storage:** Store JWT tokens securely
3. **Token Expiration:** JWT tokens may expire - implement refresh logic
4. **HTTPS:** Always use HTTPS for API communication
5. **Rate Limiting:** Be aware of API rate limits

## Testing the Complete Flow

To verify everything works, test this sequence:

1. ✅ Health check: `GET /health`
2. ✅ Create avatar: `POST /api/avatar`
3. ✅ Login: `POST /api/auth/login`
4. ✅ Verify auth: `GET /api/avatar`

If all steps return success responses, your avatar is properly authenticated and ready for use.

## Troubleshooting

### Avatar Creation Fails
- Verify all required fields are provided
- Check that `acceptTerms` is true
- Ensure username is unique
- Confirm email format is valid

### Authentication Fails
- Verify username and password match
- Check that the avatar was created successfully
- Ensure the API endpoint is correct

### API Calls Fail After Authentication
- Verify the JWT token is included in Authorization header
- Check that the token hasn't expired
- Confirm the API base URL is correct

## Next Steps

Once authentication is complete, you can:
1. Use the avatar credentials for NFT minting
2. Make authenticated API calls to OASIS services
3. Integrate with the MetaBricks NFT minting system
4. Access avatar-specific OASIS features

---

**Note:** This document assumes a standard OASIS API implementation. Specific endpoints and response formats may vary depending on your OASIS instance configuration.
