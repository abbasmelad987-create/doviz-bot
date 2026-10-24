const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(express.json());
let latestPrices = { sp_today: {}, whatsapp: {}, last_update: new Date() };

app.get('/', (req, res) => res.send('Doviz Bot Running ✅ - Check logs for QR'));
app.get('/prices', (req, res) => res.json(latestPrices));
app.get('/api/for-accounting', (req, res) => res.json(latestPrices));
app.listen(10000, () => console.log('Server on 10000'));

async function getSpToday() {
  try {
    const { data } = await axios.get('https://sp-today.com/', { headers: {'User-Agent': 'Mozilla/5.0'} });
    const $ = cheerio.load(data);
    const text = $('body').text();
    const match = text.match(/دولار.*?(\d{4,5})/g);
    latestPrices.sp_today = { prices: match ? match.slice(0,10) : 'loading', time: new Date() };
    latestPrices.last_update = new Date();
  } catch(e){}
}
setInterval(getSpToday, 300000);
getSpToday();

const client = new Client({ authStrategy: new LocalAuth(), puppeteer: { args: ['--no-sandbox'] } });
client.on('qr', qr => { qrcode.generate(qr, {small: true}); console.log(qr); });
client.on('ready', () => console.log('WhatsApp Ready ✅'));
client.on('message', async msg => {
  const chat = await msg.getChat();
  if(chat.isGroup){
    if(msg.body.includes('دولار') || /\d{4,5}/.test(msg.body)){
      latestPrices.whatsapp[chat.name] = { text: msg.body, time: new Date() };
      latestPrices.last_update = new Date();
    }
  }
});
client.initialize();
