// models/QuizSubmission.js
const mongoose = require("mongoose");

const quizSubmissionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    selectedOptions: {
      type: [Number],
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

quizSubmissionSchema.index({ quiz: 1, student: 1, course: 1 }, { unique: true });

// Auto-populate common refs to avoid N+1 query patterns
function autoPopulateQuizSubmission(next) {
  this.populate([
    {
      path: "quiz",
      select: "title lessonId course",
    },
    {
      path: "student",
      select: "username email role",
    },
    {
      path: "course",
      select: "title category",
    },
  ]);

  if (typeof next === "function") {
    next();
  }
}

quizSubmissionSchema.pre("find", autoPopulateQuizSubmission);
quizSubmissionSchema.pre("findOne", autoPopulateQuizSubmission);
quizSubmissionSchema.pre("findOneAndUpdate", autoPopulateQuizSubmission);

const QuizSubmission = mongoose.model("QuizSubmission", quizSubmissionSchema);

module.exports = QuizSubmission;