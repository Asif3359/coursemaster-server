// routes/assignmentRoute.js
const express = require("express");
const router = express.Router();

const {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsForCourse,
  submitAssignment,
  getSubmissionsForAssignment,
  getSubmissionsForCourse,
  reviewSubmission,
} = require("../controllers/assignmentController");

const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

// Admin routes
router.post("/admin/assignments", auth, requireRole("admin"), createAssignment);
router.put(
  "/admin/assignments/:assignmentId",
  auth,
  requireRole("admin"),
  updateAssignment
);
router.delete(
  "/admin/assignments/:assignmentId",
  auth,
  requireRole("admin"),
  deleteAssignment
);
router.get(
  "/admin/courses/:courseId/assignments",
  auth,
  requireRole("admin"),
  getAssignmentsForCourse
);
router.get(
  "/admin/assignments/:assignmentId/submissions",
  auth,
  requireRole("admin"),
  getSubmissionsForAssignment
);
router.get(
  "/admin/courses/:courseId/submissions",
  auth,
  requireRole("admin"),
  getSubmissionsForCourse
);
router.put(
  "/admin/submissions/:submissionId/review",
  auth,
  requireRole("admin"),
  reviewSubmission
);

// Student routes
router.post(
  "/assignments/:assignmentId/submit",
  auth,
  requireRole("user"),
  submitAssignment
);

module.exports = router;

