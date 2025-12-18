const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Routes
const houseRoutes = require('./routes/houseRoutes');
const userRoutes = require('./routes/userRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes'); // <--- 1. ADD THIS IMPORT

dotenv.config();
connectDB();

const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

// Use Routes
app.use('/api/houses', houseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/maintenance', maintenanceRoutes); // <--- 2. ADD THIS ROUTE


const PORT = process.env.PORT || 5000;
// server.js
app.listen(5000, '0.0.0.0', () => console.log('Server running on port 5000'));

