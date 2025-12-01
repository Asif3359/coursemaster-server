// routes/lessonRoute.js
const express = require("express");
const router = express.Router();

const {
  getCourseContent,
  markLessonCompleted,
} = require("../controllers/lessonController");

const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

// GET /courses/:courseId/content - student sees syllabus + completion status
router.get(
  "/:courseId/content",
  auth,
  requireRole("user"),
  getCourseContent
);

// POST /courses/:courseId/lessons/:lessonId/complete - mark lesson done
router.post(
  "/:courseId/lessons/:lessonId/complete",
  auth,
  requireRole("user"),
  markLessonCompleted
);

module.exports = router;


