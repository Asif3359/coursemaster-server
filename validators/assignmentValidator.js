// validators/assignmentValidator.js
const Joi = require("joi");

const createAssignmentSchema = Joi.object({
  courseId: Joi.string().required(),
  batchId: Joi.string().allow(null, "").optional(),
  lessonId: Joi.string().required(),
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().min(10).required(),
  dueDate: Joi.date().optional(),
});

const updateAssignmentSchema = Joi.object({
  courseId: Joi.string().optional(),
  batchId: Joi.string().allow(null, "").optional(),
  lessonId: Joi.string().optional(),
  title: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().min(10).optional(),
  dueDate: Joi.date().optional(),
});

const submitAssignmentSchema = Joi.object({
  answerText: Joi.string().allow("", null).optional(),
  googleDriveLink: Joi.string().uri().allow("", null).optional(),
}).or("answerText", "googleDriveLink");

const reviewSubmissionSchema = Joi.object({
  status: Joi.string().valid("submitted", "reviewed").default("reviewed"),
  feedback: Joi.string().allow("", null).optional(),
  grade: Joi.number().min(0).max(100).optional(),
});

module.exports = {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  reviewSubmissionSchema,
};

