// middleware/validate.js
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message).join(", ");
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: errors,
      });
    }

    next();
  };
};

module.exports = validate;

