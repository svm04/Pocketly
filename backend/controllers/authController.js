const crypto = require("crypto");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../utils/generateTokens");
const sendEmail = require("../utils/sendEmail");

// Issues a fresh access + refresh token pair for a user, persisting a hash
// of the refresh token so it can be validated (and revoked) later.
const issueTokenPair = async (user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

//register user
exports.registerUser = async (req, res) => {
  const { fullName, email, password, profileImageUrl } = req.body;

  //validattion : missing fields
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    //check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    //create new user
    const user = await User.create({
      fullName,
      email,
      password,
      profileImageUrl
    });

    const { accessToken, refreshToken } = await issueTokenPair(user);

    res.status(201).json({
      id: user._id,
      user,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

//login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = await issueTokenPair(user);

    res.status(200).json({
      id: user._id,
      user,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

//get user info
exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user info", error: error.message });
  }
};

// Exchange a valid refresh token for a new access token (and a rotated
// refresh token). Called automatically by the frontend when an access
// token expires, so the user isn't silently logged out every 15 minutes.
exports.refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select("+refreshTokenHash");

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (user.refreshTokenHash !== hashToken(refreshToken)) {
      // Token doesn't match the last-issued one (already rotated, reused,
      // or revoked) — force a full re-login rather than trusting it.
      return res.status(401).json({ message: "Refresh token expired or reused" });
    }

    const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(user);

    res.status(200).json({ token: accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// Best-effort server-side revocation. The frontend always clears its local
// tokens regardless of whether this call succeeds.
exports.logoutUser = async (req, res) => {
  try {
    if (req.user) {
      req.user.refreshTokenHash = null;
      await req.user.save({ validateBeforeSave: false });
    }
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    res.status(200).json({ message: "Logged out" });
  }
};

// Generates a reset token, emails it (or logs it to the console if no email
// provider is configured), and — outside production — also returns the
// reset URL in the response so the flow is testable without setting up SMTP.
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Please provide an email address" });
  }

  const genericResponse = {
    message: "If that email is registered, a password reset link has been sent.",
  };

  try {
    const user = await User.findOne({ email });

    // Don't reveal whether the email exists.
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset your Pocketly password",
      text: `You requested a password reset. This link expires in 15 minutes:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `<p>You requested a password reset. This link expires in 15 minutes:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
    });

    const responseBody = { ...genericResponse };
    if (process.env.NODE_ENV !== "production" || !emailResult.sent) {
      // Dev convenience only — remove this in a real production deployment
      // once a real email provider is wired up.
      responseBody.resetUrl = resetUrl;
    }

    res.status(200).json(responseBody);
  } catch (error) {
    res.status(500).json({ message: "Error processing request", error: error.message });
  }
};

// Update the logged-in user's own profile (name / avatar). Email is
// intentionally not editable here to avoid uniqueness-collision handling —
// it's the account identifier.
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, profileImageUrl } = req.body;

    if (fullName !== undefined && !fullName.trim()) {
      return res.status(400).json({ message: "Full name cannot be empty" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (profileImageUrl !== undefined) user.profileImageUrl = profileImageUrl;

    await user.save({ validateBeforeSave: false });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json(safeUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// Change password while logged in (as opposed to the forgot-password flow,
// this requires knowing the current password).
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide your current and new password" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  }

  try {
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    const { accessToken, refreshToken } = await issueTokenPair(user);

    res.status(200).json({
      message: "Password reset successfully",
      user,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};
