// models/Batch.js
const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    capacity: {
      type: Number,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful when listing batches with their course details
function autoPopulateBatch(next) {
  this.populate({
    path: "course",
    select: "title category price",
  });
  next();
}

batchSchema.pre("find", autoPopulateBatch);
batchSchema.pre("findOne", autoPopulateBatch);
batchSchema.pre("findOneAndUpdate", autoPopulateBatch);

const Batch = mongoose.model("Batch", batchSchema);

module.exports = Batch;