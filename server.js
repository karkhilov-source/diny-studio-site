// server.js - ГОТОВЫЙ для копирования (фикс Telegram + логи)
require('dotenv').config();
const path = require('path');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

//app.use(helmet());  // раскомментируй после npm i helmet

// --- 1. Настройка статики (frontend) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. Настройка multer для загрузки фото ---
const upload = multer({
  dest: path.join(__dirname, 'uploads/'),
  limits: {
    fileSize: 8 * 1024 * 1024 // 8 MB
  }
});

// --- 3. Маршрут формы: POST /apply ---
app.post(
  '/apply',
  (req, res, next) => {
    upload.single('photo')(req, res, function (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send(`
          <html>
            <head><meta charset="utf-8"><title>Ошибка загрузки</title>
            <style>body{background:#050308;color:#FCCCDC;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;}.btn{margin-top:20px;padding:12px 24px;background:#F535AA;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;}</style>
            </head>
            <body>
              <div>
                <h1>Фото слишком большое</h1>
                <p>Максимум 8 МБ. Попробуй фото поменьше.</p>
                <a href="/" class="btn">← Вернуться</a>
              </div>
            </body>
          </html>
        `);
      }
      if (err) {
        console.error('Multer error:', err);
        return res.status(500).send('Ошибка загрузки. Попробуй снова.');
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log('--- НОВАЯ АНКЕТА ---');
      console.log('BODY:', req.body);
      console.log('FILE:', req.file);

      const { name, age, city, phone, telegram, format, equipment, experience, about } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).send('Фото обязательно!');
      }

      const caption = `📋 НОВАЯ АНКЕТА — DINY STUDIO

👤 Имя: ${name || '-'}
🎂 Возраст: ${age || '-'}
📍 Город: ${city || '-'}
📱 Телефон: ${phone || '-'}
💬 Telegram: ${telegram || '-'}
🧭 Формат: ${format || '-'}
🎛 Оборудование: ${equipment || '-'}
⭐ Опыт: ${experience || '-'}
💭 О себе: ${about || '-'}
🕐 ${new Date().toLocaleString('ru-RU')}`;

      const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;

      console.log('🔄 Отправляем в TG...');

      const formData = new FormData();
      formData.append('chat_id', process.env.TELEGRAM_CHAT_ID);
      formData.append('caption', caption);
      const fileStream = fs.createReadStream(file.path);
      formData.append('photo', fileStream, {
        filename: file.originalname,
        contentType: file.mimetype,
        knownLength: file.size
      });

      const response = await axios.post(telegramUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync?.() || undefined
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000  // 30 сек
      });

      console.log('✅ TG ответ:', response.data);

      // Удаляем файл
      fs.unlink(file.path, (err) => {
        if (err) console.error('Файл не удалён:', err);
      });

      if (response.data.ok) {
        res.send(`
          <html>
            <head><meta charset="utf-8"><title>Готово!</title>
            <style>body{background:#050308;color:#FCCCDC;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;}.btn{margin-top:20px;padding:12px 24px;background:#F535AA;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;}</style>
            </head>
            <body>
              <div>
                <h1>✅ Спасибо! Анкета отправлена 💖</h1>
                <p>Свяжемся скоро по Telegram.</p>
                <a href="/" class="btn">← На главную</a>
              </div>
            </body>
          </html>
        `);
      } else {
        console.error('❌ TG failed:', response.data);
        res.status(500).send('Ошибка TG. Попробуй позже.');
      }
    } catch (error) {
      console.error('💥 FULL ERROR:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code
      });
      res.status(500).send('Серверная ошибка. Проверь консоль.');
    }
  }
);

// --- 4. Запуск ---
app.listen(PORT, () => {
  console.log(`🚀 DINY Studio: http://localhost:${PORT}`);
});
