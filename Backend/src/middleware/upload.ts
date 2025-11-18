import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError';

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage for CSV
const csvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `csv-${uniqueSuffix}${ext}`);
  },
});

// Configure multer storage for Images
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  },
});

// File filter to only accept CSV files
const csvFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext !== '.csv') {
    return cb(new AppError('Only CSV files are allowed', 400));
  }

  cb(null, true);
};

// File filter to only accept image files
const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

  if (!allowedExts.includes(ext)) {
    return cb(new AppError('Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed', 400));
  }

  cb(null, true);
};

// Configure multer for CSV upload
export const csvUpload = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Configure multer for Image upload
export const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});
