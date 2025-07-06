# Program Outcome Tracker

This is a Next.js web application designed for educational institutions to track student performance against course objectives (COs). It provides separate interfaces for administrators and teachers to manage courses, teachers, and student assessments.

## Features

Based on the project's structure and goals, the key features are:

-   **Role-Based Access Control:** Separate login and dashboard functionalities for **Admins** and **Teachers**.
-   **Admin Dashboard:**
    -   Manage teacher accounts (add, view).
    -   Create and oversee academic sessions.
    -   View high-level dashboard metrics.
-   **Teacher Dashboard:**
    -   Define and update course objectives for assigned courses.
    -   View enrolled student lists for each course.
    -   Enter and save student scores for various assessments (e.g., quizzes, midterms, finals).
-   **Automated Score Summarization:**
    -   The system automatically aggregates scores from different assessments for each course objective.
    -   It calculates pass/fail status for each student based on predefined pass marks.
    -   Generates a summary report showing the overall student performance per course objective.
-   **Secure Authentication:** User sessions are managed using JSON Web Tokens (JWT) with an expiration time.

*   **Disclaimer:** The current implementation includes a security warning regarding plaintext password storage. This is a temporary measure for development and testing, and should be replaced with password hashing in a production environment.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Database:** [MongoDB](https://www.mongodb.com/)
-   **Authentication:** [JWT (jose)](https://github.com/panva/jose)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## Project Structure

The project follows a standard Next.js structure with the `pages` directory for routing.

-   `src/pages/api/`: Contains all the backend API endpoints.
    -   `src/pages/api/admin/`: Admin-specific endpoints.
    -   `src/pages/api/teachers/`: Teacher-specific endpoints.
-   `src/app/`: Contains the main application layout and default page. The primary UI components and views are likely within `src/pages/` (not to be confused with the API directory).
-   `src/lib/`: Includes shared modules, such as the MongoDB client configuration.
-   `src/middleware.ts`: Handles request middleware, likely for authenticating and protecting routes.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18.x or later recommended)
-   npm or yarn
-   A MongoDB database instance (local or cloud-based)

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your_username/your_repository.git
    cd your_repository
    ```

2.  **Install NPM packages**
    ```sh
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env.local` file in the root of the project and add the following variables:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_secure
    ```

4.  **Run the development server**
    ```sh
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints Overview

Here are some of the key API endpoints that power the application:

-   `POST /api/login`: Authenticates a teacher and returns a JWT.
-   `POST /api/admin/login`: Authenticates an admin.
-   `POST /api/admin/add-teacher`: Allows an admin to create a new teacher account.
-   `POST /api/saveScores`: Saves student scores for a specific assessment.
-   `GET /api/score_summary`: Retrieves a comprehensive summary of student performance for a course.
-   `POST /api/request-otp`: Sends an OTP for password reset.
-   `POST /api/reset-password`: Resets a user's password using an OTP.
