// adminRoutes.js
const express = require("express");
const sgMail = require('@sendgrid/mail')
const router = express.Router();

const permission = require("./models/permission");
const pendingSignup = require("./models/pendingSignup");
const User = require("./models/user");
const Listing = require("./models/listing");

// ---------- SENDGRID MAIL SERVICE ----------
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Simple admin auth middleware (replace with JWT in production)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

router.use((req, res, next) => {
  const adminSecret = req.headers["x-admin-secret"];
  if (adminSecret !== ADMIN_PASSWORD) {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
});

// Add email to permission table
router.post("/permission", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  try {
    await permission.create({ email });
    res.status(201).json({ message: "Permission granted" });
  } catch (err) {
    res.status(500).json({
      message: "Error adding permission",
      error: err.message,
    });
  }
});

// List pending signups
router.get("/pending-signups", async (req, res) => {
  try {
    const pendings = await pendingSignup.find();
    res.json(pendings);
  } catch (err) {``
    res.status(500).json({
      message: "Error fetching pending signups",
      error: err.message,
    });
  }
});

// Approve signup
router.post("/approve-signup", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  try {
    const pending = await pendingSignup.findOneAndDelete({ email });
    if (!pending)
      return res.status(404).json({ message: "Pending signup not found" });

    await permission.create({ email });

    // send permission granted email to user
    const msg = {
      to: email,
      from: 'stacknovaa@gmail.com',
      subject: "Your Signup Request Has Been Approved 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 24px;">
            
            <h2 style="color: #333333; margin-bottom: 10px;">
              ✅ Signup Approved
            </h2>

            <p style="color: #555555; font-size: 15px;">
              Good news! Your email has been <strong>approved by the administrator</strong>.
              You can now complete your registration on the platform.
            </p>

            <table style="width: 100%; margin-top: 16px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Approved Email:</td>
                <td style="padding: 8px 0; font-weight: bold;">${email}</td>
              </tr>
            </table>

            <p style="color: #555555; font-size: 14px; margin-top: 16px;">
              ⚠️ Please make sure to <strong>use the same email ID</strong> shown above while signing up.
              Registrations with a different email will not be accepted.
            </p>

            <div style="text-align: center; margin-top: 30px;">
              <a 
                href="https://event-calendar-alpha-red.vercel.app/signup"
                style="
                  background-color: #16a34a;
                  color: #ffffff;
                  text-decoration: none;
                  padding: 12px 22px;
                  border-radius: 6px;
                  font-size: 15px;
                  display: inline-block;
                "
              >
                Complete Signup
              </a>
            </div>

            <p style="margin-top: 25px; font-size: 13px; color: #888888;">
              If the button doesn’t work, copy and paste this link into your browser:
              <br />
              <a href="https://event-calendar-alpha-red.vercel.app/signup" style="color: #16a34a;">
                https://event-calendar-alpha-red.vercel.app/signup
              </a>
            </p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eeeeee;" />

            <p style="font-size: 12px; color: #aaaaaa; text-align: center;">
              © ${new Date().getFullYear()} StackNova · All rights reserved
            </p>

          </div>
        </div>
      `,
    };

    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error('error in sending mail',error);
      });

    res.json({ message: "Signup approved and permission granted" });
  } catch (err) {
    res.status(500).json({
      message: "Error approving signup",
      error: err.message,
    });
  }
});

// Reject signup
router.post("/reject-signup", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  try {
    await pendingSignup.findOneAndDelete({ email });
    res.json({ message: "Signup rejected and removed from pending" });
  } catch (err) {
    res.status(500).json({
      message: "Error rejecting signup",
      error: err.message,
    });
  }
});

// List users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // exclude password
    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching users",
      error: err.message,
    });
  }
});

// Delete user
router.delete("/user", async (req, res) => {
  const { email, id } = req.body;
  if (!email && !id)
    return res.status(400).json({ message: "Email or ID required" });

  try {
    const query = email ? { email } : { _id: id };
    const deleted = await User.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    await permission.deleteOne({ email: deleted.email });
    res.json({ message: "User deleted and permission removed" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting user",
      error: err.message,
    });
  }
});

// Delete event
router.delete("/event", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "Event ID required" });
  try {
    const deleted = await Listing.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting event",
      error: err.message,
    });
  }
});

module.exports = router;
