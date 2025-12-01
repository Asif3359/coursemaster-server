// routes/dashboardRoute.js
const express = require("express");
const router = express.Router();

const {
  getEnrolledCourses,
  getCourseProgress,
} = require("../controllers/dashboardController");

const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

// GET /api/dashboard/enrollments
router.get(
  "/dashboard/enrollments",
  auth,
  requireRole("user"),
  getEnrolledCourses
);

// GET /api/dashboard/courses/:courseId/progress
router.get(
  "/dashboard/courses/:courseId/progress",
  auth,
  requireRole("user"),
  getCourseProgress
);

module.exports = router;


