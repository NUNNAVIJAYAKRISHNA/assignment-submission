import User, { IUser, ITeaching } from "../models/userModel";
import Submission from "../models/submissionModel";

export interface GroupedStudents {
  year: number;
  section: string;
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
    submissionMap.set(sub.studentId.toString(), sub);
  });

  const students = await User.find({
    role: "student",
    $or: faculty.teaching.map((t) => ({
      yearOfStudy: t.year,
      section: t.section
    }))
  }).select("fullname rollNumber yearOfStudy section branch");

  const grouped: Record<string, GroupedStudents> = {};

  students.forEach((student) => {
    const year = student.yearOfStudy || 0;
    const section = student.section || "";
    const key = `${year}-${section}`;
    if (!grouped[key]) {
      const matchedTeaching = faculty.teaching?.find(
        (t) => t.year === year && t.section === section
      );
      grouped[key] = {
        year,
        section,
        assignmentsEnabled: matchedTeaching ? !!matchedTeaching.assignmentsEnabled : false,
        students: []
      };
    }
    
    const sub = submissionMap.get(student._id.toString());
    grouped[key].students.push({
      _id: student._id.toString(),
      fullname: student.fullname,
      rollNumber: student.rollNumber,
      branch: student.branch,
      submission: sub ? {
        title: sub.title,
        videoUrl: sub.videoUrl,
        createdAt: sub.createdAt
      } : null
    });
  });

  return Object.values(grouped);
};
