import mongoose from "mongoose";
const { Schema } = mongoose;

const SongSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },

    artist: { type: String, required: true, trim: true },

    album: { type: String, trim: true },

    duration: { type: Number, required: true }, // seconds

    audioURL: {
      low: {
        type: String,
        required: true,
      },
      medium: {
        type: String,
        required: true,
      },
      high: {
        type: String,
        required: true,
      },
      master:{
      type: String,
        required: true,
        
      }
    },
    audioURLAac: {
      low: {
        type: String,
        required: true,
      },
      medium: {
        type: String,
        required: true,
      },
      high: {
        type: String,
        required: true,
      },
     
    },

    coverImage: { type: String, default: "" },

    genre: { type: String, index: true },

    language: { type: String },

    playCount: { type: Number, default: 0 },

    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

// 🔍 Full-text search
SongSchema.index({ title: "text", artist: "text" });

export const SongModel = mongoose.model("Song", SongSchema);
