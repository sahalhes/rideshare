require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const PORT = process.env.API_PORT;

// Connect to the database
connectDB();

// Logger 
app.use(logger);
// Middleware that adds the credentials to the request object
app.use(credentials);
// Cors Middleware
app.use(cors(corsOptions));
// Body parser middleware
app.use(express.urlencoded({ extended: false }));
// JSON parser middleware
app.use(express.json());
// Cookie parser middleware
app.use(cookieParser());

// Routes for authentication
app.use('/auth/register', require('./routes/auth/register'));
app.use('/auth/login', require('./routes/auth/login'));
app.use('/auth/refresh', require('./routes/auth/refresh'));
app.use('/auth/logout', require('./routes/auth/logout'));

// Public Routes
app.use('/api/routes', require('./routes/api/routes'));
app.use('/api/getUser', require('./routes/api/getUser'));

// Verify JWT for all routes below this line (private routes)
app.use(verifyJWT);

app.use('/api/trips', require('./routes/api/trips'));
app.use('/api/users', require('./routes/api/users'));

// Error handling middleware
app.use(errorHandler);

// Start the server
mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
