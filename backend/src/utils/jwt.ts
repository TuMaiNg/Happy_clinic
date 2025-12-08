import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload } from '../middleware/auth';

export const generateTokens = (payload: JWTPayload) => {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string, isRefresh = false): JWTPayload => {
  const secret = isRefresh ? config.jwt.refreshSecret : config.jwt.secret;
  return jwt.verify(token, secret) as JWTPayload;
};

