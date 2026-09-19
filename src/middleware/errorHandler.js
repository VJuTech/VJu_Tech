function errorHandler(error, req, res, next) {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).render('management/error', {
    title: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? error : null
  });
}

module.exports = errorHandler;