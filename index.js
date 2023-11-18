const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const cors = require('cors');

dotenv.config();
// console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;

const app = express();
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

app.get('/t', (req, res) => {
  res.json('test ok');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const createdUser = await User.create({ username, password });
    jwt.sign({ userId: createdUser._id }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookies('token', token).status(201).json('ok');
    });
  } catch (err) {
    if (err) throw err;
  }
});

app.listen(4000);
