import axios from 'axios';
import HttpError from '../models/http-error.js';


// Define a constant API_KEY that will be used to authenticate the request to the
// Google Maps Geocoding API.
const API_KEY = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';


// Define an asynchronous function called getCoordsForAddress that takes an address
// as input and returns the coordinates (latitude and longitude) for that address.
export async function getCoordsForAddress(address) {
  // Use the axios library to make an HTTP GET request to the Google Maps Geocoding API.
  // The API request URL includes the address, API_KEY, and a callback function.
  const response = await axios.get(
    
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}&callback=Function.prototype`
  );



  const data = response.data;

  if (!data || data.status === 'ZERO_RESULTS') {
    const error = new HttpError(
      'Could not find location for the specified address.',
      422
    );
    throw error;
  }

  // If the API request returned valid data, extract the coordinates (latitude and longitude)
  // from the response data and return them.
  const coordinates = data.results[0].geometry.location;

  return coordinates;
}
