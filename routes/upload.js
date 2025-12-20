const express = require('express');
const router = express.Router();
const { uploadImages } = require('../controllers/uploadController');

router.post('/profile', uploadImages);

module.exports = router;
