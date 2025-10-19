import jwt from "jsonwebtoken";

// Helper function to generate JWTs
export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.emailAddress },
    process.env.ACCESS_TOKEN_SECRET || 'default_access_secret',
    { expiresIn: "24h" } // 24 hours
  );

  const refreshToken = jwt.sign(
    { id: user._id, email: user.emailAddress },
    process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret',
    { expiresIn: "30d" } // 30 days
  );

  return { accessToken, refreshToken };
};