// controllers/courseController.js
const Course = require("../models/Course");
const Batch = require("../models/Batch");

// Public: GET /api/courses
// Query params: page, limit, search, instructor, sort (price_asc|price_desc), category, tags (comma-separated)
const getCourses = async (req, res) => {
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

    res.status(200).json({
      message: "Courses fetched successfully",
      data: {
        items: courses,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Public: GET /api/courses/:id
// Includes syllabus and active batches summary
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate({
      path: "instructor",
      select: "username email",
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const batches = await Batch.find({ course: id, isActive: true }).select(
      "name startDate endDate capacity isActive"
    );

    res.status(200).json({
      message: "Course fetched successfully",
      data: {
        course,
        batches,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: POST /api/admin/courses
const createCourse = async (req, res) => {
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

    const course = await Course.create({
      title,
      description,
      instructor,
      syllabus,
      price,
      category,
      tags,
      isActive,
    });

    res.status(201).json({
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: PUT /api/admin/courses/:id
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const course = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: DELETE /api/admin/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: POST /api/admin/courses/:courseId/batches
const createBatch = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, startDate, endDate, capacity, isActive = true } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const batch = await Batch.create({
      course: courseId,
      name,
      startDate,
      endDate,
      capacity,
      isActive,
    });

    res.status(201).json({
      message: "Batch created successfully",
      data: batch,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: PUT /api/admin/batches/:batchId
const updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const updates = req.body;

    const batch = await Batch.findByIdAndUpdate(batchId, updates, {
      new: true,
      runValidators: true,
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.status(200).json({
      message: "Batch updated successfully",
      data: batch,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: DELETE /api/admin/batches/:batchId
const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findByIdAndDelete(batchId);

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.status(200).json({
      message: "Batch deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Admin: GET /api/admin/courses/:courseId/batches
const getBatchesForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const batches = await Batch.find({ course: courseId }).sort({
      startDate: 1,
    });

    res.status(200).json({
      message: "Batches fetched successfully",
      data: batches,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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


