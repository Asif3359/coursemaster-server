// routes/enrollmentRoute.js
const express = require("express");
const router = express.Router();

const { enrollInCourse } = require("../controllers/enrollmentController");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

// Student enrollment route
// POST /api/enroll
router.post("/enroll", auth, requireRole("user"), enrollInCourse);

module.exports = router;


