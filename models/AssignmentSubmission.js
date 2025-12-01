// models/AssignmentSubmission.js
const mongoose = require("mongoose");

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
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
    answerText: {
      type: String,
      required: false,
    },
    googleDriveLink: {
      type: String,
      required: false,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["submitted", "reviewed"],
      default: "submitted",
    },
    feedback: {
      type: String,
      required: false,
    },
    grade: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

assignmentSubmissionSchema.index({ assignment: 1, student: 1, course: 1 }, { unique: true });

// Auto-populate common refs to avoid N+1 query patterns
function autoPopulateAssignmentSubmission(next) {
  this.populate([
    {
      path: "assignment",
      select: "title lessonId course batch dueDate",
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
  next();
}

assignmentSubmissionSchema.pre("find", autoPopulateAssignmentSubmission);
assignmentSubmissionSchema.pre("findOne", autoPopulateAssignmentSubmission);
assignmentSubmissionSchema.pre("findOneAndUpdate", autoPopulateAssignmentSubmission);

const AssignmentSubmission = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);

module.exports = AssignmentSubmission;

