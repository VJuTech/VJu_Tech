const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/zip'];
    callback(null, allowed.includes(file.mimetype));
  }
});

module.exports = upload;
