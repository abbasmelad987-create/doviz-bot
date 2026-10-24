const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');

const app = express();
let prices = {};

async function getPrice() {
  try {
    const { data } = await axios.get('https://sp-today.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    console.log('Fetched sp-today');
    prices = { raw: $('body').text().substring(0,200), time: new Date().toISOString() };
  } catch (e) {
    console.log('Error:', e.message);
  }
}

setInterval(getPrice, 300000);
getPrice();

app.get('/', (req,res) => res.send('Bot is running'));
app.get('/prices', (req,res) => res.json(prices));
app.listen(10000, () => console.log('Server on 10000'));

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox'] }
});

client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
  console.log('QR READY');
});
client.on('ready', () => console.log('Client ready!'));
client.on('message', async msg => {
  if(msg.body.includes('سعر') || msg.body.toLowerCase().includes('dolar')) {
    msg.reply(`السعر: ${JSON.stringify(prices)}`);
  }
});
client.initialize();
