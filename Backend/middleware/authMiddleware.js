import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User account not found",
          code: "USER_NOT_FOUND",
        });
      }

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        });
      }
      if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
        return res.status(401).json({
          success: false,
          message: "Not Authorized",
          code: "INVALID_TOKEN",
        });
      }
      console.error("[Auth Middleware Error]:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error during authentication verification",
        code: "AUTH_SERVER_ERROR",
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: "No Token",
      code: "NO_TOKEN",
    });
  }
};

export default protect;