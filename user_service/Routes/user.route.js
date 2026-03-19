import express from "express";
import {
  addToFavourites,
  GetAllUser,
  GetFavouriteSongId,
  GetLastPlayedSong,
  getLoggedInUser,
  login,
  loginforapp,
  logout,
  PostSongQuality,
  PushLastSongPlayedByUser,
  refreshAccessToken,
  refreshAccessTokenForApp,
  resendOtp,
  ResetUserPassword,
  SendResetPasswordOTP,
  SignUp,
  UpdateUser,
  verifyOtp,
} from "../Controllers/user.controller.js";
import { protect, protectforapp } from "../Middlewares/Toke.auth.js";
export const UserRouter = express.Router();

UserRouter.post("/login", login);
UserRouter.post("/loginforapp", loginforapp);
UserRouter.post("/signup", SignUp);
UserRouter.post("/verifyotp", verifyOtp);
UserRouter.post("/refresh-token", refreshAccessToken);
UserRouter.post("/refresh-token-for-app",refreshAccessTokenForApp);
UserRouter.post("/logout", logout);
UserRouter.get("/me", protect, getLoggedInUser);
UserRouter.get("/meforapp", protectforapp, getLoggedInUser);
UserRouter.post("/resend-otp", resendOtp);
UserRouter.post("/add-favourite-song", protect, addToFavourites);
UserRouter.post("/add-favourite-song-for-app", protectforapp, addToFavourites);
UserRouter.get("/get-favourite-songId", protect, GetFavouriteSongId);
UserRouter.post("/updateuser", protect, UpdateUser);
UserRouter.post("/updateuser-for-app", protectforapp, UpdateUser);
UserRouter.post("/SendResetPassOTP", SendResetPasswordOTP);
UserRouter.post("/ResetUserPassword", ResetUserPassword);
UserRouter.get("/get-all-user", protect, GetAllUser);
UserRouter.post("/post-last-song-played-by-user-for-app/:id",protectforapp,PushLastSongPlayedByUser)
UserRouter.post("/post-last-song-played-by-user/:id",protect,PushLastSongPlayedByUser)
UserRouter.get("/get-last-played-song-for-app/:id",protectforapp,GetLastPlayedSong)
UserRouter.get("/get-last-played-song/:id",protect,GetLastPlayedSong)
UserRouter.post("/post-song-quality-for-app",protectforapp,PostSongQuality)
UserRouter.post("/post-song-quality",protect,PostSongQuality)