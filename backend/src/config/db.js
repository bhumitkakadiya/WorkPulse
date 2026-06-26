const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Use memory server if no real URI is provided
    if (!uri || uri === 'your_mongodb_atlas_connection_string_here' || uri.includes('cluster0.mongodb.net')) {
      console.log('⚠️ No valid MONGO_URI found. Starting MongoDB Memory Server for local testing...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }

    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    if (mongoServer) {
      const { seed } = require('../utils/seeder');
      await seed(true);
    }

  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
