const express = require('express')
const pool = require('../db/database')

const router = express.Router()

const BASE_SELECT = `
  SELECT
    r.id,
    r.user_id,
    r.report_type,
    r.status,
    r.item_name,
    r.item_description,
    r.category_id,
    r.location_id,
    r.created_at,
    r.updated_at,
    r.image IS NOT NULL AS has_image,
    c.name AS category_name,
    l.location_name,
    l.floor AS location_floor,
    l.room AS location_room,
    l.description AS location_description,
    u.email
  FROM item_report r
  JOIN user u ON r.user_id = u.id
  JOIN category c ON r.category_id = c.id
  JOIN location l ON r.location_id = l.id
`

const getIdByName = async (table, field, value) => {
  if (!value) return null
  const [rows] = await pool.query(`SELECT id FROM ${table} WHERE ${field} = ?`, [value])
  return rows[0]?.id
}

router.post('/', async (req, res) => {
  const {
    user_id,
    item_name,
    description,
    item_description,
    report_type,
    category_id,
    category_name,
    location_id,
    location_name,
    status
  } = req.body

  try {
    const resolvedCategoryId = category_id || (await getIdByName('category', 'name', category_name))
    const resolvedLocationId = location_id || (await getIdByName('location', 'location_name', location_name))

    const [result] = await pool.query(
      `INSERT INTO item_report
        (user_id, item_name, item_description, report_type, category_id, location_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        item_name,
        item_description || description,
        report_type,
        resolvedCategoryId,
        resolvedLocationId,
        status || 'open'
      ]
    )

    res.json({
      id: result.insertId,
      user_id,
      item_name,
      item_description: item_description || description,
      report_type,
      category_id: resolvedCategoryId,
      location_id: resolvedLocationId,
      status: status || 'open'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  const {
    search,
    reportType,
    status,
    category,
    location,
    dateFrom,
    dateTo,
    sort = 'newest'
  } = req.query

  try {
    const conditions = []
    const values = []

    if (search) {
      conditions.push(`(r.item_name LIKE ? OR r.item_description LIKE ? OR c.name LIKE ? OR l.location_name LIKE ? OR l.description LIKE ?)`)
      const searchValue = `%${search}%`
      values.push(searchValue, searchValue, searchValue, searchValue, searchValue)
    }

    if (reportType && reportType !== 'all') {
      conditions.push('r.report_type = ?')
      values.push(reportType)
    }

    if (status && status !== 'all') {
      conditions.push('r.status = ?')
      values.push(status)
    }

    if (category && category !== 'all') {
      conditions.push('c.name = ?')
      values.push(category)
    }

    if (location && location !== 'all') {
      conditions.push('l.location_name = ?')
      values.push(location)
    }

    if (dateFrom) {
      conditions.push('DATE(r.created_at) >= ?')
      values.push(dateFrom)
    }

    if (dateTo) {
      conditions.push('DATE(r.created_at) <= ?')
      values.push(dateTo)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderDirection = sort === 'oldest' ? 'ASC' : 'DESC'

    const [results] = await pool.query(
      `${BASE_SELECT} ${whereClause} ORDER BY r.created_at ${orderDirection}`,
      values
    )

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [results] = await pool.query(
      `${BASE_SELECT} WHERE r.id = ?`,
      [req.params.id]
    )

    if (!results.length) {
      return res.status(404).json({ error: 'Report not found' })
    }

    res.json(results[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/image', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT image FROM item_report WHERE id = ?',
      [req.params.id]
    )

    if (!results.length || !results[0].image) {
      return res.status(404).json({ error: 'Image not found' })
    }

    res.setHeader('Content-Type', 'image/png')
    res.send(results[0].image)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
