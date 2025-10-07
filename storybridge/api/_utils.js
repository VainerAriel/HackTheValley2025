const snowflake = require('snowflake-sdk');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Snowflake connection
const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA
});

// Auth0 JWT verification setup
const auth0Domain = process.env.AUTH0_DOMAIN || process.env.REACT_APP_AUTH0_DOMAIN;
console.log('Auth0 Domain:', auth0Domain);

if (!auth0Domain) {
  console.error('AUTH0_DOMAIN or REACT_APP_AUTH0_DOMAIN environment variable is not set');
  throw new Error('Auth0 domain is required for JWT verification');
}

const client = jwksClient({
  jwksUri: `https://${auth0Domain}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('JWKS client error:', err);
      return callback(err);
    }
    if (!key) {
      console.error('No signing key found for kid:', header.kid);
      return callback(new Error('No signing key found'));
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    if (!signingKey) {
      console.error('No public key found in signing key');
      return callback(new Error('No public key found'));
    }
    callback(null, signingKey);
  });
}

// Auth0 middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, getKey, {
    audience: `https://api.storybites.vip`,
    issuer: `https://${auth0Domain}/`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// CORS headers helper
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
};

module.exports = {
  connection,
  authenticateToken,
  setCorsHeaders
};
