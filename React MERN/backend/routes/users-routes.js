import express from "express";
import { check } from "express-validator";


import {
  getUsers,
  signup,
  login,
  forgotPassword,
} from "../controllers/users-controllers.js";
import fileUpload from "../middleware/file-upload.js";

const router = express.Router();

router.get("/", getUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").notEmpty(),
    check('email').normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signup
);

router.post("/login", login);

router.patch(
  "forgot-password",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  forgotPassword
);

export default router;
