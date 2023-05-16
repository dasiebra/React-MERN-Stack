import express from "express";
import { check } from "express-validator";

import {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
} from "../controllers/places-controllers.js";
import fileUpload from "../middleware/file-upload.js";
import checkAuth from "../middleware/check-auth.js";


// Creates an instance of an express router
const router = express.Router();

// Handles GET requests for all places by a user ID
router.get("/:pid", getPlaceById);

router.get("/user/:uid", getPlacesByUserId);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  // Handles POST requests to create a new place
  createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  // Handles PATCH requests to update an existing place by ID
  updatePlace
);

router.delete("/:pid", deletePlace);

// Exports the express router instance for use in other files
export default router;
