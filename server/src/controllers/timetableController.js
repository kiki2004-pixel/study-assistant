const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { generateTimetable } = require('../services/aiService');

async function generate(req, res, next) {
  try {
    const {
      school_timetable_id,
      subjects,
      start_date,
      end_date,
      study_hours_per_day = 4,
      name,
    } = req.body;

    if (!subjects || subjects.length === 0) {
      return res.status(400).json({ error: 'At least one subject is required' });
    }
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    let schoolTimetableText = null;
    if (school_timetable_id) {
      const mat = db.prepare('SELECT extracted_text FROM materials WHERE id = ?').get(school_timetable_id);
      if (mat) schoolTimetableText = mat.extracted_text;
    }

    const result = await generateTimetable({
      schoolTimetableText,
      subjects,
      startDate: start_date,
      endDate: end_date,
      studyHoursPerDay: study_hours_per_day,
    });

    const id = uuidv4();
    const now = new Date().toISOString();
    const timetableName = name || `Study Plan ${start_date} to ${end_date}`;

    db.prepare(`
      INSERT INTO study_timetables (id, name, school_timetable_id, subjects_json, schedule_json, start_date, end_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      timetableName,
      school_timetable_id || null,
      JSON.stringify(subjects),
      JSON.stringify(result.schedule),
      start_date,
      end_date,
      now
    );

    const saved = db.prepare('SELECT * FROM study_timetables WHERE id = ?').get(id);
    res.status(201).json({
      ...saved,
      subjects_json: JSON.parse(saved.subjects_json),
      schedule_json: JSON.parse(saved.schedule_json),
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(422).json({ error: 'AI returned invalid schedule. Please try again.' });
    }
    next(err);
  }
}

function listTimetables(req, res, next) {
  try {
    const timetables = db.prepare('SELECT id, name, start_date, end_date, created_at FROM study_timetables ORDER BY created_at DESC').all();
    res.json(timetables);
  } catch (err) {
    next(err);
  }
}

function getTimetable(req, res, next) {
  try {
    const t = db.prepare('SELECT * FROM study_timetables WHERE id = ?').get(req.params.id);
    if (!t) return res.status(404).json({ error: 'Timetable not found' });
    res.json({
      ...t,
      subjects_json: t.subjects_json ? JSON.parse(t.subjects_json) : [],
      schedule_json: t.schedule_json ? JSON.parse(t.schedule_json) : {},
    });
  } catch (err) {
    next(err);
  }
}

function deleteTimetable(req, res, next) {
  try {
    const t = db.prepare('SELECT id FROM study_timetables WHERE id = ?').get(req.params.id);
    if (!t) return res.status(404).json({ error: 'Timetable not found' });
    db.prepare('DELETE FROM study_timetables WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { generate, listTimetables, getTimetable, deleteTimetable };
