const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { db } = require('../config/database');
const { extractText } = require('../services/extractionService');


function getFileType(mimeType) {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'text/plain') return 'text';
  return 'image';
}

async function uploadMaterial(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { material_type = 'note', subject = '' } = req.body;
    const now = new Date().toISOString();
    const id = uuidv4();

    const extracted = await extractText(req.file.path, req.file.mimetype);

    const stmt = db.prepare(`
      INSERT INTO materials (id, original_name, stored_name, file_path, file_type, material_type, subject, extracted_text, file_size, mime_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      req.file.originalname,
      req.file.filename,
      req.file.path,
      getFileType(req.file.mimetype),
      material_type,
      subject,
      extracted,
      req.file.size,
      req.file.mimetype,
      now,
      now
    );

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
    res.status(201).json(material);
  } catch (err) {
    next(err);
  }
}

function listMaterials(req, res, next) {
  try {
    const { type, subject } = req.query;
    let query = 'SELECT * FROM materials WHERE 1=1';
    const params = [];

    if (type) { query += ' AND material_type = ?'; params.push(type); }
    if (subject) { query += ' AND subject = ?'; params.push(subject); }
    query += ' ORDER BY created_at DESC';

    const materials = db.prepare(query).all(...params);
    res.json(materials);
  } catch (err) {
    next(err);
  }
}

function getMaterial(req, res, next) {
  try {
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json(material);
  } catch (err) {
    next(err);
  }
}

function updateMaterial(req, res, next) {
  try {
    const { subject, material_type } = req.body;
    const now = new Date().toISOString();
    db.prepare('UPDATE materials SET subject = ?, material_type = ?, updated_at = ? WHERE id = ?')
      .run(subject, material_type, now, req.params.id);
    const updated = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Material not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

function deleteMaterial(req, res, next) {
  try {
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    if (fs.existsSync(material.file_path)) {
      fs.unlinkSync(material.file_path);
    }
    db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadMaterial, listMaterials, getMaterial, updateMaterial, deleteMaterial };
