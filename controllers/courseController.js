// controllers/courseController.js
const Course = require("../models/Course");
const Batch = require("../models/Batch");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/responseHandler");

// Public: GET /api/courses
// Query params: page, limit, search, instructor, sort (price_asc|price_desc), category, tags (comma-separated)
const getCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      instructor,
      sort,
      category,
      tags,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);

    const filter = { isActive: true };

    if (search) {
      // text search on title/description
      filter.$text = { $search: search };
    }

    if (instructor) {
      // if you later switch instructor to string, adjust this
      filter.instructor = instructor;
    }

    if (category) {
      filter.category = category;
    }

    if (tags) {
      const tagList = Array.isArray(tags)
        ? tags
        : String(tags)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
      if (tagList.length > 0) {
        filter.tags = { $in: tagList };
      }
    }

    let sortOption = {};
    if (sort === "price_asc") {
      sortOption.price = 1;
    } else if (sort === "price_desc") {
      sortOption.price = -1;
    } else {
      // default sort: newest first
      sortOption.createdAt = -1;
    }

    const skip = (pageNum - 1) * limitNum;

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: "instructor",
          select: "username email",
        }),
      Course.countDocuments(filter),
    ]);

    sendResponse(res, 200, "Courses fetched successfully", {
      items: courses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Public: GET /api/courses/:id
// Includes syllabus and active batches summary
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate({
      path: "instructor",
      select: "username email",
    });

    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const batches = await Batch.find({ course: id, isActive: true }).select(
      "name startDate endDate capacity isActive"
    );

    sendResponse(res, 200, "Course fetched successfully", {
      course,
      batches,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: POST /api/admin/courses
const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      instructor,
      syllabus = [],
      price,
      category,
      tags = [],
      isActive = true,
    } = req.body;

    // Handle instructor: if it's a string (email/username), find the user
    let instructorId = instructor;
    if (typeof instructor === "string" && !instructor.match(/^[0-9a-fA-F]{24}$/)) {
      // Not a valid ObjectId, try to find user by email or username
      const user = await User.findOne({
        $or: [{ email: instructor }, { username: instructor }],
      });
      if (!user) {
        throw new ApiError(404, "Instructor not found. Please provide a valid user email or username.");
      }
      instructorId = user._id;
    }

    // Convert price to number if it's a string
    const coursePrice = typeof price === "string" ? parseFloat(price) : price;

    // Handle tags: if undefined/null, use empty array; if string, split by comma; if array, use as-is
    let courseTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        courseTags = tags;
      } else if (typeof tags === "string") {
        courseTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    const course = await Course.create({
      title,
      description,
      instructor: instructorId,
      syllabus,
      price: coursePrice,
      category,
      tags: courseTags,
      isActive,
    });

    sendResponse(res, 201, "Course created successfully", course);
  } catch (error) {
    next(error);
  }
};

// Admin: PUT /api/admin/courses/:id
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Handle instructor: if it's a string (email/username), find the user
    if (updates.instructor && typeof updates.instructor === "string" && !updates.instructor.match(/^[0-9a-fA-F]{24}$/)) {
      // Not a valid ObjectId, try to find user by email or username
      const user = await User.findOne({
        $or: [{ email: updates.instructor }, { username: updates.instructor }],
      });
      if (!user) {
        throw new ApiError(404, "Instructor not found. Please provide a valid user email or username.");
      }
      updates.instructor = user._id;
    }

    // Convert price to number if it's a string
    if (updates.price && typeof updates.price === "string") {
      updates.price = parseFloat(updates.price);
    }

    // Handle tags: if string, convert to array
    if (updates.tags && typeof updates.tags === "string") {
      updates.tags = updates.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    const course = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    sendResponse(res, 200, "Course updated successfully", course);
  } catch (error) {
    next(error);
  }
};

// Admin: DELETE /api/admin/courses/:id
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    sendResponse(res, 200, "Course deleted successfully");
  } catch (error) {
    next(error);
  }
};

// Admin: POST /api/admin/courses/:courseId/batches
const createBatch = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { name, startDate, endDate, capacity, isActive = true } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const batch = await Batch.create({
      course: courseId,
      name,
      startDate,
      endDate,
      capacity,
      isActive,
    });

    sendResponse(res, 201, "Batch created successfully", batch);
  } catch (error) {
    next(error);
  }
};

// Admin: PUT /api/admin/batches/:batchId
const updateBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const updates = req.body;

    const batch = await Batch.findByIdAndUpdate(batchId, updates, {
      new: true,
      runValidators: true,
    });

    if (!batch) {
      throw new ApiError(404, "Batch not found");
    }

    sendResponse(res, 200, "Batch updated successfully", batch);
  } catch (error) {
    next(error);
  }
};

// Admin: DELETE /api/admin/batches/:batchId
const deleteBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findByIdAndDelete(batchId);

    if (!batch) {
      throw new ApiError(404, "Batch not found");
    }

    sendResponse(res, 200, "Batch deleted successfully");
  } catch (error) {
    next(error);
  }
};

// Admin: GET /api/admin/courses/:courseId/batches
const getBatchesForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const batches = await Batch.find({ course: courseId }).sort({
      startDate: 1,
    });

    sendResponse(res, 200, "Batches fetched successfully", batches);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchesForCourse,
};


