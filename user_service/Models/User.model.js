import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    refreshToken: {
  type: String,
  default: "",
},
SongQuality:{
  type:String,
  default:"",
},
 resetOtpExpiresAt: {
      type: Number,
      default: 0,
    },
 resetOtp: {
      type:String,
      default: "",
    },
contact:{
  type:"String",
  default:0
},
    age: {
      type: String,
      default:""
    },

    password: { type: String, required: true },
    verifyOtp: { type: String},
    Lastsongplayed:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Song"
    },

    profileImage: { type: String, default: "" },

    language: { type: String, default: "en" },

    isAdmin: { type: Boolean, default: false },

    isAccountVerified: { type: Boolean, default: false },

    /* References */
    playlists: [{ type: Schema.Types.ObjectId, ref: "Playlist" }],
    favoriteSongs: [{ type: Schema.Types.ObjectId, ref: "Song" }],
  },
  { timestamps: true },
);

export const UserModel = mongoose.model("User", UserSchema);
