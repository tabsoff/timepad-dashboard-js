// init_db.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  // Проверяем существование таблицы events
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='events'",
    (err, row) => {
      if (err) {
        console.error("Ошибка при проверке таблицы:", err.message);
        db.close();
        return;
      }

      // Если таблица не существует, создаем её
      if (!row) {
        console.log("Таблица 'events' не найдена, создаём новую...");

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
              console.log("Таблица 'events' успешно создана");
            }
            db.close();
          }
        );
      } else {
        console.log("Таблица 'events' уже существует");
        db.close();
      }
    }
  );
});
