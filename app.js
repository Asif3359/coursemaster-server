var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

require('dotenv').config();
require('./config/database');

// Import routes
var indexRouter = require('./routes/index');
var authRouter = require('./routes/authRoute');
var courseRouter = require('./routes/courseRoute');
var enrollmentRouter = require('./routes/enrollmentRoute');
var dashboardRouter = require('./routes/dashboardRoute');
var lessonRouter = require('./routes/lessonRoute');
var assignmentRouter = require('./routes/assignmentRoute');
var quizRouter = require('./routes/quizRoute');

// Import middleware
var errorHandler = require('./middleware/errorHandler');
var sendResponse = require('./utils/responseHandler');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes - API v1
app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/quizzes', quizRouter);

// 404 handler
app.use(function(req, res, next) {
  sendResponse(res, 404, 'Route not found');
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
