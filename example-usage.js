const express = require('express');
const AuthKit = require('@abhinavtiwari2705/express-auth-kit');

async function startServer() {
  try {
    const authKit = new AuthKit({
      port: process.env.PORT || 3000,
      database: {
        type: 'mongodb',
        uri: process.env.MONGODB_URI
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET,
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }
      }
    });

    // Initialize AuthKit
    await authKit.initialize();

    // Get Express app instance
    const app = authKit.getApp();

    // Add protected route
    app.get('/api/protected', 
      authKit.protect(), 
      (req, res) => {
        res.json({ message: 'Protected route', user: req.user });
      }
    );

    // Start the server
    await authKit.start();
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();