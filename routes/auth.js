const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // app password (not your Gmail password)
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Email send error:", error);
  }
};


// Signup Route
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, role });
        await user.save();

        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Route
// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // ⛔ Only check status for non-admin users
        if (user.role !== 'admin' && user.status !== 'accepted') {
            return res.status(403).json({ message: 'Your account is not yet accepted or has been rejected' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                menuPermissions: user.menuPermissions
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/', async (req, res) => {
    try {
      const users = await User.find({ role: { $ne: 'admin' } });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  // Add this to the end of your routes/auth.js
router.post('/updateMenuPermissions', async (req, res) => {
    const { userId, menuPermissions } = req.body;
    try {
      await User.findByIdAndUpdate(userId, { menuPermissions });
      res.status(200).json({ message: 'Permissions updated successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to update permissions' });
    }
  });
  
//   router.post('/acceptUser', async (req, res) => {
//     const { userId } = req.body;
//     try {
//         const user = await User.findById(userId);
//         if (!user) return res.status(404).json({ message: 'User not found' });

//         user.status = 'accepted'; // Set status to accepted
//         await user.save();

//         res.status(200).json({ message: 'User accepted' });
//     } catch (err) {
//         res.status(500).json({ message: 'Error accepting user' });
//     }
// });

router.post('/acceptUser', async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.status = 'accepted';
        await user.save();

        await sendEmail(
            user.email,
            "Access Granted - Digital Portal",
            "Congratulations! Your account has been accepted. You can now access the portal."
        );

        res.status(200).json({ message: 'User accepted' });
    } catch (err) {
        res.status(500).json({ message: 'Error accepting user' });
    }
});


// Reject user (Admin action)
// router.post('/rejectUser', async (req, res) => {
//     const { userId } = req.body;
//     try {
//         const user = await User.findById(userId);
//         if (!user) return res.status(404).json({ message: 'User not found' });

//         user.status = 'rejected'; // Set status to rejected
//         await user.save();

//         res.status(200).json({ message: 'User rejected' });
//     } catch (err) {
//         res.status(500).json({ message: 'Error rejecting user' });
//     }
// });

router.post('/rejectUser', async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.status = 'rejected';
        await user.save();

        await sendEmail(
            user.email,
            "Access Revoked - Digital Portal",
            "Your access to the portal has been revoked or denied. Please contact yajasmenon2913@gmail.com for further assistance."
        );

        res.status(200).json({ message: 'User rejected' });
    } catch (err) {
        res.status(500).json({ message: 'Error rejecting user' });
    }
});


module.exports = router;
