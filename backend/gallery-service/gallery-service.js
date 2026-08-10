const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

let images = require("./images.json");

const PORT = process.env.PORT || 3001;

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/images", (req, res) => {
  res.json(images);
});

app.post("/api/images", async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;

    if (!title || !imageUrl) {
      return res
        .status(400)
        .json({ message: "Title and imageUrl are required" });
    }

    const newImage = {
      id: images.length + 1,
      title,
      description: description || "",
      imageUrl,
    };

    images.push(newImage);

    const filePath = path.join(__dirname, "images.json");
    await fs.writeFile(filePath, JSON.stringify(images, null, 2), "utf-8");

    return res.status(201).json({ message: "Image added", image: newImage });
  } catch (error) {
    console.error("Error saving image:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`gallery-service running on http://localhost:${PORT}`);
});
