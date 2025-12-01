// controllers/dashboardController.js
const Enrollment = require("../models/Enrollment");
const LessonProgress = require("../models/LessonProgress");
const Course = require("../models/Course");

// GET /api/dashboard/enrollments
const getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user && req.user.id;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const enrollments = await Enrollment.find({
      student: studentId,
      status: "active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Enrolled courses fetched successfully",
      data: enrollments,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// GET /api/dashboard/courses/:courseId/progress
const getCourseProgress = async (req, res) => {
  try {
    const studentId = req.user && req.user.id;
    const { courseId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const totalLessons = course.syllabus.length;

    const completedCount = await LessonProgress.countDocuments({
      student: studentId,
      course: courseId,
      isCompleted: true,
    });

    const percentage =
      totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;

    res.status(200).json({
      message: "Course progress fetched successfully",
      data: {
        courseId,
        totalLessons,
        completedLessons: completedCount,
        percentage,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  getEnrolledCourses,
  getCourseProgress,
};


