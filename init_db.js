// init_db.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    name TEXT,
    date TEXT,
    ticket_limit INTEGER,
    sales_reception INTEGER,
    reserved_tickets INTEGER,
    timepad_ticket_limit INTEGER,
    timepad_sold INTEGER
  )`,
    (err) => {
      if (err) {
        console.error("Ошибка при создании таблицы:", err.message);
      } else {
        console.log("Таблица 'events' успешно создана или уже существует.");
      }
    }
  );
});

db.close();
