const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiter");

const {
  registerUser,
  loginUser,
  getUserInfo,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/getuser", protect, getUserInfo);

router.post("/refresh-token", refreshAccessToken);
router.post("/logout", protect, logoutUser);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

router.post("/upload-image", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Image is too large. Please choose a file under 2MB."
          : err.message || "Upload failed.";
      return res.status(400).json({ message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    // Data URI (e.g. "data:image/png;base64,...") — works as an <img src>
    // directly in the browser, and is stored on the user document in
    // MongoDB instead of on the server's local (non-persistent) disk.
    const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64"
    )}`;
    res.status(200).json({ imageUrl });
  });
});

module.exports = router;
