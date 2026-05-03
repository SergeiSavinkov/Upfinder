const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')

const app = express()

app.use(express.json())
app.use(cors())

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'upfinder'
})

app.get('/', (req, res) => {
  res.send('API working')
})

app.post('/reports', async (req, res) => {
  const { user_id, item_name, description, report_type } = req.body

  try {
    const [result] = await pool.query(
      `INSERT INTO item_report (user_id, item_name, description, report_type)
      VALUES (?, ?, ?, ?)`,
      [user_id, item_name, description, report_type]
    )

    res.json({
      id: result.insertId,
      user_id,
      item_name,
      description,
      report_type
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/reports', async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT r.*, u.email
      FROM item_report r
      JOIN user u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `)

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/auth/register', async (req, res) => {
  const { first_name, last_name, email, password, role } = req.body

  try {
    const [result] = await pool.query(
      `INSERT INTO user (first_name, last_name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [first_name, last_name, email, password, role || 'student']
    )

    res.json({
      id: result.insertId,
      email,
      role: role || 'student'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const [results] = await pool.query(
      'SELECT * FROM user WHERE email = ? AND password = ?',
      [email, password]
    )

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    res.json(results[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(5000, () => console.log('Server running'))