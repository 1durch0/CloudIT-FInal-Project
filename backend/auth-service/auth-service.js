const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const app = express();
app.use(helmet());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return ipKeyGenerator(req.ip, 56);
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
  keyGenerator: clientIp,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many registration attempts, please try again later" },
  keyGenerator: clientIp,
});

app.post("/api/register", registerLimiter, async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!name || name.length > 50) {
      return res
        .status(400)
        .json({ message: "Name is required (max 50 characters)" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }
    if (password.length < 8 || password.length > 72) {
      return res
        .status(400)
        .json({ message: "Password must be 8-72 characters long" });
    }

    const user = await User.create({ name, email, password });

    return res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }
    console.error("Error saving user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const email =
    typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  return res.json({
    message: "Login successful",
    user: { id: user._id, name: user.name, email: user.email },
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

async function seed() {
  const count = await User.countDocuments();
  if (count > 0) return;

  await User.insertMany([
    {
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      password: "secret",
    },
    { name: "Bob Smith", email: "bob.smith@example.com", password: "12345" },
    {
      name: "Charlie Davis",
      email: "charlie.davis@example.com",
      password: "bliblablub",
    },
    {
      name: "Diana Prince",
      email: "diana.prince@example.com",
      password: "mehrzweckeier",
    },
  ]);

  console.log("Seeded sample users");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("auth-service connected to MongoDB");
    await seed();
    app.listen(PORT, () => {
      console.log(`auth-service running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
