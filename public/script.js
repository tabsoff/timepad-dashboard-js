// Add date formatting helper function at the top
function formatDate(date, includingYear = true) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear().toString().substr(-2);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  if (includingYear) {
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }
  return `${day}.${month}`;
}

// Функция для загрузки данных и отображения dashboard
function loadDashboard() {
  fetch("/api/events")
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById("graph-container");
      container.innerHTML = ""; // очищаем контент

      // Sort events by date
      const sortedEvents = data.events.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      var eventHTML = ``;

      sortedEvents.forEach((event) => {
        // Определяем переменные
        const eventId = "event.id";
        const totalLimit = event.ticket_limit;
        const timepadLimit = event.timepad_ticket_limit;
        const ticketReserved = event.reserved_tickets;
        const ticketReseption = event.sales_reception;
        const ticketTimepad = event.timepad_sold;

        // Рассчитываем оставшиеся дни
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Убираем время для корректного сравнения дат
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let daysText;
        if (diffDays < 0) {
          daysText = "Прошло";
        } else if (diffDays === 0) {
          daysText = "Сегодня";
        } else {
          daysText = `${diffDays} ${getDaysDeclension(diffDays)}`;
        }

        const dateStr = formatDate(event.date, false);
        const eventTitle = event.name;

        // Генерируем HTML с использованием шаблонных строк
        eventHTML += `
      <div class="event-container" id="${eventId}">
        <div class="event-header">
          <span>${
            ticketReserved + ticketReseption + ticketTimepad
          }</span><span>/</span><span
          `;

        //
        // Проверяем на соответсвие лимитов и выставляем предупреждение
        //
        if (timepadLimit != totalLimit) {
          eventHTML += `class="event-header-limit-warning"`;
        }

        eventHTML += `
          >${totalLimit}</span>
        </div>
        <div class="graph">
        <div class="graph-ticket graph-tickets-all">
              <div style="height: calc(var(--graph-height) * ${
                totalLimit - (ticketReserved + ticketReseption + ticketTimepad)
              } / ${totalLimit})">
        `;

        //
        // Проверяем, что оставшихся билетов > 0
        //
        if (
          totalLimit - (ticketReserved + ticketReseption + ticketTimepad) >
          0
        ) {
          eventHTML += `
                <div class="ticket-label ticket-label-all">${
                  totalLimit -
                  (ticketReserved + ticketReseption + ticketTimepad)
                }</div>     
       `;
        }

        eventHTML += `</div><div class="graph-ticket graph-tickets-reserved" style="height: calc(var(--graph-height) * ${
          ticketReserved + ticketReseption + ticketTimepad
        } / ${totalLimit})">
              <div style="height: calc(var(--graph-height) * ${ticketReserved} / ${
          ticketReserved + ticketReseption + ticketTimepad
        })">`;

        //
        // Проверяем, что reserved билетов > 0
        //
        if (ticketReserved > 0) {
          eventHTML += `
                <div class="ticket-label ticket-label-reserved">${ticketReserved}</div>
              `;
        }

        eventHTML += ` </div>     
              <div class="graph-ticket graph-tickets-reseption" style="height: calc(var(--graph-height) * ${
                ticketReseption + ticketTimepad
              } / ${ticketReserved + ticketReseption + ticketTimepad})">
                <div style="height: calc(var(--graph-height) * ${ticketReseption} / ${
          ticketReseption + ticketTimepad
        })">`;

        //
        // Проверяем, что reseption билетов > 0
        //
        if (ticketReseption > 0) {
          eventHTML += `                <div class="ticket-label ticket-label-reseption">${ticketReseption}</div>`;
        }

        eventHTML += `
                </div>
                <div class="graph-ticket graph-tickets-timepad" style="height: calc(var(--graph-height) * ${ticketTimepad} / ${
          ticketReseption + ticketTimepad
        })">
                  <div style="height: calc(var(--graph-height) * ${ticketTimepad} / ${ticketTimepad})">
                  `;

        //
        // Проверяем, что timepad билетов > 0
        //
        if (ticketTimepad > 0) {
          eventHTML += `<div class="ticket-label ticket-label-timepad">${ticketTimepad}</div>`;
        }

        eventHTML += `</div>
                </div>
                </div>
                </div>
                </div>
                </div>
        <div class="event-footer">
          <div>${eventTitle}</div>
          <span>${daysText}</span><span>/</span><span>${dateStr}</span>
        </div>
      </div>
    `;
      });

      document.getElementById("graph-container").innerHTML = eventHTML;
    })
    .catch((err) => console.error(err));
}

// Автоматическое обновление dashboard каждые 60 секунд (60000 мс)
// Проверяем, активна ли вкладка Dashboard, и если да — вызываем loadDashboard()
setInterval(function () {
  if ($("#dashboard").hasClass("active")) {
    loadDashboard();
  }
}, 1000);

// Main initialization
document.addEventListener("DOMContentLoaded", () => {
  loadManualEvents();
  initializeEventHandlers();
});

function initializeEventHandlers() {
  // Add row button handler
  const addRowBtn = document.getElementById("addRowBtn");
  if (addRowBtn) {
    addRowBtn.addEventListener("click", () => {
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          date: new Date().toISOString(),
          ticket_limit: 0,
          sales_reception: 0,
          reserved_tickets: 0,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error(data.error);
          } else {
            loadManualEvents();
          }
        })
        .catch((err) => console.error("Error adding row:", err));
    });
  }

  // Tab change handler
  $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
    if (e.target.id === "dashboard-tab") {
      loadDashboard();
    }
  });
}

// Добавление кнопки удаления и обработчика для удаления события
function loadManualEvents() {
  fetch("/api/events")
    .then((response) => response.json())
    .then((data) => {
      const tbody = document.getElementById("eventsTableBody");
      tbody.innerHTML = "";

      // Sort events by date
      const sortedEvents = data.events.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      sortedEvents.forEach((event) => {
        const row = `
          <tr>
            <td contenteditable="true" data-field="id" data-id="${event.id}">${
          event.id
        }</td>
            <td contenteditable="true" data-field="timepad_id" data-id="${
              event.id
            }">${event.timepad_id || ""}</td>
            <td contenteditable="true" data-field="date" data-id="${
              event.id
            }">${formatDate(event.date)}</td>
            <td contenteditable="true" data-field="name" data-id="${
              event.id
            }">${event.name}</td>
            <td contenteditable="true" data-field="ticket_limit" data-id="${
              event.id
            }">${event.ticket_limit}</td>
            <td contenteditable="true" data-field="sales_reception" data-id="${
              event.id
            }">${event.sales_reception}</td>
            <td contenteditable="true" data-field="reserved_tickets" data-id="${
              event.id
            }">${event.reserved_tickets}</td>
            <td><button class="delete-btn" data-id="${
              event.id
            }">Удалить</button></td>
          </tr>
        `;
        tbody.innerHTML += row;
      });

      // Add event listeners for inline editing
      document.querySelectorAll('[contenteditable="true"]').forEach((cell) => {
        cell.addEventListener("blur", function () {
          const field = this.dataset.field;
          const id = this.dataset.id;
          let value = this.textContent;

          // Convert value to number for numeric fields
          if (
            ["ticket_limit", "sales_reception", "reserved_tickets"].includes(
              field
            )
          ) {
            value = parseInt(value) || 0;
          }

          // If it's a date field, try to parse the date
          if (field === "date") {
            try {
              // First try to parse the date string in DD.MM.YY HH:mm format
              const parts = value.split(" ");
              if (parts.length === 2) {
                const [datePart, timePart] = parts;
                const [day, month, year] = datePart.split(".");
                const [hours, minutes] = timePart.split(":");

                const date = new Date(
                  2000 + parseInt(year),
                  parseInt(month) - 1,
                  parseInt(day),
                  parseInt(hours),
                  parseInt(minutes)
                );

                if (!isNaN(date)) {
                  value = date.toISOString();
                } else {
                  throw new Error("Invalid date");
                }
              } else {
                throw new Error("Invalid date format");
              }
            } catch (e) {
              alert("Неверный формат даты. Используйте формат ДД.ММ.ГГ ЧЧ:ММ");
              loadManualEvents();
              return;
            }
          }

          // Send update to server using the original field name
          fetch(`/api/events/${id}/${field}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.error) {
                console.error("Server error:", data);
                alert(
                  `Ошибка: ${data.error}\nПоле: ${
                    data.field
                  }\nРазрешенные поля: ${data.allowed?.join(", ")}`
                );
                loadManualEvents();
              }
            })
            .catch((err) => {
              console.error("Request error:", err);
              alert(`Ошибка запроса: ${err.message}`);
              loadManualEvents();
            });
        });

        // Prevent Enter key from creating new lines
        cell.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            this.blur();
          }
        });
      });

      // Добавляем обработчики для кнопок удаления
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const eventId = this.getAttribute("data-id");
          fetch(`/api/events/${eventId}`, {
            method: "DELETE",
          })
            .then((response) => response.json())
            .then((data) => {
              alert(data.message);
              loadManualEvents(); // обновляем список событий
            })
            .catch((err) => console.error(err));
        });
      });
    })
    .catch((err) => console.error(err));
}

// Добавляем функцию для правильного склонения слова "дни"
function getDaysDeclension(number) {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ["день", "дня", "дней"];
  return titles[
    number % 100 > 4 && number % 100 < 20 ? 2 : cases[Math.min(number % 10, 5)]
  ];
}
