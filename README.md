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
