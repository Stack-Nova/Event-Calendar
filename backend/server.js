// server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const moment = require("moment");
const PDFDocument = require("pdfkit");
const sgMail = require('@sendgrid/mail')

const Listing = require("./models/listing.js");
const User = require("./models/user.js");
const permission = require("./models/permission.js");
const pendingSignup = require("./models/pendingSignup.js");
const adminRoutes = require("./adminRoutes");

const app = express();

// ---------- CONFIG ----------

const PORT = process.env.PORT || 8000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Event";

const CLIENT_ORIGIN = "https://event-calendar-alpha-red.vercel.app"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

// ---------- MIDDLEWARE ----------

app.use(
  cors({
    origin: CLIENT_ORIGIN === "*" ? "*" : [CLIENT_ORIGIN, "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- DB CONNECTION ----------

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    // In production, better to crash than run half-broken
    process.exit(1);
  });

// ---------- SENDGRID MAIL SERVICE ----------
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// ---------- ROUTES ----------

// Mount admin routes (protected inside adminRoutes.js)
app.use("/api/admin", adminRoutes);

// GET: all events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Listing.find();
    return res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch events", error: error.message });
  }
});

// POST: add new event with clash detection
app.post("/api/events", async (req, res) => {
  try {
    const { date, time, duration, location } = req.body;

    // Check for venue and time clashes on same date and location
    const existingEvents = await Listing.find({
      location: location,
      date: date,
    });

    // Convert HH:MM / hh:mm am/pm / "all day" → minutes from start of day
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;

      const timeLower = timeStr.toLowerCase();

      // All day events start at 0 for simplicity
      if (timeLower.includes("all day") || timeLower.includes("all-day")) {
        return 0;
      }

      // AM/PM format
      const ampmMatch = timeLower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
      if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
        const period = ampmMatch[3].toLowerCase();

        if (period === "pm" && hours !== 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;

        return hours * 60 + minutes;
      }

      // 24-hour HH:MM format
      const hhmmMatch = timeLower.match(/(\d{1,2}):(\d{2})/);
      if (hhmmMatch) {
        const hours = parseInt(hhmmMatch[1], 10);
        const minutes = parseInt(hhmmMatch[2], 10);
        return hours * 60 + minutes;
      }

      // Fallback
      return 0;
    };

    const newEventStartMinutes = timeToMinutes(time);
    const eventDuration = parseInt(duration, 10) || 60;
    const newEventEndMinutes = newEventStartMinutes + eventDuration;

    for (const existingEvent of existingEvents) {
      const existingEventStartMinutes = timeToMinutes(existingEvent.time);
      const existingDuration = parseInt(existingEvent.duration, 10) || 60;
      const existingEventEndMinutes =
        existingEventStartMinutes + existingDuration;

      // Check overlap
      const overlap =
        Math.max(
          0,
          Math.min(newEventEndMinutes, existingEventEndMinutes) -
            Math.max(newEventStartMinutes, existingEventStartMinutes)
        ) > 0;

      if (overlap) {
        return res.status(409).json({
          message:
            "Event clash detected! There's already an event at this venue that overlaps with your event time.",
          conflictingEvent: {
            title: existingEvent.title,
            time: existingEvent.time,
            duration: existingEvent.duration,
            location: existingEvent.location,
            date: existingEvent.date,
          },
        });
      }
    }

    // No clash ➝ save event
    const event = new Listing(req.body);
    await event.save();
    res.status(201).json({ message: "Event saved successfully" });
  } catch (error) {
    console.error("Error saving event:", error);
    res
      .status(500)
      .json({ message: "Failed to save event", error: error.message });
  }
});

// SIGNUP
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check permission table
    const isPermitted = await permission.findOne({ email });
    if (!isPermitted) {
      // Add to pending if not present
      const alreadyPending = await pendingSignup.findOne({ email });
      if (!alreadyPending) {
        await pendingSignup.create({ email, username });

        // Notify admin (if transporter configured)
        const msg = {
          to: ADMIN_EMAIL,
          from: 'stacknovaa@gmail.com',
          subject: "New Signup Request Pending Approval",
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
              <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 24px;">
                
                <h2 style="color: #333333; margin-bottom: 10px;">
                  🚀 New Signup Request
                </h2>

                <p style="color: #555555; font-size: 15px;">
                  A new user has requested access to the platform. Please review the details below and take the necessary action.
                </p>

                <table style="width: 100%; margin-top: 16px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Username:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${username}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Email:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${email}</td>
                  </tr>
                </table>

                <div style="text-align: center; margin-top: 30px;">
                  <a 
                    href="https://event-calendar-alpha-red.vercel.app/login"
                    style="
                      background-color: #4f46e5;
                      color: #ffffff;
                      text-decoration: none;
                      padding: 12px 22px;
                      border-radius: 6px;
                      font-size: 15px;
                      display: inline-block;
                    "
                  >
                    Review Signup Request
                  </a>
                </div>

                <p style="margin-top: 25px; font-size: 13px; color: #888888;">
                  If the button doesn’t work, copy and paste this link into your browser:
                  <br />
                  <a href="https://event-calendar-alpha-red.vercel.app/login" style="color: #4f46e5;">
                    https://event-calendar-alpha-red.vercel.app/login
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
      }
      return res
        .status(403)
        .json({ message: "Permission denied. Admin has been notified." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();
    return res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.password === password) {
      // In production, actually return a JWT instead of raw user
      return res.status(200).json({ message: "Login successful", user });
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// REPORT DOWNLOAD
app.get("/api/reports/download", async (req, res) => {
  try {
    const { range, format, start, end } = req.query;
    let startDate, endDate;

    const today = moment();

    if (start && end) {
      startDate = moment(start).toDate();
      endDate = moment(end).toDate();
    } else {
      switch (range) {
        case "week":
          startDate = today.clone().startOf("week").toDate();
          endDate = today.clone().endOf("week").toDate();
          break;
        case "month":
          startDate = today.clone().startOf("month").toDate();
          endDate = today.clone().endOf("month").toDate();
          break;
        case "year":
          startDate = today.clone().startOf("year").toDate();
          endDate = today.clone().endOf("year").toDate();
          break;
        default:
          try {
            const rangeObj = JSON.parse(range);
            startDate = moment(rangeObj.start).toDate();
            endDate = moment(rangeObj.end).toDate();
          } catch (e) {
            startDate = today.toDate();
            endDate = today.toDate();
          }
      }
    }

    const listings = await Listing.find({
      date: { $gte: startDate, $lte: endDate },
    });

    console.log("Listings fetched for report:", listings.length);

    if (format === "excel") {
      const XLSX = require("xlsx");
      const data = listings.map((item) => ({
        Title: item.title,
        Organizer: item.organizer,
        Date: item.date,
        Time: item.time,
        Location: item.location,
        Description: item.description,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Events");

      const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=event-report.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(buffer);
    } else {
      const pdfDoc = new PDFDocument();
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=event-report.pdf"
      );
      res.setHeader("Content-Type", "application/pdf");

      pdfDoc.pipe(res);
      pdfDoc.fontSize(24).text("Event Report", 100, 80);

      listings.forEach((item, index) => {
        pdfDoc.moveDown();
        pdfDoc.fontSize(16).text(`Event #${index + 1}`);
        pdfDoc.fontSize(12).text(`Title: ${item.title}`);
        pdfDoc.text(`Organizer: ${item.organizer}`);
        pdfDoc.text(`Date: ${item.date}`);
        pdfDoc.text(`Time: ${item.time}`);
        pdfDoc.text(`Location: ${item.location}`);
        pdfDoc.text(`Description: ${item.description}`);
      });

      pdfDoc.end();
    }
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).send("Error generating report");
  }
});

// ---------- START SERVER ----------

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

app.get("/", (req, res)=> res.send("backend is running"));

module.exports = app;
