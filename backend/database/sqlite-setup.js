const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'employee_management.db');
const db = new Database(dbPath);

// Включение foreign keys
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  try {
    console.log('🔄 Инициализация SQLite базы данных...');

    // Таблица должностей
    db.exec(`
      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица сотрудников
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        middle_name TEXT,
        position_id INTEGER,
        address TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        salary REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (position_id) REFERENCES positions (id)
      )
    `);

    // Таблица администраторов
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Триггер для updated_at
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_employee_timestamp 
      AFTER UPDATE ON employees
      FOR EACH ROW
      BEGIN
        UPDATE employees SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END
    `);

    // Начальные данные
    const insertPosition = db.prepare(`
      INSERT OR IGNORE INTO positions (name) VALUES (?)
    `);

    const positions = [
      'Software Developer',
      'Project Manager', 
      'HR Manager',
      'QA Engineer',
      'DevOps Engineer'
    ];

    positions.forEach(position => insertPosition.run(position));

    // Администратор (пароль: password)
    const passwordHash = bcrypt.hashSync('password', 10);
    const insertAdmin = db.prepare(`
      INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)
    `);
    insertAdmin.run('admin', passwordHash);

    console.log('✅ База данных SQLite инициализирована успешно!');
    console.log(`📁 Файл базы данных: ${dbPath}`);

  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    throw error;
  }
}

module.exports = { db, initializeDatabase };