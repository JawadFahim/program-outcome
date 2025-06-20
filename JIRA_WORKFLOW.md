# Jira Scrum Workflow for the Program Outcome Project

Here is a detailed, step-by-step guide to retroactively document your project in Jira using the Scrum framework. This will help you showcase your work process as if you had been using Jira from the start.

### Project Analysis Summary
Based on the file structure, your project is a **Next.js web application** with the following key features:
-   **User Authentication:** Separate login flows for Admins and general users, including OTP requests and password resets.
-   **Admin Dashboard:** Features for managing teachers, sessions, and viewing dashboard metrics.
-   **Teacher/Course Functionality:** Tools for managing course objectives, viewing student lists, and inputting/saving student scores.
-   **API-driven Backend:** A clear set of API endpoints in `src/pages/api` to handle all the business logic.
-   **Standard Web Frontend:** A frontend built with Next.js/React, likely located in `src/app` and `src/components`.

---

## Step 1: Set Up Your Jira Scrum Project

1.  **Create a Jira Account:** If you don't have one, sign up for a free Jira Software account.
2.  **Create a Scrum Project:**
    *   From your Jira dashboard, click **Projects** > **Create project**.
    *   Select the **Scrum** template. It comes with all the features you'll need (Backlog, Sprints, Reports).
    *   Give your project a name (e.g., `Program Outcome Tracker`) and a key (Jira will suggest one, like `POT`).

---

## Step 2: Populate the Backlog with Epics

Epics are large pieces of work that represent a major feature. In your Backlog view, create the following epics based on your project's features.

*   **Go to the Backlog** in your project's left sidebar.
*   **Click the Epics panel** and then **Create epic**.

**Create these Epics:**

1.  `User Authentication & Authorization`
2.  `Admin Dashboard & Management`
3.  `Teacher & Course Management`
4.  `Student Assessment System`
5.  `Initial Project Setup & UI Foundation`

---

## Step 3: Break Down Epics into User Stories

User Stories are specific, user-focused requirements. They explain what a user needs to do. From the Backlog view, click **Create issue** and select the `Story` issue type. As you create them, assign each story to its relevant Epic.

Here is a list of stories to create, based on your project's API files and logic:

**Epic: `User Authentication & Authorization`**
*   `As a user, I want to log in with my credentials to access the system.`
*   `As a user, I want to request a one-time password (OTP) to reset my password.`
*   `As a user, I want to reset my password using an OTP.`
*   `As an admin, I want to log in through a separate admin portal.`

**Epic: `Admin Dashboard & Management`**
*   `As an admin, I want to view a dashboard with key system metrics.`
*   `As an admin, I want to add new teacher accounts to the system.`
*   `As an admin, I want to view a list of all teachers.`
*   `As an admin, I want to create and manage academic sessions.`

**Epic: `Teacher & Course Management`**
*   `As a teacher, I want to view all academic sessions.`
*   `As a teacher, I want to define and manage objectives for my courses.`
*   `As a teacher, I want to view the list of students enrolled in my course.`

**Epic: `Student Assessment System`**
*   `As a teacher, I want to enter and save student scores for course objectives.`
*   `As a teacher, I want to view a summary of scores for my students.`
*   `As the system, I need to calculate and store score summaries accurately.`

**Epic: `Initial Project Setup & UI Foundation`**
*   `As a developer, I need to set up a new Next.js project with TypeScript.`
*   `As a developer, I need to establish the basic file structure and global styles.`
*   `As a user, I want a consistent and intuitive layout across the application.`

---

## Step 4: Add Technical Sub-tasks to Stories

Now, break down each story into the actual technical tasks you completed.

*   Click on a story to open its details.
*   Under the `Child issues` section, click **Create a child issue** and select the `Subtask` type.

**Example Breakdown for the story `As a user, I want to log in...`:**
*   **Sub-task:** Create the login API endpoint (`/api/login.ts`).
*   **Sub-task:** Design and build the main login UI form.
*   **Sub-task:** Implement frontend logic to call the login API and handle the response.
*   **Sub-task:** Implement session management using middleware (`middleware.ts`).

**Do this for all your stories.** Look at your file names in `src/pages/api`—each file often corresponds to one or more sub-tasks. For example, the `add-teacher.ts` file is a sub-task for the "add new teacher accounts" story.

---

## Step 5: Simulate Sprints to Show Progress

Since the work is already done, you'll create and complete sprints to represent the project timeline.

1.  **Create Your First Sprint:**
    *   In the **Backlog**, you'll see a "Sprint 1" box.
    *   Drag the most fundamental stories into it. A good first sprint would include stories from the `Initial Project Setup` and `User Authentication` epics.
2.  **"Start" the Sprint:**
    *   Click the **Start Sprint** button.
    *   Give it a goal (e.g., "Build project foundation and user login functionality").
    *   **Set the start and end dates to be in the past** to reflect when you actually did the work (e.g., a 1-week sprint from a month ago).
3.  **Move All Issues to "Done":**
    *   Go to your **Active sprints** board.
    *   You will see your tasks in the "To Do" column.
    *   Drag every task and sub-task through the columns: **To Do** -> **In Progress** -> **Done**. This simulates the work being completed.
4.  **Complete the Sprint:**
    *   Once all issues are in "Done", click the **Complete Sprint** button. Jira will show you a summary of the completed work.
5.  **Repeat for All Work:**
    *   Go back to the **Backlog**.
    *   Create "Sprint 2" and drag the next set of stories into it (e.g., Admin features).
    *   Start and complete this sprint with dates set after your first sprint.
    *   Continue this process until all your stories from the backlog have been completed in a series of historical sprints.

---

## Step 6: Showcase Your Work with Jira Reports

By completing the steps above, Jira has automatically generated valuable reports that visualize your workflow.

*   **Burndown Charts:** Go to **Reports** > **Burndown Chart**. You can select each completed sprint to see a chart showing the "work" being completed over the sprint's duration.
*   **Velocity Chart:** Go to **Reports** > **Velocity Chart**. This shows how much work (in story points, if you choose to use them) was completed in each sprint, demonstrating your consistent progress.
*   **Roadmap:** Go to the **Roadmap** tab from the main navigation. This provides a high-level timeline of your epics, showing the start and end dates of the features you built.

By following this guide, you will have a fully documented Jira project that accurately reflects the work you've done, ready to be presented. 