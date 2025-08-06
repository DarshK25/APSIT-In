import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const port = 5001; // Different port to avoid conflicts

// CORS configuration matching your main server
const corsOptions = {
  origin: ['https://apsit-in.vercel.app', 'https://apsit-in-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Test cookie setting endpoint
app.post('/test-login', (req, res) => {
  console.log('=== COOKIE DEBUG TEST ===');
  console.log('Headers:', req.headers);
  console.log('Origin:', req.headers.origin);
  
  const cookieOptions = {
    httpOnly: true,
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production"
  };
  
  console.log('Setting cookie with options:', cookieOptions);
  console.log('Environment:', process.env.NODE_ENV);
  
  res.cookie("test-jwt", "test-token-12345", cookieOptions);
  
  res.json({
    success: true,
    message: 'Test cookie set',
    cookieOptions,
    environment: process.env.NODE_ENV
  });
});

// Test cookie reading endpoint
app.get('/test-me', (req, res) => {
  console.log('=== COOKIE READ TEST ===');
  console.log('Received cookies:', req.cookies);
  console.log('Headers:', req.headers);
  
  const token = req.cookies['test-jwt'];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No test cookie found',
      receivedCookies: req.cookies
    });
  }
  
  res.json({
    success: true,
    message: 'Test cookie found',
    token,
    allCookies: req.cookies
  });
});

app.listen(port, () => {
  console.log(`Cookie debug server running on port ${port}`);
  console.log('Test endpoints:');
  console.log(`POST http://localhost:${port}/test-login`);
  console.log(`GET http://localhost:${port}/test-me`);
});
