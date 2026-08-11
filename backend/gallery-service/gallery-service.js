const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const imageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Image = mongoose.model("Image", imageSchema);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/images", async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/images", async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;

    if (!title || !imageUrl) {
      return res
        .status(400)
        .json({ message: "Title and imageUrl are required" });
    }

    const image = await Image.create({
      title,
      description: description || "",
      imageUrl,
    });

    return res.status(201).json({ message: "Image added", image });
  } catch (error) {
    console.error("Error saving image:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

async function seed() {
  const count = await Image.countDocuments();
  if (count > 0) return;

  await Image.insertMany([
    {
      title: "Sunset over the lake",
      description: "A warm summer evening at the water.",
      imageUrl: "https://picsum.photos/seed/sunset/400/300",
    },
    {
      title: "City skyline",
      description: "Downtown seen from the bridge.",
      imageUrl: "https://picsum.photos/seed/city/400/300",
    },
  ]);

  console.log("Seeded sample images");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("gallery-service connected to MongoDB");
    await seed();
    app.listen(PORT, () => {
      console.log(`gallery-service running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
