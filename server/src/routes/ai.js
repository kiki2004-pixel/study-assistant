const router = require('express').Router();
const { simplify, getSummaries, deleteSummary } = require('../controllers/aiController');

router.post('/simplify', simplify);
router.get('/summaries/:material_id', getSummaries);
router.delete('/summaries/:id', deleteSummary);

module.exports = router;
