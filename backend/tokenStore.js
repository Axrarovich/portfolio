// backend/tokenStore.js
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'mappings.json');

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
  } catch (e) {
    return {};
  }
}

function saveAll(obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
}

function setMapping(token, chatId) {
  const all = readAll();
  all[token] = { chatId, createdAt: Date.now() };
  saveAll(all);
}

function getChatId(token) {
  const all = readAll();
  return all[token] ? all[token].chatId : null;
}

module.exports = { setMapping, getChatId, readAll };
