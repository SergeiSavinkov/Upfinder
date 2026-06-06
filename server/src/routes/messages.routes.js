const express = require('express')
const pool = require('../db/database')
const { createNotification } = require('./notifications.routes')

const router = express.Router()

const getContacts = async (req, res) => {
  const { userId } = req.params

  try {
    const [contacts] = await pool.query(
      `SELECT other_user.id AS user_id, other_user.first_name, other_user.last_name, other_user.email,
      r.id AS item_report_id, r.item_name, r.report_type,
      MAX(m.created_at) AS last_message_at
      FROM message m
      JOIN item_report r ON r.id = m.item_report_id
      JOIN user other_user
      ON other_user.id = CASE
        WHEN m.sender_id = ? THEN m.receiver_id
        ELSE m.sender_id
      END
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY other_user.id, r.id
      ORDER BY last_message_at DESC`,
      [userId, userId, userId]
    )

    res.json(contacts)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const getMessages = async (req, res) => {
  const { userId, contactId, itemReportId } = req.query

  if (!userId || !contactId || !itemReportId) {
    return res.status(400).json({
      error: 'userId, contactId and itemReportId are required'
    })
  }

  try {
    const [messages] = await pool.query(
      `SELECT id, sender_id, receiver_id, item_report_id, content, created_at
      FROM message
      WHERE item_report_id = ?
      AND (
        (sender_id = ? AND receiver_id = ?)
        OR
        (sender_id = ? AND receiver_id = ?)
      )
      ORDER BY created_at ASC`,
      [itemReportId, userId, contactId, contactId, userId]
    )

    res.json(messages)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const createMessage = async (req, res) => {
  const { sender_id, receiver_id, item_report_id, content } = req.body

  if (!sender_id || !receiver_id || !item_report_id || !content?.trim()) {
    return res.status(400).json({
      error: 'sender_id, receiver_id, item_report_id and content are required'
    })
  }

  if (Number(sender_id) === Number(receiver_id)) {
    return res.status(400).json({
      error: 'You cannot message yourself.'
    })
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO message (sender_id, receiver_id, item_report_id, content)
      VALUES (?, ?, ?, ?)`,
      [sender_id, receiver_id, item_report_id, content.trim()]
    )

    await createNotification({
      user_id: receiver_id,
      entity_id: result.insertId,
      entity_type: 'message'
    })

    res.json({
      id: result.insertId,
      sender_id,
      receiver_id,
      item_report_id,
      content: content.trim(),
      created_at: new Date()
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

router.get('/contacts/:userId', getContacts)
router.get('/', getMessages)
router.post('/', createMessage)

module.exports = router
