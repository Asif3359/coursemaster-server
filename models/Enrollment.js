// models/Enrollment.js
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
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
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    enrolledAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
enrollmentSchema.index({ student: 1, course: 1, batch: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });

// Auto-populate common refs to avoid N+1 query patterns
function autoPopulateEnrollment(next) {
  if (typeof next === 'function') {
    this.populate([
      {
        path: "student",
        select: "username email role status",
      },
      {
        path: "course",
        select: "title price category isActive",
      },
      {
        path: "batch",
        select: "name startDate endDate isActive",
      },
    ]);
    next();
  } else {
    // If next is not provided, just populate
    this.populate([
      {
        path: "student",
        select: "username email role status",
      },
      {
        path: "course",
        select: "title price category isActive",
      },
      {
        path: "batch",
        select: "name startDate endDate isActive",
      },
    ]);
  }
}

enrollmentSchema.pre("find", autoPopulateEnrollment);
enrollmentSchema.pre("findOne", autoPopulateEnrollment);
enrollmentSchema.pre("findOneAndUpdate", autoPopulateEnrollment);

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;

