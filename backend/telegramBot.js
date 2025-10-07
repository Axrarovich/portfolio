// backend/telegramBot.js
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios'); // npm i axios
const { setMapping } = require('./tokenStore'); // agar serverga to'g'ridan-to'g'ri yozishni xohlasangiz

const token = "8275895226:AAE6IKLDFiDFwDB84iBHp_sbEZ0fk6G8ZJI";
const bot = new TelegramBot(token, { polling: true });

// Variant A: bot o'zi lokal faylga yozsa (soddaroq)
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const param = match && match[1] ? match[1].trim() : null;
    if (!param) {
        // Foydalanuvchiga ko'rsatma
        bot.sendMessage(chatId, "Xush kelibsiz! Agar siz veb-saytga buyurtma yubormoqchi bo'lsangiz, iltimos vebda 'Connect to Telegram' tugmasiga bosing.");
        return;
    }

    // param = token — biz uni mappingga yozamiz
    try {
        // Agar siz tokenStore.js dan foydalanayotgan bo'lsangiz to'g'ridan-to'g'ri yozing:
        setMapping(param, chatId);
        bot.sendMessage(chatId, "Siz muvaffaqiyatli bog'landingiz — endi vebdan buyurtma yuborsangiz, men sizga xabar yuboraman.");
        console.log(`Mapped token ${param} -> chat ${chatId}`);
    } catch (err) {
        console.error("Mapping error:", err);
        bot.sendMessage(chatId, "Xato yuz berdi, iltimos qayta urinib ko'ring.");
    }

    // Alternativ: agar mappingni boshqa serverga yubormoqchi bo'lsangiz:
    // await axios.post('http://localhost:3000/api/save-mapping', { token: param, chatId });
});

async function sendToTelegram(chatId, orderItems) {
    let message = "📦 Yangi buyurtma:\n\n";
    orderItems.forEach(item => {
        message += `• ${item.name} (${item.category}) - ${item.quantity} ta - $${item.price}\n`;
    });
    try {
        await bot.sendMessage(chatId, message);
        console.log("Sent order to", chatId);
    } catch (err) {
        console.error("Failed to send:", err);
    }
}

module.exports = { sendToTelegram, bot };
