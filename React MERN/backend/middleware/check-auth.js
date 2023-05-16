import jwt from 'jsonwebtoken';
import HttpError from '../models/http-error.js';

export default function authenticate(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      throw new Error('Die Authentifizierung ist fehlgeschlagen');
    }
    const decodedToken = jwt.verify(token, 'supersecret_dont_share');
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    const httpError = new HttpError('ADie Authentifizierung ist fehlgeschlagen', 403);
    return next(httpError);
  }
}
