// models/Quiz.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: (v) => Array.isArray(v) && v.length >= 2,
    },
    correctOptionIndex: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessonId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;