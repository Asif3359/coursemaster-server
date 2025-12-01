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

enrollmentSchema.index({ student: 1, course: 1, batch: 1 }, { unique: true });

// Auto-populate common refs to avoid N+1 query patterns
function autoPopulateEnrollment(next) {
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
}

enrollmentSchema.pre("find", autoPopulateEnrollment);
enrollmentSchema.pre("findOne", autoPopulateEnrollment);
enrollmentSchema.pre("findOneAndUpdate", autoPopulateEnrollment);

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;

