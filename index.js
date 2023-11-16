const express = require('express');

const app = express();

app.get('/test', (req, res) => {
  res.json('test OK');
});

app.listen(4000);
