const express = require('express');
const router = express.Router();
const tripsController = require('../../controllers/api/tripsController');

router.route('/')
    .get(tripsController.getTrips)
    .post(tripsController.createTrip)
    .delete(tripsController.deleteTrip);

router.route('/requestJoin')
    .patch(tripsController.requestJoin);

router.route('/acceptRequest')
    .patch(tripsController.acceptRequest);

router.route('/rejectRequest')
    .patch(tripsController.rejectRequest);

router.route('/leaveTrip')
    .patch(tripsController.leaveTrip);

module.exports = router;