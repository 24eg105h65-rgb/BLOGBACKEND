import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { UserModel } from "../models/UserModel.js";
const { verify } = jwt;
config();

const jwtSecret = process.env.SECRET_KEY || process.env.JWT_SECRET;

export const verifyToken = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      //get token from cookie
      const token = req.cookies?.token; // { token : asdasd}
      //check token existed or not
      if (!token) {
        return res.status(401).json({ message: "Please login first" });
      }
      //validate token(decode the token)
      let decodedToken = verify(token, jwtSecret);

      // check the role is same as role in decodedToken
      if (!allowedRoles.includes(decodedToken.role)) {
        return res.status(403).json({ message: "You are not authorized" });
      }

      const user = await UserModel.findById(decodedToken.id);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      if (!user.isUserActive) {
        res.clearCookie("token", {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        });
        return res.status(403).json({ message: "error occurred", error: "User blocked" });
      }

      //add decoded token
      req.user = decodedToken;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

// export const verifyToken = async (req, res, next) => {
//   try {
//     //get token from cookie
//     const token = req.cookies?.token; // { token : asdasd}
//     //check token existed or not
//     if (!token) {
//       return res.status(401).json({ message: "Please login first" });
//     }
//     //validate token(decode the token)
//     let decodedToken = verify(token, process.env.SECRET_KEY);

//     // check the role is same as role in decodedToken

//     //add decoded token
//     res.user = decodedToken;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };