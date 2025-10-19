import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: "No token provided. Authorization header required." 
            });
        }

        // Extract token
        const accessToken = authHeader.split(' ')[1];

        // Verify accessToken
        const decodedPayload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        
        // Attach user info to request
        req.user = decodedPayload;
        
        // Proceed to next middleware/controller
        next();

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: "Token expired. Please refresh your token." 
            });
        }
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: "Invalid token signature." 
            });
        }

        console.error("Token verification error:", err);
        return res.status(401).json({ 
            message: "Authentication failed." 
        });
    }
};