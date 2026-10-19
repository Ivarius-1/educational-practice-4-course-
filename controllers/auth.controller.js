const db = require('../config/database');

function register(req, res) {
  const { login, password, fullName, phone, email } = req.body;

  if (!login || !password || !fullName || !phone || !email) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }

  if (!/^[A-Za-z0-9]{6,}$/.test(login)) {
    return res.status(400).json({ message: 'Логин: минимум 6 латинских букв или цифр' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Пароль должен содержать минимум 8 символов' });
  }

  if (!/^[А-Яа-яЁё ]+$/.test(fullName)) {
    return res.status(400).json({ message: 'ФИО должно содержать только кириллицу и пробелы' });
  }

  if (!/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(phone)) {
    return res.status(400).json({ message: 'Телефон: 8(XXX)XXX-XX-XX' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Введите корректный email' });
  }

  db.run(
    `INSERT INTO users (login,password,full_name,phone,email)
     VALUES (?,?,?,?,?)`,
    [login, password, fullName, phone, email],
    function (err) {
      if (err) {
        return res.status(400).json({ message: 'Такой логин уже существует' });
      }

      res.json({
        message: 'Пользователь успешно зарегистрирован',
        userId: this.lastID
      });
    }
  );
}

function login(req, res) {
  const { login, password } = req.body;

  if (login === 'Conf2027' && password === 'Demo77') {
    return res.json({ role: 'admin', login });
  }

  db.get(
    `SELECT id, login, full_name, email
     FROM users
     WHERE login = ? AND password = ?`,
    [login, password],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({
          message: 'Неверный логин или пароль'
        });
      }

      res.json({
        role: 'user',
        user
      });
    }
  );
}

module.exports = { register, login };