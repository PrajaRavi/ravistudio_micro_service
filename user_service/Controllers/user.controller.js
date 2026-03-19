import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { transporter } from "../utilities/transporter.utility.js";


import { UserModel } from "../Models/User.model.js";
export const SignUp = async (req, res) => {
  try {
    const { firstName, lastName, dob, email, password, contact } = req.body;

    // 1. Validation Check
    if (!firstName || !lastName || !dob || !email || !password || !contact) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    /* ---------- AGE CALCULATION ---------- */
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    if (age < 15) {
      return res.status(400).json({
        success: false,
        msg: "Your age should be greater than 15",
      });
    }

    /* ---------- PASSWORD HASH ---------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------- PROFILE AVATAR ---------- */
    const profileImage = ` `;

    /* ---------- OTP ---------- */
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    /* ---------- CREATE USER ---------- */
    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      contact,
      age,
      profileImage,
      verifyOtp: hashedOtp,
      verifyOtpExpiresAt: Date.now() + 5 * 60 * 1000,
    });

    /* ---------- SEND EMAIL ---------- */
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });

    return res.status(201).json({
      success: true,
      msg: "Signup successful. Please verify your email.",
    });

  } catch (error) {
    /* ---------- ERROR HANDLING ---------- */
    // Duplicate Key Error (MongoDB code 11000)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        msg: "User already exists" 
      });
    }

    // General Errors
    return res.status(500).json({
      success: false,
      msg: error.message || "Internal Server Error",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1. Validation Check
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        msg: "Email and OTP are required" 
      });
    }

    // 2. Find user
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        msg: "User not found" 
      });
    }

    // 3. Already verified
    if (user.isAccountVerified) {
      return res.status(400).json({ 
        success: false, 
        msg: "Account already verified" 
      });
    }

    // 4. OTP expired
    if (user.verifyOtpExpiresAt < Date.now()) {
      return res.status(410).json({ 
        success: false, 
        msg: "OTP has expired" 
      });
    }

    // 5. Hash incoming OTP and Compare
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
    if (hashedOtp !== user.verifyOtp) {
      return res.status(401).json({ 
        success: false, 
        msg: "Invalid OTP" 
      });
    }

    // 6. Verify account & Clear OTP fields
    user.isAccountVerified = true;
    user.verifyOtp = undefined;
    user.verifyOtpExpiresAt = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      msg: "Email verified successfully",
    });

  } catch (error) {
    /* ---------- ERROR HANDLING ---------- */
    return res.status(500).json({
      success: false,
      msg: error.message || "Internal Server Error",
    });
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Email and password required",
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "User Not found",
      });
    }
    // if(user.DOB)
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials",
      });
    }

    if (!user.isAccountVerified) {
      return res.status(403).json({
        success: false,
        msg: "Please verify your account first",
      });
    }

    // 🔑 Short-lived access token
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET_KEY,
      {
        expiresIn: "15m",
      },
    );

    // 🔄 Long-lived refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: "7d" },
    );

    // Store refresh token (optional but recommended)
    user.refreshToken = refreshToken;
    await user.save();

    // 🍪 Send tokens in cookies
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        msg: "Login successful",
        email: user.email,
      });
  } catch (error) {
    console.log(error)
    return res.send({ success: false, msg: error });
  }
};

export const loginforapp = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Email and password required",
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "User Not found",
      });
    }
    // if(user.DOB)
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials",
      });
    }

    if (!user.isAccountVerified) {
      return res.status(403).json({
        success: false,
        msg: "Please verify your account first",
      });
    }


    // 🔑 Short-lived access token
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET_KEY,
      {
        expiresIn: "15m",
      },
    );

    // 🔄 Long-lived refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: "7d" },
    );

    // Store refresh token (optional but recommended)
    user.refreshToken = refreshToken;
    await user.save();

    // 🍪 Send tokens in cookies
    res.send({
        success: true,
        msg: "Login successful",
        email: user.email,
        accessToken,
        refreshToken,

      });
  } catch (error) {
    console.log(error)
    return res.send({ success: false, msg: error });
  }
};

export const refreshAccessToken = async (req, res) => {
  // console.log(req.cookies)
  const refreshToken = req.cookies.refreshToken;
  // console.log(req.cookies);
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      msg: "Login again",
    });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY,
    );

    const user = await UserModel.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        msg: "Invalid refresh token",
      });
    }

    const newAccessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET_KEY,
      { expiresIn: "15m" },
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.send({ success: true, msg: "refreshed successfully"});
  } catch (err) {
    console.log(err)
    return res.status(403).json({
      success: false,
      msg: "Refresh token expired",
    });
  }
};
export const refreshAccessTokenForApp = async (req, res) => {
   let refreshToken;

    // 1️⃣ Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      refreshToken = req.headers.authorization.split(" ")[1];
    }
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      msg: "Login again",
    });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY,
    );
    const user = await UserModel.findById(decoded.id);
    console.log(user.refreshToken)
    console.log(refreshToken)
    if (!user || user.refreshToken !== refreshToken) {
      console.log("invalid refresh token")
      return res.status(403).json({
        success: false,
        msg: "Invalid refresh token",
      });
    }

    const newAccessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET_KEY,
      { expiresIn: "15m" },
    );
const newrefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: "30d" },
    );

   
    console.log("refresh")
    res.send({ success: true, msg: "refreshed successfully",newAccessToken,newrefreshToken });
  } catch (err) {
    console.log(err)
    return res.status(403).json({
      success: false,
      msg: "Refresh token expired",
    });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await UserModel.updateOne({ refreshToken }, { $set: { refreshToken: "" } });
  }

  res.clearCookie("accessToken").clearCookie("refreshToken").json({
    success: true,
    msg: "Logged out successfully",
  });
};

export const getLoggedInUser = async (req, res, next) => {
  try {
    const userId = req.user.id; // from protectforapp middleware

    const user = await UserModel.findById(userId).select(
      "-password -refreshToken -verifyotp -resetOtp",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, msg: "Email required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    if (user.isAccountVerified) {
      return res
        .status(400)
        .json({ success: false, msg: "User already verified" });
    }

    // 🔑 Generate new OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // 🔒 Hash OTP
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // ✅ Save OTP + expiry in DB
    user.verifyOtp = hashedOtp;
    user.verifyOtpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    // ✉️ Send OTP via email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "OTP Verification - Resend",
      text: `Hello ${user.firstName},\n\nYour OTP for account verification is: ${otp}\nThis OTP will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      msg: "OTP resent successfully. Please check your email.",
    });
  } catch (error) {
    return res.send({ success: false, msg: error });
  }
};

export const updateProfileImage = async (req, res) => {
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
    res.status(500).json({
      success: false,
      msg: "Something went wrong",
    });
  }
};

export const UpdateUserLang = async (req, res, next) => {
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
};

export const addToFavourites = async (req, res, next) => {
  try {
    const userId = req.user.id;       // from protect middleware
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({
        success: false,
        msg: "Song ID is required",
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { favoriteSongs: songId }, // 👈 NO DUPLICATES
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Song added to favourites",
      favourites: updatedUser.FavSongData,
    });
  } catch (error) {
    return res.send({success:false,msg:"error in favourite song post"})
  }
};

export const GetFavouriteSongId=async(req,res,next)=>{
  const userId = req.user.id;       // from protect middleware
    
  try {

    let data=await UserModel.findById(userId);
    if(data){
      return res.send({success:true,msg:data.favoriteSongs})
    }
  } catch (error) {
    return res.send({success:false,msg:"error in Getting favourite song"})
    
  }
  
}

export const UpdateUser=async(req,resp)=>{
  try {
    let {firstName,lastName,contact,email}=req.body;
    let userId=req.user.id
    let data=await UserModel.findOneAndUpdate({_id:userId},{$set:{
      firstName,lastName,contact,email
    }})
    if(data) return resp.send({success:true,msg:"successfully updated"})
  } catch (error) {
    console.log(error)
    return resp.send({success:false,msg:"error in updating user"})
    
  }
}

export const GetAllUser=async(req,resp)=>{
  let page=req.query.page||1;
  let limit=req.query.limit||9;
  try {
    let data=await UserModel.find()
    .skip(page-1)
    .limit(limit)
    .lean();
    if(data) return resp.status(200).json({success:true,msg:"successfully fetched",users:data})
  } catch (error) {
    console.log(error)
    return resp.status(500).json({success:false,msg:"error in collecting all user"})
    
  }
}
export const PushLastSongPlayedByUser=async(req,resp)=>{
  try {
      const userId = req.user.id;       // from protect middleware
      if(!userId){
        return resp.status(400).send({success:false,msg:"you are not loged in"})
      }
      let data=await UserModel.updateOne({_id:userId},{
        $set:{Lastsongplayed:req.params.id}
      })
      if(data){
        return resp.status(200).send({success:true,msg:"succesfully aur kya "})
      }
    
  } catch (error) {
    console.log(error)
    console.log("error in pushing the lastsongplayed by user")
    
  }
}

export const GetLastPlayedSong=async(req,resp)=>{
  try {
     const userId = req.user.id;       // from protect middleware
    //  console.log(req.params.id)
      if(!userId){
        return resp.status(400).send({success:false,msg:"you are not loged in"})
      }
      let data=await SongModel.find({_id:req.params.id})
      if(data){
        console.log(data)
        return resp.status(200).json({success:true,msg:data})
      }

     
  } catch (error) {
     console.log(error)
    console.log("error in fetching the lastsongplayed by user")
  }
}

export const PostSongQuality=async(req,resp)=>{
  try {
     const userId = req.user.id;       // from protect middleware
     const SongQuality=req.body.SongQuality
     let data=await UserModel.updateOne({_id:userId},{$set:{SongQuality}})
     if(data)
      return resp.status(200).send({success:true,msg:"successfull!!"})
    
  } catch (error) {
    console.log(error)
    console.log("error in posting the song quality of user")
    return resp.status(500).send({success:false,msg:"error during posting the song quality"})
  }
}

export async function SendResetPasswordOTP(req, resp) {
  const { email } = req.body;

  if (!email) {
    return resp.status(400).send({ success: false, msg: "Please provide an email address" });
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() }); // Use lowercase for consistency

    // Security Note: You might want to return 'success: true' even if user doesn't exist 
    // to prevent email enumeration, but 404/403 is standard for many apps.
    if (!user) {
      return resp.status(404).send({ success: false, msg: "No account found with this email" });
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set Expiry (5 minutes)
    const otpExpiresAt = Date.now() + 5 * 60 * 1000;

    // Save OTP to User document
    await UserModel.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          resetOtp: otp,
          resetOtpExpiresAt: otpExpiresAt,
        },
      }
    );

    // Prepare Email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Reset Your Password - Music App",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Use the code below to proceed:</p>
          <h1 style="color: #3fa9f5; letter-spacing: 5px;">${otp}</h1>
          <p>This code <b>expires in 5 minutes</b>.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    // Send Mail
    await transporter.sendMail(mailOptions);

    // Return a CLEAN success response
    return resp.status(200).send({ 
      success: true, 
      msg: "OTP sent successfully to your email" 
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return resp.status(500).send({ 
      success: false, 
      msg: "An internal server error occurred. Please try again later." 
    });
  }
}

export async function ResetUserPassword(req, resp) {
  const { email, NewPassword, otp } = req.body;

  // 1. Validation check (400 Bad Request)
  if (!email || !NewPassword || !otp) {
    return resp.status(400).send({ 
      success: false, 
      message: "All fields (email, new password, and OTP) are required" 
    });
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

    // 2. User Existence check (404 Not Found)
    if (!user) {
      return resp.status(404).send({ success: false, message: "User not found" });
    }

    // 3. OTP Presence & Validity check (400 Bad Request)
    // We check if resetOtp exists in DB to prevent reset logic if no OTP was requested
    if (!user.resetOtp || user.resetOtp !== String(otp)) {
      return resp.status(400).send({ success: false, message: "Invalid OTP" });
    }

    // 4. Expiry check (410 Gone or 400)
    if (user.resetOtpExpiresAt < Date.now()) {
      return resp.status(400).send({ success: false, message: "OTP has expired" });
    }

    // 5. Hashing & Updating (Use Async for better performance)
    const saltRounds = 10;
    const hashedPass = await bcrypt.hash(NewPassword, saltRounds);

    await UserModel.updateOne(
      { email: user.email },
      {
        $set: {
          password: hashedPass,
          resetOtp: "",           // Clear the OTP so it can't be reused
          resetOtpExpiresAt: 0,   // Reset the timer
        },
      }
    );

    // 6. Success Response (200 OK)
    return resp.status(200).send({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return resp.status(500).send({ 
      success: false, 
      message: "Internal server error during password reset" 
    });
  }
}