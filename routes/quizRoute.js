// routes/quizRoute.js
const express = require("express");
const router = express.Router();

const {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuiz,
  submitQuiz,
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

// Student routes
router.get("/quizzes/:quizId", auth, requireRole("user"), getQuiz);
router.post("/quizzes/:quizId/submit", auth, requireRole("user"), submitQuiz);

module.exports = router;

