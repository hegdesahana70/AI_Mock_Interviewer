const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { fullName, username, email, password, gender } = req.body;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      gender
    });

    res.status(201).json({ success: true, message: "User registered successfully", userId: newUser._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid email or password" });

    res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      userId: user._id, 
      fullName: user.fullName,
      email: user.email 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Fetch User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};