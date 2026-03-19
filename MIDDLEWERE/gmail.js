require('dotenv').config();
const { google } = require('googleapis');

const auth = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

auth.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth });

module.exports = { gmail, auth };