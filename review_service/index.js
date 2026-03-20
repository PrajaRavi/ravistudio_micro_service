// Import necessary modules
import express from "express";
import cors from "cors";
import fs from "fs"; // NEW
import dotenv from "dotenv";
// exec - Needed to execute command in shell
import { exec } from "child_process"; // NEW
import path from "path"; // NEW

// for audio transcoding
import { parseFile } from "music-metadata";

import { protect, protectforapp } from "./Middlewares/Toke.auth.js";
import { DBConnect } from "./Config/connection1.config.js";
import { ContactRouter } from "./Routes/contact.route.js";
import { ReviewRouter } from "./Routes/Review.route.js";
import morgan from "morgan";

let UploadedAudioPath = ""

dotenv.config();
// Set up port, defaulting to 2000 if not specified in environment
const port =  3000;

// Initialize Express application
const app = express();
DBConnect();

app.use(morgan("dev"))

app.use
// Enable CORS for all routes
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173", "http://192.168.1.155:8081", "http://localhost:8081"],
    credentials: true,
  }),
);
// Parse JSON and URL-encoded bodiesk
app.use(express.json());

// creating roots
app.use("/contact", ContactRouter);
app.use("/review", ReviewRouter);
let dt = new Date()

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});









