const { errorResponse } = require('../utils/response');

const notFound = (req, res, next) => {
  res.status(404).json(
    errorResponse(`Route not found: ${req.method} ${req.originalUrl}`)
  );
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json(
      errorResponse('Validation Error', 400, err.errors)
    );
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json(
      errorResponse('Duplicate entry found')
    );
  }

  res.status(statusCode).json(
    errorResponse(message, statusCode)
  );
};

module.exports = { notFound, errorHandler };