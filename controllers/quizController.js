// controllers/quizController.js
const Quiz = require("../models/Quiz");
const QuizSubmission = require("../models/QuizSubmission");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/responseHandler");

// Admin: POST /api/admin/quizzes
const createQuiz = async (req, res, next) => {
  try {
    const { courseId, lessonId, title, questions } = req.body;

    if (!courseId || !lessonId || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
      throw new ApiError(400, "courseId, lessonId, title, and questions array are required");
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const quiz = await Quiz.create({
      course: courseId,
      lessonId,
      title,
      questions,
    });

    sendResponse(res, 201, "Quiz created successfully", quiz);
  } catch (error) {
    next(error);
  }
};

// Admin: PUT /api/admin/quizzes/:quizId
const updateQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const updates = req.body;

    const quiz = await Quiz.findByIdAndUpdate(quizId, updates, {
      new: true,
      runValidators: true,
    });

    if (!quiz) {
      throw new ApiError(404, "Quiz not found");
    }

    sendResponse(res, 200, "Quiz updated successfully", quiz);
  } catch (error) {
    next(error);
  }
};

// Admin: DELETE /api/admin/quizzes/:quizId
const deleteQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByIdAndDelete(quizId);

    if (!quiz) {
      throw new ApiError(404, "Quiz not found");
    }

    sendResponse(res, 200, "Quiz deleted successfully");
  } catch (error) {
    next(error);
  }
};

// Student: GET /api/quizzes/:quizId
// Returns quiz questions without correct answers
const getQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new ApiError(404, "Quiz not found");
    }

    const questionsWithoutAnswers = quiz.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options,
    }));

    sendResponse(res, 200, "Quiz fetched successfully", {
      quizId: quiz._id,
      courseId: quiz.course,
      lessonId: quiz.lessonId,
      title: quiz.title,
      questions: questionsWithoutAnswers,
    });
  } catch (error) {
    next(error);
  }
};

// Student: GET /api/quizzes/courses/:courseId
const getQuizzesForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user && req.user.id;

    const quizzes = await Quiz.find({ course: courseId });

    // If student is logged in, fetch their submissions for these quizzes
    if (studentId) {
      const submissions = await QuizSubmission.find({
        student: studentId,
        quiz: { $in: quizzes.map(q => q._id) },
        course: courseId,
      });

      // Create a map of quizId -> submission
      const submissionMap = {};
      submissions.forEach(sub => {
        submissionMap[sub.quiz.toString()] = sub;
      });

      // Add submission info to each quiz
      const quizzesWithSubmissions = quizzes.map(quiz => {
        const submission = submissionMap[quiz._id.toString()];
        const quizObj = quiz.toObject();
        
        if (submission) {
          quizObj.submission = {
            score: submission.score,
            correctAnswers: submission.selectedOptions.filter((opt, idx) => 
              opt === quiz.questions[idx].correctOptionIndex
            ).length,
            totalQuestions: quiz.questions.length,
            submittedAt: submission.submittedAt,
          };
          quizObj.isSubmitted = true;
        } else {
          quizObj.isSubmitted = false;
        }
        
        return quizObj;
      });

      sendResponse(res, 200, "Quizzes fetched successfully", quizzesWithSubmissions);
    } else {
      // No student logged in, return quizzes without submission info
      sendResponse(res, 200, "Quizzes fetched successfully", quizzes);
    }
  } catch (error) {
    next(error);
  }
};

// Student: POST /api/quizzes/:quizId/submit
// Accepts answers, computes score, stores submission, returns score
const submitQuiz = async (req, res, next) => {
  try {
    const studentId = req.user && req.user.id;
    const { quizId } = req.params;
    const { selectedOptions } = req.body;

    if (!studentId) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!selectedOptions || !Array.isArray(selectedOptions)) {
      throw new ApiError(400, "selectedOptions array is required");
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new ApiError(404, "Quiz not found");
    }

    if (selectedOptions.length !== quiz.questions.length) {
      throw new ApiError(400, "Number of answers must match number of questions");
    }

    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedOptions[index] === question.correctOptionIndex) {
        correctCount++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    const existing = await QuizSubmission.findOne({
      quiz: quizId,
      student: studentId,
      course: quiz.course,
    });

    if (existing) {
      throw new ApiError(409, "Quiz already submitted. Cannot submit twice.");
    }

    const submission = await QuizSubmission.create({
      quiz: quizId,
      student: studentId,
      course: quiz.course,
      selectedOptions,
      score,
      submittedAt: new Date(),
    });

    sendResponse(res, 201, "Quiz submitted successfully", { 
      submission,
      score,
      correctAnswers: correctCount,
      totalQuestions,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Quiz already submitted");
    }
    next(error);
  }
};

// Student: GET /api/quizzes/:quizId/submission
// Get student's submission and marks for a specific quiz
const getQuizSubmission = async (req, res, next) => {
  try {
    const studentId = req.user && req.user.id;
    const { quizId } = req.params;

    if (!studentId) {
      throw new ApiError(401, "Unauthorized");
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new ApiError(404, "Quiz not found");
    }

    const submission = await QuizSubmission.findOne({
      quiz: quizId,
      student: studentId,
      course: quiz.course,
    });

    if (!submission) {
      throw new ApiError(404, "Quiz submission not found. You haven't submitted this quiz yet.");
    }

    // Calculate correct answers
    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      if (submission.selectedOptions[index] === question.correctOptionIndex) {
        correctCount++;
      }
    });

    sendResponse(res, 200, "Quiz submission fetched successfully", {
      quizId: quiz._id,
      quizTitle: quiz.title,
      courseId: quiz.course,
      lessonId: quiz.lessonId,
      submission: {
        score: submission.score,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length,
        selectedOptions: submission.selectedOptions,
        submittedAt: submission.submittedAt,
      },
      // Include questions with correct answers for review
      questions: quiz.questions.map((q, idx) => ({
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        studentAnswer: submission.selectedOptions[idx],
        isCorrect: submission.selectedOptions[idx] === q.correctOptionIndex,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Student: GET /api/quizzes/courses/:courseId/submissions
// Get all quiz submissions for the logged-in student in a specific course
const getMyQuizSubmissions = async (req, res, next) => {
  try {
    const studentId = req.user && req.user.id;
    const { courseId } = req.params;

    if (!studentId) {
      throw new ApiError(401, "Unauthorized");
    }

    // Verify student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });

    if (!enrollment) {
      throw new ApiError(403, "You must be enrolled in this course to view quiz submissions");
    }

    const submissions = await QuizSubmission.find({
      student: studentId,
      course: courseId,
    }).lean(); // Use lean() to get plain objects

    if (submissions.length === 0) {
      return sendResponse(res, 200, "No quiz submissions found", []);
    }

    // Get all quiz IDs and fetch quizzes in one query
    const quizIds = submissions.map((s) => s.quiz);
    const quizzes = await Quiz.find({ _id: { $in: quizIds } });
    const quizMap = new Map(quizzes.map((q) => [q._id.toString(), q]));

    // Enrich submissions with quiz details and calculate correct answers
    const enrichedSubmissions = submissions
      .map((submission) => {
        const quiz = quizMap.get(submission.quiz.toString());
        if (!quiz) return null; // Quiz was deleted

        let correctCount = 0;
        quiz.questions.forEach((question, index) => {
          if (submission.selectedOptions[index] === question.correctOptionIndex) {
            correctCount++;
          }
        });

        return {
          submissionId: submission._id,
          quizId: quiz._id,
          quizTitle: quiz.title,
          lessonId: quiz.lessonId,
          score: submission.score,
          correctAnswers: correctCount,
          totalQuestions: quiz.questions.length,
          submittedAt: submission.submittedAt,
        };
      })
      .filter((s) => s !== null); // Filter out null values

    sendResponse(res, 200, "Quiz submissions fetched successfully", validSubmissions);
  } catch (error) {
    next(error);
  }
};

// Admin: GET /api/admin/courses/:courseId/quizzes
// Get all quizzes and their submissions for a course (admin view)
const getAdminQuizzesForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    // Get all quizzes for the course
    const quizzes = await Quiz.find({ course: courseId });

    // Get all submissions for these quizzes with student info
    const quizIds = quizzes.map((q) => q._id);
    const submissions = await QuizSubmission.find({
      course: courseId,
      quiz: { $in: quizIds },
    })
      .populate({
        path: "student",
        select: "username email",
      })
      .lean();

    // Group submissions by quiz
    const submissionsByQuiz = new Map();
    submissions.forEach((sub) => {
      const quizId = sub.quiz.toString();
      if (!submissionsByQuiz.has(quizId)) {
        submissionsByQuiz.set(quizId, []);
      }
      submissionsByQuiz.get(quizId).push(sub);
    });

    // Enrich quizzes with submission data
    const quizzesWithSubmissions = await Promise.all(
      quizzes.map(async (quiz) => {
        const quizSubmissions = submissionsByQuiz.get(quiz._id.toString()) || [];
        
        // Calculate stats for each submission
        const enrichedSubmissions = quizSubmissions.map((sub) => {
          let correctCount = 0;
          quiz.questions.forEach((question, index) => {
            if (sub.selectedOptions[index] === question.correctOptionIndex) {
              correctCount++;
            }
          });

          return {
            submissionId: sub._id,
            student: sub.student ? {
              id: sub.student._id || sub.student,
              username: sub.student.username || null,
              email: sub.student.email || null,
            } : { id: sub.student },
            score: sub.score,
            correctAnswers: correctCount,
            totalQuestions: quiz.questions.length,
            selectedOptions: sub.selectedOptions,
            submittedAt: sub.submittedAt,
          };
        });

        return {
          quizId: quiz._id,
          title: quiz.title,
          lessonId: quiz.lessonId,
          questions: quiz.questions.map((q) => ({
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
          })),
          totalSubmissions: quizSubmissions.length,
          submissions: enrichedSubmissions,
        };
      })
    );

    sendResponse(res, 200, "Quizzes and submissions fetched successfully", quizzesWithSubmissions);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuiz,
  getQuizzesForCourse,
  submitQuiz,
  getQuizSubmission,
  getMyQuizSubmissions,
  getAdminQuizzesForCourse,
};

