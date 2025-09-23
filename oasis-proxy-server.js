/**
 * Simple Node.js HTTPS Proxy for OASIS API
 * 
 * Alternative to Cloudflare Worker - deploy this to Render, Fly, or any HTTPS-capable platform.
 * 
 * Usage:
 * 1. Deploy this to Render/Fly/etc
 * 2. Set OASIS_API_URL to the deployed HTTPS URL
 * 3. Optionally set PROXY_SHARED_SECRET for additional security
 */

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// Very strict allowlist - only allow OASIS API paths we actually use
const ALLOWED_PATHS = new Set([
  "/api/avatar/authenticate",
  "/api/nft/mint-nft", 
  "/api/provider/register-provider",
  "/api/provider/activate-provider"
]);

// Security: Check if path is allowed
function checkPath(req, res, next) {
  const url = new URL(req.url, "http://x");
  if (ALLOWED_PATHS.has(url.pathname)) {
    console.log(`✅ Allowed path: ${url.pathname}`);
    return next();
  }
  console.log(`❌ Blocked path: ${url.pathname}`);
  return res.status(403).json({ 
    error: "Path not allowed",
    allowed: Array.from(ALLOWED_PATHS)
  });
}

// Optional: Authentication between your backend and proxy
function checkSecret(req, res, next) {
  const key = req.get("x-oasis-proxy-key");
  if (!process.env.PROXY_SHARED_SECRET) {
    // No secret configured, allow all requests
    return next();
  }
  
  if (key && key === process.env.PROXY_SHARED_SECRET) {
    console.log(`✅ Valid proxy key provided`);
    return next();
  }
  
  console.log(`❌ Invalid proxy key`);
  return res.status(401).json({ 
    error: "Missing or invalid proxy key" 
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'oasis-proxy',
    timestamp: new Date().toISOString(),
    allowedPaths: Array.from(ALLOWED_PATHS)
  });
});

// Apply security middleware
app.use(checkSecret);
app.use(checkPath);

// Proxy configuration
app.use(
  "/",
  createProxyMiddleware({
    target: "http://oasisweb4.one",
    changeOrigin: true,
    secure: false,        // allow HTTP origin
    xfwd: true,
    followRedirects: true,
    proxyTimeout: 30000,
    timeout: 30000,
    headers: { 
      connection: "close" // avoid keep alive issues
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Proxying ${req.method} ${req.path} to OASIS API`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`✅ Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
      
      // Add CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-oasis-proxy-key';
    },
    onError: (err, req, res) => {
      console.error(`❌ Proxy error:`, err.message);
      res.status(502).json({
        error: 'Proxy error',
        message: err.message
      });
    }
  })
);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`🚀 OASIS Proxy server running on port ${port}`);
  console.log(`📋 Allowed paths: ${Array.from(ALLOWED_PATHS).join(', ')}`);
  console.log(`🔐 Secret protection: ${process.env.PROXY_SHARED_SECRET ? 'Enabled' : 'Disabled'}`);
});
