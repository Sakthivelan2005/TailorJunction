import fs from "fs";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tailorId = req.body.tailor_id;

    if (!tailorId) {
      return cb(new Error("tailor_id is required"));
    }

    const dir = path.join("src/uploads/tailors", tailorId);

    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name =
      file.fieldname === "profilePhoto" ? "profile" + ext : "shop" + ext;

    cb(null, name);
  },
});
const dressStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = (req.body.category || "misc").toLowerCase();
    const dir = path.join(process.cwd(), "src", "uploads", "images", category);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // 1. Get name and remove any accidental spaces at the start/end
    const rawName = (req.body.dress_name || "Custom_Dress").trim();

    // 2. Replace all spaces inside the name with underscores
    // "Green Chudi" becomes "Green_Chudi"
    const formattedName = rawName.replace(/\s+/g, "_");

    const ext = path.extname(file.originalname) || ".png";

    // 3. Final Output: "Green_Chudi.png"
    cb(null, `${formattedName}${ext}`);
  },
});

export const uploadDressImage = multer({
  storage: dressStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const upload = multer({ storage });
