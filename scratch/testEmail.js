require("dotenv").config();
const { sendVerificationEmail } = require("../utils/sendEmail");

async function runTest() {
  console.log("BASE_URL:", process.env.BASE_URL);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);

  try {
    const testToken = "test_verification_token_123456";
    await sendVerificationEmail(process.env.EMAIL_USER, testToken);
    console.log("VERIFICATION EMAIL DISPATCHED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("VERIFICATION EMAIL DISPATCH FAILED:", err);
    process.exit(1);
  }
}

runTest();
