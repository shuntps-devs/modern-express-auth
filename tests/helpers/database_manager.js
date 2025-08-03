import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

class TestDatabaseManager {
  constructor() {
    this.mongoServer = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      // Start in-memory MongoDB server
      this.mongoServer = await MongoMemoryServer.create();
      const mongoUri = this.mongoServer.getUri();

      // Disconnect any existing connection first
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      // Connect to the in-memory database with robust options
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 10000,
      });

      // Ensure connection is ready
      await mongoose.connection.db.admin().ping();
      this.isConnected = true;

      console.log('Test database connected successfully');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }
  }

  async clearCollections() {
    if (!this.isConnected || mongoose.connection.readyState !== 1) {
      return;
    }

    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    } catch (error) {
      console.warn('Collection cleanup warning:', error.message);
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      // Close database connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
      }

      // Stop the in-memory MongoDB instance
      if (this.mongoServer) {
        await this.mongoServer.stop();
        this.mongoServer = null;
      }

      this.isConnected = false;
      console.log('Test database disconnected successfully');
    } catch (error) {
      console.warn('Database cleanup warning:', error.message);
    }
  }

  getConnectionState() {
    return {
      isConnected: this.isConnected,
      mongooseState: mongoose.connection.readyState,
      serverRunning: !!this.mongoServer,
    };
  }
}

// Export singleton instance
export const testDbManager = new TestDatabaseManager();
