import exp from "express";
import { config } from "dotenv";
import { connect } from "mongoose";
import { userApp } from "./APIs/UserAPI.js";
import { authorApp } from "./APIs/AuthorAPI.js";
import { adminApp } from "./APIs/AdminAPI.js";
import { commonApp } from "./APIs/CommonAPI.js";
import cookieParser from "cookie-parser";
import cors from 'cors'
config();

let dbConnected = false;

//create express app
const app = exp();
const allowedOrigins =
  process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ||
  [
    "http://localhost:5173",
    "https://blog-application-frontend-theta.vercel.app",
  ].filter(Boolean);
// enable cors
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))
//add cookie parser middeleware
app.use(cookieParser())
//body parser middleware
app.use(exp.json());
//connect to db
const connectDB = async () => {
  if (dbConnected) {
    return;
  }

  try {
    const mongoUri = process.env.DB_URL || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("Missing DB_URL or MONGODB_URI");
    }

    await connect(mongoUri);
    dbConnected = true;
    console.log("DB server connected");
  } catch (err) {
    console.log("err in db connect", err);
    throw err;
  }
};

// In serverless environments, initialize DB lazily per request (cached by dbConnected)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

//path level middlewares
app.use("/user-api", userApp);
app.use("/author-api", authorApp);
app.use("/admin-api", adminApp);
app.use("/auth", commonApp);

if (process.env.VERCEL !== "1") {
  connectDB()
    .then(() => {
      //assign port
      const port = process.env.PORT || 4000;
      app.listen(port, () => console.log(`server listening on ${port}..`));
    })
    .catch((err) => {
      console.log("Failed to start server", err);
      process.exit(1);
    });
}

//to handle invalid path
app.use((req, res, next) => {
  console.log(req.url);
  res.status(404).json({ message: `path ${req.url} is invalid` });
});

//Error handling middleware
app.use((err, req, res, next) => {
  console.log("error is ",err)
  console.log("Full error:", JSON.stringify(err, null, 2));
  //ValidationError
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "error occurred", error: err.message });
  }
  //CastError
  if (err.name === "CastError") {
    return res.status(400).json({ message: "error occurred", error: err.message });
  }
  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];
    return res.status(409).json({
      message: "error occurred",
      error: `${field} "${value}" already exists`,
    });
  }

  //send server side error
  res.status(500).json({ message: "error occurred", error: "Server side error" });
});

export { app, connectDB };
export default app;