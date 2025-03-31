
// app.js - Головний файл сервера
const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3000;

// Налаштування підключення до MySQL (замінити на свої дані в Azure)

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'Lab2-CC'
// });
const isAzure = process.env.AZURE_MYSQL_HOST !== undefined;

const dbConfig = {
    host: process.env.AZURE_MYSQL_HOST || 'localhost',
    user: process.env.AZURE_MYSQL_USER || 'root',
    password: process.env.AZURE_MYSQL_PASSWORD || '',
    database: process.env.AZURE_MYSQL_DATABASE || 'Lab2-CC',
};

// Якщо працюємо в Azure, додаємо SSL
if (isAzure) {
    dbConfig.ssl = {
        rejectUnauthorized: true
    };

    // Якщо потрібно використовувати сертифікат:
    // dbConfig.ssl.ca = fs.readFileSync('/path/to/BaltimoreCyberTrustRoot.crt.pem');
}

const db = mysql.createConnection(dbConfig);



db.connect(err => {
    if (err) {
        console.error('Помилка підключення до MySQL:', err);
    } else {
        console.log('Підключено до MySQL');
        db.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        )`, (err, result) => {
            if (err) console.error('Помилка створення таблиці:', err);
        });
    }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API для додавання користувача
app.post('/add', (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO users (name) VALUES (?)', [name], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Помилка запису в базу' });
        } else {
            res.json({ success: true, id: result.insertId });
        }
    });
});

// API для отримання користувачів
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Помилка отримання даних' });
        } else {
            res.json(results);
        }
    });
});

// Головна сторінка (простий фронт)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="uk">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Користувачі</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; }
                input, button { margin: 5px; padding: 10px; }
                ul { list-style-type: none; padding: 0; }
            </style>
        </head>
        <body>
            <h1>Список користувачів</h1>
            <input type="text" id="name" placeholder="Введіть ім'я">
            <button onclick="addUser()">Додати</button>
            <ul id="userList"></ul>
            <script>
                async function fetchUsers() {
                    const response = await fetch('/users');
                    const users = await response.json();
                    const list = document.getElementById('userList');
                    list.innerHTML = '';
                    users.forEach(user => {
                        const li = document.createElement('li');
                        li.textContent = user.name;
                        list.appendChild(li);
                    });
                }

                async function addUser() {
                    const name = document.getElementById('name').value;
                    if (!name) return;
                    await fetch('/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name })
                    });
                    document.getElementById('name').value = '';
                    fetchUsers();
                }

                fetchUsers();
            </script>
        </body>
        </html>
    `);
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущено на http://localhost:${port}`);
});
