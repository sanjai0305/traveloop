import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Journal from "../models/Journal.js";
import Flight from "../models/Flight.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isValidEmail, isValidPhone, isStrongPassword } from "../utils/validators.js";
import { sendWelcomeEmail } from "../services/emailService.js";



// GENERATE TOKEN
const generateToken = (id) => {

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};




// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      country,
      additionalInfo,
      password,
      acceptedTerms,
      termsVersion,
      firebaseUid,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !city || !country || !password) {
      return res.status(400).json({
        success: false,
        message: "All registration fields (firstName, lastName, email, phone, city, country, password) are required for email accounts",
      });
    }

    if (acceptedTerms !== true || termsVersion !== "2026-06") {
      return res.status(400).json({
        success: false,
        message: "You must accept the Terms & Conditions and Privacy Policy to register.",
      });
    }

    // Email format validation
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Phone validation
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number (7-15 digits, numeric).",
      });
    }

    // Password strength check
    const pwdStrength = isStrongPassword(password);
    if (!pwdStrength.valid) {
      return res.status(400).json({
        success: false,
        message: pwdStrength.message,
      });
    }

    // CHECK EXISTING USER
    const userExists = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CREATE USER
    const user = await User.create({
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      phone,
      city,
      country,
      additionalInfo,
      password: hashedPassword,
      acceptedTerms: true,
      termsAcceptedAt: new Date(),
      termsVersion: "2026-06",
      firebaseUid: firebaseUid || "",
    });

    // Send welcome email (async)
    try {
      sendWelcomeEmail(user.email, user.firstName);
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }

    // RESPONSE
    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        additionalInfo: user.additionalInfo,
        acceptedTerms: user.acceptedTerms,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
        firebaseUid: user.firebaseUid,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password, firebaseUid } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // FIND USER
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email",
      });
    }

    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    // Update lastLogin & firebaseUid if provided and not already set
    user.lastLogin = new Date();
    if (firebaseUid && !user.firebaseUid) {
      user.firebaseUid = firebaseUid;
    }
    await user.save();

    // SUCCESS
    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        additionalInfo: user.additionalInfo,
        acceptedTerms: user.acceptedTerms,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
        firebaseUid: user.firebaseUid,
        lastLogin: user.lastLogin,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET CURRENT USER PROFILE
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Streak check & update
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (!user.lastActiveDate) {
      user.streak = 1;
      user.lastActiveDate = today;
      user.xp = (user.xp || 0) + 10;
      user.level = Math.floor(user.xp / 100) + 1;
      await user.save();
    } else if (user.lastActiveDate === yesterday) {
      user.streak = (user.streak || 0) + 1;
      user.lastActiveDate = today;
      user.xp = (user.xp || 0) + 10;
      user.level = Math.floor(user.xp / 100) + 1;
      await user.save();
    } else if (user.lastActiveDate !== today) {
      user.streak = 1;
      user.lastActiveDate = today;
      await user.save();
    }

    // Fetch user trips
    const userTrips = await Trip.find({
      $or: [
        { user: user._id },
        { owner: user._id },
        { "collaborators.userId": user._id }
      ]
    });
    const tripCount = userTrips.length;
    const tripIds = userTrips.map(t => t._id);

    // Check if they have collaborators
    const hasCollaborators = await Trip.exists({
      $or: [
        { owner: user._id, "collaborators.0": { $exists: true } },
        { "collaborators.userId": user._id }
      ]
    });

    // Check if they have added expenses
    const hasExpenses = await Trip.exists({
      $or: [
        { user: user._id },
        { owner: user._id },
        { "collaborators.userId": user._id }
      ],
      "expenseItems.paidBy": user._id
    });

    // Check if they have journal entries
    const hasJournal = await Journal.exists({ trip: { $in: tripIds } });

    // Check if they have flights
    const hasFlight = await Flight.exists({ trip: { $in: tripIds } });

    // Evaluate which achievements are unlocked
    const unlockedList = [];
    if (tripCount >= 1) unlockedList.push("First Trip Created");
    if (tripCount >= 5) unlockedList.push("Explorer");
    if (tripCount >= 10) unlockedList.push("Planner Pro");
    if (hasCollaborators) unlockedList.push("Collaboration Pro");
    if (hasExpenses) unlockedList.push("Budget Master");
    if (hasJournal) unlockedList.push("Journal Keeper");
    if (hasFlight) unlockedList.push("Flight Tracker");
    if (user.achievements?.includes("Chat Starter")) unlockedList.push("Chat Starter");

    // Sync user model achievements array
    let updatedAchievements = user.achievements || [];
    let modified = false;
    for (const ach of unlockedList) {
      if (!updatedAchievements.includes(ach)) {
        updatedAchievements.push(ach);
        modified = true;
      }
    }
    if (modified) {
      user.achievements = updatedAchievements;
      await user.save();
    }

    const achievements = [
      {
        title: "First Trip Created",
        description: "Created your first trip",
        icon: "🏆",
        unlocked: tripCount >= 1
      },
      {
        title: "Explorer",
        description: "Created 5 trips",
        icon: "🏆",
        unlocked: tripCount >= 5
      },
      {
        title: "Planner Pro",
        description: "Created 10 trips",
        icon: "🏆",
        unlocked: tripCount >= 10
      },
      {
        title: "Collaboration Pro",
        description: "Collaborate on a trip",
        icon: "🏆",
        unlocked: !!hasCollaborators
      },
      {
        title: "Budget Master",
        description: "Logged your first expense",
        icon: "🏆",
        unlocked: !!hasExpenses
      },
      {
        title: "Journal Keeper",
        description: "Created a journal entry",
        icon: "🏆",
        unlocked: !!hasJournal
      },
      {
        title: "Flight Tracker",
        description: "Tracked your first flight",
        icon: "🏆",
        unlocked: !!hasFlight
      },
      {
        title: "Chat Starter",
        description: "Sent your first chat message",
        icon: "🏆",
        unlocked: user.achievements?.includes("Chat Starter")
      }
    ];

    res.json({
      success: true,
      user,
      achievements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GOOGLE SIGN IN / UP
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "idToken is required" });
    }

    // Verify token with Google's tokeninfo API
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const verifyRes = await fetch(verifyUrl);
    
    if (!verifyRes.ok) {
      return res.status(400).json({ success: false, message: "Invalid Google ID token" });
    }

    const data = await verifyRes.json();
    
    // Safety check: verify Google client ID if configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && data.aud !== clientId) {
      return res.status(400).json({ success: false, message: "Google Client ID mismatch" });
    }

    const { sub, email, name, picture } = data;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email not provided by Google account" });
    }

    // Search user by googleId
    let user = await User.findOne({ googleId: sub });
    
    if (!user) {
      // Check if email already registered with email/password
      user = await User.findOne({ email });
      if (user) {
        // Link Google provider to existing account
        user.googleId = sub;
        user.avatar = picture || user.avatar;
        user.authProvider = "google";
        await user.save();
      } else {
        // Create new Google User without password
        const nameParts = name ? name.split(" ") : ["Google", "User"];
        const firstName = nameParts[0] || "Google";
        const lastName = nameParts.slice(1).join(" ") || "User";

        user = await User.create({
          firstName,
          lastName,
          email,
          googleId: sub,
          avatar: picture || "",
          authProvider: "google",
          acceptedTerms: true,
          termsAcceptedAt: new Date(),
          termsVersion: "2026-06",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Google Authentication Successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        avatar: user.avatar || "",
        authProvider: user.authProvider || "email",
        acceptedTerms: user.acceptedTerms,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
      },
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// ACCEPT TERMS & CONDITIONS
export const acceptTerms = async (req, res) => {
  try {
    const { termsVersion } = req.body;
    if (termsVersion !== "2026-06") {
      return res.status(400).json({
        success: false,
        message: "Invalid terms version.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.acceptedTerms = true;
    user.termsAcceptedAt = new Date();
    user.termsVersion = termsVersion;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Terms accepted successfully.",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        avatar: user.avatar || "",
        authProvider: user.authProvider || "email",
        acceptedTerms: user.acceptedTerms,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
      },
    });
  } catch (error) {
    console.error("Accept Terms Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email address." });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified. Proceed with password reset.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// VALIDATE EMAIL AVAILABILITY
export const validateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    return res.status(200).json({
      success: true,
      message: "Email is available.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};