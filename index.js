const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User.js');

dotenv.config();
// console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL);
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});
const jwtSecret = process.env.JWT_SECRET;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:5173',
    // methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
);

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });

app.get('/profile', (req, res) => {
  const token = req.cookies?.token;
  if (token){
    jwt.verify(token, jwtSecret, {}, (err, userData)=> {
      if (err) throw err;
      const {id, username} = userData;
      res.json(userData);
    });
  } else{
    res.status(401).json('no token');
  }
});

app.get('/test', (req, res) => {
  res.json('test ok');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const createdUser = await User.create({ username, password });
    jwt.sign({ userId:createdUser._id }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token, {sameSite:'none'}).status(201).json({
        id: createdUser._id,
        username,
      });
    });
  } catch (err) {
    if(err) throw err;
    res.status(500).json({error:"Internal server error"});
  }
});

app.listen(4000, () => {
  console.log('Listening on port');
});
