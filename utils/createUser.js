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
    fullname: fullname?.trim(),

    email: email?.toLowerCase().trim(),

    password,

    role,

    // student fields
    rollNumber: rollNumber?.trim() || null,

    yearOfStudy: yearOfStudy ? Number(yearOfStudy) : null,

    semester: semester ? Number(semester) : null,

    section: section ? section.toUpperCase() : null,

    // faculty fields
    designation: designation?.trim() || null,

    teaching: teaching.map(t => ({
      year: Number(t.year),
      section: t.section?.toUpperCase(),
      subject: t.subject?.trim()
    }))

  };

}