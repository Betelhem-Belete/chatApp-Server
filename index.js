const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');

dotenv.config();
// console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL);

app.get('/t', (req, res) => {
  res.json('test ok');
});

app.post('/register', (req, res) => {});

app.listen(4000);
