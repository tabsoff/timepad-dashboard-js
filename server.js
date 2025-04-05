// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cron = require("node-cron");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Встроенные middleware для парсинга JSON и данных формы
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статическая папка для фронтенда (будем использовать папку public)
app.use(express.static(path.join(__dirname, "public")));

// Подключаемся к базе данных
const db = new sqlite3.Database("./database.sqlite");

// Маршрут для получения данных о событиях (используется во вкладке Dashboard)
app.get("/api/events", (req, res) => {
  db.all("SELECT * FROM events", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ events: rows });
  });
});

// Маршрут для создания или обновления события (используется во вкладке Ввод данных)
app.post("/api/events", (req, res) => {
  const { id, name, date, ticket_limit, sales_reception, reserved_tickets } =
    req.body;

  if (id) {
    // Обновление существующего события
    db.run(
      `UPDATE events SET name = ?, date = ?, ticket_limit = ?, sales_reception = ?, reserved_tickets = ? WHERE id = ?`,
      [name, date, ticket_limit, sales_reception, reserved_tickets, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Событие обновлено", changes: this.changes });
      }
    );
  } else {
    // Добавление нового события
    db.run(
      `INSERT INTO events (name, date, ticket_limit, sales_reception, reserved_tickets) VALUES (?, ?, ?, ?, ?)`,
      [name, date, ticket_limit, sales_reception, reserved_tickets],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Событие добавлено", id: this.lastID });
      }
    );
  }
});

// Пример cron-задачи: обновление данных из TimePad каждые 15 минут
cron.schedule("*/10 * * * * *", () => {
  console.log("Запуск cron-задачи для обновления данных из TimePad");

  // Здесь мы симулируем обновление данных.
  // В реальном приложении вы будете делать запрос к TimePad API.
  db.all("SELECT id FROM events", [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    rows.forEach((event) => {
      // Симулируем случайные значения для лимита и проданных билетов
      const simulatedLimit = Math.floor(Math.random() * 100) + 50;
      const simulatedSold = Math.floor(Math.random() * simulatedLimit);

      db.run(
        `UPDATE events SET timepad_ticket_limit = ?, timepad_sold = ? WHERE id = ?`,
        [simulatedLimit, simulatedSold, event.id],
        (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log(`Обновлены данные для события id=${event.id}`);
          }
        }
      );
    });
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
