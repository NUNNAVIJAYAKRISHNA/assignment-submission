export function homePage(req, res) {
  let name = "Assignment Submission Platform By Vijaya Krishna Nunna";
  res.render("index", { name });
};