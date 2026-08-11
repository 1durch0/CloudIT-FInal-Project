const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
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

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

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
