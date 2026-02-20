const express = require('express');
const router = express.Router();
const routesController = require('../../controllers/api/routesController');

router.route('/')
    .get(routesController.getTrips);
    

module.exports = router;