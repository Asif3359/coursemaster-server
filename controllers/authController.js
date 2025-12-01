// authentication controller
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// configure nodemailer transport using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Welcome to CourseMaster",
        text: `Hi ${user.username}, your account has been created successfully.`,
        html: `<p>Hi <strong>${user.username}</strong>,</p><p>Your CourseMaster account has been created successfully.</p>`,
      });
    } catch (mailError) {
      console.error("Error sending registration email:", mailError);
    }

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// const verifyEmail = async (req, res) => {
//   try {
//     // Verify using a numeric code instead of a link token
//     const { code } = req.body;
//     const user = await User.findOne({ verificationToken: code });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid token" });
//     }
//     if (user.verified) {
//       return res.status(400).json({ message: "Email already verified" });
//     }
//     if (user.verificationTokenExpiresAt < Date.now()) {
//       return res.status(400).json({ message: "Token expired" });
//     }
//     user.verified = true;
//     user.verificationToken = null;
//     user.verificationTokenExpiresAt = null;
//     await user.save();
//     res.status(200).json({ message: "Email verified successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// const resendVerificationEmail = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }
//     if (user.verified) {
//       return res.status(400).json({ message: "Email already verified" });
//     }

//     // Generate a 6-digit numeric verification code
//     const code = Math.floor(100000 + Math.random() * 900000).toString();
//     user.verificationToken = code;
//     user.verificationTokenExpiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24h
//     await user.save();

//     // send code via email
//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: user.email,
//       subject: "Your verification code",
//       text: `Your verification code is ${code}`,
//       html: `<p>Your verification code is <strong>${code}</strong></p>`,
//     });

//     res.status(200).json({ message: "Verification code sent" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }
//     // Generate a 6-digit numeric reset code
//     const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
//     user.resetPasswordToken = resetCode;
//     user.resetPasswordTokenExpiresAt = Date.now() + 1000 * 60 * 60 * 24;
//     await user.save();

//     // send reset code via email
//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: user.email,
//       subject: "Your password reset code",
//       text: `Your password reset code is ${resetCode}`,
//       html: `<p>Your password reset code is <strong>${resetCode}</strong></p>`,
//     });

//     res.status(200).json({ message: "Reset password code sent" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// const resetPassword = async (req, res) => {
//   try {
//     const { code, password } = req.body;
//     const user = await User.findOne({ resetPasswordToken: code });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid token" });
//     }
//     if (user.resetPasswordTokenExpiresAt < Date.now()) {
//       return res.status(400).json({ message: "Token expired" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10); // same saltRounds as signup
//     user.password = hashedPassword;
//     user.resetPasswordToken = null;
//     user.resetPasswordTokenExpiresAt = null;
//     await user.save();

//     res.status(200).json({ message: "Password reset successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// const changePassword = async (req, res) => {
//   try {
//     // auth middleware sets req.user = { id: decoded.userId }
//     const { id } = req.user;
//     const { oldPassword, newPassword } = req.body;
//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }
//     const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
//     if (!isPasswordValid) {
//       return res.status(400).json({ message: "Invalid old password" });
//     }

//     const hashedNewPassword = await bcrypt.hash(newPassword, 10);
//     user.password = hashedNewPassword;
//     await user.save();
//     res.status(200).json({ message: "Password changed successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

module.exports = {
  register,
  login,
  logout,
  //   verifyEmail,
  //   resendVerificationEmail,
  //   forgotPassword,
  //   resetPassword,
  //   changePassword,
};
