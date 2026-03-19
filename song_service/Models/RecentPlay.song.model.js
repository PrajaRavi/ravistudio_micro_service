const RecentlyPlayedSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    songId: { type: Schema.Types.ObjectId, ref: "Song" },
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const RecentlyPlayedModel = mongoose.model(
  "RecentlyPlayed",
  RecentlyPlayedSchema
);
