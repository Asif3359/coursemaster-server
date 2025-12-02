// validators/enrollmentValidator.js
const Joi = require("joi");

const enrollSchema = Joi.object({
  courseId: Joi.string().required(),
  batchId: Joi.string().required(),
  paymentStatus: Joi.string().valid("pending", "paid", "failed").default("paid"),
});

module.exports = {
  enrollSchema,
};

