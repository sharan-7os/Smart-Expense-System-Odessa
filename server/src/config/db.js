const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campussplit';
    const conn = await mongoose.connect(connStr);
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[MongoDB Connection Error]: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
