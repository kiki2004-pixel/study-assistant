const router = require('express').Router();
const upload = require('../middleware/upload');
const {
  uploadMaterial, listMaterials, getMaterial, updateMaterial, deleteMaterial,
} = require('../controllers/materialsController');

router.get('/', listMaterials);
router.get('/:id', getMaterial);
router.post('/upload', upload.single('file'), uploadMaterial);
router.patch('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

module.exports = router;
