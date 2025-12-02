# CourseMaster server

A Express.js server application for CourseMaster, a full-featured E-learning platform. Students can browse, purchase, and consume courses. Administrators can manage courses, track enrollments, and review assignments.

**Live Link**: [https://coursemaster-client.vercel.app](https://coursemaster-client.vercel.app)
**Live Link-backend**: [https://coursemaster-server.onrender.com](https://coursemaster-server.onrender.com)

## Installation & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## API Documentation

The client communicates with the backend API. Main API modules:

- **Auth**: `/auth/register` (POST), `/auth/login` (POST), `/auth/logout` (POST)
- **Courses**: `/courses/courses` (GET), `/courses/courses/:id` (GET)
- **Enrollments**: `/enrollments/enroll` (POST)
- **Assignments**: `/assignments/assignments/:assignmentId/submit` (POST), `/assignments/assignments/courses/:courseId` (GET)
- **Quizzes**: `/quizzes/quizzes/:quizId` (GET), `/quizzes/quizzes/:quizId/submit` (POST), `/quizzes/courses/:courseId/quizzes` (GET), `/quizzes/quizzes/:quizId/submission` (GET)
- **Lessons**: `/lessons/:courseId/content` (GET), `/lessons/:courseId/lessons/:lessonId/complete` (POST)
- **Dashboard**: `/dashboard/dashboard/enrollments` (GET), `/dashboard/dashboard/courses/:courseId/progress` (GET)
- **Admin - Courses**: `/courses/admin/courses` (POST), `/courses/admin/courses/:id` (PUT, DELETE)
- **Admin - Batches**: `/courses/admin/courses/:courseId/batches` (GET, POST), `/courses/admin/batches/:batchId` (PUT, DELETE)
- **Admin - Assignments**: `/assignments/admin/assignments` (POST), `/assignments/admin/assignments/:assignmentId` (PUT, DELETE), `/assignments/admin/courses/:courseId/assignments` (GET), `/assignments/admin/assignments/:assignmentId/submissions` (GET), `/assignments/admin/submissions/:submissionId/review` (PUT)
- **Admin - Quizzes**: `/quizzes/admin/quizzes` (POST), `/quizzes/admin/quizzes/:quizId` (PUT, DELETE), `/quizzes/admin/courses/:courseId/quizzes` (GET)

All authenticated requests require a Bearer token in the Authorization header.


