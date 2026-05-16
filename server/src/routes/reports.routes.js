const express = require('express')
const multer = require('multer')
const pool = require ('../db/database')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage()
})

router.post('/', upload.single('image'), async (req, res) => {
  const { user_id, item_name, item_description, report_type, category_id, category_name, location_id, location_name, location_floor, location_room, location_description, status } = req.body

  try {
    let finalCategoryId = category_id
    if (!finalCategoryId && category_name) {
      const [catRows] = await pool.query('SELECT id FROM category WHERE name = ?', [category_name])
      if (catRows.length) {
        finalCategoryId = catRows[0].id
      } else {
        const [catResult] = await pool.query('INSERT INTO category (name) VALUES (?)', [category_name])
        finalCategoryId = catResult.insertId
      }
    }

    let finalLocationId = location_id
    if (!finalLocationId && location_name) {
      const [locRows] = await pool.query('SELECT id FROM location WHERE location_name = ?', [location_name])
      if (locRows.length) {
        finalLocationId = locRows[0].id
      } else {
        const [locResult] = await pool.query(
          'INSERT INTO location (location_name, floor, room, description) VALUES (?, ?, ?, ?)',
          [location_name, location_floor || null, location_room || null, location_description || null]
        )
        finalLocationId = locResult.insertId
      }
    }

    const [result] = await pool.query(
      `INSERT INTO item_report
      (user_id, item_name, item_description, report_type, category_id, location_id, status, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, item_name, item_description, report_type, finalCategoryId, finalLocationId, status || 'open', req.file ? req.file.buffer : null]
    )

    res.json({id: result.insertId, user_id, item_name, item_description, report_type, category_id: finalCategoryId, location_id: finalLocationId, status: status || 'open', has_image: Boolean(req.file)})
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get('/', async (req, res) => {
  const {
    search,
    category,
    reportType
  } = req.query

  try {
    let query = `
    SELECT r.id, r.user_id, r.report_type, r.status, r.item_name, r.item_description, r.created_at, r.image IS NOT NULL AS has_image,
    c.name AS category_name,
    l.location_name, l.floor, l.room,
    u.email
    FROM item_report r
    JOIN category c ON r.category_id = c.id
    JOIN location l ON r.location_id = l.id
    JOIN user u ON r.user_id = u.id
    WHERE 1=1
    `
    
    const values = []

    if (search) {
      query += `
        AND (
          r.item_name LIKE ?
          OR r.item_description LIKE ?
          OR c.name LIKE ?
          OR l.location_name LIKE ?
        )
      `

      const searchValue = `%${search}%`

      values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue
      )
    }

    if (category) {
      query += ` AND c.name = ?`
      values.push(category)
    }

    if (reportType) {
      query += ` AND r.report_type = ?`
      values.push(reportType)
    }

    query += ` ORDER BY r.created_at DESC`

    const [results] = await pool.query(query, values)

    res.json(results)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [results] = await pool.query(
      `
      SELECT
        r.id,
        r.user_id,
        r.report_type,
        r.status,
        r.item_name,
        r.item_description,
        r.created_at,
        r.updated_at,
        r.image IS NOT NULL AS has_image,

        c.name AS category_name,

        l.location_name,
        l.floor,
        l.room,
        l.description,

        u.email

      FROM item_report r

      JOIN category c
        ON r.category_id = c.id

      JOIN location l
        ON r.location_id = l.id

      JOIN user u
        ON r.user_id = u.id

      WHERE r.id = ?
      `,
      [req.params.id]
    )

    if (results.length === 0) {
      return res.status(404).json({
        error: 'Report not found'
      })
    }

    res.json(results[0])
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get('/:id/image', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT image FROM item_report WHERE id = ?',
      [req.params.id]
    )

    if (!results.length || !results[0].image) {
      return res.status(404).json({
        error: 'Image not found'
      })
    }

    res.setHeader('Content-Type', 'image/png')
    res.send(results[0].image)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

module.exports = router