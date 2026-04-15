const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#14b8a6'];

function listSubjects(req, res, next) {
  try {
    res.json(db.prepare('SELECT * FROM subjects ORDER BY name').all());
  } catch (err) { next(err); }
}

function createSubject(req, res, next) {
  try {
    const { name, color, priority = 1, exam_date } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const id = uuidv4();
    const now = new Date().toISOString();
    const assignedColor = color || COLORS[Math.floor(Math.random() * COLORS.length)];
    db.prepare('INSERT INTO subjects (id, name, color, priority, exam_date, created_at) VALUES (?,?,?,?,?,?)')
      .run(id, name, assignedColor, priority, exam_date || null, now);
    res.status(201).json(db.prepare('SELECT * FROM subjects WHERE id = ?').get(id));
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Subject already exists' });
    next(err);
  }
}

function updateSubject(req, res, next) {
  try {
    const { name, color, priority, exam_date } = req.body;
    db.prepare('UPDATE subjects SET name=?, color=?, priority=?, exam_date=? WHERE id=?')
      .run(name, color, priority, exam_date || null, req.params.id);
    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Subject not found' });
    res.json(updated);
  } catch (err) { next(err); }
}

function deleteSubject(req, res, next) {
  try {
    const s = db.prepare('SELECT id FROM subjects WHERE id = ?').get(req.params.id);
    if (!s) return res.status(404).json({ error: 'Subject not found' });
    db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { listSubjects, createSubject, updateSubject, deleteSubject };
