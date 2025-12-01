// controllers/quizController.js
const Quiz = require("../models/Quiz");
const QuizSubmission = require("../models/QuizSubmission");
const Course = require("../models/Course");

// Admin: POST /api/admin/quizzes
const createQuiz = async (req, res) => {
  try {
    const { courseId, lessonId, title, questions } = req.body;

    if (!courseId || !lessonId || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "courseId, lessonId, title, and questions array are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const quiz = await Quiz.create({
      course: courseId,
      lessonId,
      title,
      questions,
    });

    res.status(201).json({
      message: "Quiz created successfully",
      data: quiz,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: PUT /api/admin/quizzes/:quizId
const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const updates = req.body;

    const quiz = await Quiz.findByIdAndUpdate(quizId, updates, {
      new: true,
      runValidators: true,
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json({
      message: "Quiz updated successfully",
      data: quiz,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: DELETE /api/admin/quizzes/:quizId
const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByIdAndDelete(quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json({
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Student: GET /api/quizzes/:quizId
// Returns quiz questions without correct answers
const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const questionsWithoutAnswers = quiz.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options,
    }));

    res.status(200).json({
      message: "Quiz fetched successfully",
      data: {
        quizId: quiz._id,
        courseId: quiz.course,
        lessonId: quiz.lessonId,
        title: quiz.title,
        questions: questionsWithoutAnswers,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Student: POST /api/quizzes/:quizId/submit
// Accepts answers, computes score, stores submission, returns score
const submitQuiz = async (req, res) => {
  try {
    const studentId = req.user && req.user.id;
    const { quizId } = req.params;
    const { selectedOptions } = req.body;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!selectedOptions || !Array.isArray(selectedOptions)) {
      return res.status(400).json({
        message: "selectedOptions array is required",
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (selectedOptions.length !== quiz.questions.length) {
      return res.status(400).json({
        message: "Number of answers must match number of questions",
      });
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
      return res.status(409).json({
        message: "Quiz already submitted. Cannot submit twice.",
      });
    }

    const submission = await QuizSubmission.create({
      quiz: quizId,
      student: studentId,
      course: quiz.course,
      selectedOptions,
      score,
      submittedAt: new Date(),
    });

    res.status(201).json({
      message: "Quiz submitted successfully",
      data: {
        submission,
        score,
        correctAnswers: correctCount,
        totalQuestions,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Quiz already submitted",
      });
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuiz,
  submitQuiz,
};

