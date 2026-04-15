const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { simplifyNote } = require('../services/aiService');

const VALID_STYLES = ['simple', 'detailed', 'bullet_points', 'flashcards'];

async function simplify(req, res, next) {
  try {
    const { material_id, style = 'simple' } = req.body;

    if (!material_id) return res.status(400).json({ error: 'material_id is required' });
    if (!VALID_STYLES.includes(style)) return res.status(400).json({ error: 'Invalid style' });

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    if (!material.extracted_text) return res.status(400).json({ error: 'No text content found in this file' });

    const result = await simplifyNote(material.extracted_text, style);

    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO summaries (id, material_id, summary_text, style, model_used, tokens_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, material_id, result.text, style, result.model, result.tokens, now);

    const summary = db.prepare('SELECT * FROM summaries WHERE id = ?').get(id);
    res.status(201).json(summary);
  } catch (err) {
    next(err);
  }
}

function getSummaries(req, res, next) {
  try {
    const summaries = db.prepare(
      'SELECT * FROM summaries WHERE material_id = ? ORDER BY created_at DESC'
    ).all(req.params.material_id);
    res.json(summaries);
  } catch (err) {
    next(err);
  }
}

function deleteSummary(req, res, next) {
  try {
    const summary = db.prepare('SELECT id FROM summaries WHERE id = ?').get(req.params.id);
    if (!summary) return res.status(404).json({ error: 'Summary not found' });
    db.prepare('DELETE FROM summaries WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { simplify, getSummaries, deleteSummary };
