// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. Настройка статики (frontend) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. Настройка multer для загрузки фото ---
const upload = multer({
  dest: path.join(__dirname, 'uploads/'),
  limits: {
    fileSize: 4 * 1024 * 1024 // максимум 8 MB на фото
  }
});

// --- 3. Маршрут формы: POST /apply ---
app.post(
  '/apply',
  (req, res, next) => {
    upload.single('photo')(req, res, function (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        // Фото > 4 МБ — показываем понятную страницу и НЕ отправляем в Telegram
        return res.status(400).send(`
          <html>
            <head>
              <meta charset="utf-8">
              <title>Ошибка загрузки</title>
              <style>
                body {
                  background: #050308;
                  color: #FCCCDC;
                  font-family: Arial, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  text-align: center;
                }
                .btn {
                  margin-top: 20px;
                  padding: 12px 24px;
                  background: #F535AA;
                  color: #fff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                }
              </style>
            </head>
            <body>
              <div>
                <h1>Фото слишком большое</h1>
                <p>Максимальный размер файла — 4 МБ. Пожалуйста, выбери фото меньшего размера и попробуй снова.</p>
                <a href="/" class="btn">Вернуться к анкете</a>
              </div>
            </body>
          </html>
        `);
      }

      if (err) {
        console.error('Ошибка загрузки файла:', err);
        return res.status(500).send('Ошибка загрузки файла. Попробуй ещё раз.');
      }

      next(); // идём в основной обработчик, если всё ок
    });
  },
  async (req, res) => {
    try {
      console.log('--- Новая анкета ---');
      console.log('BODY:', req.body);
      console.log('FILE:', req.file);

      // Текстовые поля из формы
      const {
        name,
        age,
        city,
        phone,
        telegram,
        format,
        equipment,
        experience,
        about
      } = req.body;

      // Файл (фото)
      const file = req.file; // если нет файла — будет undefined

      if (!file) {
        return res.status(400).send('Фото обязательно для отправки');
      }


      // Собираем текст заявки
      const caption = `
📋 НОВАЯ АНКЕТА МОДЕЛИ — DINY STUDIO

👤 Имя: ${name || '-'}
🎂 Возраст: ${age || '-'}
📍 Город: ${city || '-'}
📱 Телефон: ${phone || '-'}
💬 Telegram: ${telegram || '-'}
🧭 Формат работы: ${format || '-'}
🎛 Оборудование: ${equipment || '-'}
⭐ Опыт: ${experience || '-'}
💭 О себе: ${about || '-'}
🕐 Время: ${new Date().toLocaleString('ru-RU')}
    `;

      // Отправка фото в Telegram
      const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;

      // Создаём form-data для Telegram
      const formData = new FormData();
      formData.append('chat_id', process.env.TELEGRAM_CHAT_ID);
      formData.append('caption', caption);

      // Читаем файл как поток
      const fileStream = fs.createReadStream(file.path);
      formData.append('photo', fileStream, file.originalname);

      // Отправляем запрос
      const response = await axios.post(telegramUrl, formData, {
        headers: formData.getHeaders()
      });

      // Удаляем временный файл после отправки
      fs.unlink(file.path, (err) => {
        if (err) console.error('Ошибка удаления файла:', err);
      });

      // Если всё ок — отправляем ответ пользователю
      if (response.data && response.data.ok) {
        // Для пользователя можно отдать HTML-страницу с сообщением
        res.send(`
        <html>
          <head>
            <meta charset="utf-8">
            <title>Спасибо за заявку</title>
            <style>
              body {
                background: #050308;
                color: #FCCCDC;
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                text-align: center;
              }
              .btn {
                margin-top: 20px;
                padding: 12px 24px;
                background: #F535AA;
                color: #fff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div>
              <h1>Спасибо! Твоя анкета отправлена 💖</h1>
              <p>Администратор студии свяжется с тобой в ближайшее время.</p>
              <a href="/" class="btn">Вернуться на главную</a>
            </div>
          </body>
        </html>
      `);
      } else {
        console.error('Ошибка Telegram:', response.data);
        res.status(500).send('Ошибка при отправке заявки. Попробуй позже.');
      }
    } catch (error) {
      console.error('Ошибка в /apply:', error);
      res.status(500).send('Внутренняя ошибка сервера');
    }
  });

// --- 4. Запуск сервера ---
app.listen(PORT, () => {
  console.log(`DINY Studio server запущен: http://localhost:${PORT}`);
});
