/**
 * Cloudflare Worker HTTPS Proxy for OASIS API
 * 
 * This worker provides an HTTPS endpoint that proxies requests to the HTTP-only OASIS API.
 * It solves the Heroku HTTP blocking issue by providing an HTTPS face for the OASIS API.
 * 
 * Deployment:
 * 1. Go to Cloudflare Workers dashboard
 * 2. Create a new worker
 * 3. Paste this code
 * 4. Deploy and get the worker URL
 * 5. Update OASIS_API_URL in Heroku to use the worker URL
 */

export default {
  async fetch(req, env, ctx) {
    const incoming = new URL(req.url);
    
    // Security: Only allow specific OASIS API paths
    const ALLOWED_PATHS = [
      '/api/avatar/authenticate',
      '/api/nft/mint-nft',
      '/api/provider/register-provider',
      '/api/provider/activate-provider'
    ];
    
    if (!ALLOWED_PATHS.some(path => incoming.pathname.startsWith(path))) {
      return new Response(JSON.stringify({ 
        error: 'Path not allowed',
        allowed: ALLOWED_PATHS 
      }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // Optional: Add shared secret authentication
    // Uncomment and set PROXY_SECRET in worker environment if needed
    /*
    const proxySecret = req.headers.get('x-oasis-proxy-key');
    if (!proxySecret || proxySecret !== env.PROXY_SECRET) {
      return new Response(JSON.stringify({ error: 'Missing or invalid proxy key' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    */
    
    // Map worker route to OASIS API
    // Example: https://oasis-proxy.yourworker.workers.dev/api/... -> http://oasisweb4.one/api/...
    const target = new URL(req.url);
    target.hostname = "oasisweb4.one";
    target.protocol = "http:";
    
    console.log(`Proxying ${req.method} ${incoming.pathname} to ${target.toString()}`);
    
    // Copy headers but drop hop-by-hop ones
    const headers = new Headers(req.headers);
    const hopByHopHeaders = [
      "host", "content-length", "connection", "transfer-encoding", 
      "keep-alive", "proxy-authenticate", "proxy-authorization", 
      "te", "trailers", "upgrade"
    ];
    hopByHopHeaders.forEach(h => headers.delete(h));
    
    // Prepare request options
    const init = {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
      redirect: "follow"
    };
    
    try {
      // Make request to OASIS API
      const resp = await fetch(target.toString(), init);
      
      // Pass back response, again drop hop-by-hop headers
      const respHeaders = new Headers(resp.headers);
      const hopByHopRespHeaders = [
        "connection", "transfer-encoding", "keep-alive", 
        "proxy-authenticate", "proxy-authorization", 
        "te", "trailers", "upgrade"
      ];
      hopByHopRespHeaders.forEach(h => respHeaders.delete(h));
      
      // Add CORS headers for browser requests (if needed)
      respHeaders.set('Access-Control-Allow-Origin', '*');
      respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-oasis-proxy-key');
      
      console.log(`Response: ${resp.status} ${resp.statusText}`);
      
      return new Response(resp.body, { 
        status: resp.status, 
        statusText: resp.statusText, 
        headers: respHeaders 
      });
      
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(JSON.stringify({ 
        error: 'Proxy error', 
        message: error.message 
      }), { 
        status: 502, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  }
};
