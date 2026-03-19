import jwt from "jsonwebtoken";
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not logged in",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY);
    // console.log(decoded)
    req.user = decoded; // attach user info to request

    next(); // ✅ allow request to continue
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const protectforapp = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ (Optional) fallback for web cookies
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET_KEY
    );

    req.user = decoded;
    next();
  } catch (err) {
    console.log(err)
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
