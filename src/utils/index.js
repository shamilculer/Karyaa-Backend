import jwt from "jsonwebtoken";

/**
 * Generate access and refresh tokens for user/vendor/admin
 * Includes role for role-based access control
 *
 * @param {Object} account - The user, vendor, or admin document
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateTokens = (account) => {
  let payload = null;

  switch (account.role) {
    case "user":
      payload = {
        id: account._id,
        username: account.username,
        role: account.role,
        email: account.emailAddress,
        profileImage: account.profileImage,
      };
      break; 

    case "vendor":
      payload = {
        id: account._id,
        businessName: account.businessName,
        businessLogo: account.businessLogo,
        role: account.role,
        email: account.email,
        slug: account.slug,
        tagline: account.tagline,
      };
      break; 

    case "admin":
      payload = {
        id: account._id,
        username: account.fullName || account.name,
        role: account.role,
        email: account.email,
        phoneNumber: account.phoneNumber,
        profileImage: account.profileImage,
        adminLevel: account.adminLevel,
        accessControl: account.accessControl
      };
      break;

    default:
      throw new Error(`Invalid account role: ${account.role}`);
  }

  // ✅ Generate tokens
  const accessToken = jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" } // ⚠️ Changed from 24h - see note below
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" }
  );

  return { accessToken, refreshToken };
};