# 🚀 Local Development Setup

This guide helps you set up a local development environment to test your changes without affecting production.

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Your environment variables (already configured in `.env.local`)

## 🛠️ Development Options

### Option 1: Full Local Development (Recommended)
**Test your frontend changes with production backend data**

```bash
# Start both frontend and proxy server
npm run dev
```

This will:
- Start React frontend on `http://localhost:3000`
- Start proxy server on `http://localhost:3001`
- Proxy API calls to production backend
- Allow you to test frontend changes safely

### Option 2: Frontend Only
**Test just the frontend with local proxy**

```bash
# Terminal 1: Start proxy server
npm run dev:server

# Terminal 2: Start frontend
npm run dev:frontend
```

### Option 3: Frontend Only (Manual)
**If you prefer manual control**

```bash
# Terminal 1: Start proxy server
node server-local.js

# Terminal 2: Start React with local API
REACT_APP_API_URL=http://localhost:3001 npm start
```

## 🔧 How It Works

1. **Frontend** runs on `http://localhost:3000`
2. **Proxy Server** runs on `http://localhost:3001`
3. **API calls** from frontend go to `http://localhost:3001/api`
4. **Proxy server** forwards requests to production backend
5. **Your changes** are tested locally without affecting production

## 📁 Project Structure

```
storybridge/
├── src/                    # Your reorganized frontend code
├── api/                    # Vercel API routes (production backend)
├── server-local.js         # Local proxy server
├── .env.local             # Local environment variables
└── package.json           # Updated with dev scripts
```

## 🎯 Testing Your Changes

1. **Start development environment**:
   ```bash
   npm run dev
   ```

2. **Open browser** to `http://localhost:3000`

3. **Test your changes**:
   - Component reorganization
   - Import path updates
   - New utility functions
   - UI improvements

4. **Check console** for any errors

5. **Verify functionality**:
   - Authentication works
   - Story generation works
   - Audio playback works
   - All features function correctly

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 3001
npx kill-port 3001
```

### Environment Variables Not Loading
- Check `.env.local` file exists
- Restart development server
- Clear browser cache

### API Connection Issues
- Check proxy server is running on port 3001
- Verify production backend is accessible
- Check network connectivity

## 📝 Development Notes

- **Frontend changes** are tested locally
- **Backend data** comes from production
- **No production impact** from your changes
- **Safe testing** environment
- **Real data** for realistic testing

## 🚀 Next Steps

1. **Test your changes** thoroughly
2. **Fix any issues** that arise
3. **Verify all functionality** works
4. **Deploy to production** when ready

Happy coding! 🎉
