const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const passport = require('passport');
const DatabaseManager = require('./config/database');
const AuthStrategies = require('./auth/strategies');
const UserModel = require('./models/User');

class AuthKit {
  constructor(config = {}) {
    this.config = {
      port: config.port || process.env.PORT || 3000,
      database: config.database || {
        type: process.env.DB_TYPE || 'mongodb',
        uri: process.env.DB_URI,
        options: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD
        }
      },
      auth: {
        jwtSecret: config.auth?.jwtSecret || process.env.JWT_SECRET,
        jwtExpire: config.auth?.jwtExpire || process.env.JWT_EXPIRE || '7d',
        google: config.auth?.google || {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        },
        github: config.auth?.github || {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET
        }
      },
      smtp: config.smtp || {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      security: config.security || {
        cors: {
          origin: config.security?.cors?.origin || [
            `http://localhost:${config.port || process.env.PORT || 3000}`
          ],
          credentials: true
        },
        rateLimit: {
          windowMs: 15 * 60 * 1000,
          max: 100
        },
        session: {
          secret: process.env.SESSION_SECRET || 'your-secret-key',
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          }
        }
      },
      baseUrl: config.baseUrl || `http://localhost:${config.port || process.env.PORT || 3000}`
    };

    this.app = express();
    this.db = new DatabaseManager(this.config.database);
    this.router = express.Router();
  }

  async initialize() {
    // Connect to database
    await this.db.connect();

    // Initialize authentication strategies
    this.authStrategies = new AuthStrategies({
      ...this.config.auth,
      baseUrl: this.config.baseUrl
    }, UserModel);

    // Setup middleware and routes
    this.setupMiddleware();
    this.setupRoutes();

    return this;
  }

  setupMiddleware() {
    // Basic middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors(this.config.security.cors));
    this.app.use(rateLimit(this.config.security.rateLimit));
    
    // Initialize passport
    this.app.use(this.authStrategies.initialize());
    
    // Redis session store
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL);
      this.app.use(session({
        ...this.config.security.session,
        store: new RedisStore({ client: redis })
      }));
    } else {
      this.app.use(session(this.config.security.session));
    }
    
    // CSRF protection
    this.app.use(csrf({ cookie: true }));
    
    // Error handlers
    this.app.use((err, req, res, next) => {
      if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
          success: false,
          message: 'Invalid CSRF token'
        });
      }
      next(err);
    });
  }

  setupRoutes() {
    // Mount auth routes
    this.app.use('/auth', require('./routes/auth'));
    
    // OAuth routes
    if (this.config.auth.google?.clientId) {
      this.app.get('/auth/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
      );
      
      this.app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/login' }),
        (req, res) => res.redirect('/')
      );
    }
    
    if (this.config.auth.github?.clientId) {
      this.app.get('/auth/github',
        passport.authenticate('github', { scope: ['user:email'] })
      );
      
      this.app.get('/auth/github/callback',
        passport.authenticate('github', { failureRedirect: '/login' }),
        (req, res) => res.redirect('/')
      );
    }

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    });
  }

  start() {
    return new Promise((resolve) => {
      const server = this.app.listen(this.config.port, () => {
        console.log(`Server running on port ${this.config.port}`);
        resolve(server);
      });
    });
  }

  getApp() {
    return this.app;
  }

  getRouter() {
    return this.router;
  }

  protect() {
    return passport.authenticate('jwt', { session: false });
  }

  async disconnect() {
    await this.db.disconnect();
  }
}

module.exports = AuthKit;