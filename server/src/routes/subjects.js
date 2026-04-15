const router = require('express').Router();
const { listSubjects, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectsController');

router.get('/', listSubjects);
router.post('/', createSubject);
router.patch('/:id', updateSubject);
router.delete('/:id', deleteSubject);

module.exports = router;
