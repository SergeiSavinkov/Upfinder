const express = require('express')
const pool = require('../db/database')

const router = express.Router()

const getUserRole = role => {
  return role === 'staff' ? 'staff' : 'student'
}

const register = async (req, res) => {
  const { first_name, last_name, email, password, password_hash, role } = req.body
  const userPassword = password_hash || password
  const userRole = getUserRole(role)

  try {
    const [result] = await pool.query(
      `INSERT INTO user (first_name, last_name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)`,
      [first_name, last_name, email, userPassword, userRole]
    )

    res.json({
      id: result.insertId,
      email,
      role: userRole
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const login = async (req, res) => {
  const { email, password, password_hash } = req.body
  const userPassword = password_hash || password

  try {
    const [users] = await pool.query(
      `SELECT *
      FROM user
      WHERE email = ? AND password_hash = ?`,
      [email, userPassword]
    )

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials'
      })
    }

    const user = users[0]

    res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const { first_name, last_name, email, password, password_hash, role } = req.body
  const userPassword = password_hash || password || null
  const userRole = getUserRole(role)

  try {
    const [result] = await pool.query(
      `UPDATE user
      SET first_name = ?, last_name = ?, email = ?, role = ?, password_hash = COALESCE(?, password_hash)
      WHERE id = ?`,
      [first_name, last_name, email, userRole, userPassword, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    const [users] = await pool.query(
      `SELECT id, first_name, last_name, email, role
      FROM user
      WHERE id = ?`,
      [id]
    )

    res.json(users[0])
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

router.post('/register', register)
router.post('/login', login)
router.put('/users/:id', updateUser)

module.exports = router
