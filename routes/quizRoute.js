// routes/quizRoute.js
const express = require("express");
const router = express.Router();

const {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuiz,
  submitQuiz,
  getQuizzesForCourse,
  getQuizSubmission,
  getMyQuizSubmissions,
  getAdminQuizzesForCourse,
} = require("../controllers/quizController");

const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

// Admin routes
router.post("/admin/quizzes", auth, requireRole("admin"), createQuiz);
router.put("/admin/quizzes/:quizId", auth, requireRole("admin"), updateQuiz);
router.delete(
  "/admin/quizzes/:quizId",
  auth,
  requireRole("admin"),
  deleteQuiz
);
router.get("/admin/courses/:courseId/quizzes", auth, requireRole("admin"), getAdminQuizzesForCourse);

// Student routes
router.get("/quizzes/:quizId", auth, requireRole("user"), getQuiz);
router.post("/quizzes/:quizId/submit", auth, requireRole("user"), submitQuiz);
router.get("/quizzes/:quizId/submission", auth, requireRole("user"), getQuizSubmission);
router.get("/courses/:courseId/quizzes", auth, requireRole("user"), getQuizzesForCourse);
router.get("/courses/:courseId/submissions", auth, requireRole("user"), getMyQuizSubmissions);
module.exports = router;

