# Assignment Submission Platform

A web-based platform for managing academic assignment submissions.
Students can submit assignments while faculty members can manage sections, assignments, and submissions.

## 🚀 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas
* **Templating Engine:** EJS
* **Styling:** Tailwind CSS
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
│   └── userController.js    # Business logic
│
├── models
│   └── userModel.js         # User schema/model
│
├── routes
│   └── indexRoutes.js       # Application routes
│
├── views
│   └── index.ejs            # EJS templates
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

* Authentication system (login & registration)
* Assignment creation and management
* File/link-based submission system
* Faculty dashboard
* Student submission tracking
* Notifications

---

## 🧑‍💻 Author

**Vijaya Krishna Nunna**
B.Tech Computer Science Engineering
