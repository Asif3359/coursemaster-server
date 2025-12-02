// validators/courseValidator.js
const Joi = require("joi");

const lessonSchema = Joi.object({
  lessonId: Joi.string().required(),
  title: Joi.string().required(),
  videoUrl: Joi.string().uri().allow("", null).optional(),
  content: Joi.string().allow("", null).optional(),
});

const createCourseSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().min(10).required(),
  instructor: Joi.string().required(),
  syllabus: Joi.array().items(lessonSchema).default([]),
  price: Joi.alternatives().try(Joi.number().min(0), Joi.string().pattern(/^\d+(\.\d+)?$/)).required(),
  category: Joi.string().trim().optional(),
  tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional().default([]),
  isActive: Joi.boolean().default(true),
});

const updateCourseSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().min(10).optional(),
  instructor: Joi.string().optional(),
  syllabus: Joi.array().items(lessonSchema).optional(),
  price: Joi.number().min(0).optional(),
  category: Joi.string().trim().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
});

const createBatchSchema = Joi.object({
  name: Joi.string().trim().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref("startDate")).required(),
  capacity: Joi.number().min(1).optional(),
  isActive: Joi.boolean().default(true),
});

module.exports = {
  createCourseSchema,
  updateCourseSchema,
  createBatchSchema,
};

