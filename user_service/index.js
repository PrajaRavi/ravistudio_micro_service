// Import necessary modules
import express from "express";
import cors from "cors";
import fs from "fs"; // NEW
import dotenv from "dotenv";
// exec - Needed to execute command in shell


import { UserModel } from "./Models/User.model.js";
import multer from "multer";
import { protect, protectforapp } from "./Middlewares/Toke.auth.js";
import { DBConnect } from "./Config/connection1.config.js";
import { UserRouter } from "./Routes/user.route.js";
import cookieParser from "cookie-parser";


dotenv.config();
// Set up port, defaulting to 2000 if not specified in environment
const port = 4500;

// Initialize Express application
const app = express();
DBConnect();

// Enable CORS for all routes
app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:4173","http://192.168.1.155:8081","http://localhost:8081"],
    credentials: true,
  }),
);

// Parse JSON and URL-encoded bodiesk
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

app.use(express.static("./Images/Profile"));

// creating roots
app.use("/user", UserRouter);
let dt=new Date()

// Serve HLS output files statically (NEW)
const Storage = multer.diskStorage({
  // DESTINATION MEANS ALL ABOUT THAT WHERE WE HAVE TO SAVE OUR FILES
  destination: function (req, file, cb) {
    cb(null, `./Images/Profile`);
  },
  //HERE FILENAME MEANS IT IS ALL ABOUT WHAT WILL BE NAME OF OUR FILE
  filename: function (req, file, cb) {
    cb(null, `${Date.now().toString()}UserProfile.png`); //file.originalname.split('.').pop() it will basically remove all the sentance before . means at 0th position
  },
});

const upload = multer({ storage: Storage });


// Define route for video upload




 


const UpdateUserLangFun=async (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        msg: "Language is required",
      });
    }

    const userId = req.user.id; // from protect middleware

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { language },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      msg: "Language updated successfully",
      language: user.language,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Something went wrong",
    });
  }
}
// app.get("/get-all-user-playlist",protect,getAllUserPlaylist)
// app.get("/get-all-user-playlist-for-app",protectforapp,getAllUserPlaylistForApp)
app.post("/update-user-language", protect,UpdateUserLangFun);
app.post("/update-user-language-for-app", protectforapp,UpdateUserLangFun);

const updateProfileImage = async (req, res) => {
  try {
    // 1️⃣ Check file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: "Profile image is required",
      });
    }

    // 2️⃣ User ID from protect middleware
    const userId = req.user.id;
    console.log(userId)

    // 3️⃣ Update user
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { profileImage: req.file.filename },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    // 4️⃣ Success response
    res.status(200).json({
      success: true,
      msg: "Profile image updated successfully",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      msg: "Something went wrong",
    });
  }
};
const updateProfileImageForApp = async (req, res) => {
  try {
    // 1️⃣ Check file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: "Profile image is required",
      });
    }

    // 2️⃣ User ID from protect middleware
    const userId = req.params.id;
    console.log(userId)

    // 3️⃣ Update user
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { profileImage: req.file.filename },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    // 4️⃣ Success response
    res.status(200).json({
      success: true,
      msg: "Profile image updated successfully",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      msg: "Something went wrong",
    });
  }
};

app.post("/update-profile-image",upload.single("Profile"), protect, updateProfileImage);
app.post("/update-DP/:id",upload.single("Profile"), updateProfileImageForApp);

// executing a single command








app.listen(port, () => {
  console.log(`Server is running at ${port} of ${process.env.App_name}`);
});
