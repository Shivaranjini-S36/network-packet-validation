const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connect to MongoDB using Mongoose.
 * If connection fails or no URI is provided, graceful fallback is maintained.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/network_packet_db';
  const dbName = process.env.DB_NAME || 'network_packet_db';

  try {
    const conn = await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 3000
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[MongoDB] Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB] Connection attempt failed: ${error.message}`);
    console.warn(`[Storage] Operating with Local JSON Persistence Fallback Engine.`);
    return false;
  }
};

/**
 * Get current database status.
 */
const getStatus = () => {
  const ready = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  return {
    connected: isConnected && ready === 1,
    readyState: ready,
    stateDescription: statusMap[ready] || 'Unknown',
    host: mongoose.connection.host || 'Local Storage Engine',
    dbName: mongoose.connection.name || 'network_packet_db',
    mode: (isConnected && ready === 1) ? 'MongoDB' : 'Local Fallback Storage'
  };
};

module.exports = { connectDB, getStatus };
