const path = require('path');
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware');

const app = express();

dotenv.config({ path: './config/config.env' });

connectDB();

const { auth, users, posts } = require('./routes');

// Body parser
app.use(express.json());

app.use(cors());

app.use(cookieParser());

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(fileUpload());

app.use(express.static(path.join(__dirname, 'public')));
// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/posts', posts);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle global unhandled promise rejectioxns
process.on('unhandledRejection', (err, data) => {
  console.log(`Error: ${err.message}`.red);
  server.close(() => process.exit(1));
});
