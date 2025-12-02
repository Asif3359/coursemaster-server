const express = require("express");
const router = express.Router();

const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchesForCourse,
} = require("../controllers/courseController");

const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const validate = require("../middleware/validate");
const { createCourseSchema } = require("../validators/courseValidator");

// Public routes
router.get("/courses", getCourses);
router.get("/courses/:id", getCourseById);

// Admin-only routes
router.post("/admin/courses", auth, requireRole("admin"), validate(createCourseSchema), createCourse);
router.put("/admin/courses/:id", auth, requireRole("admin"), updateCourse);
router.delete("/admin/courses/:id", auth, requireRole("admin"), deleteCourse);

router.post(
  "/admin/courses/:courseId/batches",
  auth,
  requireRole("admin"),
  createBatch
);
router.put(
  "/admin/batches/:batchId",
  auth,
  requireRole("admin"),
  updateBatch
);
router.delete(
  "/admin/batches/:batchId",
  auth,
  requireRole("admin"),
  deleteBatch
);
router.get(
  "/admin/courses/:courseId/batches",
  auth,
  requireRole("admin"),
  getBatchesForCourse
);

module.exports = router;