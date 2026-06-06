const express = require('express')
const pool = require('../db/database')

const router = express.Router()

const createNotification = async ({ user_id, entity_id, entity_type }) => {
  if (!user_id || !entity_id || !entity_type) {
    return
  }

  await pool.query(
    `INSERT INTO notification (user_id, entity_id, entity_type)
    VALUES (?, ?, ?)`,
    [user_id, entity_id, entity_type]
  )
}

const buildNotification = async notification => {
  const item = {
    ...notification,
    title: 'Notification',
    text: 'You have a new notification.',
    action: 'Open',
    target_url: '/dashboard'
  }

  if (notification.entity_type === 'message') {
    const [messages] = await pool.query(
      `SELECT item_report_id
      FROM message
      WHERE id = ?`,
      [notification.entity_id]
    )

    item.title = 'New Message'
    item.text = 'You received a new message.'
    item.action = 'Chat'
    item.target_url = '/chat'

    if (messages[0]?.item_report_id) {
      item.item_report_id = messages[0].item_report_id
    }
  }

  if (notification.entity_type === 'claim') {
    const [claims] = await pool.query(
      `SELECT item_report_id
      FROM claim
      WHERE id = ?`,
      [notification.entity_id]
    )

    item.title = 'New Claim'
    item.text = 'Someone sent a claim for your report.'
    item.action = 'Claims'
    item.target_url = claims[0]?.item_report_id
      ? `/claim-review/${claims[0].item_report_id}`
      : '/my-reports'
  }

  if (notification.entity_type === 'match') {
    item.title = 'New Match'
    item.text = 'A possible match was found.'
    item.action = 'Matches'
    item.target_url = `/match-details/${notification.entity_id}`
  }

  return item
}

const getUserNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id, entity_id, entity_type, is_read, created_at
      FROM notification
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [req.params.userId]
    )

    const notifications = []

    for (const row of rows) {
      notifications.push(await buildNotification(row))
    }

    res.json(notifications)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const markNotificationAsRead = async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE notification
      SET is_read = 1
      WHERE id = ?`,
      [req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Notification not found'
      })
    }

    res.json({
      id: Number(req.params.id),
      is_read: true
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const deleteNotification = async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM notification
      WHERE id = ?`,
      [req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Notification not found'
      })
    }

    res.json({
      message: 'Notification deleted'
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

router.get('/user/:userId', getUserNotifications)
router.patch('/:id/read', markNotificationAsRead)
router.delete('/:id', deleteNotification)

module.exports = {
  router,
  createNotification
}
