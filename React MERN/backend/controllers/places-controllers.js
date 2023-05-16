import fs from "fs";
import { validationResult } from "express-validator";
import mongoose from "mongoose";

import HttpError from "../models/http-error.js";
import { getCoordsForAddress } from "../util/location.js";
import Place from "../models/place.js";
import User from "../models/user.js";


// Get a place by its ID
export const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    // Find the place in the database with the given ID
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Etwas ist schiefgegangen, der Ort konnte nicht gefunden werden.",
      500
    );
    return next(error);
  }
  // If no place was found with the given ID
  if (!place) {
    const error = new HttpError(
      "Der Ort mit der angegebenen ID konnte nicht gefunden werden.",
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};


// Get all places for a given user
export const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    // Find the user in the database with the given ID and populate the "places" field with the corresponding places
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Das Abrufen der Orte ist fehlgeschlagen, bitte versuchen Sie es später noch einmal.",
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Das Abrufen der Orte ist fehlgeschlagen, bitte versuche es später erneut.", 404)
    );
  }
  // Return the places for the user as JSON
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

export const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Ungültige Eingaben wurden übergeben, bitte überprüfe deine Daten.", 422)
    );
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Das Erstellen des Ortes ist fehlgeschlagen, bitte versuche es erneut.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Der Benutzer mit der angegebenen ID konnte nicht gefunden werden.", 404);
    return next(error);
  }

  // Use a transaction to save the new place and add it to the user's list of places
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Das Erstellen des Ortes ist fehlgeschlagen, bitte versuche es erneut.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

// Update an existing place
export const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Ungültige Eingaben wurden übergeben, bitte überprüfe deine Daten.", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Etwas ist schiefgegangen, der Ort konnte nicht aktualisiert werden.", 500)
    );
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(
      new HttpError("Etwas ist schiefgegangen, der Ort konnte nicht aktualisiert werden.", 500)
    );
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// Delete a place
export const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Etwas ist schiefgegangen, der Ort konnte nicht gelöscht werden.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Der Ort mit dieser ID konnte nicht gefunden werden.", 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "Du hast keine Berechtigung, diesen Ort zu löschen.",
      401
    );
    return next(error);
  }

  // Get the path of the image associated with the place
  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    // Remove the place from the database
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    // Commit the transaction
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Etwas ist schiefgegangen, der Ort konnte nicht gelöscht werden.",
      500
    );
    return next(error);
  }

  // Remove the image file from the file system
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Ort wurde gelöscht" });
};
