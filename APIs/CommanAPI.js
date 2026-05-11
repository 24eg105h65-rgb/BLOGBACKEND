import exp from "express";
import { UserModel } from "../models/UserModel.js";
import { hash, compare } from "bcryptjs";
import { config } from "dotenv";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middlewares/VerifyToken.js";
const { sign } = jwt;
export const commonApp = exp.Router();
import { upload } from "../config/multer.js";
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";
import cloudinary from "../config/cloudinary.js";
config();

const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
};

const jwtSecret = process.env.SECRET_KEY || process.env.JWT_SECRET;

//Route for register
commonApp.post("/users", upload.single("profileImageUrl"), async (req, res, next) => {
  let cloudinaryResult;
  try {
    let allowedRoles = ["USER", "AUTHOR", "ADMIN"];
    //get user from req
    const newUser = req.body;
    console.log(newUser);
    console.log(req.file);

    //check role
    if (!allowedRoles.includes(newUser.role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    //Upload image to cloudinary from memoryStorage
    if (req.file) {
      cloudinaryResult = await uploadToCloudinary(req.file.buffer);
    }

    // console.log("cloudinaryResult", cloudinaryResult);
    //add CDN link(secure_url) of image to newUserObj
    newUser.profileImageUrl = cloudinaryResult?.secure_url;

    //run validators manually
    //hash password and replace plain with hashed one
    newUser.password = await hash(newUser.password, 12);

    //create New user document
    const newUserDoc = new UserModel(newUser);

    //save document
    await newUserDoc.save();
    //send res
    res.status(201).json({ message: "User created" });
  } catch (err) {
    console.log("err is ", err);
    //delete image from cloudinary
    if (cloudinaryResult?.public_id) {
      await cloudinary.uploader.destroy(cloudinaryResult.public_id);
    }
    return next(err);
  }
});

//Route for Login(USER, AUTHOR and ADMIN)
commonApp.post("/login", async (req, res) => {
  //console.log(req.body)
  //get user cred obj
  const { email, password } = req.body;
  //find user by email
  const user = await UserModel.findOne({ email: email });
  //if use not found
  if (!user) {
    return res.status(400).json({ message: "error occurred", error: "Invalid email" });
  }

  if (!user.isUserActive) {
    return res.status(403).json({ message: "error occurred", error: "User blocked" });
  }
  //compare password
  const isMatched = await compare(password, user.password);
  //if passwords not matched
  if (!isMatched) {
    return res.status(400).json({ message: "Invalid password" });
  }
  if (!jwtSecret) {
    return res.status(500).json({ message: "error occurred", error: "Server misconfigured: missing JWT secret" });
  }
  //create jwt
  const signedToken = sign(
    {
      id: user._id,
      email: email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
    jwtSecret,
    {
      expiresIn: "1h",
    },
  );

  //set token to res header as httpOnly cookie
  res.cookie("token", signedToken, cookieOptions);
  //remove password from user document
  let userObj = user.toObject();
  delete userObj.password;

  //send res
  res.status(200).json({ message: "login success", payload: userObj });
});

//Route for Logout
commonApp.get("/logout", (req, res) => {
  //delete token from cookie storage
  res.clearCookie("token", cookieOptions);
  //send res
  res.status(200).json({ message: "Logout success" });
});

//Page refresh
commonApp.get("/check-auth", async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(200).json({
        message: "unauthenticated",
        authenticated: false,
        payload: null,
      });
    }

    if (!jwtSecret) {
      return res.status(200).json({
        message: "unauthenticated",
        authenticated: false,
        payload: null,
      });
    }

    const decodedToken = jwt.verify(token, jwtSecret);
    const user = await UserModel.findById(decodedToken.id);

    if (!user || !user.isUserActive) {
      res.clearCookie("token", cookieOptions);
      return res.status(200).json({
        message: "unauthenticated",
        authenticated: false,
        payload: null,
      });
    }

    return res.status(200).json({
      message: "authenticated",
      authenticated: true,
      payload: decodedToken,
    });
  } catch (err) {
    return res.status(200).json({
      message: "unauthenticated",
      authenticated: false,
      payload: null,
    });
  }
});

//Change password
commonApp.put("/password", verifyToken("USER", "AUTHOR", "ADMIN"), async (req, res) => {
  //check current password and new password are same
  //get current password of user/admin/author
  //check the current password of req and user are not same
  // hash new password
  //replace current password of user with hashed new password
  //save
  //send res
});