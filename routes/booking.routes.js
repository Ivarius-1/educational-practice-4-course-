const express = require('express');
const controller = require('../controllers/booking.controller');

const router = express.Router();

router.post('/', controller.create);
router.get('/user/:userId', controller.getUserBookings);
router.get('/', controller.getAll);
router.patch('/:id/status', controller.changeStatus);
router.patch('/:id/review', controller.addReview);

module.exports = router;