/**
 * Global Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[Server Error]', err.stack || err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = { errorHandler };
