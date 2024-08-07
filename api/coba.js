const fetch = require('node-fetch');
const FormData = require('form-data');
const https = require('https');
const { JSDOM } = require('jsdom');

// Fungsi untuk menghasilkan huruf acak
function getRandomChar() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

// Fungsi untuk mengganti satu karakter dalam string
function getRandomizedClientId(clientId) {
  const randomIndex = Math.floor(Math.random() * clientId.length);
  return clientId.slice(0, randomIndex) + getRandomChar() + clientId.slice(randomIndex + 1);
}

const API_URL = 'https://chatgptfree.onl/wp-admin/admin-ajax.php';
const TARGET_URL = 'https://chatgptfree.onl/';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const prompt = req.query.isi || 'hi';

    // Ambil data nonce dari halaman target
    const nonce = await new Promise((resolve, reject) => {
      https.get(TARGET_URL, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
          data += chunk;
        });

        // The whole response has been received.
        resp.on('end', () => {
          const dom = new JSDOM(data);
          const nonceElement = dom.window.document.querySelector('div[class="wpaicg-chat-shortcode"]');
          if (nonceElement && nonceElement.dataset.nonce) {
            resolve(nonceElement.dataset.nonce);
          } else {
            reject('Nonce not found');
          }
        });
      }).on('error', (err) => {
        reject(`Error fetching nonce: ${err.message}`);
      });
    });

    const form = new FormData();
    form.append('_wpnonce', nonce);
    form.append('post_id', '221');
    form.append('url', 'https://chatgptfree.onl');
    form.append('action', 'wpaicg_chat_shortcode_message');
    form.append('message', prompt);
    form.append('bot_id', '0');
    form.append('chatbot_identity', 'shortcode');
    
    // Mengganti salah satu huruf pada wpaicg_chat_client_id dengan karakter acak
    const clientId = 'MKEOkxageh';
    const randomizedClientId = getRandomizedClientId(clientId);
    form.append('wpaicg_chat_client_id', randomizedClientId);
    
    form.append('wpaicg_chat_history', '["Human: hay"]');

    const HEADERS = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Redmi Note 7 Build/QKQ1.190910.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.188 Mobile Safari/537.36',
      ...form.getHeaders()
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: HEADERS,
      body: form
    });

    const data = await response.json();
    const replyText = data.data || 'No reply received';

    res.status(200).send(replyText);

  } catch (error) {
    res.status(500).send({ error: `An error occurred: ${error.message}` });
  }
};
