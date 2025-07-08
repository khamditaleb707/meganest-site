const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ SECURITY HEADERS (CSP updated to allow fonts & safe inline scripts)
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "default-src": ["'self'"],
                "script-src": ["'self'", "'unsafe-inline'", "https://img1.wsimg.com"],
                "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                "font-src": ["'self'", "https://fonts.gstatic.com"],
                "img-src": ["'self'", "data:", "https://img1.wsimg.com"]
            },
        },
    })
);

// ✅ RATE LIMITING
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// ✅ FORCE HTTPS IN PRODUCTION
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

// ✅ STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// ✅ BODY PARSING
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ✅ CONTACT FORM ROUTE
app.post('/contact', async (req, res) => {
    const { name, email, phone, product, message } = req.body;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Meganest Contact Form" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New Meganest Order from ${name}`,
        html: `
            <h2>New Order Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Product:</strong> ${product}</p>
            <p><strong>Message:</strong><br>${message}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully.');
        res.redirect('/thankyou.html');
    } catch (error) {
        console.error('❌ Email failed:', error.message);
        res.status(500).send('Error sending message.');
    }
});

// ✅ 404 FALLBACK
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ✅ SERVER START
app.listen(PORT, () => {
    console.log(`🚀 Meganest site running at http://localhost:${PORT}`);
});
