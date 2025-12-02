// validators/quizValidator.js
const Joi = require("joi");

const questionSchema = Joi.object({
  questionText: Joi.string().trim().min(5).required(),
  options: Joi.array().items(Joi.string().trim()).min(2).required(),
  correctOptionIndex: Joi.number().integer().min(0).required(),
});

const createQuizSchema = Joi.object({
  courseId: Joi.string().required(),
  lessonId: Joi.string().required(),
  title: Joi.string().trim().min(3).max(200).required(),
  questions: Joi.array().items(questionSchema).min(1).required(),
});

const updateQuizSchema = Joi.object({
  courseId: Joi.string().optional(),
  lessonId: Joi.string().optional(),
  title: Joi.string().trim().min(3).max(200).optional(),
  questions: Joi.array().items(questionSchema).min(1).optional(),
});

const submitQuizSchema = Joi.object({
  selectedOptions: Joi.array().items(Joi.number().integer().min(0)).required(),
});

module.exports = {
  createQuizSchema,
  updateQuizSchema,
  submitQuizSchema,
};

