// controllers/assignmentController.js
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Course = require("../models/Course");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/responseHandler");

// Admin: POST /api/admin/assignments
const createAssignment = async (req, res) => {
  try {
    const { courseId, batchId, lessonId, title, description, dueDate } =
      req.body;

    if (!courseId || !lessonId || !title || !description) {
      return res.status(400).json({
        message: "courseId, lessonId, title, and description are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const assignment = await Assignment.create({
      course: courseId,
      batch: batchId || null,
      lessonId,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    res.status(201).json({
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: PUT /api/admin/assignments/:assignmentId
const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const updates = req.body;

    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      updates,
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: DELETE /api/admin/assignments/:assignmentId
const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByIdAndDelete(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: GET /api/admin/courses/:courseId/assignments
const getAssignmentsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const assignments = await Assignment.find({ course: courseId }).populate({
      path: "batch",
      select: "name startDate endDate",
    });

    res.status(200).json({
      message: "Assignments fetched successfully",
      data: assignments,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Student: POST /api/assignments/:assignmentId/submit
const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user && req.user.id;
    const { assignmentId } = req.params;
    const { answerText, googleDriveLink } = req.body;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!answerText && !googleDriveLink) {
      return res.status(400).json({
        message: "Either answerText or googleDriveLink is required",
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const existing = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentId,
      course: assignment.course,
    });

    if (existing) {
      return res.status(409).json({
        message: "Assignment already submitted. Use update endpoint to modify.",
      });
    }

    const submission = await AssignmentSubmission.create({
      assignment: assignmentId,
      student: studentId,
      course: assignment.course,
      answerText: answerText || null,
      googleDriveLink: googleDriveLink || null,
      submittedAt: new Date(),
      status: "submitted",
    });

    res.status(201).json({
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Assignment already submitted",
      });
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: GET /api/admin/assignments/:assignmentId/submissions
const getSubmissionsForAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Assignment not found");
    }

    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
    });

    sendResponse(res, 200, "Submissions fetched successfully", submissions);
  } catch (error) {
    next(error);
  }
};

// Admin: GET /api/admin/courses/:courseId/submissions
const getSubmissionsForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const submissions = await AssignmentSubmission.find({ course: courseId });

    sendResponse(res, 200, "Submissions fetched successfully", submissions);
  } catch (error) {
    next(error);
  }
};

// Admin: PUT /api/admin/submissions/:submissionId/review
const reviewSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { status, feedback, grade } = req.body;

    const submission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      {
        status: status || "reviewed",
        feedback: feedback || null,
        grade: grade !== undefined ? grade : null,
      },
      { new: true, runValidators: true }
    );

    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }

    sendResponse(res, 200, "Submission reviewed successfully", submission);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsForCourse,
  submitAssignment,
  getSubmissionsForAssignment,
  getSubmissionsForCourse,
  reviewSubmission,
};

