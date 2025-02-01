const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');

class AuthStrategies {
  constructor(config, userModel) {
    this.config = config;
    this.userModel = userModel;
  }

  initialize() {
    this.setupJwtStrategy();
    
    if (this.config.google?.clientId && this.config.google?.clientSecret) {
      this.setupGoogleStrategy();
    }
    
    if (this.config.github?.clientId && this.config.github?.clientSecret) {
      this.setupGithubStrategy();
    }

    return passport.initialize();
  }

  setupJwtStrategy() {
    const opts = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: this.config.jwtSecret
    };

    passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await this.userModel.findById(jwt_payload.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    }));
  }

  setupGoogleStrategy() {
    passport.use(new GoogleStrategy({
      clientID: this.config.google.clientId,
      clientSecret: this.config.google.clientSecret,
      callbackURL: `${this.config.baseUrl}/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await this.userModel.findOne({ googleId: profile.id });
        
        if (!user) {
          user = await this.userModel.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            isEmailVerified: true
          });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }));
  }

  setupGithubStrategy() {
    passport.use(new GitHubStrategy({
      clientID: this.config.github.clientId,
      clientSecret: this.config.github.clientSecret,
      callbackURL: `${this.config.baseUrl}/auth/github/callback`
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await this.userModel.findOne({ githubId: profile.id });
        
        if (!user) {
          user = await this.userModel.create({
            githubId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            isEmailVerified: true
          });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }));
  }
}

module.exports = AuthStrategies;