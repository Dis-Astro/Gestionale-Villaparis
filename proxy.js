const http = require('http');

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: clientReq.url,
    method: clientReq.method,
    headers: { ...clientReq.headers, host: 'localhost:3000' }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    clientRes.writeHead(502, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.listen(8001, '0.0.0.0', () => {
  console.log('[proxy] Running on :8001 → :3000');
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
