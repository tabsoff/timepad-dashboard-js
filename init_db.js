// init_db.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  // Удаляем существующую таблицу
  db.run("DROP TABLE IF EXISTS events", (err) => {
    if (err) {
      console.error("Ошибка при удалении таблицы:", err.message);
      return;
    }
  });

  // Создаем таблицу заново с полем timepad_id
  db.run(
    `CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    name TEXT,
    date TEXT,
    ticket_limit INTEGER,
    sales_reception INTEGER,
    reserved_tickets INTEGER,
    timepad_ticket_limit INTEGER,
    timepad_sold INTEGER,
    timepad_id TEXT
  )`,
    (err) => {
      if (err) {
        console.error("Ошибка при создании таблицы:", err.message);
      } else {
        console.log("Таблица 'events' успешно создана с полем timepad_id");
      }
    }
  );
});

db.close();
