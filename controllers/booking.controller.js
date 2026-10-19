const db = require('../config/database');

function create(req, res) {
  const { userId, room, conferenceDate, payment } = req.body;

  if (!userId || !room || !conferenceDate || !payment) {
    return res.status(400).json({
      message: 'Заполните все поля заявки'
    });
  }

  db.run(
    `INSERT INTO bookings
     (user_id, room, conference_date, payment)
     VALUES (?, ?, ?, ?)`,
    [userId, room, conferenceDate, payment],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: 'Ошибка сохранения заявки'
        });
      }

      res.json({
        message: 'Заявка отправлена администратору',
        id: this.lastID
      });
    }
  );
}

function getUserBookings(req, res) {
  db.all(
    `SELECT * FROM bookings
     WHERE user_id = ?
     ORDER BY id DESC`,
    [req.params.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: 'Ошибка базы данных'
        });
      }

      res.json(rows);
    }
  );
}

function getAll(req, res) {
  db.all(
    `SELECT bookings.*, users.login, users.full_name,
            users.phone, users.email
     FROM bookings
     JOIN users ON users.id = bookings.user_id
     ORDER BY bookings.id DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: 'Ошибка базы данных'
        });
      }

      res.json(rows);
    }
  );
}

function changeStatus(req, res) {
  const allowedStatuses = [
    'Новая',
    'Мероприятие назначено',
    'Завершено'
  ];

  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Недопустимый статус'
    });
  }

  db.run(
    `UPDATE bookings SET status = ? WHERE id = ?`,
    [status, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: 'Ошибка обновления'
        });
      }

      res.json({ message: 'Статус изменён' });
    }
  );
}

function addReview(req, res) {
  const review = String(req.body.review || '').trim();

  if (!review) {
    return res.status(400).json({
      message: 'Введите отзыв'
    });
  }

  db.run(
    `UPDATE bookings
     SET review = ?
     WHERE id = ? AND status = 'Завершено'`,
    [review, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: 'Ошибка сохранения отзыва'
        });
      }

      if (!this.changes) {
        return res.status(400).json({
          message: 'Отзыв можно оставить только после завершения'
        });
      }

      res.json({ message: 'Отзыв сохранён' });
    }
  );
}

module.exports = {
  create,
  getUserBookings,
  getAll,
  changeStatus,
  addReview
};