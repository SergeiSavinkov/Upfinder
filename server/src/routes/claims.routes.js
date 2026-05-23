const express = require('express')
const pool = require('../db/database')

const router = express.Router()

router.post('/', async (req, res) => {
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
})

router.get('/user/:userId', async (req, res) => {
    try {
        const [results] = await pool.query(
            `SELECT c.id, c.item_report_id, c.claimant_id, c.description, c.status, c.created_at,
            r.item_name, r.item_description, r.report_type, r.image IS NOT NULL AS has_image,
            u.email AS claimant_email

            FROM claim c

            JOIN item_report r ON c.item_report_id = r.id

            JOIN user u ON c.claimant_id = u.id

            WHERE c.claimant_id = ?

            ORDER BY c.created_at DESC`,

            [req.params.userId]
        )

        res.json(results)

    } catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
})

router.get('/report/:reportId', async (req, res) => {
    try {
        const [results] = await pool.query(
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
            `SELECT c.id, c.item_report_id, c.claimant_id, c.description, c.status, c.created_at,
            r.item_name, r.item_description, r.report_type, r.image IS NOT NULL AS has_image,
            u.email AS claimant_email

            FROM claim c

            JOIN item_report r ON c.item_report_id = r.id

            JOIN user u ON c.claimant_id = u.id

            WHERE c.id = ?`,

            [req.params.id]
        )

        if (results.length === 0) {
            return res.status(404).json({
                error: 'Claim not found'
            })
        }

        res.json(results[0])

    } catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
})

router.patch('/:id/status', async (req, res) => {
    const { status } = req.body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
            error: 'Invalid claim status'
        })
    }

    try {
        const [result] = await pool.query(
            `UPDATE claim
            SET status = ?
            WHERE id = ?`,
            [status, req.params.id]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Claim not found'
            })
        }

        res.json({
            id: Number(req.params.id),
            status
        })

    } catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
})

router.put('/:id', async (req, res) => {
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
})

router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM claim WHERE id = ?',
            [req.params.id]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Claim not found'
            })
        }

        res.json({
            message: 'Claim deleted'
        })

    } catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
})

module.exports = router

