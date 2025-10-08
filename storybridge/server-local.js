const express = require('express');
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'https://www.storybites.vip'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the api directory
app.use('/api', express.static(path.join(__dirname, 'api')));

// Proxy API routes to Vercel for testing
// This allows you to test your frontend changes while using the production backend
app.use('/api', createProxyMiddleware({
  target: 'https://www.storybites.vip',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to production backend`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Backend connection failed' });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Local development server running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Local Development Server Running');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Frontend: http://localhost:3000`);
  console.log(`🔗 API Proxy: http://localhost:${PORT}/api`);
  console.log('='.repeat(50) + '\n');
  console.log('📝 Note: This server proxies API calls to production backend');
  console.log('📝 Your frontend changes will be tested locally');
  console.log('📝 Backend data comes from production environment\n');
});
