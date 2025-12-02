# CourseMaster API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Protected endpoints require JWT token in `Authorization` header:
```
Authorization: Bearer <token>
```

**Get Token:**
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`

**User Roles:**
- `user`: Student role
- `admin`: Admin role

## Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

---

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Body: {
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "...", "username": "...", "email": "...", "role": "user" }
  }
}
```

#### Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer <token>
```

---

### Courses (Public)

#### Get All Courses
```
GET /api/courses/courses?page=1&limit=10&search=javascript&category=programming&tags=web,frontend&sort=price_asc

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- search: string
- instructor: string (ObjectId)
- category: string
- tags: string (comma-separated)
- sort: "price_asc" | "price_desc"
```

#### Get Course by ID
```
GET /api/courses/courses/:id
```

---

### Courses (Admin)

#### Create Course
```
POST /api/courses/admin/courses
Headers: Authorization: Bearer <admin_token>
Body: {
  "title": "JavaScript Fundamentals",
  "description": "Learn JavaScript from scratch...",
  "instructor": "instructor@example.com",
  "price": 99.99,
  "category": "programming",
  "tags": ["web", "frontend"],
  "syllabus": [
    {
      "lessonId": "lesson_1",
      "title": "Introduction",
      "videoUrl": "https://youtube.com/...",
      "content": "..."
    }
  ],
  "isActive": true
}
```

#### Update Course
```
PUT /api/courses/admin/courses/:id
Headers: Authorization: Bearer <admin_token>
Body: { /* any fields to update */ }
```

#### Delete Course
```
DELETE /api/courses/admin/courses/:id
Headers: Authorization: Bearer <admin_token>
```

---

### Batches (Admin)

#### Create Batch
```
POST /api/courses/admin/courses/:courseId/batches
Headers: Authorization: Bearer <admin_token>
Body: {
  "name": "Batch 1 - January 2024",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-02-01T00:00:00.000Z",
  "capacity": 50,
  "isActive": true
}
```

#### Update Batch
```
PUT /api/courses/admin/batches/:batchId
Headers: Authorization: Bearer <admin_token>
Body: { /* any fields to update */ }
```

#### Delete Batch
```
DELETE /api/courses/admin/batches/:batchId
Headers: Authorization: Bearer <admin_token>
```

#### Get Batches for Course
```
GET /api/courses/admin/courses/:courseId/batches
Headers: Authorization: Bearer <admin_token>
```

---

### Enrollments

#### Enroll in Course (Student)
```
POST /api/enrollments/enroll
Headers: Authorization: Bearer <student_token>
Body: {
  "courseId": "course_id",
  "batchId": "batch_id",
  "paymentStatus": "paid"  // optional, default: "paid"
}
```

#### Get Enrollments for Course (Admin)
```
GET /api/enrollments/admin/courses/:courseId/enrollments
Headers: Authorization: Bearer <admin_token>
```

#### Get Enrollments for Batch (Admin)
```
GET /api/enrollments/admin/batches/:batchId/enrollments
Headers: Authorization: Bearer <admin_token>
```

#### Get Enrollments for Course and Batch (Admin)
```
GET /api/enrollments/admin/courses/:courseId/batches/:batchId/enrollments
Headers: Authorization: Bearer <admin_token>
```

---

### Dashboard (Student)

#### Get Enrolled Courses
```
GET /api/dashboard/dashboard/enrollments
Headers: Authorization: Bearer <student_token>
```

#### Get Course Progress
```
GET /api/dashboard/dashboard/courses/:courseId/progress
Headers: Authorization: Bearer <student_token>
Response: {
  "courseId": "...",
  "totalLessons": 10,
  "completedLessons": 4,
  "percentage": 40
}
```

---

### Lessons (Student)

#### Get Course Content with Progress
```
GET /api/lessons/:courseId/content
Headers: Authorization: Bearer <student_token>
Response: {
  "courseId": "...",
  "title": "...",
  "lessons": [
    {
      "lessonId": "lesson_1",
      "title": "Introduction",
      "videoUrl": "https://youtube.com/...",
      "content": "...",
      "isCompleted": true,
      "completedAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

#### Mark Lesson as Completed
```
POST /api/lessons/:courseId/lessons/:lessonId/complete
Headers: Authorization: Bearer <student_token>
```

---

### Assignments (Admin)

#### Create Assignment
```
POST /api/assignments/admin/assignments
Headers: Authorization: Bearer <admin_token>
Body: {
  "courseId": "course_id",
  "batchId": "batch_id",  // optional
  "lessonId": "lesson_1",
  "title": "Assignment 1",
  "description": "Complete the following tasks...",
  "dueDate": "2024-02-01T00:00:00.000Z"  // optional
}
```

#### Update Assignment
```
PUT /api/assignments/admin/assignments/:assignmentId
Headers: Authorization: Bearer <admin_token>
Body: { /* any fields to update */ }
```

#### Delete Assignment
```
DELETE /api/assignments/admin/assignments/:assignmentId
Headers: Authorization: Bearer <admin_token>
```

#### Get Assignments for Course
```
GET /api/assignments/admin/courses/:courseId/assignments
Headers: Authorization: Bearer <admin_token>
```

#### Get Submissions for Assignment
```
GET /api/assignments/admin/assignments/:assignmentId/submissions
Headers: Authorization: Bearer <admin_token>
```

#### Get All Submissions for Course
```
GET /api/assignments/admin/courses/:courseId/submissions
Headers: Authorization: Bearer <admin_token>
```

#### Review Submission
```
PUT /api/assignments/admin/submissions/:submissionId/review
Headers: Authorization: Bearer <admin_token>
Body: {
  "status": "reviewed",  // optional, default: "reviewed"
  "feedback": "Great work!",
  "grade": 85  // optional, 0-100
}
```

---

### Assignments (Student)

#### Get Assignments for Course
```
GET /api/assignments/assignments/courses/:courseId
Headers: Authorization: Bearer <student_token>
```

#### Submit Assignment
```
POST /api/assignments/assignments/:assignmentId/submit
Headers: Authorization: Bearer <student_token>
Body: {
  "answerText": "My answer here...",  // at least one required
  "googleDriveLink": "https://drive.google.com/..."  // at least one required
}
```

---

### Quizzes (Admin)

#### Create Quiz
```
POST /api/quizzes/admin/quizzes
Headers: Authorization: Bearer <admin_token>
Body: {
  "courseId": "course_id",
  "lessonId": "lesson_1",
  "title": "JavaScript Basics Quiz",
  "questions": [
    {
      "questionText": "What is JavaScript?",
      "options": ["A programming language", "A coffee brand", "A car", "A country"],
      "correctOptionIndex": 0
    }
  ]
}
```

#### Update Quiz
```
PUT /api/quizzes/admin/quizzes/:quizId
Headers: Authorization: Bearer <admin_token>
Body: { /* any fields to update */ }
```

#### Delete Quiz
```
DELETE /api/quizzes/admin/quizzes/:quizId
Headers: Authorization: Bearer <admin_token>
```

#### Get Quizzes for Course (Admin)
```
GET /api/quizzes/admin/courses/:courseId/quizzes
Headers: Authorization: Bearer <admin_token>
```

---

### Quizzes (Student)

#### Get Quiz (Without Answers)
```
GET /api/quizzes/quizzes/:quizId
Headers: Authorization: Bearer <student_token>
Response: {
  "quizId": "...",
  "title": "JavaScript Basics Quiz",
  "questions": [
    {
      "questionText": "What is JavaScript?",
      "options": ["A programming language", "A coffee brand", "A car", "A country"]
      // Note: correctOptionIndex is NOT included
    }
  ]
}
```

#### Submit Quiz
```
POST /api/quizzes/quizzes/:quizId/submit
Headers: Authorization: Bearer <student_token>
Body: {
  "selectedOptions": [0, 3, 1, 2]  // Array of selected option indices
}
Response: {
  "score": 75,
  "correctAnswers": 3,
  "totalQuestions": 4
}
```

#### Get Quiz Submission
```
GET /api/quizzes/quizzes/:quizId/submission
Headers: Authorization: Bearer <student_token>
```

#### Get Quizzes for Course
```
GET /api/quizzes/courses/:courseId/quizzes
Headers: Authorization: Bearer <student_token>
```

#### Get My Quiz Submissions
```
GET /api/quizzes/courses/:courseId/submissions
Headers: Authorization: Bearer <student_token>
```

---

## Status Codes
- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `500 Internal Server Error`: Server error
