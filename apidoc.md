# CourseMaster API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base URL & Authentication](#base-url--authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Data Flow](#data-flow)
6. [API Endpoints](#api-endpoints)
7. [Frontend Implementation Guide](#frontend-implementation-guide)

---

## Overview

CourseMaster is a Learning Management System (LMS) backend API built with Node.js, Express, MongoDB, and Mongoose. It supports:

- **Public Access**: Course browsing and details
- **Student Features**: Enrollment, course consumption, progress tracking, assignments, quizzes
- **Admin Features**: Course/batch management, assignment/quiz creation, submission review

### Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Password Hashing**: bcrypt

---

## Base URL & Authentication

### Base URL
```
http://localhost:3000/api
```

### Authentication

**Protected endpoints require:**
1. JWT token in `Authorization` header: `Bearer <token>`
2. Valid user role (`"user"` for students, `"admin"` for admin)

**Getting a Token:**
```bash
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
Response: { "success": true, "message": "Login successful", "data": { "token": "...", "user": {...} } }
```

**Using Token:**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### User Roles
- `"user"`: Student role - can enroll, view courses, submit assignments/quizzes
- `"admin"`: Admin role - can manage courses, batches, assignments, quizzes, review submissions
- `"instructor"`: Instructor role (defined in User model, currently not used in routes)

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

### Status Codes
- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request
- `400 Bad Request`: Validation error or invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions (wrong role)
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (e.g., already enrolled)
- `500 Internal Server Error`: Server error

---

## Error Handling

### Global Error Handler
All errors are caught by the global error handler middleware which:
- Formats errors consistently
- Handles Mongoose errors (validation, cast errors, duplicates)
- Handles JWT errors (invalid token, expired token)
- Returns appropriate HTTP status codes

### Validation Errors
Validation errors return `400 Bad Request` with details:
```json
{
  "success": false,
  "message": "Validation error",
  "error": "title is required, description must be at least 10 characters"
}
```

---

## Data Flow

### 1. Authentication Flow

```
User Registration/Login
    ↓
POST /api/auth/register or /api/auth/login
    ↓
Backend validates input (Joi)
    ↓
Creates/Verifies user (bcrypt password hashing)
    ↓
Returns JWT token + user info
    ↓
Frontend stores token (localStorage/cookie)
    ↓
Token included in all protected requests
```

### 2. Course Browsing Flow (Public)

```
User visits homepage
    ↓
GET /api/courses/courses?page=1&limit=10&search=...
    ↓
Backend queries MongoDB (with pagination, filters, search)
    ↓
Returns course list with pagination info
    ↓
Frontend displays course cards
    ↓
User clicks course → GET /api/courses/courses/:id
    ↓
Backend returns course details + active batches
    ↓
Frontend shows course details + "Enroll Now" button
```

### 3. Enrollment Flow (Student)

```
Student clicks "Enroll Now"
    ↓
If not logged in → Redirect to login
    ↓
If logged in → Show batch selection
    ↓
POST /api/enrollments/enroll
Body: { courseId, batchId, paymentStatus? }
    ↓
Backend validates:
  - User is authenticated (auth middleware)
  - User role is "user" (role middleware)
  - Course exists
  - Batch exists and belongs to course
  - Not already enrolled (unique index check)
    ↓
Creates Enrollment record
    ↓
Returns enrollment confirmation
    ↓
Frontend redirects to dashboard
```

### 4. Course Consumption Flow (Student)

```
Student opens enrolled course
    ↓
GET /api/lessons/:courseId/content
    ↓
Backend:
  1. Fetches course with syllabus
  2. Fetches student's lesson progress
  3. Merges completion status for each lesson
    ↓
Returns course content with completion status
    ↓
Frontend displays:
  - Lesson list with completion checkmarks
  - Video player for each lesson
  - "Mark as completed" button
    ↓
Student watches video → clicks "Mark as completed"
    ↓
POST /api/lessons/:courseId/lessons/:lessonId/complete
    ↓
Backend:
  1. Creates/updates LessonProgress record
  2. Recalculates course completion percentage
    ↓
Returns updated progress
    ↓
Frontend updates progress bar
```

### 5. Assignment Submission Flow

```
Admin creates assignment
    ↓
POST /api/assignments/admin/assignments
Body: { courseId, lessonId, title, description, dueDate? }
    ↓
Assignment created in database
    ↓
Student views assignment
    ↓
POST /api/assignments/assignments/:assignmentId/submit
Body: { answerText?, googleDriveLink? }
    ↓
Backend:
  1. Validates at least one answer provided
  2. Checks for duplicate submission (unique index)
  3. Creates AssignmentSubmission record
    ↓
Returns submission confirmation
    ↓
Admin reviews submissions
    ↓
GET /api/assignments/admin/assignments/:assignmentId/submissions
    ↓
PUT /api/assignments/admin/submissions/:submissionId/review
Body: { feedback, grade, status: "reviewed" }
    ↓
Student sees feedback and grade
```

### 6. Quiz Flow

```
Admin creates quiz
    ↓
POST /api/quizzes/admin/quizzes
Body: { courseId, lessonId, title, questions: [...] }
    ↓
Quiz created (questions include correctOptionIndex)
    ↓
Student takes quiz
    ↓
GET /api/quizzes/quizzes/:quizId
    ↓
Backend returns quiz WITHOUT correct answers
    ↓
Student selects answers → submits
    ↓
POST /api/quizzes/quizzes/:quizId/submit
Body: { selectedOptions: [0, 1, 2, ...] }
    ↓
Backend:
  1. Compares selectedOptions with correctOptionIndex
  2. Calculates score immediately
  3. Stores QuizSubmission
  4. Prevents duplicate submission
    ↓
Returns score immediately
    ↓
Frontend displays score
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Register Student
```
POST /api/auth/register
Body: {
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
Response: { "success": true, "message": "User created successfully", "data": { "user": {...} } }
```

#### 2. Login (Student/Admin)
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
    "user": {
      "id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

#### 3. Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer <token>
Response: { "success": true, "message": "Logout successful" }
```

---

### Course Endpoints (Public)

#### 4. Get All Courses
```
GET /api/courses/courses?page=1&limit=10&search=javascript&category=programming&tags=web,frontend&sort=price_asc

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- search: string (text search on title/description)
- instructor: string (ObjectId)
- category: string
- tags: string (comma-separated)
- sort: "price_asc" | "price_desc" (default: newest first)

Response: {
  "message": "Courses fetched successfully",
  "data": {
    "items": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

#### 5. Get Course by ID
```
GET /api/courses/courses/:id

Response: {
  "message": "Course fetched successfully",
  "data": {
    "course": {
      "_id": "...",
      "title": "...",
      "description": "...",
      "instructor": { "username": "...", "email": "..." },
      "price": 99.99,
      "category": "...",
      "tags": [...],
      "syllabus": [
        {
          "lessonId": "lesson_1",
          "title": "...",
          "videoUrl": "...",
          "content": "..."
        }
      ],
      "isActive": true
    },
    "batches": [
      {
        "_id": "...",
        "name": "Batch 1",
        "startDate": "...",
        "endDate": "...",
        "capacity": 50,
        "isActive": true
      }
    ]
  }
}
```

---

### Course Endpoints (Admin)

#### 6. Create Course
```
POST /api/courses/admin/courses
Headers: Authorization: Bearer <admin_token>
Body: {
  "title": "JavaScript Fundamentals",
  "description": "Learn JavaScript from scratch...",
  "instructor": "instructor@example.com",  // email, username, or ObjectId
  "price": 99.99,  // number or string
  "category": "programming",
  "tags": ["web", "frontend"],  // array or comma-separated string
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

Response: {
  "success": true,
  "message": "Course created successfully",
  "data": { "course": {...} }
}
```

#### 7. Update Course
```
PUT /api/courses/admin/courses/:id
Headers: Authorization: Bearer <admin_token>
Body: { /* any fields to update */ }
Response: { "message": "Course updated successfully", "data": {...} }
```

#### 8. Delete Course
```
DELETE /api/courses/admin/courses/:id
Headers: Authorization: Bearer <admin_token>
Response: { "message": "Course deleted successfully" }
```

---

### Batch Endpoints (Admin)

#### 9. Create Batch
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
Response: { "message": "Batch created successfully", "data": {...} }
```

#### 10. Update Batch
```
PUT /api/courses/admin/batches/:batchId
Headers: Authorization: Bearer <admin_token>
Body: { /* any fields to update */ }
Response: { "message": "Batch updated successfully", "data": {...} }
```

#### 11. Delete Batch
```
DELETE /api/courses/admin/batches/:batchId
Headers: Authorization: Bearer <admin_token>
Response: { "message": "Batch deleted successfully" }
```

#### 12. Get Batches for Course
```
GET /api/courses/admin/courses/:courseId/batches
Headers: Authorization: Bearer <admin_token>
Response: { "message": "Batches fetched successfully", "data": [...] }
```

---

### Enrollment Endpoints (Student)

#### 13. Enroll in Course
```
POST /api/enrollments/enroll
Headers: Authorization: Bearer <student_token>
Body: {
  "courseId": "course_id",
  "batchId": "batch_id",
  "paymentStatus": "paid"  // optional, default: "paid"
}
Response: {
  "message": "Enrolled successfully",
  "data": {
    "enrollment": {
      "_id": "...",
      "student": { "username": "...", "email": "..." },
      "course": { "title": "...", "price": 99.99 },
      "batch": { "name": "...", "startDate": "...", "endDate": "..." },
      "status": "active",
      "paymentStatus": "paid",
      "enrolledAt": "..."
    }
  }
}
```

**Error 409**: Already enrolled in this course/batch combination

---

### Dashboard Endpoints (Student)

#### 14. Get Enrolled Courses
```
GET /api/dashboard/dashboard/enrollments
Headers: Authorization: Bearer <student_token>
Response: {
  "message": "Enrolled courses fetched successfully",
  "data": [
    {
      "_id": "...",
      "student": {...},
      "course": {...},
      "batch": {...},
      "status": "active",
      "enrolledAt": "..."
    }
  ]
}
```

#### 15. Get Course Progress
```
GET /api/dashboard/dashboard/courses/:courseId/progress
Headers: Authorization: Bearer <student_token>
Response: {
  "message": "Course progress fetched successfully",
  "data": {
    "courseId": "...",
    "totalLessons": 10,
    "completedLessons": 4,
    "percentage": 40
  }
}
```

---

### Lesson/Content Endpoints (Student)

#### 16. Get Course Content with Progress
```
GET /api/lessons/:courseId/content
Headers: Authorization: Bearer <student_token>
Response: {
  "message": "Course content fetched successfully",
  "data": {
    "courseId": "...",
    "title": "...",
    "description": "...",
    "lessons": [
      {
        "lessonId": "lesson_1",
        "title": "Introduction",
        "videoUrl": "https://youtube.com/...",
        "content": "...",
        "isCompleted": true,
        "completedAt": "2024-01-15T00:00:00.000Z"
      },
      {
        "lessonId": "lesson_2",
        "title": "Variables",
        "videoUrl": "...",
        "content": "...",
        "isCompleted": false,
        "completedAt": null
      }
    ]
  }
}
```

#### 17. Mark Lesson as Completed
```
POST /api/lessons/:courseId/lessons/:lessonId/complete
Headers: Authorization: Bearer <student_token>
Response: {
  "message": "Lesson marked as completed",
  "data": {
    "progress": {
      "_id": "...",
      "student": "...",
      "course": "...",
      "lessonId": "lesson_1",
      "isCompleted": true,
      "completedAt": "..."
    },
    "courseProgress": {
      "courseId": "...",
      "totalLessons": 10,
      "completedLessons": 5,
      "percentage": 50
    }
  }
}
```

---

### Assignment Endpoints (Admin)

#### 18. Create Assignment
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
Response: { "message": "Assignment created successfully", "data": {...} }
```

#### 19. Update Assignment
```
PUT /api/assignments/admin/assignments/:assignmentId
Headers: Authorization: Bearer <admin_token>
Body: { /* any fields to update */ }
Response: { "message": "Assignment updated successfully", "data": {...} }
```

#### 20. Delete Assignment
```
DELETE /api/assignments/admin/assignments/:assignmentId
Headers: Authorization: Bearer <admin_token>
Response: { "message": "Assignment deleted successfully" }
```

#### 21. Get Assignments for Course
```
GET /api/assignments/admin/courses/:courseId/assignments
Headers: Authorization: Bearer <admin_token>
Response: { "message": "Assignments fetched successfully", "data": [...] }
```

#### 22. Get Submissions for Assignment
```
GET /api/assignments/admin/assignments/:assignmentId/submissions
Headers: Authorization: Bearer <admin_token>
Response: {
  "message": "Submissions fetched successfully",
  "data": [
    {
      "_id": "...",
      "assignment": {...},
      "student": { "username": "...", "email": "..." },
      "course": {...},
      "answerText": "...",
      "googleDriveLink": "...",
      "status": "submitted",
      "feedback": null,
      "grade": null,
      "submittedAt": "..."
    }
  ]
}
```

#### 23. Get All Submissions for Course
```
GET /api/assignments/admin/courses/:courseId/submissions
Headers: Authorization: Bearer <admin_token>
Response: { "message": "Submissions fetched successfully", "data": [...] }
```

#### 24. Review Submission
```
PUT /api/assignments/admin/submissions/:submissionId/review
Headers: Authorization: Bearer <admin_token>
Body: {
  "status": "reviewed",  // optional, default: "reviewed"
  "feedback": "Great work!",
  "grade": 85  // optional, 0-100
}
Response: { "message": "Submission reviewed successfully", "data": {...} }
```

---

### Assignment Endpoints (Student)

#### 25. Submit Assignment
```
POST /api/assignments/assignments/:assignmentId/submit
Headers: Authorization: Bearer <student_token>
Body: {
  "answerText": "My answer here...",  // at least one required
  "googleDriveLink": "https://drive.google.com/..."  // at least one required
}
Response: {
  "message": "Assignment submitted successfully",
  "data": {
    "submission": {
      "_id": "...",
      "assignment": {...},
      "student": {...},
      "answerText": "...",
      "googleDriveLink": "...",
      "status": "submitted",
      "submittedAt": "..."
    }
  }
}
```

**Error 409**: Already submitted (duplicate submission prevented)

---

### Quiz Endpoints (Admin)

#### 26. Create Quiz
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
    },
    {
      "questionText": "Which keyword declares a variable?",
      "options": ["var", "let", "const", "All of the above"],
      "correctOptionIndex": 3
    }
  ]
}
Response: { "message": "Quiz created successfully", "data": {...} }
```

#### 27. Update Quiz
```
PUT /api/quizzes/admin/quizzes/:quizId
Headers: Authorization: Bearer <admin_token>
Body: { /* any fields to update */ }
Response: { "message": "Quiz updated successfully", "data": {...} }
```

#### 28. Delete Quiz
```
DELETE /api/quizzes/admin/quizzes/:quizId
Headers: Authorization: Bearer <admin_token>
Response: { "message": "Quiz deleted successfully" }
```

---

### Quiz Endpoints (Student)

#### 29. Get Quiz (Without Answers)
```
GET /api/quizzes/quizzes/:quizId
Headers: Authorization: Bearer <student_token>
Response: {
  "message": "Quiz fetched successfully",
  "data": {
    "quizId": "...",
    "courseId": "...",
    "lessonId": "lesson_1",
    "title": "JavaScript Basics Quiz",
    "questions": [
      {
        "questionText": "What is JavaScript?",
        "options": ["A programming language", "A coffee brand", "A car", "A country"]
        // Note: correctOptionIndex is NOT included
      }
    ]
  }
}
```

#### 30. Submit Quiz
```
POST /api/quizzes/quizzes/:quizId/submit
Headers: Authorization: Bearer <student_token>
Body: {
  "selectedOptions": [0, 3, 1, 2]  // Array of selected option indices
}
Response: {
  "message": "Quiz submitted successfully",
  "data": {
    "submission": {
      "_id": "...",
      "quiz": {...},
      "student": {...},
      "selectedOptions": [0, 3, 1, 2],
      "score": 75,
      "submittedAt": "..."
    },
    "score": 75,
    "correctAnswers": 3,
    "totalQuestions": 4
  }
}
```

**Note**: Score is calculated immediately on submission. Duplicate submissions are prevented (409 error).

---

## Frontend Implementation Guide

### 1. API Client Setup

Create a centralized API client:

```typescript
// lib/api/client.ts
const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

### 2. Authentication Service

```typescript
// lib/api/auth.ts
import { apiClient } from './client';

export const authApi = {
  async register(username: string, email: string, password: string) {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password,
    });
    return response;
  },

  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    if (response.data.token) {
      apiClient.setToken(response.data.token);
    }
    return response;
  },

  async logout() {
    await apiClient.post('/auth/logout', {});
    apiClient.clearToken();
  },
};
```

### 3. Course Service

```typescript
// lib/api/courses.ts
import { apiClient } from './client';

export const courseApi = {
  async getCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tags?: string;
    sort?: 'price_asc' | 'price_desc';
  }) {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiClient.get(`/courses/courses?${queryString}`);
  },

  async getCourseById(id: string) {
    return apiClient.get(`/courses/courses/${id}`);
  },

  // Admin only
  async createCourse(courseData: {
    title: string;
    description: string;
    instructor: string;
    price: number;
    category?: string;
    tags?: string[];
    syllabus?: any[];
  }) {
    return apiClient.post('/courses/admin/courses', courseData);
  },

  async updateCourse(id: string, updates: any) {
    return apiClient.put(`/courses/admin/courses/${id}`, updates);
  },

  async deleteCourse(id: string) {
    return apiClient.delete(`/courses/admin/courses/${id}`);
  },
};
```

### 4. Redux Store Structure

```typescript
// store/slices/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin' | 'instructor';
  } | null;
  token: string | null;
  isAuthenticated: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
  } as AuthState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 5. Protected Route Component

```typescript
// components/AuthGuard.tsx
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children, requiredRole }: { 
  children: React.ReactNode; 
  requiredRole?: 'user' | 'admin' 
}) {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole === 'admin' && user?.role !== 'admin') {
      router.push('/dashboard'); // or show 403
      return;
    }
  }, [isAuthenticated, user, router, requiredRole]);

  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
```

### 6. Error Handling

```typescript
// lib/utils/errorHandler.ts
export function handleApiError(error: any) {
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    // Token expired or invalid
    apiClient.clearToken();
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }

  if (error.message.includes('403') || error.message.includes('Forbidden')) {
    return 'You do not have permission to perform this action.';
  }

  if (error.message.includes('404')) {
    return 'Resource not found.';
  }

  if (error.message.includes('409')) {
    return 'This action has already been completed.';
  }

  return error.message || 'An error occurred. Please try again.';
}
```

### 7. Implementation Checklist

#### Phase 1: Authentication & Public Pages
- [ ] Login/Register pages
- [ ] Token storage (localStorage or httpOnly cookie)
- [ ] AuthGuard component
- [ ] Homepage with course listing
- [ ] Course details page
- [ ] Search, filter, sort functionality

#### Phase 2: Student Features
- [ ] Enrollment flow
- [ ] Dashboard (enrolled courses)
- [ ] Course content page with video player
- [ ] Progress tracking
- [ ] Mark lesson as completed

#### Phase 3: Assignments & Quizzes
- [ ] Assignment submission form
- [ ] Quiz interface with radio buttons
- [ ] Score display
- [ ] Submission history

#### Phase 4: Admin Features
- [ ] Course CRUD interface
- [ ] Batch management
- [ ] Assignment/Quiz creation
- [ ] Submission review interface

### 8. Key Frontend Considerations

1. **Token Management**
   - Store token securely (prefer httpOnly cookies for production)
   - Handle token expiration gracefully
   - Refresh token if implementing refresh mechanism

2. **Error Handling**
   - Show user-friendly error messages
   - Handle network errors
   - Implement retry logic for failed requests

3. **Loading States**
   - Show loading indicators during API calls
   - Implement optimistic updates where appropriate

4. **Form Validation**
   - Validate on frontend before submission
   - Display validation errors clearly
   - Match backend validation rules

5. **Data Caching**
   - Cache course listings
   - Implement pagination properly
   - Use React Query or SWR for data fetching

6. **Real-time Updates** (Optional)
   - Consider WebSockets for live progress updates
   - Poll for assignment/quiz status changes

---

## Database Schema Overview

### Collections & Relationships

```
User
  ├── _id (ObjectId)
  ├── username, email, password, role
  └── timestamps

Course
  ├── _id (ObjectId)
  ├── title, description, price, category, tags
  ├── instructor → User._id (ref)
  ├── syllabus: [{ lessonId, title, videoUrl, content }]
  └── timestamps

Batch
  ├── _id (ObjectId)
  ├── course → Course._id (ref)
  ├── name, startDate, endDate, capacity
  └── timestamps

Enrollment
  ├── _id (ObjectId)
  ├── student → User._id (ref)
  ├── course → Course._id (ref)
  ├── batch → Batch._id (ref)
  ├── status, paymentStatus, enrolledAt
  └── timestamps
  └── Unique index: (student, course, batch)

LessonProgress
  ├── _id (ObjectId)
  ├── student → User._id (ref)
  ├── course → Course._id (ref)
  ├── lessonId (string)
  ├── isCompleted, completedAt
  └── timestamps
  └── Unique index: (student, course, lessonId)

Assignment
  ├── _id (ObjectId)
  ├── course → Course._id (ref)
  ├── batch → Batch._id (ref, optional)
  ├── lessonId, title, description, dueDate
  └── timestamps

AssignmentSubmission
  ├── _id (ObjectId)
  ├── assignment → Assignment._id (ref)
  ├── student → User._id (ref)
  ├── course → Course._id (ref)
  ├── answerText, googleDriveLink
  ├── status, feedback, grade
  └── timestamps
  └── Unique index: (assignment, student, course)

Quiz
  ├── _id (ObjectId)
  ├── course → Course._id (ref)
  ├── lessonId, title
  ├── questions: [{ questionText, options[], correctOptionIndex }]
  └── timestamps

QuizSubmission
  ├── _id (ObjectId)
  ├── quiz → Quiz._id (ref)
  ├── student → User._id (ref)
  ├── course → Course._id (ref)
  ├── selectedOptions[], score
  └── timestamps
  └── Unique index: (quiz, student, course)
```

---

## Testing Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Courses (Public)
curl http://localhost:3000/api/courses/courses?page=1&limit=10

# Create Course (Admin)
curl -X POST http://localhost:3000/api/courses/admin/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title":"Test Course",
    "description":"This is a test course description",
    "instructor":"admin@example.com",
    "price":99.99,
    "category":"programming"
  }'
```

### Using Postman

1. Create a new collection "CourseMaster API"
2. Set base URL: `http://localhost:3000/api`
3. Create environment variables:
   - `base_url`: `http://localhost:3000/api`
   - `token`: (set after login)
4. Add pre-request script to set Authorization header:
   ```javascript
   pm.request.headers.add({
     key: 'Authorization',
     value: 'Bearer ' + pm.environment.get('token')
   });
   ```

---

## Performance Optimizations

### Implemented
- ✅ Database indexes on frequently queried fields
- ✅ Auto-populate hooks to prevent N+1 queries
- ✅ Pagination for course listings
- ✅ Field selection to limit response size

### Recommended for Frontend
- Implement caching for course listings
- Use pagination properly (don't load all courses at once)
- Lazy load course content
- Implement virtual scrolling for long lists
- Cache user's enrolled courses

---

## Security Best Practices

1. **Never expose sensitive data**
   - Don't send passwords in error messages
   - Don't log tokens in production

2. **Validate on both frontend and backend**
   - Frontend validation for UX
   - Backend validation for security

3. **Handle tokens securely**
   - Use httpOnly cookies in production
   - Implement token refresh mechanism
   - Clear tokens on logout

4. **Rate limiting** (recommended)
   - Implement rate limiting for API endpoints
   - Prevent brute force attacks on login

5. **CORS configuration**
   - Configure CORS properly for production
   - Only allow trusted origins

---

## Support & Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if token is included in Authorization header
   - Verify token hasn't expired
   - Ensure token format: `Bearer <token>`

2. **403 Forbidden**
   - Verify user role matches endpoint requirements
   - Check if user is logged in

3. **400 Bad Request**
   - Check request body format
   - Verify all required fields are present
   - Check validation rules

4. **409 Conflict**
   - Usually means duplicate resource (enrollment, submission)
   - Check if action was already performed

5. **500 Internal Server Error**
   - Check server logs for detailed error
   - Verify database connection
   - Check if all required environment variables are set

---

## Environment Variables

Required environment variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/coursemaster

# JWT
JWT_SECRET=your_secret_key_here

# Email (for registration emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@coursemaster.com

# Server
PORT=3000
NODE_ENV=development
```

---

## Conclusion

This API provides a complete backend for a Learning Management System. The frontend should:

1. Handle authentication and token management
2. Implement proper error handling
3. Use the standardized response format
4. Follow the data flow patterns described
5. Implement proper loading states and user feedback

For questions or issues, refer to the specific endpoint documentation above or check the server logs for detailed error messages.

