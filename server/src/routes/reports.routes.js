const express = require('express')
const multer = require('multer')
const pool = require('../db/database')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage()
})

const createReport = async (req, res) => {
  const { user_id, item_name, item_description, report_type, category_name, location_name } = req.body

  if (!user_id || !item_name || !item_description || !report_type || !category_name || !location_name) {
    return res.status(400).json({
      error: 'Required fields are missing'
    })
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO item_report
      (user_id, item_name, item_description, report_type, category_name, location_name, status, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, item_name, item_description, report_type, category_name, location_name, 'open', req.file ? req.file.buffer : null]
    )

    res.status(201).json({
      id: result.insertId,
      user_id,
      item_name,
      item_description,
      report_type,
      category_name,
      location_name,
      status: 'open',
      has_image: Boolean(req.file)
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const getReports = async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT r.id, r.user_id, r.report_type, r.status, r.item_name, r.item_description,
      r.category_name, r.location_name, r.created_at, r.image IS NOT NULL AS has_image,
      u.first_name, u.last_name, u.email
      FROM item_report r
      JOIN user u ON r.user_id = u.id
      ORDER BY r.created_at DESC`
    )

    res.json(reports)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const getReportById = async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT r.id, r.user_id, r.report_type, r.status, r.item_name, r.item_description,
      r.category_name, r.location_name, r.created_at, r.updated_at, r.image IS NOT NULL AS has_image,
      u.first_name, u.last_name, u.email
      FROM item_report r
      JOIN user u ON r.user_id = u.id
      WHERE r.id = ?`,
      [req.params.id]
    )

    if (reports.length === 0) {
      return res.status(404).json({
        error: 'Report not found'
      })
    }

    res.json(reports[0])
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const updateReport = async (req, res) => {
  const { item_name, item_description, report_type, category_name, location_name } = req.body

  if (!item_name || !item_description || !report_type || !category_name || !location_name) {
    return res.status(400).json({
      error: 'Required fields are missing'
    })
  }

  try {
    const values = [item_name, item_description, report_type, category_name, location_name]
    let imageSql = ''

    if (req.file) {
      imageSql = ', image = ?'
      values.push(req.file.buffer)
    }

    values.push(req.params.id)

    const [result] = await pool.query(
      `UPDATE item_report
      SET item_name = ?, item_description = ?, report_type = ?, category_name = ?, location_name = ?
      ${imageSql}
      WHERE id = ?`,
      values
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Report not found'
      })
    }

    res.json({
      id: Number(req.params.id),
      item_name,
      item_description,
      report_type,
      category_name,
      location_name,
      has_image: Boolean(req.file)
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const getReportImage = async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT image
      FROM item_report
      WHERE id = ?`,
      [req.params.id]
    )

    if (!reports.length || !reports[0].image) {
      return res.status(404).json({
        error: 'Image not found'
      })
    }

    res.setHeader('Content-Type', 'image/png')
    res.send(reports[0].image)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const deleteReport = async (req, res) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [claims] = await connection.query(
      `SELECT id
      FROM claim
      WHERE item_report_id = ?`,
      [req.params.id]
    )

    const [messages] = await connection.query(
      `SELECT id
      FROM message
      WHERE item_report_id = ?`,
      [req.params.id]
    )

    const [matches] = await connection.query(
      `SELECT id
      FROM \`match\`
      WHERE lost_report_id = ? OR found_report_id = ?`,
      [req.params.id, req.params.id]
    )

    if (claims.length > 0) {
      await connection.query(
        `DELETE FROM notification
        WHERE entity_type = 'claim'
        AND entity_id IN (?)`,
        [claims.map(claim => claim.id)]
      )
    }

    if (messages.length > 0) {
      await connection.query(
        `DELETE FROM notification
        WHERE entity_type = 'message'
        AND entity_id IN (?)`,
        [messages.map(message => message.id)]
      )
    }

    if (matches.length > 0) {
      await connection.query(
        `DELETE FROM notification
        WHERE entity_type = 'match'
        AND entity_id IN (?)`,
        [matches.map(match => match.id)]
      )
    }

    const [claimsResult] = await connection.query(
      `DELETE FROM claim
      WHERE item_report_id = ?`,
      [req.params.id]
    )

    const [messagesResult] = await connection.query(
      `DELETE FROM message
      WHERE item_report_id = ?`,
      [req.params.id]
    )

    const [matchesResult] = await connection.query(
      `DELETE FROM \`match\`
      WHERE lost_report_id = ? OR found_report_id = ?`,
      [req.params.id, req.params.id]
    )

    const [result] = await connection.query(
      `DELETE FROM item_report
      WHERE id = ?`,
      [req.params.id]
    )

    if (result.affectedRows === 0) {
      await connection.rollback()

      return res.status(404).json({
        error: 'Report not found'
      })
    }

    await connection.commit()

    res.json({
      message: 'Report deleted',
      deletedClaims: claimsResult.affectedRows,
      deletedMessages: messagesResult.affectedRows,
      deletedMatches: matchesResult.affectedRows
    })
  } catch (err) {
    await connection.rollback()

    res.status(500).json({
      error: err.message
    })
  } finally {
    connection.release()
  }
}

router.post('/', upload.single('image'), createReport)
router.get('/', getReports)
router.get('/:id', getReportById)
router.put('/:id', upload.single('image'), updateReport)
router.get('/:id/image', getReportImage)
router.delete('/:id', deleteReport)

module.exports = router
