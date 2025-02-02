# Express Auth Kit

A complete authentication solution for Express.js applications with support for multiple databases and authentication methods.

## Features

- Multiple Database Support:
  - MongoDB
  - PostgreSQL
  - MySQL
  - Firebase Realtime Database
  
- Authentication Methods:
  - Email/Password
  - Google OAuth 2.0
  - GitHub OAuth
  - JWT tokens
  
- Security Features:
  - CORS configuration
  - Rate limiting
  - XSS protection (via Helmet)
  - CSRF protection
  - Password hashing (bcrypt)
  - Input validation
  - Session management
  
## Installation

```bash
npm install express-auth-kit
```

## Quick Start

```javascript
const express = require('express');
const AuthKit = require('express-auth-kit');

const app = express();

// Initialize AuthKit with your configuration
const authKit = new AuthKit({
  // Database Configuration
  database: {
    type: 'mongodb', // or 'postgresql', 'mysql', 'firebase'
    uri: 'your-mongodb-uri',
    // For SQL databases
    options: {
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      user: 'username',
      password: 'password'
    }
  },
  
  // Authentication Configuration
  auth: {
    jwtSecret: 'your-jwt-secret',
    jwtExpire: '7d',
    
    // OAuth Configuration
    google: {
      clientId: 'your-google-client-id',
      clientSecret: 'your-google-client-secret'
    },
    github: {
      clientId: 'your-github-client-id',
      clientSecret: 'your-github-client-secret'
    }
  },
  
  // Email Configuration
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'your-email@gmail.com',
    pass: 'your-app-specific-password'
  },
  
  // Security Configuration
  security: {
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    }
  }
});

// Connect to database
await authKit.connect();

// Use the auth routes
app.use('/api/auth', authKit.getRouter());

// Protected route example
app.get('/api/protected', 
  authKit.protect(), 
  (req, res) => {
    res.json({ message: 'Protected route accessed successfully' });
  }
);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Environment Variables

Create a `.env` file in your project root:

```env
# Database
DB_TYPE=mongodb
DB_URI=mongodb://localhost:27017/myapp
# For SQL databases
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=username
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify/:token` - Verify email
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/github` - GitHub OAuth login

### Request Examples

#### Register User
```javascript
fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  })
});
```

#### Login User
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});
```

## Security Best Practices

1. Always use HTTPS in production
2. Set secure cookie options
3. Implement proper CORS configuration
4. Use environment variables for sensitive data
5. Regularly update dependencies
6. Implement proper input validation
7. Use rate limiting for API endpoints
8. Enable CSRF protection for forms

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT

## Author

Abhinav Tiwari
