// Adapted from https://github.com/ccoenraets/cors-proxy

const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();

const ALLOWED_EMAILS = (process.env.NEWSWEATHER_ALLOWED_EMAILS || '').split(',');
if (ALLOWED_EMAILS.length === 0 || ALLOWED_EMAILS[0] === '') {
  console.warn('No emails found in envvar `NEWSWEATHER_ALLOWED_EMAILS`');
  process.exit(-1);
}

const SENDGRID_API_KEY = process.env.NEWSWEATHER_SENDGRID_API_KEY;
if (!SENDGRID_API_KEY || SENDGRID_API_KEY.length === 0) {
  console.warn('Envvar `NEWSWEATHER_SENDGRID_API_KEY` is empty');
  process.exit(-1);
}

app.use(express.static('static'));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/cors/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));

  if (req.method === 'OPTIONS') {
    res.send();
    return;
  }

  const secondSlashPos = req.originalUrl.indexOf('/', 1);
  if (secondSlashPos === -1) {
    res.send(500);
    return;
  }

  const targetURL = req.originalUrl.slice(secondSlashPos + 1);

  request({ url: targetURL, method: 'GET' }, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  })
    .pipe(res);
});

app.post('/email/:address', (req, res) => {
  const address = req.params.address;

  if (!ALLOWED_EMAILS.includes(address)) {
    res.status(400).send('Bad email');
    return;
  }

  const message = req.body.message;

  if (!message) {
    res.status(400).send('Bad/missing message');
    return;
  }

  exec(`
    curl --request POST \
      --url https://api.sendgrid.com/v3/mail/send \
      --header "Authorization: Bearer ${SENDGRID_API_KEY}" \
      --header 'Content-Type: application/json' \
      --data '{"personalizations": [{"to": [{"email": "${address}"}]}],"from": {"email": "noreply@oriba.xyz"},"subject": "Your Newsweather link","content": [{"type": "text/plain", "value": "${message}"}]}'
  `);

  res.sendStatus(201);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
