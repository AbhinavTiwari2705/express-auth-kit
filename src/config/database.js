const mongoose = require('mongoose');
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');

class DatabaseManager {
  constructor(config) {
    this.config = config;
    this.type = config.type;
    this.connection = null;
  }

  async connect() {
    switch (this.type) {
      case 'mongodb':
        await this.connectMongoDB();
        break;
      case 'postgresql':
        await this.connectPostgreSQL();
        break;
      case 'mysql':
        await this.connectMySQL();
        break;
      case 'firebase':
        await this.connectFirebase();
        break;
      default:
        throw new Error(`Unsupported database type: ${this.type}`);
    }
  }

  async connectMongoDB() {
    try {
      this.connection = await mongoose.connect(this.config.uri);
      console.log('MongoDB Connected');
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
      throw err;
    }
  }

  async connectPostgreSQL() {
    try {
      const pool = new Pool(this.config.options);
      await pool.connect();
      this.connection = pool;
      console.log('PostgreSQL Connected');
    } catch (err) {
      console.error('PostgreSQL connection error:', err.message);
      throw err;
    }
  }

  async connectMySQL() {
    try {
      this.connection = await mysql.createConnection(this.config.options);
      console.log('MySQL Connected');
    } catch (err) {
      console.error('MySQL connection error:', err.message);
      throw err;
    }
  }

  async connectFirebase() {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(this.config.serviceAccount),
        databaseURL: this.config.databaseURL
      });
      this.connection = admin.database();
      console.log('Firebase Connected');
    } catch (err) {
      console.error('Firebase connection error:', err.message);
      throw err;
    }
  }

  getConnection() {
    return this.connection;
  }

  async disconnect() {
    switch (this.type) {
      case 'mongodb':
        await mongoose.disconnect();
        break;
      case 'postgresql':
        await this.connection.end();
        break;
      case 'mysql':
        await this.connection.end();
        break;
      case 'firebase':
        await admin.app().delete();
        break;
    }
  }
}

module.exports = DatabaseManager;