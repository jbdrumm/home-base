// ─────────────────────────────────────────────────────────────
//  fetch-weather-scheduled.js
//  Scheduled wrapper around fetch-weather — runs every 30 min.
//  Kept separate from fetch-weather.js so manual POST calls
//  to fetch-weather still work without being rejected.
// ─────────────────────────────────────────────────────────────
const { schedule } = require('@netlify/functions');
const { handler }  = require('./fetch-weather');

exports.handler = schedule('*/30 * * * *', handler);
