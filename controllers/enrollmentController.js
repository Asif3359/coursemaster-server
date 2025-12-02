// controllers/enrollmentController.js
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Batch = require("../models/Batch");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/responseHandler");

// POST /api/enroll
// body: { courseId, batchId, paymentStatus? }
const enrollInCourse = async (req, res) => {
  try {
    const studentId = req.user && req.user.id;
    const { courseId, batchId, paymentStatus = "paid" } = req.body;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!courseId || !batchId) {
      return res
        .status(400)
        .json({ message: "courseId and batchId are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const batch = await Batch.findOne({ _id: batchId, course: courseId });
    if (!batch) {
      return res.status(404).json({ message: "Batch not found for this course" });
    }

    const existing = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      batch: batchId,
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Already enrolled in this course and batch" });
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      batch: batchId,
      enrolledAt: new Date(),
      status: "active",
      paymentStatus,
    });

    res.status(201).json({
      message: "Enrolled successfully",
      data: enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Already enrolled in this course and batch" });
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: GET /api/enrollments/admin/courses/:courseId/enrollments
// Get all enrollments for a course
const getEnrollmentsForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const enrollments = await Enrollment.find({ course: courseId }).sort({ createdAt: -1 });

    sendResponse(res, 200, "Enrollments fetched successfully", enrollments);
  } catch (error) {
    next(error);
  }
};

// Admin: GET /api/enrollments/admin/batches/:batchId/enrollments
// Get all enrollments for a batch
const getEnrollmentsForBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw new ApiError(404, "Batch not found");
    }

    const enrollments = await Enrollment.find({ batch: batchId }).sort({ createdAt: -1 });

    sendResponse(res, 200, "Enrollments fetched successfully", enrollments);
  } catch (error) {
    next(error);
  }
};

// Admin: GET /api/enrollments/admin/courses/:courseId/batches/:batchId/enrollments
// Get enrollments for specific course and batch
const getEnrollmentsForCourseAndBatch = async (req, res, next) => {
  try {
    const { courseId, batchId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const batch = await Batch.findOne({ _id: batchId, course: courseId });
    if (!batch) {
      throw new ApiError(404, "Batch not found for this course");
    }

    const enrollments = await Enrollment.find({
      course: courseId,
      batch: batchId,
    }).sort({ createdAt: -1 });

    sendResponse(res, 200, "Enrollments fetched successfully", enrollments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollInCourse,
  getEnrollmentsForCourse,
  getEnrollmentsForBatch,
  getEnrollmentsForCourseAndBatch,
};


