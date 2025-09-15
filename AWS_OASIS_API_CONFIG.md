# AWS OASIS API Configuration

## API Endpoint
- **URL**: `http://44.202.138.7:8080`
- **Authentication Endpoint**: `http://44.202.138.7:8080/api/avatar/authenticate`

## Authentication Credentials
- **Username**: `metabricks_admin`
- **Password**: `Uppermall1!`

## Response Structure
The API returns a nested JWT token structure:
```json
{
  "showDetailedSettings": true,
  "result": {
    "result": {
      "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "avatarId": "5f7daa80-160e-4213-9e81-94500390f31e",
      "username": "metabricks_admin",
      "firstName": "Max",
      "lastName": "Gershfield",
      "fullName": "Max Gershfield",
      "email": "max.gershfield1@gmail.com"
    }
  }
}
```

## Test Command
```bash
curl -X POST http://44.202.138.7:8080/api/avatar/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"metabricks_admin","password":"Uppermall1!"}'
```

## Status
✅ **WORKING** - The AWS endpoint is accessible and returns valid JWT tokens when tested with curl.

## Notes
- The JWT token is nested at `result.result.jwtToken` (not `result.jwtToken`)
- Token expires in 15 minutes
- Server uses chunked transfer encoding
- CORS issues prevent direct frontend access - requires backend proxy

## Files Updated
- `src/app/services/oasis-auth.service.ts`
- `src/app/services/wallet.service.ts`
- `src/app/components/metabricks-wallet/wallet-core.service.ts`
- `src/app/components/metabricks-wallet/oasis-wallet.service.ts`
- `src/app/components/metabricks-wallet/wallet.config.ts`
- `src/app/services/metabricks-config.service.ts`
- `backend/server.js`
- `backend/storage/oasis-storage-utils.js`
