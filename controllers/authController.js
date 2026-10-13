const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
}

function getLocalUsers() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveLocalUsers(users) {
  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { fullName, username, email, password, gender } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (isMongoConnected()) {
      try {
        const newUser = await User.create({
          fullName: fullName || email.split('@')[0],
          username: username || email.split('@')[0],
          email: email.toLowerCase(),
          password: hashedPassword,
          gender: gender || 'male'
        });
        return res.status(201).json({ 
          success: true, 
          message: "User registered successfully", 
          userId: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email
        });
      } catch (dbErr) {
        console.warn('MongoDB register error, saving to local store:', dbErr.message);
      }
    }

    // Local JSON store fallback
    const users = getLocalUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Account with this email already exists" });
    }

    const newUser = {
      _id: `user-${Date.now()}`,
      fullName: fullName || email.split('@')[0],
      username: username || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      gender: gender || 'male',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveLocalUsers(users);

    return res.status(201).json({ 
      success: true, 
      message: "User registered successfully", 
      userId: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (isMongoConnected()) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (isMatch) {
            return res.status(200).json({ 
              success: true, 
              message: "Login successful", 
              userId: user._id, 
              fullName: user.fullName,
              email: user.email 
            });
          } else {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
          }
        }
      } catch (dbErr) {
        console.warn('MongoDB login error, checking local store:', dbErr.message);
      }
    }

    // Check Local JSON store
    const users = getLocalUsers();
    const localUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!localUser) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, localUser.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      userId: localUser._id, 
      fullName: localUser.fullName,
      email: localUser.email 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Fetch User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (isMongoConnected()) {
      try {
        const user = await User.findById(userId).select('-password');
        if (user) return res.status(200).json({ success: true, user });
      } catch (e) {}
    }

    const users = getLocalUsers();
    const user = users.find(u => u._id === userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { password, ...safeUser } = user;
    return res.status(200).json({ success: true, user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};