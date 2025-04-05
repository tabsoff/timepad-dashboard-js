function loadDashboard() {
  fetch("/api/events")
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById("dashboardContent");
      container.innerHTML = ""; // очищаем контент
      data.events.forEach((event) => {
        // Вычисляем оставшееся время до мероприятия
        const eventDate = new Date(event.date);
        const now = new Date();
        const diffMs = eventDate - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(
          (diffMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        const remaining =
          diffMs > 0
            ? `${diffHours} ч ${diffMinutes} мин`
            : "Мероприятие началось";

        // Суммарное количество билетов
        const totalSold =
          (event.timepad_sold || 0) +
          +event.sales_reception +
          +event.reserved_tickets;

        // Создаем элемент для отображения информации о мероприятии
        const eventDiv = document.createElement("div");
        eventDiv.className = "card mb-3";
        eventDiv.innerHTML = `
                <div class="card-body">
                  <h5 class="card-title">${event.name}</h5>
                  <p class="card-text">Дата: ${new Date(
                    event.date
                  ).toLocaleString()}</p>
                  <p class="card-text">Осталось времени: ${remaining}</p>
                  <p class="card-text">Лимит билетов: ${event.ticket_limit}</p>
                  <p class="card-text">Суммарно продано: ${totalSold}</p>
                  <div>
                    ${
                      event.ticket_limit != event.timepad_ticket_limit
                        ? '<span class="text-warning">⚠️ Лимит TimePad не совпадает!</span>'
                        : ""
                    }
                  </div>
                  <canvas id="chart-${
                    event.id
                  }" width="400" height="200"></canvas>
                </div>
              `;
        container.appendChild(eventDiv);

        // Рисуем диаграмму заполнения зала с помощью Chart.js
        const ctx = document
          .getElementById(`chart-${event.id}`)
          .getContext("2d");
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Продано"],
            datasets: [
              {
                label: "TimePad",
                data: [event.timepad_sold || 0],
                backgroundColor: "rgba(54, 162, 235, 0.5)",
              },
              {
                label: "Ресепшн",
                data: [event.sales_reception],
                backgroundColor: "rgba(255, 206, 86, 0.5)",
              },
              {
                label: "Резерв",
                data: [event.reserved_tickets],
                backgroundColor: "rgba(75, 192, 192, 0.5)",
              },
            ],
          },
          options: {
            scales: {
              yAxes: [
                {
                  ticks: { beginAtZero: true },
                },
              ],
            },
          },
        });
      });
    })
    .catch((err) => console.error(err));
}

//
//
//
//
//

document.addEventListener("DOMContentLoaded", function () {
  // Определяем переменные
  const eventId = "12345678";
  const totalLimit = 100;
  const timepadLimit = 100;
  const ticketReserved = 10;
  const ticketReseption = 5;
  const ticketTimepad = 60;
  const days = 5;
  const dateStr = "12.04";
  const eventTitle = "Бранч";

  // Генерируем HTML с использованием шаблонных строк
  var eventHTML = `
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
  if (totalLimit - (ticketReserved + ticketReseption + ticketTimepad) > 0) {
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

  // Вставляем сгенерированный HTML внутрь элемента с id="event-container"
  document.getElementById("graph-container").innerHTML = eventHTML;
});
