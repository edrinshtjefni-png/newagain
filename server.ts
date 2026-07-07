import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import schedule from "node-schedule";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/send-booking-email', async (req, res) => {
    try {
      const { to, bookingDetails, salonName } = req.body;
      
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn("RESEND_API_KEY is not set. Email would have been sent to", to);
        return res.status(200).json({ success: true, mocked: true });
      }

      const resend = new Resend(apiKey);
      const data = await resend.emails.send({
        from: 'Booking System <onboarding@resend.dev>',
        to: [to],
        subject: `Booking Confirmed at ${salonName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Your booking is confirmed!</h1>
            <p>Hi there,</p>
            <p>Your booking at <strong>${salonName}</strong> has been successfully confirmed.</p>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; font-size: 18px;">Booking Details:</h2>
              <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 8px;"><strong>Service:</strong> ${bookingDetails.serviceName}</li>
                <li style="margin-bottom: 8px;"><strong>Date:</strong> ${new Date(bookingDetails.date).toLocaleDateString()}</li>
                <li style="margin-bottom: 8px;"><strong>Time:</strong> ${bookingDetails.time}</li>
              </ul>
            </div>
            <p>Thank you for using our service!</p>
          </div>
        `,
      });
      
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Email send error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  
  app.post('/api/schedule-reminder', async (req, res) => {
    try {
      const { to, bookingDetails, salonName, bookingDateTimeISO } = req.body;
      
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn("RESEND_API_KEY is not set. Reminder scheduling mocked.");
        return res.status(200).json({ success: true, mocked: true });
      }

      const bookingTime = new Date(bookingDateTimeISO);
      const reminderTime = new Date(bookingTime.getTime() - 24 * 60 * 60 * 1000);
      
      if (reminderTime.getTime() <= Date.now()) {
        console.warn("Booking is less than 24 hours away. Skipping 24h reminder.");
        return res.status(200).json({ success: true, message: "Booking too soon for 24h reminder" });
      }

      schedule.scheduleJob(reminderTime, async () => {
        try {
          const resend = new Resend(apiKey);
          await resend.emails.send({
            from: 'Booking System <onboarding@resend.dev>',
            to: [to],
            subject: `Reminder: Upcoming Booking at ${salonName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Upcoming Appointment Reminder</h1>
                <p>Hi there,</p>
                <p>This is a reminder for your upcoming appointment at <strong>${salonName}</strong> in 24 hours.</p>
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin-top: 0; font-size: 18px;">Booking Details:</h2>
                  <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 8px;"><strong>Service:</strong> ${bookingDetails.serviceName}</li>
                    <li style="margin-bottom: 8px;"><strong>Date:</strong> ${new Date(bookingDetails.date).toLocaleDateString()}</li>
                    <li style="margin-bottom: 8px;"><strong>Time:</strong> ${bookingDetails.time}</li>
                  </ul>
                </div>
                <p>We look forward to seeing you!</p>
              </div>
            `,
          });
          console.log(`Reminder email sent to ${to} for ${salonName}`);
        } catch (err) {
          console.error("Failed to send reminder email:", err);
        }
      });

      res.status(200).json({ success: true, message: "Reminder scheduled successfully" });
    } catch (error) {
      console.error("Error scheduling reminder:", error);
      res.status(500).json({ error: "Failed to schedule reminder" });
    }
  });

  app.get('/api/download', (req, res) => {
    const file = path.join(process.cwd(), 'public', 'project.zip');
    res.download(file, 'project.zip', (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Could not download the file.");
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
