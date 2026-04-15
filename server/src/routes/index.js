const router = require('express').Router();
const materialsRoutes = require('./materials');
const aiRoutes = require('./ai');
const timetableRoutes = require('./timetable');
const subjectsRoutes = require('./subjects');

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/materials', materialsRoutes);
router.use('/ai', aiRoutes);
router.use('/timetable', timetableRoutes);
router.use('/subjects', subjectsRoutes);

module.exports = router;
