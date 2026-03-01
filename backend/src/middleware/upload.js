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

export const upload = multer({ storage });
