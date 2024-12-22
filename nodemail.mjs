
// still working on this to make it work and better 
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/sendProjectEmail', (req, res) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: req.body.email,
    subject: 'Project Update',
    html: `<h1>Project Update</h1><p>Here are the latest updates on your project...</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.json({ success: false, message: "Email not sent" });
    } else {
      res.json({ success: true, message: "Email sent successfully!" });
    }
  });
});