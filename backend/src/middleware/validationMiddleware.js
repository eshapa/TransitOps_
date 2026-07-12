function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(d => d.message);
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details
        }
      });
    }

    req[property] = value;
    next();
  };
}

module.exports = validateRequest;
