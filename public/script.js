// Обработка отправки формы для создания или обновления события
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

// Автоматическое обновление dashboard каждые 60 секунд (60000 мс)
// Проверяем, активна ли вкладка Dashboard, и если да — вызываем loadDashboard()
setInterval(function () {
  if ($("#dashboard").hasClass("active")) {
    loadDashboard();
  }
}, 9000);

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
