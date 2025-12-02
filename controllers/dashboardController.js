// controllers/dashboardController.js
const Enrollment = require("../models/Enrollment");
const LessonProgress = require("../models/LessonProgress");
const Course = require("../models/Course");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/responseHandler");

// GET /api/dashboard/enrollments
const getEnrolledCourses = async (req, res, next) => {
  try {
    const studentId = req.user && req.user.id;

    if (!studentId) {
      throw new ApiError(401, "Unauthorized");
    }

    const enrollments = await Enrollment.find({
      student: studentId,
      status: "active",
    }).sort({ createdAt: -1 });

    sendResponse(res, 200, "Enrolled courses fetched successfully", enrollments);
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/courses/:courseId/progress
const getCourseProgress = async (req, res, next) => {
  try {
    const studentId = req.user && req.user.id;
    const { courseId } = req.params;

    if (!studentId) {
      throw new ApiError(401, "Unauthorized");
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
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

    sendResponse(res, 200, "Course progress fetched successfully", {
      courseId,
      totalLessons,
      completedLessons: completedCount,
      percentage,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEnrolledCourses,
  getCourseProgress,
};


