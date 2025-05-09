const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'marketing', 'finance', 'sales'], required: true },
    menuPermissions: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' } // New field
});

module.exports = mongoose.model('User', UserSchema);
