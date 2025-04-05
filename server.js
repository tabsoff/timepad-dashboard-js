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

// Добавление маршрута для удаления события по ID
app.delete("/api/events/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM events WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Событие удалено", changes: this.changes });
  });
});

// Маршрут для обновления отдельного поля события
app.patch("/api/events/:id/:field", (req, res) => {
  const { id, field } = req.params;
  const { value } = req.body;

  // Проверяем, что поле допустимо
  const allowedFields = [
    "name",
    "date",
    "ticket_limit",
    "sales_reception",
    "reserved_tickets",
    "timepad_id",
    "id",
  ];

  if (!allowedFields.includes(field)) {
    return res.status(400).json({
      error: "Invalid field name",
      field: field,
      allowed: allowedFields,
    });
  }

  // Защита от SQL-инъекций: используем параметризованный запрос
  const sql = `UPDATE events SET "${field}" = ? WHERE id = ?`;

  db.run(sql, [value, id], function (err) {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: "Поле обновлено",
      changes: this.changes,
    });
  });
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
