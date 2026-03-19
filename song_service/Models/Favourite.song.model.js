const FavoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    songId: { type: Schema.Types.ObjectId, ref: "Song", index: true },
  },
  { timestamps: true },
);

FavoriteSchema.index({ userId: 1, songId: 1 }, { unique: true });
// 👇 ADD INDEX
FavoriteSchema.index({ userId: 1 });
export const FavoriteModel = mongoose.model("Favorite", FavoriteSchema);
