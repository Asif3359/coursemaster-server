// controllers/lessonController.js
const Course = require("../models/Course");
const LessonProgress = require("../models/LessonProgress");

// GET /courses/:courseId/content
// Returns course syllabus with each lesson's completion status for the logged-in student
const getCourseContent = async (req, res) => {
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

    const syllabus = course.syllabus || [];

    const progressDocs = await LessonProgress.find({
      student: studentId,
      course: courseId,
    }).lean();

    const progressMap = new Map();
    progressDocs.forEach((doc) => {
      progressMap.set(doc.lessonId, doc);
    });

    const lessonsWithStatus = syllabus.map((lesson) => {
      const progress = progressMap.get(lesson.lessonId);
      return {
        lessonId: lesson.lessonId,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        content: lesson.content,
        isCompleted: progress ? progress.isCompleted : false,
        completedAt: progress ? progress.completedAt : null,
      };
    });

    res.status(200).json({
      message: "Course content fetched successfully",
      data: {
        courseId: course._id,
        title: course.title,
        description: course.description,
        lessons: lessonsWithStatus,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// POST /courses/:courseId/lessons/:lessonId/complete
// Marks a specific lesson as completed for the logged-in student and returns updated progress
const markLessonCompleted = async (req, res) => {
  try {
    const studentId = req.user && req.user.id;
    const { courseId, lessonId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const lessonExists = (course.syllabus || []).some(
      (lesson) => lesson.lessonId === lessonId
    );
    if (!lessonExists) {
      return res.status(404).json({ message: "Lesson not found in course syllabus" });
    }

    const now = new Date();

    const progress = await LessonProgress.findOneAndUpdate(
      { student: studentId, course: courseId, lessonId },
      { isCompleted: true, completedAt: now },
      { new: true, upsert: true }
    );

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
      message: "Lesson marked as completed",
      data: {
        progress,
        courseProgress: {
          courseId,
          totalLessons,
          completedLessons: completedCount,
          percentage,
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  getCourseContent,
  markLessonCompleted,
};


