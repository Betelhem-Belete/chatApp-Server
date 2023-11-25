const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs') 
const User = require('./models/User.js');
const ws = require('ws');

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
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:5173',
    // methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });

app.get('/test', (req, res) =>{
  res.json('test');
})

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

app.post('/login', async (req, res) => {
  const {username, password } = req.body;
  const foundUser = await User.findOne({username});
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if(passOk){
      jwt.sign({userId:foundUser._id, username}, jwtSecret, {}, (err, token) => {
        res.cookie('token', token,  {sameSite:'none', secure:true}).json({
          id: foundUser._id,
        })
      });
    }
  }

});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({ 
      username: username,
      password: hashedPassword });
    jwt.sign({ userId:createdUser._id,username }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
        id: createdUser._id,
      });
    });
  } catch (err) {
    if(err) throw err;
    res.status(500).json({error:"Internal server error"});
  }
});

const server = app.listen(4000, () => {
  console.log('Listening on port');
});

const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req) => {
  // console.log('connected');
  // connection.send('hey');
  // console.log(req.headers);
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
    // console.log(tokenCookieString);
    if(tokenCookieString){
      const token = tokenCookieString.split('=')[1];
      if(token){
        // console.log(token);
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          // console.log(userData);
          const {userId, username} = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }
  // console.log([...wss.clients].map(c => c.username));
  [...wss.clients].forEach(client => {
    client.send(JSON.stringify({
      onLine: [...wss.clients].map(c => ({userId: c.userId, username: c.username}))
    }
    ));
  });
});