import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided. Authorization header required." });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Token expired. Please refresh your token." });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token signature or format." });
      }
      throw err; // unexpected error
    }

    req.user = decoded;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access forbidden. User is not authorized as an Admin." });
    }

    next();
  } catch (err) {
    console.error("Admin verification error:", err);
    return res.status(500).json({ message: "Authentication failed due to a server error." });
  }
};
