const express = require('express');
const router = express.Router();
const multer = require('multer');
const usersController = require('../../controllers/api/usersController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.patch('/', upload.single('profile_picture'), usersController.updateUser);
    

module.exports = router;