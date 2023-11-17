const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

dotenv.config();
// console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;

app.get('/t', (req, res) => {
  res.json('test ok');
});

app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    const createdUser = await User.create({username, password});
    jwt.sign({userId: createdUser._id}, jwtSecret).then((err, token) => {
        if (err) throw err;
        res.cookie('token', token).status(201).json('ok')
    });
});

app.listen(4000);
