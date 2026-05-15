const fs = require('fs');
const config = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY             || '',
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN         || '',
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID          || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             process.env.REACT_APP_FIREBASE_APP_ID              || '',
};
const output = `// Auto-generated — do not edit\nself.__FB_CONFIG__ = ${JSON.stringify(config)};\n`;
fs.writeFileSync('public/firebase-config.js', output);
console.log('[Build] Generated public/firebase-config.js');
