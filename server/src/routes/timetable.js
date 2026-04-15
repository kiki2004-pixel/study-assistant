const router = require('express').Router();
const { generate, listTimetables, getTimetable, deleteTimetable } = require('../controllers/timetableController');

router.post('/generate', generate);
router.get('/', listTimetables);
router.get('/:id', getTimetable);
router.delete('/:id', deleteTimetable);

module.exports = router;
