const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Gmail SMTP Transporter செட்டப்
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // .env-ல இருந்து உங்க ஈமெயில் ஐடி எடுக்கும்
    pass: process.env.EMAIL_PASS  // .env-ல இருந்து உங்க ஆப் பாஸ்வேர்ட் எடுக்கும்
  }
});

// சர்வர் ஒர்க் ஆகுதான்னு செக் பண்ண ஒரு டெஸ்ட் ரூட்
app.get('/', (req, res) => {
  res.send('Backend Server is Running Successfully! 🚀');
});

// Frontend-ல இருந்து மெயில் அனுப்பும் API Endpoint
app.post('/api/send-email', (req, res) => {
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    text: text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.status(200).json({ success: true, message: 'Email Sent: ' + info.response });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});