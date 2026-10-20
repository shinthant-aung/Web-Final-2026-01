# Online Course Service - Final Examination

## Live Deployment (Vercel)

- **Application:** [https://web-final-2026-01-frontend.vercel.app](https://web-final-2026-01-frontend.vercel.app)

---
## How to Run Locally

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (MongoDB Atlas connection string)

### 2. Backend Setup (`next-backend`)
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd next-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env.local` is present with your MongoDB URI and JWT secret:
   ```env
   MONGODB_URI=your_mongodb_connection_uri
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:3000`.

### 3. Frontend Setup (`react-frontend`)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd react-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` is configured with the backend API URL:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---
## Test Credentials

The system includes pre-configured test accounts for both **Teacher** and **Student** roles:

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **Teacher 1** | `teacher1` | `teacher1@exam.com` | `Teacher@123` |
| **Teacher 2** | `teacher2` | `teacher2@exam.com` | `Teacher@123` |
| **Teacher 3** | `teacher3` | `teacher3@exam.com` | `Teacher@123` |
| **Student 1** | `student1` | `student1@exam.com` | `Student@123` |
| **Student 2** | `student2` | `student2@exam.com` | `Student@123` |
| **Student 3** | `student3` | `student3@exam.com` | `Student@123` |

---
## Testing Walkthrough
### A. Authentication & Initial Redirect
Unauthenticated requests immediately redirect to the **Sign In** page (`/login`).
---

### B. Teacher Course Management
1. **Sign In as Teacher**:
   - Sign in with `teacher1@exam.com` / `Teacher@123`.
   - You land directly on the courses page with your role badge and Logout button in the top right.
2. **Teacher Dashboard ("My Course")**:
   - Notice the **"My Course"** table displaying only courses created by `teacher1`.
3. **Create Courses**:
   - Click the green **`+ Create New Course`** button above the table.
   - **Course 1 (Open for enrollment)**:
     - Name: `Web Application Development with Next.js`
     - Duration: `30` days
     - Price: `199` (or `0` for free)
     - Max Students: `2` (set to 2 for capacity testing)
     - Status: `Open`
     - Topics: `Next.js, React, MongoDB, REST API`
     - Click **Save Course** -> redirects back to courses page showing the new course in **"My Course"** and in the **"Course Catalog"**.
   - **Course 2 (Closed)**:
     - Name: `Advanced Machine Learning`
     - Duration: `45` days
     - Price: `250`
     - Max Students: `10`
     - Status: `Close`
     - Topics: `Python, PyTorch, Deep Learning`
     - Click **Save Course**.
   - **Course 3 (Cancelled)**:
     - Name: `Deprecated Legacy Systems`
     - Duration: `15` days
     - Price: `50`
     - Max Students: `5`
     - Status: `Cancel`
     - Topics: `COBOL, Fortran`
     - Click **Save Course**.
4. **Edit Course**:
   - In the **"My Course"** table, click the pencil icon (✏️) on any course.
   - Change price, duration, or topics -> click **Save Course** to update.
5. **Delete Course with 0 Enrolled**:
   - Click the trash icon (🗑️) on `Deprecated Legacy Systems`.
   - Confirm deletion in the dialog -> Course is deleted successfully.

---

### C. Student Course Browsing & Enrollment
1. **Logout and Sign In as Student**:
   - Click **Logout** in the top bar.
   - Sign in with `student1@exam.com` / `Student@123`.
2. **Course Catalog Visibility**:
   - Notice that `Deprecated Legacy Systems` (`Cancel` status) is **NOT** visible in the Course Catalog.
   - Only `Open` and `Close` courses appear.
3. **Search & Filter**:
   - Use the search bar to filter by course name (e.g., `Next.js`) or teacher name (`teacher1`).
4. **Enrollment**:
   - Click **"Enroll"** on `Web Application Development with Next.js`.
   - Button immediately updates to **"Enrolled"**.
   - The course appears above in the **"Enrolled Course"** table.
5. **Duplicate Enrollment Restriction**:
   - The enroll button is now disabled; backend strictly prevents duplicate enrollment.
6. **Closed Course Restriction**:
   - Look at `Advanced Machine Learning` (`Close` status): the button displays **"Closed"** and enrollment is disabled.

---

### D. Capacity Limits & Delete Protection
1. **Fill Course Capacity**:
   - Click **Logout** and sign in as `student2@exam.com` / `Student@123`.
   - Enroll in `Web Application Development with Next.js`.
   - Capacity reaches `2 / 2 (FULL)`.
2. **Third Student Blocked from Full Course**:
   - Click **Logout** and sign in as `student3@exam.com` / `Student@123`.
   - Notice the button displays **"Full"** and backend rejects enrollment attempts.
3. **Teacher View Enrolled Students & Delete Block**:
   - Click **Logout** and sign in as `teacher1@exam.com` / `Teacher@123`.
   - Click the view icon (👁️) on `Web Application Development with Next.js`.
   - Under **"Enrolled Students"**, both `student1` and `student2` are listed with emails and enrolled dates.
   - Notice that the **Delete** button is disabled with tooltip: `"Cannot delete: Students have already enrolled"`.
   - The backend API strictly rejects delete requests when enrolled students exist.
