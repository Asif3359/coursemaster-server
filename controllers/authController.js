// authentication controller
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/responseHandler");

// initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Qurrota <noreply@qurrota.com>",
        to: user.email,
        subject: "Welcome to CourseMaster",
        text: `Hi ${user.username}, your account has been created successfully.`,
        html: `<p>Hi <strong>${user.username}</strong>,</p><p>Your CourseMaster account has been created successfully.</p>`,
      });
    } catch (mailError) {
      console.error("Error sending registration email:", mailError);
    }

    sendResponse(res, 201, "User created successfully", { user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    sendResponse(res, 200, "Login successful", { token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    sendResponse(res, 200, "Logout successful");
  } catch (error) {
    next(error);
  }
};



module.exports = {
  register,
  login,
  logout,
};
