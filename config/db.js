const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // You will replace this string with your real MongoDB Atlas URL later
    // For now, we can use a local one or a cloud string
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;