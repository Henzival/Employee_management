const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite database setup
const dbPath = path.join(__dirname, '../database/employee_management.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database
function initializeDatabase() {
  try {
    console.log('🔄 Initializing SQLite database...');

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create timestamp trigger
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_employee_timestamp 
      AFTER UPDATE ON employees
      FOR EACH ROW
      BEGIN
        UPDATE employees SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END
    `);

    // Insert initial data
    const positions = [
      'Software Developer',
      'Project Manager', 
      'HR Manager',
      'QA Engineer',
      'DevOps Engineer'
    ];

    const insertPosition = db.prepare('INSERT OR IGNORE INTO positions (name) VALUES (?)');
    positions.forEach(position => insertPosition.run(position));

    // Admin user (password: password)
    const passwordHash = bcrypt.hashSync('password', 10);
    const insertAdmin = db.prepare('INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)');
    insertAdmin.run('admin', passwordHash);

    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Initialize on startup
initializeDatabase();

// JWT Secret
const JWT_SECRET = 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin management routes
app.get('/api/admin/users', authenticateToken, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, created_at FROM admin_users ORDER BY username').all();
    res.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверяем, что пользователь не создает сам себя (для безопасности)
    if (req.user.username === username) {
      return res.status(400).json({ error: 'Cannot modify your own account' });
    }

    // Проверяем, существует ли пользователь
    const existingUser = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    const result = db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);

    const newUser = db.prepare('SELECT id, username, created_at FROM admin_users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // Предотвращаем удаление самого себя
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Предотвращаем удаление основного администратора (id = 1)
    if (parseInt(id) === 1) {
      return res.status(400).json({ error: 'Cannot delete the primary admin account' });
    }

    const result = db.prepare('DELETE FROM admin_users WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Employee routes
app.get('/api/employees', (req, res) => {
  try {
    const employees = db.prepare(`
      SELECT e.*, p.name as position_name 
      FROM employees e 
      LEFT JOIN positions p ON e.position_id = p.id 
      ORDER BY e.last_name, e.first_name
    `).all();
    
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/employees', authenticateToken, (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      middle_name,
      position_id,
      address,
      contact_email,
      contact_phone,
      salary
    } = req.body;

    // Валидация обязательных полей
    if (!employee_id || !first_name || !last_name) {
      return res.status(400).json({ 
        error: 'Employee ID, first name and last name are required' 
      });
    }

    // Проверяем, что employee_id - строка
    if (typeof employee_id !== 'string' || employee_id.trim() === '') {
      return res.status(400).json({ 
        error: 'Employee ID must be a non-empty string' 
      });
    }

    // Check if employee_id already exists
    const existingEmployee = db.prepare(
      'SELECT * FROM employees WHERE employee_id = ?'
    ).get(employee_id.trim());

    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    const result = db.prepare(`
      INSERT INTO employees (
        employee_id, first_name, last_name, middle_name, 
        position_id, address, contact_email, contact_phone, salary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      employee_id.trim(),
      first_name.trim(),
      last_name.trim(),
      middle_name ? middle_name.trim() : null,
      position_id || null,
      address ? address.trim() : null,
      contact_email ? contact_email.trim() : null,
      contact_phone ? contact_phone.trim() : null,
      salary || null
    );

    const newEmployee = db.prepare(`
      SELECT e.*, p.name as position_name 
      FROM employees e 
      LEFT JOIN positions p ON e.position_id = p.id 
      WHERE e.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_NOTNULL') {
      return res.status(400).json({ 
        error: 'Required fields cannot be empty' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/employees/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      first_name,
      last_name,
      middle_name,
      position_id,
      address,
      contact_email,
      contact_phone,
      salary
    } = req.body;

    // Валидация обязательных полей
    if (!employee_id || !first_name || !last_name) {
      return res.status(400).json({ 
        error: 'Employee ID, first name and last name are required' 
      });
    }

    // Проверяем, что employee_id - строка
    if (typeof employee_id !== 'string' || employee_id.trim() === '') {
      return res.status(400).json({ 
        error: 'Employee ID must be a non-empty string' 
      });
    }

    // Check if employee exists
    const existingEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee_id is already used by another employee
    if (employee_id !== existingEmployee.employee_id) {
      const duplicate = db.prepare(
        'SELECT * FROM employees WHERE employee_id = ? AND id != ?'
      ).get(employee_id.trim(), id);
      
      if (duplicate) {
        return res.status(400).json({ error: 'Employee ID already exists' });
      }
    }

    // Обновляем данные, обрезая пробелы и обеспечивая корректные значения
    db.prepare(`
      UPDATE employees SET 
        employee_id = ?, first_name = ?, last_name = ?, middle_name = ?,
        position_id = ?, address = ?, contact_email = ?, contact_phone = ?, salary = ?
      WHERE id = ?
    `).run(
      employee_id.trim(),
      first_name.trim(),
      last_name.trim(),
      middle_name ? middle_name.trim() : null,
      position_id || null,
      address ? address.trim() : null,
      contact_email ? contact_email.trim() : null,
      contact_phone ? contact_phone.trim() : null,
      salary || null,
      id
    );

    const updatedEmployee = db.prepare(`
      SELECT e.*, p.name as position_name 
      FROM employees e 
      LEFT JOIN positions p ON e.position_id = p.id 
      WHERE e.id = ?
    `).get(id);

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_NOTNULL') {
      return res.status(400).json({ 
        error: 'Required fields cannot be empty' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/employees/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM employees WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Position routes
app.get('/api/positions', (req, res) => {
  try {
    const positions = db.prepare('SELECT * FROM positions ORDER BY name').all();
    res.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/positions', authenticateToken, (req, res) => {
  try {
    const { name } = req.body;

    // Валидация
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Position name is required' });
    }

    const result = db.prepare('INSERT INTO positions (name) VALUES (?)').run(name.trim());

    const newPosition = db.prepare('SELECT * FROM positions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newPosition);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Position already exists' });
    }
    console.error('Error creating position:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/positions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // Check if position is being used
    const employeesUsingPosition = db.prepare(
      'SELECT id FROM employees WHERE position_id = ?'
    ).all(id);

    if (employeesUsingPosition.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete position that is assigned to employees' 
      });
    }

    const result = db.prepare('DELETE FROM positions WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1 as test').get();
    res.json({ 
      status: 'OK', 
      database: 'SQLite', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Using SQLite database`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  console.log(`👤 Admin credentials: admin / password`);
});