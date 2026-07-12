# Assignment Submission Platform

A web-based platform for managing academic assignment submissions.
Students can submit assignments while faculty members can manage sections, assignments, and submissions.

## 🚀 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas
* **Templating Engine:** EJS
* **Styling:** Tailwind CSS
* **Authentication & Utilities:** Express Session, bcrypt, Nodemailer
* **Development Tools:** Nodemon, dotenv

---

## 📂 Project Structure

```
assignment-submission
│
├── config
│   └── db.js                # MongoDB connection setup
│
├── controllers
│   ├── authController.js    # Authentication request handling
│   ├── facultyController.js # Faculty domain logic
│   ├── pageController.js    # Public page rendering
│   ├── studentController.js # Student domain logic
│   └── verificationController.js # Email verification logic
│
├── models
│   └── userModel.js         # User schema/model
│
├── routes
│   ├── authRoutes.js        # Login & Registration endpoints
│   ├── dashboardRoutes.js   # Protected dashboard endpoints
│   └── pageRoutes.js        # General page routing
│
├── services
│   ├── facultyService.js    # Complex DB queries & business logic
│   └── studentService.js    # Student domain business logic
│   
├── utils
│   ├── createUser.js        # User payload transformation
│   ├── loginUser.js         # Credential verification
│   └── sendEmail.js         # Email sending utility
│
├── views
│   └── ...                  # EJS templates (dashboards, forms)
│
├── public
│   ├── css
│   │   ├── input.css
│   │   └── output.css
│   └── js                   # Client-side scripts
│
├── .env                     # Environment variables
├── .gitignore
├── index.js                 # Application entry point
├── package.json
├── tailwind.config.js
└── README.md
```

---

## ⚙️ Installation

Clone the repository:

```
git clone https://github.com/yourusername/assignment-submission.git
cd assignment-submission
```

Install dependencies:

```
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```
PORT=8000
MONGO_URI=your_mongodb_connection_string
```

---

## ▶️ Running the Application

Start the development server:

```
npm run dev
```

Build Tailwind CSS:

```
npm run css
```

Then open your browser:

```
http://localhost:8000
```

---

## 🛡️ System Architecture & Key Flows

### 1. Email Verification Flow
To secure user registration for both Students and Faculty:
* Upon registration, a cryptographically secure token is generated (`crypto.randomBytes`) and stored with an expiration timeline.
* A Nodemailer mail utility formats and dispatches a verification link (`/verify?token=...`) to the registered email address.
* The `/verify` route triggers `verificationController.js` which matches the token, checks expiration, sets `isVerified: true`, and clears token properties in MongoDB.

### 2. Payload Preprocessing & Safeguards
* Added input sanitization during user creation to clean up and filter out empty academic entries (`teaching` array for faculty). This prevents empty/unfilled form rows from violating MongoDB schema constraints (`required: true` on nested fields) and causing validation errors.

### 3. Password Visibility Toggles
* Interactive password visibility options are integrated on student and faculty registration views using eye SVG icons and pure Javascript toggle event listeners.

### 4. Cohesive Styling & UI Layer
* Implemented a unified modern visual system featuring custom Tailwind configurations (such as the gradient `bg-hush`), professional typography (importing Google Font `Plus Jakarta Sans`), custom SVG iconography, responsive layouts (using `md:grid-cols-6` grid structures), and collapsible accordion panels with rotating chevrons.

---

## 👤 User Roles

### Student

* Register and login
* Submit assignments
* View submission status

### Faculty

* Manage sections handled
* Create assignments
* Review submissions

---



---

## 📌 Future Features

* Assignment creation and management
* File/link-based submission system
* Student submission tracking
* Notifications

---

## 🧑‍💻 Author

**Vijaya Krishna Nunna**
B.Tech Computer Science Engineering
