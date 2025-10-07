// server.js
const express = require("express");
const fs = require('fs');
const path = require("path");
const file = path.join(__dirname, 'mappings.json');
const { products, categories } = require("./db");
const { sendToTelegram } = require('./telegramBot');
const { getChatId, setMapping, readAll } = require('./tokenStore');
const { randomUUID } = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json());

// Frontend papkasi
app.use(express.static(path.join(__dirname, "../frontend")));

// API: mahsulotlar va kategoriyalar
app.get("/api/products", (req, res) => {
    res.json({ products, categories });
});

// Yangi mahsulot qo'shish
app.post("/api/products", (req, res) => {
    const { name, price, category, info } = req.body;
    if (!name || !price || !category)
        return res.status(400).json({ message: "Nom, narx va kategoriya majburiy!" });

    const id = products.length ? products[products.length - 1].id + 1 : 1;

    if (!categories.includes(category)) categories.push(category);

    const newProduct = { id, name, price, category, info: info || "", quantity: 0 };
    products.push(newProduct);

    res.status(201).json(newProduct);
});

// Savatga qo'shish/olib tashlash
app.post("/api/cart", (req, res) => {
    const { id, action } = req.body;
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: "Mahsulot topilmadi" });

    if (action === "add") product.quantity++;
    else if (action === "remove" && product.quantity > 0) product.quantity--;

    res.json(product);
});

// Buyurtma yuborish (token orqali chatId topiladi)
app.post("/api/order", async (req, res) => {
    const token = req.body.token || req.headers['x-client-token']; // prefer body
    if (!token) return res.status(400).json({ message: "Token kerak" });

    const chatId = getChatId(token);
    if (!chatId) return res.status(400).json({ message: "Telegram bilan bog'lanmagansiz" });

    const orderItems = products.filter(p => p.quantity > 0);
    if (orderItems.length === 0)
        return res.status(400).json({ message: "Savat bo'sh" });

    await sendToTelegram(chatId, orderItems);

    products.forEach(p => (p.quantity = 0));
    res.json({ message: "Buyurtma yuborildi", order: orderItems });
});

// Token yaratish va link olish
app.get('/api/create-link-token', (req, res) => {
    const token = randomUUID();
    setMapping(token, null); // chatId keyin saqlanadi
    res.json({ token, link: `https://t.me/YOUR_BOT_USERNAME?start=${token}` });
});

// Foydalanuvchi mapping saqlash
app.post('/api/save-mapping', (req, res) => {
    const { token, chatId } = req.body;
    if (!token || !chatId) return res.status(400).send('Bad request');
    setMapping(token, chatId);
    return res.json({ ok: true });
});

module.exports = { setMapping, getChatId, readAll };

// Serverni ishga tushurish
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishlamoqda`));
