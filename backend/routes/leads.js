const router = require('express').Router();
const auth = require('../middleware/auth');
const { createLead, getLeads, getLead, updateLead, deleteLead } = require('../controllers/leadController');

router.use(auth);

router.post('/', createLead);
router.get('/', getLeads);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

module.exports = router;
