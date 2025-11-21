const router = require('express').Router();
const { getNotes, getNoteById, likeNote, viewNote } = require('../controllers/noteController');

router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/:id/like', likeNote);
router.post('/:id/view', viewNote);

module.exports = router;


