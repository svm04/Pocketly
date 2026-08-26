const multer = require("multer");

// Files are kept in memory (req.file.buffer) rather than written to disk.
// Render's free tier (and most free hosts) have an ephemeral filesystem —
// anything written to disk during runtime is wiped on every redeploy/restart.
// Since profile pictures are small, we instead convert the buffer to a
// base64 data URI and store it directly on the user document in MongoDB,
// which is the one place we already have durable, persistent storage.
const storage = multer.memoryStorage();

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG and JPG are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB cap, plenty for a profile photo
});

module.exports = upload;
