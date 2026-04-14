import User from "../models/userModel.js";

export async function verifyEmail(req, res) {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.send("Invalid or expired verification link");
    }
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();
    res.send("Email verified successfully. You can now login.");
  }
  catch (error) {
    console.error(error);
    res.send("Verification failed");
  }
}