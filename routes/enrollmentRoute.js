// routes/enrollmentRoute.js
const express = require("express");
const router = express.Router();

const {
  enrollInCourse,
  getEnrollmentsForCourse,
  getEnrollmentsForBatch,
  getEnrollmentsForCourseAndBatch,
} = require("../controllers/enrollmentController");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

// Student enrollment route
// POST /api/enrollments/enroll
router.post("/enroll", auth, requireRole("user"), enrollInCourse);

// Admin routes
// GET /api/enrollments/admin/courses/:courseId/enrollments
router.get(
  "/admin/courses/:courseId/enrollments",
  auth,
  requireRole("admin"),
  getEnrollmentsForCourse
);

// GET /api/enrollments/admin/batches/:batchId/enrollments
router.get(
  "/admin/batches/:batchId/enrollments",
  auth,
  requireRole("admin"),
  getEnrollmentsForBatch
);

// GET /api/enrollments/admin/courses/:courseId/batches/:batchId/enrollments
router.get(
  "/admin/courses/:courseId/batches/:batchId/enrollments",
  auth,
  requireRole("admin"),
  getEnrollmentsForCourseAndBatch
);

module.exports = router;


