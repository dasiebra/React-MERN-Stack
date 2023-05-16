import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import HttpError from "../models/http-error.js";
import User from "../models/user.js";

// Get all users
export const getUsers = async (req, res, next) => {
  let users;
  try {
    // Query all users and exclude password field
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Das Abrufen der Benutzer ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }
  // Map through the users and return them as an array of objects
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

// Create a new user
export const signup = async (req, res, next) => {
  // Check for any validation errors from previous middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Ungültige Eingaben wurden übergeben, bitte überprüfe deine Daten.", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Die Registrierung ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "Der Benutzer existiert bereits, bitte melde dich stattdessen an.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    // Hash the password before storing it in the database
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Der Benutzer konnte nicht erstellt werden, bitte versuche es erneut.",
      500
    );
    return next(error);
  }

  // Create a new user object
  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    // Save the new user to the database
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Die Registrierung ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }

  let token;
  try {
    // Create a new JWT token for the user
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Die Registrierung ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};




// Function to handle user login
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Das Einloggen ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Ungültige Anmeldeinformationen, Einloggen fehlgeschlagen.",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    // Check if the provided password matches the password stored in the database for the user
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Das Einloggen ist fehlgeschlagen, bitte überprüfe deine Anmeldeinformationen und versuche es erneut.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Ungültige Anmeldeinformationen, Einloggen fehlgeschlagen.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Das Einloggen ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }

  // Return a JSON object containing user's ID, email and the token
  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};



// Define a function to handle forgot password functionality
export const forgotPassword = async (req, res, next) => {
  // Validate request body using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Ungültige Eingaben wurden übergeben, bitte überprüfe deine Daten.", 422)
    );
  }

  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Das Zurücksetzen des Passworts ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Ungültige Anmeldeinformationen, Passwort konnte nicht zurückgesetzt werden.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    // Hash the new password using bcrypt library
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Das Zurücksetzen des Passworts ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }

  let updatedUser;

  // Update the user's password in the database
  try {
    updatedUser = await User.updateOne(
      { email: email },
      { password: hashedPassword }
    );
  } catch (err) {
    const error = new HttpError(
      "Das Zurücksetzen des Passworts ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    // If there is an error while updating the user's password, return an HTTP error with a message and status code 500
    const error = new HttpError(
      "Das Zurücksetzen des Passworts ist fehlgeschlagen, bitte versuche es später erneut.",
      500
    );
    return next(error);
  }
};
