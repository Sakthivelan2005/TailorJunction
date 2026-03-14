import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access Denied: No Token Provided!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Strict check: Only allow users with the 'admin' role
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Admin Access Required!" });
    }

    req.user = decoded; // Contains userId and role
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or Expired Token" });
  }
};
