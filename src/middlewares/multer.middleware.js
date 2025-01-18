// import multer from "multer";

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "./public/temp")
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.originalname)
//     }
//   })
//   export const upload = multer({
//     storage, 
// })

import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "./public/temp");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); 
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueSuffix = `${timestamp}-${file.originalname}`;
    cb(null, uniqueSuffix); 
  },
});

export const upload = multer({
  storage, 
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["video/mp4", "image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true); 
  },
})