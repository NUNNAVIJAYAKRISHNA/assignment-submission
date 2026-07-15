import User, { IUser, ITeaching } from "../models/userModel";
import Submission from "../models/submissionModel";

export interface GroupedStudents {
  year: number;
  section: string;
  subject: string;
  assignmentsEnabled: boolean;
  students: any[];
}

export const getStudentsForFaculty = async (faculty: { _id: any; teaching?: ITeaching[] }): Promise<GroupedStudents[]> => {
  if (!faculty.teaching || faculty.teaching.length === 0) {
    return [];
  }

  // Fetch all submissions for this faculty to map submission status
  const submissions = faculty._id ? await Submission.find({ facultyId: faculty._id }) : [];
  const submissionMap = new Map();
  submissions.forEach((sub) => {
    submissionMap.set(`${sub.studentId.toString()}-${sub.subject.toLowerCase()}`, sub);
  });

  const grouped: GroupedStudents[] = [];

  for (const t of faculty.teaching) {
    // Fetch students of this year and section
    const students = await User.find({
      role: "student",
      yearOfStudy: t.year,
      section: t.section
    }).select("fullname rollNumber yearOfStudy section branch");

    const classStudents = students.map((student) => {
      const sub = submissionMap.get(`${student._id.toString()}-${t.subject.toLowerCase()}`);
      return {
        _id: student._id.toString(),
        fullname: student.fullname,
        rollNumber: student.rollNumber,
        branch: student.branch,
        submission: sub ? {
          title: sub.title,
          videoUrl: sub.videoUrl,
          createdAt: sub.createdAt
        } : null
      };
    });

    grouped.push({
      year: t.year,
      section: t.section,
      subject: t.subject,
      assignmentsEnabled: !!t.assignmentsEnabled,
      students: classStudents
    });
  }

  return grouped;
};
