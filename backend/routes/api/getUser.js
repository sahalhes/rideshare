const express = require('express');
const router = express.Router();
const getUserController = require('../../controllers/api/getUserController');

router.route('/:username')
    .get(getUserController.getUser);
    

module.exports = router;