// controllers/enrollmentController.js
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Batch = require("../models/Batch");

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

module.exports = {
  enrollInCourse,
};


