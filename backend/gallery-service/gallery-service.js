const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const app = express();
app.use(helmet());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const containerName = "images";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(containerName);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "jpe", "png", "gif", "webp", "avif"]);

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

function normalizeExt(ext) {
  const map = { jpeg: "jpg", jpe: "jpg", jpg: "jpg" };
  return map[ext] || ext;
}

function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  )
    return "png";

  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38)
    return "gif";

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return "webp";

  const brand = buffer.subarray(4, 12).toString("latin1");
  if (brand.startsWith("ftyp") && (brand.slice(4, 8) === "avif" || brand.slice(4, 8) === "avis"))
    return "avif";

  return null;
}

function sanitizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return ipKeyGenerator(req.ip, 56);
}

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many uploads, please try again later" },
  keyGenerator: clientIp,
});

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

app.post("/api/images", uploadLimiter, upload.single("image"), async (req, res) => {
  try {
    const title = sanitizeText(req.body.title, MAX_TITLE_LENGTH);
    const description = sanitizeText(req.body.description, MAX_DESCRIPTION_LENGTH);

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = safeName.toLowerCase().split(".").pop();
    const detected = detectImageType(req.file.buffer);

    if (
      !ALLOWED_EXTENSIONS.has(ext) ||
      detected === null ||
      detected !== normalizeExt(ext) ||
      !req.file.mimetype.startsWith("image/")
    ) {
      return res.status(415).json({
        message: "Invalid or unsupported image file. Allowed types: JPG, PNG, GIF, WEBP, AVIF",
      });
    }

    const blobName = `${Date.now()}-${safeName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: CONTENT_TYPES[detected] },
    });

    const image = await Image.create({
      title,
      description: description || "",
      imageUrl: blockBlobClient.url,
    });

    return res.status(201).json({ message: "Image added", image });
  } catch (error) {
    console.error("Error saving image:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large (max 5 MB)" });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: "Invalid request" });
  }
  next();
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
