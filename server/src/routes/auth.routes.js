const express = require('express')
const pool = require('../db/database')

const router = express.Router()

router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password, password_hash, role } = req.body
  const userPassword = password_hash || password

  try {
    const [result] = await pool.query(
      `INSERT INTO user (first_name, last_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [first_name, last_name, email, userPassword, role || 'student']
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

router.post('/login', async (req, res) => {
  const { email, password, password_hash } = req.body
  const userPassword = password_hash || password

  try {
    const [results] = await pool.query(
      'SELECT * FROM user WHERE email = ? AND password_hash = ?',
      [email, userPassword]
    )

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = results[0]

    res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
