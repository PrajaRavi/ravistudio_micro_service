import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    coverImage: {
      type: String,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],

    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },

    followersCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* 🔥 INDEXES */


// Prevent duplicate playlist names per user
PlaylistSchema.index({ owner: 1, name: 1 }, { unique: true });

export const UserPlaylistModel = mongoose.model("UserPlaylist", PlaylistSchema);
