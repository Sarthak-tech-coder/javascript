require("dotenv").config()
const express = require('express');
const path = require('path');
const mongoose = require("mongoose")
const cors = require('cors');
const app = express();
const port = process.env.PORT || 9000
const rateLimit = require('express-rate-limit')
var morgan = require('morgan')
app.use(cors());
app.use(express.json())
app.use(express.json({
  type: ['application/json', 'text/plain']
}))
app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
}))
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use("/MFAPI", require('./src/router/MFA.js'))
app.use("/UserAPI", require("./src/router/User.js"))
app.use("/youtubeAPI", require("./src/router/Youtube.js"))
app.use("/nlp", require("./src/router/nlp.js"))
app.get('/api', (req, res) => {
  res.status(200).send({ message: 'Welcome to backend!' });
});

mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGOOSE_CONNECTION_STRING).then(() => {
  app.listen(port, () => {
    console.log(`Listening at localhost:${port}/api`);

  }).on('error', console.error);

}).catch(() => {
  console.log("Connection failed, server terminated")
})
