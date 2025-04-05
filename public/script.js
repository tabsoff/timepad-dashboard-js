// // Обработка отправки формы для создания или обновления события
document.getElementById("eventForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = {
    id: document.getElementById("eventId").value,
    name: document.getElementById("eventName").value,
    date: document.getElementById("eventDate").value,
    ticket_limit: document.getElementById("ticketLimit").value,
    sales_reception: document.getElementById("salesReception").value,
    reserved_tickets: document.getElementById("reservedTickets").value,
  };

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message);
      document.getElementById("eventForm").reset();
      loadManualEvents(); // обновляем список событий
    })
    .catch((err) => console.error(err));
});

// Функция для загрузки данных и отображения dashboard
function loadDashboard() {
  fetch("/api/events")
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById("graph-container");
      container.innerHTML = ""; // очищаем контент

      var eventHTML = ``;

      data.events.forEach((event) => {
        // Определяем переменные
        const eventId = "event.id";
        const totalLimit = event.ticket_limit;
        const timepadLimit = event.timepad_ticket_limit;
        const ticketReserved = event.reserved_tickets;
        const ticketReseption = event.sales_reception;
        const ticketTimepad = event.timepad_sold;
        const days = 5;
        const dateStr = "12.04";
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
          <span>${days} дней</span><span>/</span>${dateStr}<span></span>
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

// Загружаем dashboard при переключении на соответствующую вкладку
$('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
  if (e.target.id === "dashboard-tab") {
    loadDashboard();
  }
});

function loadManualEvents() {
  fetch("/api/events")
    .then((response) => response.json())
    .then((data) => {
      const tbody = document.getElementById("eventsTableBody");
      tbody.innerHTML = ""; // очищаем таблицу
      data.events.forEach((event) => {
        const row = `
          <tr>
            <td>${event.id}</td>
            <td>${event.name}</td>
            <td>${new Date(event.date).toLocaleString()}</td>
            <td>${event.ticket_limit}</td>
            <td>${event.sales_reception}</td>
            <td>${event.reserved_tickets}</td>
          </tr>
        `;
        tbody.innerHTML += row;
      });
    })
    .catch((err) => console.error(err));
}

document.addEventListener("DOMContentLoaded", () => {
  loadManualEvents();
});
