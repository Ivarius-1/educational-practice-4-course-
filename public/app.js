let currentUser = null;
let adminBookings = [];

const $ = selector => document.querySelector(selector);

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if (id === 'dashboard' && currentUser) loadUserBookings();
  if (id === 'admin') loadAdminBookings();

  window.scrollTo(0, 0);
}

function showMessage(id, text, success = false) {
  const element = $(id);
  element.textContent = text;
  element.className = success ? 'message success' : 'message error';
}

$('#registerForm').addEventListener('submit', async event => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(event.target));

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });

  const result = await response.json();

  showMessage('#registerMsg', result.message, response.ok);

  if (response.ok) {
    setTimeout(() => showPage('login'), 700);
  }
});

$('#loginForm').addEventListener('submit', async event => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(event.target));

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    showMessage('#loginMsg', result.message);
    return;
  }

  currentUser = result.role === 'admin'
    ? {role: 'admin'}
    : result.user;

  showPage(result.role === 'admin' ? 'admin' : 'dashboard');
});

$('#bookingForm').addEventListener('submit', async event => {
  event.preventDefault();

  if (!currentUser?.id) {
    showPage('login');
    return;
  }

  const data = Object.fromEntries(new FormData(event.target));
  data.userId = currentUser.id;

  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });

  const result = await response.json();

  showMessage('#bookingMsg', result.message, response.ok);

  if (response.ok) {
    event.target.reset();
    setTimeout(() => showPage('dashboard'), 700);
  }
});

async function loadUserBookings() {
  const response = await fetch('/api/bookings/user/' + currentUser.id);
  const bookings = await response.json();

  if (!bookings.length) {
    $('#userBookings').innerHTML =
      '<div class="booking-card"><h3>Заявок пока нет</h3><p>Создайте первую заявку.</p></div>';
    return;
  }

  $('#userBookings').innerHTML = bookings.map(booking => `
    <div class="booking-card">
      <div>
        <span class="status">${booking.status}</span>
        <h3>${escapeHtml(booking.room)}</h3>
        <p>
          Дата: <b>${escapeHtml(booking.conference_date)}</b><br>
          Оплата: ${escapeHtml(booking.payment)}
        </p>

        ${booking.review
          ? `<p><b>Ваш отзыв:</b> ${escapeHtml(booking.review)}</p>`
          : ''}

        ${booking.status === 'Завершено' && !booking.review
          ? `<div class="review">
              <input id="review-${booking.id}" placeholder="Ваш отзыв">
              <button class="primary" onclick="sendReview(${booking.id})">Отправить</button>
             </div>`
          : ''}
      </div>
      <small>Заявка №${booking.id}</small>
    </div>
  `).join('');
}

async function sendReview(id) {
  const review = $('#review-' + id).value;

  const response = await fetch('/api/bookings/' + id + '/review', {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({review})
  });

  const result = await response.json();

  if (!response.ok) {
    alert(result.message);
    return;
  }

  loadUserBookings();
}

async function loadAdminBookings() {
  const response = await fetch('/api/bookings');
  adminBookings = await response.json();
  renderAdmin();
}

function renderAdmin() {
  const search = ($('#adminSearch')?.value || '').toLowerCase();

  const bookings = adminBookings.filter(booking =>
    `${booking.full_name} ${booking.login} ${booking.room}`
      .toLowerCase()
      .includes(search)
  );

  $('#adminBookings').innerHTML = bookings.map(booking => `
    <div class="admin-row">
      <div>
        <b>#${booking.id} · ${escapeHtml(booking.full_name)}</b>
        <small>${escapeHtml(booking.login)}</small>
      </div>

      <div>
        <b>${escapeHtml(booking.room)}</b>
        <small>${escapeHtml(booking.conference_date)}</small>
      </div>

      <select onchange="changeStatus(${booking.id}, this.value)">
        ${['Новая','Мероприятие назначено','Завершено']
          .map(status =>
            `<option ${status === booking.status ? 'selected' : ''}>${status}</option>`
          ).join('')}
      </select>
    </div>
  `).join('');
}

async function changeStatus(id, status) {
  await fetch('/api/bookings/' + id + '/status', {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({status})
  });

  loadAdminBookings();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, symbol => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[symbol]));
}