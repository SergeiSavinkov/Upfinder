const express = require('express')
const pool = require('../db/database')
const { createNotification } = require('./notifications.routes')

const router = express.Router()

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getWords(value) {
  const ignoredWords = ['the', 'a', 'an', 'in', 'at', 'with', 'and', 'or', 'of', 'to']

  return normalizeText(value)
    .split(' ')
    .filter(word => word.length > 2 && !ignoredWords.includes(word))
}

function getWordSimilarity(leftText, rightText) {
  const leftWords = new Set(getWords(leftText))
  const rightWords = new Set(getWords(rightText))

  if (leftWords.size === 0 || rightWords.size === 0) {
    return 0
  }

  const commonWords = [...leftWords].filter(word => rightWords.has(word))
  const allWords = new Set([...leftWords, ...rightWords])

  return commonWords.length / allWords.size
}

function calculateSimilarity(report, candidate) {
  let score = 0

  if (normalizeText(report.category_name) === normalizeText(candidate.category_name)) {
    score += 35
  }

  if (normalizeText(report.location_name) === normalizeText(candidate.location_name)) {
    score += 20
  }

  score += getWordSimilarity(report.item_name, candidate.item_name) * 30
  score += getWordSimilarity(report.item_description, candidate.item_description) * 15

  return Math.round(score)
}

const getMatchesForReport = async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT id, user_id, report_type, status, item_name, item_description,
      category_name, location_name, created_at, image IS NOT NULL AS has_image
      FROM item_report
      WHERE id = ?`,
      [req.params.reportId]
    )

    if (reports.length === 0) {
      return res.status(404).json({
        error: 'Report not found'
      })
    }

    const report = reports[0]
    const oppositeType = report.report_type === 'lost' ? 'found' : 'lost'

    const [candidates] = await pool.query(
      `SELECT id, user_id, report_type, status, item_name, item_description,
      category_name, location_name, created_at, image IS NOT NULL AS has_image
      FROM item_report
      WHERE report_type = ?
      AND id <> ?`,
      [oppositeType, report.id]
    )

    const matches = []

    for (const candidate of candidates) {
      const similarityScore = calculateSimilarity(report, candidate)

      if (similarityScore < 40) {
        continue
      }

      const lostReportId = report.report_type === 'lost' ? report.id : candidate.id
      const foundReportId = report.report_type === 'found' ? report.id : candidate.id

      const [existingMatches] = await pool.query(
        `SELECT id, status
        FROM \`match\`
        WHERE lost_report_id = ?
        AND found_report_id = ?`,
        [lostReportId, foundReportId]
      )

      let matchId = existingMatches[0]?.id
      const matchStatus = existingMatches[0]?.status || 'pending'

      if (matchId) {
        await pool.query(
          `UPDATE \`match\`
          SET similarity_score = ?
          WHERE id = ?`,
          [similarityScore, matchId]
        )
      } else {
        const [result] = await pool.query(
          `INSERT INTO \`match\` (lost_report_id, found_report_id, similarity_score, status)
          VALUES (?, ?, ?, ?)`,
          [lostReportId, foundReportId, similarityScore, 'pending']
        )

        matchId = result.insertId

        const userIds = [...new Set([report.user_id, candidate.user_id])]

        for (const userId of userIds) {
          await createNotification({
            user_id: userId,
            entity_id: matchId,
            entity_type: 'match'
          })
        }
      }

      matches.push({
        match_id: matchId,
        status: matchStatus,
        similarity_score: similarityScore,
        report: candidate
      })
    }

    matches.sort((a, b) => b.similarity_score - a.similarity_score)

    res.json(matches)
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

const getMatchById = async (req, res) => {
  try {
    const [matches] = await pool.query(
      `SELECT m.id, m.lost_report_id, m.found_report_id, m.similarity_score, m.status, m.created_at,
      lost.id AS lost_id,
      lost.user_id AS lost_user_id,
      lost.item_name AS lost_item_name,
      lost.item_description AS lost_item_description,
      lost.category_name AS lost_category_name,
      lost.location_name AS lost_location_name,
      lost.report_type AS lost_report_type,
      lost.status AS lost_status,
      lost.image IS NOT NULL AS lost_has_image,
      lost_user.email AS lost_email,
      found.id AS found_id,
      found.user_id AS found_user_id,
      found.item_name AS found_item_name,
      found.item_description AS found_item_description,
      found.category_name AS found_category_name,
      found.location_name AS found_location_name,
      found.report_type AS found_report_type,
      found.status AS found_status,
      found.image IS NOT NULL AS found_has_image,
      found_user.email AS found_email
      FROM \`match\` m
      JOIN item_report lost ON m.lost_report_id = lost.id
      JOIN item_report found ON m.found_report_id = found.id
      JOIN user lost_user ON lost.user_id = lost_user.id
      JOIN user found_user ON found.user_id = found_user.id
      WHERE m.id = ?`,
      [req.params.id]
    )

    if (matches.length === 0) {
      return res.status(404).json({
        error: 'Match not found'
      })
    }

    const match = matches[0]

    res.json({
      id: match.id,
      similarity_score: match.similarity_score,
      status: match.status,
      created_at: match.created_at,
      lost_report: {
        id: match.lost_id,
        user_id: match.lost_user_id,
        item_name: match.lost_item_name,
        item_description: match.lost_item_description,
        category_name: match.lost_category_name,
        location_name: match.lost_location_name,
        report_type: match.lost_report_type,
        status: match.lost_status,
        has_image: match.lost_has_image,
        email: match.lost_email
      },
      found_report: {
        id: match.found_id,
        user_id: match.found_user_id,
        item_name: match.found_item_name,
        item_description: match.found_item_description,
        category_name: match.found_category_name,
        location_name: match.found_location_name,
        report_type: match.found_report_type,
        status: match.found_status,
        has_image: match.found_has_image,
        email: match.found_email
      }
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
}

router.get('/report/:reportId', getMatchesForReport)
router.get('/:id', getMatchById)

module.exports = router
