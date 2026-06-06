const express = require('express')
const pool = require('../db/database')
const { createNotification } = require('./notifications.routes')

const router = express.Router()

const createClaim = async (req, res) => {
  const { item_report_id, claimant_id, description } = req.body

  if (!item_report_id || !claimant_id) {
    return res.status(400).json({
      error: 'item_report_id and claimant_id are required'
    })
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO claim (item_report_id, claimant_id, description)
      VALUES (?, ?, ?)`,
      [item_report_id, claimant_id, description || null]
    )

    const [reports] = await pool.query(
      `SELECT user_id
      FROM item_report
      WHERE id = ?`,
      [item_report_id]
    )

    const report = reports[0]

    if (report && Number(report.user_id) !== Number(claimant_id)) {
      await createNotification({
        user_id: report.user_id,
        entity_id: result.insertId,
        entity_type: 'claim'
      })
    }

    res.status(201).json({
      id: result.insertId,
      item_report_id,
      claimant_id,
      description: description || null,
      status: 'pending'
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const getUserClaims = async (req, res) => {
  try {
    const [claims] = await pool.query(
      `SELECT c.id, c.item_report_id, c.claimant_id, c.description, c.status, c.created_at,
      r.item_name, r.item_description, r.report_type, r.image IS NOT NULL AS has_image,
      u.email AS claimant_email
      FROM claim c
      JOIN item_report r ON c.item_report_id = r.id
      JOIN user u ON c.claimant_id = u.id
      WHERE c.claimant_id = ?
      AND c.status <> 'approved'
      ORDER BY c.created_at DESC`,
      [req.params.userId]
    )

    res.json(claims)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const getReportClaims = async (req, res) => {
  try {
    const [claims] = await pool.query(
      `SELECT c.id, c.item_report_id, c.claimant_id, c.description, c.status, c.created_at,
      r.item_name, r.item_description, r.report_type,
      u.email AS claimant_email
      FROM claim c
      JOIN item_report r ON c.item_report_id = r.id
      JOIN user u ON c.claimant_id = u.id
      WHERE c.item_report_id = ?
      ORDER BY c.created_at DESC`,
      [req.params.reportId]
    )

    res.json(claims)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const getClaimById = async (req, res) => {
  try {
    const [claims] = await pool.query(
      `SELECT c.id, c.item_report_id, c.claimant_id, c.description, c.status, c.created_at,
      r.item_name, r.item_description, r.report_type, r.image IS NOT NULL AS has_image,
      u.email AS claimant_email
      FROM claim c
      JOIN item_report r ON c.item_report_id = r.id
      JOIN user u ON c.claimant_id = u.id
      WHERE c.id = ?`,
      [req.params.id]
    )

    if (claims.length === 0) {
      return res.status(404).json({
        error: 'Claim not found'
      })
    }

    res.json(claims[0])
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const updateClaimStatus = async (req, res) => {
  const { status } = req.body

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      error: 'Invalid claim status'
    })
  }

  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [claims] = await connection.query(
      `SELECT item_report_id
      FROM claim
      WHERE id = ?`,
      [req.params.id]
    )

    if (claims.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        error: 'Claim not found'
      })
    }

    const claim = claims[0]

    if (status === 'approved') {
      const [approvedClaims] = await connection.query(
        `SELECT id
     FROM claim
     WHERE item_report_id = ?
     AND status = 'approved'
     AND id <> ?`,
        [claim.item_report_id, req.params.id]
      )

      if (approvedClaims.length > 0) {
        await connection.rollback()

        return res.status(400).json({
          error: 'Another claim is already approved'
        })
      }
    }

    const [result] = await connection.query(
      `UPDATE claim
      SET status = ?
      WHERE id = ?`,
      [status, req.params.id]
    )

    if (status === 'approved') {
      await connection.query(
        `UPDATE item_report
        SET status = 'returned'
        WHERE id = ?`,
        [claim.item_report_id]
      )
    } else {
      const [approvedClaims] = await connection.query(
        `SELECT id
        FROM claim
        WHERE item_report_id = ? AND status = 'approved'`,
        [claim.item_report_id]
      )

      if (approvedClaims.length === 0) {
        await connection.query(
          `UPDATE item_report
          SET status = 'open'
          WHERE id = ?`,
          [claim.item_report_id]
        )
      }
    }

    const [reports] = await connection.query(
      `SELECT status
      FROM item_report
      WHERE id = ?`,
      [claim.item_report_id]
    )

    await connection.commit()

    res.json({
      id: Number(req.params.id),
      status,
      item_report_id: claim.item_report_id,
      report_status: reports[0]?.status || 'open'
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

const updateClaim = async (req, res) => {
  const { claimant_id, description } = req.body

  if (!claimant_id) {
    return res.status(400).json({
      error: 'claimant_id is required'
    })
  }

  if (!description || !description.trim()) {
    return res.status(400).json({
      error: 'description is required'
    })
  }

  try {
    const [result] = await pool.query(
      `UPDATE claim
      SET description = ?
      WHERE id = ? AND claimant_id = ?`,
      [description.trim(), req.params.id, claimant_id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Claim not found'
      })
    }

    res.json({
      id: Number(req.params.id),
      claimant_id,
      description: description.trim()
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const deleteClaim = async (req, res) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [claims] = await connection.query(
      `SELECT item_report_id, status
      FROM claim
      WHERE id = ?`,
      [req.params.id]
    )

    if (claims.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        error: 'Claim not found'
      })
    }

    const claim = claims[0]

    const [result] = await connection.query(
      `DELETE FROM claim
      WHERE id = ?`,
      [req.params.id]
    )

    if (claim.status === 'approved') {
      const [approvedClaims] = await connection.query(
        `SELECT id
        FROM claim
        WHERE item_report_id = ? AND status = 'approved'`,
        [claim.item_report_id]
      )

      if (approvedClaims.length === 0) {
        await connection.query(
          `UPDATE item_report
          SET status = 'open'
          WHERE id = ?`,
          [claim.item_report_id]
        )
      }
    }

    await connection.commit()

    res.json({
      message: 'Claim deleted'
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

router.post('/', createClaim)
router.get('/user/:userId', getUserClaims)
router.get('/report/:reportId', getReportClaims)
router.get('/:id', getClaimById)
router.patch('/:id/status', updateClaimStatus)
router.put('/:id', updateClaim)
router.delete('/:id', deleteClaim)

module.exports = router
