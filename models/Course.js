// models/Course.js
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    lessonId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      required: false, 
    },
    content: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    syllabus: {
      type: [lessonSchema],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      index: true,
    },
    category: {
      type: String,
      index: true,
    },
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ title: "text", description: "text" });

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;