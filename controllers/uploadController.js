const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage setup with dynamic filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = file.fieldname === 'profileImage' ? 'profile' : 'cover';
    const uploadPath = path.join(__dirname, `../uploads/${type}`);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Extract authKey from the query string since req.body is not yet available
    const authKey = req.headers['authkey'] || 'unknown';
    const fileType = file.fieldname === 'profileImage' ? '-profile' : '-cover';
    const ext = path.extname(file.originalname);
    cb(null, `${authKey}${fileType}${ext}`);
  }
});

// File filter to allow only JPG/JPEG
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg') {
    return cb(new Error('Only JPG/JPEG files are allowed'), false);
  }
  cb(null, true);
};

// Multer middleware setup
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

// Controller function
const uploadImages = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const response = { message: 'Images uploaded successfully' };

    if (req.files.profileImage) {
      const file = req.files.profileImage[0];
      response.profileImagePath = `/uploads/profile/${file.filename}`;
    }
    if (req.files.coverImage) {
      const file = req.files.coverImage[0];
      response.coverImagePath = `/uploads/cover/${file.filename}`;
    }

    res.status(200).json(response);
  });
};

module.exports = { uploadImages };
