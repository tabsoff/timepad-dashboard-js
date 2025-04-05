// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cron = require("node-cron");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Добавляем переменную для хранения времени последнего обновления
let lastUpdateTime = null;

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
    res.json({
      events: rows,
      lastUpdateTime: lastUpdateTime,
    });
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
app.patch("/api/events/:id/:field", async (req, res) => {
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

  try {
    // Защита от SQL-инъекций: используем параметризованный запрос
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE events SET "${field}" = ? WHERE id = ?`,
        [value, id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    // Если обновляется timepad_id, сразу получаем данные
    if (field === "timepad_id" && value) {
      console.log(
        `Immediately fetching data for event with ID ${id} and TimePad ID ${value}`
      );

      // Get event details for ticket limit
      const eventResponse = await fetch(
        `https://api.timepad.ru/v1/events/${value}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.TIMEPAD_TOKEN}`,
          },
        }
      );

      if (!eventResponse.ok) {
        throw new Error(`TimePad API returned ${eventResponse.status}`);
      }

      const eventData = await eventResponse.json();
      const timepadLimit = calculateTicketLimit(eventData);

      // Get paid tickets count from orders
      const timepadSold = await getTimePadOrders(
        value,
        process.env.TIMEPAD_TOKEN
      );

      console.log(`Event data: limit=${timepadLimit}, sold=${timepadSold}`);

      // Update database
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE events SET timepad_ticket_limit = ?, timepad_sold = ? WHERE id = ?`,
          [timepadLimit, timepadSold, id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    res.json({
      message: "Поле обновлено",
      changes: 1,
    });
  } catch (error) {
    console.error("Error in update:", error);
    res.status(500).json({ error: error.message });
  }
});

async function getTimePadOrders(eventId, token) {
  let totalPaidTickets = 0;
  let skip = 0;
  const limit = 100;

  try {
    while (true) {
      console.log(
        `Fetching orders for event ${eventId} (skip=${skip}, limit=${limit})`
      );

      const response = await fetch(
        `https://api.timepad.ru/v1/events/${eventId}/orders?limit=${limit}&skip=${skip}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`TimePad API returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`Got ${data.values?.length || 0} orders`);

      if (!data.values || !Array.isArray(data.values)) {
        console.log("No orders found or invalid response format");
        break;
      }

      // Count tickets in orders
      data.values.forEach((order) => {
        // Only count tickets from paid orders
        if (order.status?.name === "paid" && Array.isArray(order.tickets)) {
          // Count each ticket in the order
          order.tickets.forEach((ticket) => {
            // We count all tickets in paid orders
            totalPaidTickets++;
          });
        }
      });

      console.log(`Counted ${totalPaidTickets} paid tickets so far`);

      // If we got less than limit orders, we've reached the end
      if (data.values.length < limit) {
        break;
      }

      skip += limit;
    }

    console.log(
      `Final count for event ${eventId}: ${totalPaidTickets} paid tickets`
    );
    return totalPaidTickets;
  } catch (error) {
    console.error(`Error in getTimePadOrders for event ${eventId}:`, error);
    throw error;
  }
}

function calculateTicketLimit(eventData) {
  // Собираем все возможные лимиты
  const rootLimit = eventData.tickets_limit || 0;
  const regDataLimit = eventData.registration_data?.tickets_limit || 0;
  const typesLimit = eventData.ticket_types.reduce((sum, type) => {
    return sum + (type.limit || 0);
  }, 0);

  console.log("Найденные лимиты:", {
    rootLimit,
    regDataLimit,
    typesLimit,
    raw: {
      tickets_limit: eventData.tickets_limit,
      registration_data: eventData.registration_data,
      ticket_types: eventData.ticket_types.map((t) => ({
        name: t.name,
        limit: t.limit,
      })),
    },
  });

  const limits = [rootLimit, regDataLimit, typesLimit];

  // Фильтруем нулевые значения (отсутствие лимита)
  const actualLimits = limits.filter((limit) => limit > 0);

  // Если нет ни одного ненулевого лимита, возвращаем 0
  if (actualLimits.length === 0) {
    return 0;
  }

  // Возвращаем минимальный из установленных лимитов
  const finalLimit = Math.min(...actualLimits);
  console.log("Итоговый лимит:", finalLimit);
  return finalLimit;
}

// Пример cron-задачи: обновление данных из TimePad каждые 15 минут
cron.schedule("*/15 * * * *", async () => {
  console.log("Запуск cron-задачи для обновления данных из TimePad");

  try {
    // Получаем список событий с TimePad ID
    const rows = await new Promise((resolve, reject) => {
      db.all(
        "SELECT id, timepad_id, name FROM events WHERE timepad_id IS NOT NULL",
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Если есть хотя бы одно событие с TimePad ID
    if (rows.length > 0) {
      // Обновляем время перед началом обработки
      lastUpdateTime = new Date();
    }

    console.log(`Found ${rows.length} events with TimePad IDs`);

    for (const event of rows) {
      try {
        console.log(
          `Processing event "${event.name}" (ID: ${event.id}, TimePad ID: ${event.timepad_id})`
        );

        // Get event details for ticket limit
        const eventResponse = await fetch(
          `https://api.timepad.ru/v1/events/${event.timepad_id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.TIMEPAD_TOKEN}`,
            },
          }
        );

        if (!eventResponse.ok) {
          throw new Error(`TimePad API returned ${eventResponse.status}`);
        }

        const eventData = await eventResponse.json();
        const timepadLimit = calculateTicketLimit(eventData);

        // Get paid tickets count from orders
        const timepadSold = await getTimePadOrders(
          event.timepad_id,
          process.env.TIMEPAD_TOKEN
        );

        console.log(
          `Event "${event.name}": limit=${timepadLimit}, sold=${timepadSold}`
        );

        // Update database
        db.run(
          `UPDATE events SET timepad_ticket_limit = ?, timepad_sold = ? WHERE id = ?`,
          [timepadLimit, timepadSold, event.id],
          (err) => {
            if (err) {
              console.error(`Error updating event ${event.id}:`, err.message);
            } else {
              console.log(
                `Successfully updated data for event "${event.name}" (id=${event.id})`
              );
            }
          }
        );
      } catch (error) {
        console.error(
          `Error processing event "${event.name}" (${event.timepad_id}):`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error in cron task:", error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
