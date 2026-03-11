export function createUser({
  fullname,
  email,
  password,
  role = "student",

  // student fields
  rollNumber = null,
  yearOfStudy = null,
  semester = null,
  section = null,

  // faculty fields
  designation = null,
  teaching = []

}) {
  return {
    fullname: fullname.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,

    // student
    rollNumber,
    yearOfStudy,
    semester,
    section: section ? section.toUpperCase() : null,

    // faculty
    designation,
    teaching,

    createdAt: new Date(),
    updatedAt: new Date()
  };
}