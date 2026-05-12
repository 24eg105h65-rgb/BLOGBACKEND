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
    "https://blog-frontend-liard-three.vercel.app",
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

  const mongoUri = process.env.DB_URL || process.env.MONGODB_URI;
  const localFallbackUri = process.env.LOCAL_DB_URL || "mongodb://127.0.0.1:27017/blogbackend";

  if (!mongoUri) {
    throw new Error("Missing DB_URL or MONGODB_URI");
  }

  try {
    await connect(mongoUri);
    dbConnected = true;
    console.log("DB server connected");
  } catch (err) {
    console.log("err in db connect", err);

    if (process.env.NODE_ENV !== "production" && localFallbackUri && localFallbackUri !== mongoUri) {
      console.log("Attempting local MongoDB fallback...");
      try {
        await connect(localFallbackUri);
        dbConnected = true;
        console.log("Local DB server connected");
        return;
      } catch (fallbackErr) {
        console.log("Local fallback DB connection failed", fallbackErr);
        throw fallbackErr;
      }
    }

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

app.get("/", (req, res) => {
  res.status(200).json({ message: "Blog backend running" });
});

if (process.env.VERCEL !== "1") {
  const startServer = () => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`server listening on ${port}..`));
  };

  connectDB()
    .then(() => {
      startServer();
    })
    .catch((err) => {
      console.log("Warning: DB connection failed on startup, starting server anyway", err);
      startServer();
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