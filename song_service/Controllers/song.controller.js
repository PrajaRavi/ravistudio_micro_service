import { SongModel } from "../Models/song.model.js";
import { createClient } from "redis";
import { ObjectId } from "mongodb";

// --- Redis Setup ---
const client = createClient();
client.on("error", (err) => console.log("Redis Client Error", err));
await client.connect();

const CreateKeyForRedis = (req, page, limit) => {
    return `${String(req.path).replace("/", "")}:page=${page}:limit=${limit}`;
};

// --- Controllers ---

export const GetAllSongs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const mykey = CreateKeyForRedis(req, page, limit);

        // 1. Check Redis Cache
        const cachedData = await client.get(mykey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                msg: JSON.parse(cachedData), // Standardized key name to 'songs'
            });
        }

        // 2. Database Operations
        const totalSongs = await SongModel.countDocuments();
        const totalPages = Math.ceil(totalSongs / limit);

        if (page > totalPages && totalSongs > 0) {
            return res.status(204).send({ success: true, msg: "no data for return" });
        }

        const data = await SongModel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        if (!data) return res.status(404).json({ success: false, msg: "No songs found" });

        // 3. Set Cache (Expiries in 1 hour) and Respond
        await client.set(mykey, JSON.stringify(data), { EX: 3600 });

        return res.status(200).send({
            success: true,
            msg: data,
            totalPages,
            page
        });

    } catch (error) {
        console.error("GetAllSongs Error:", error);
        return res.status(500).json({ success: false, msg: "Song fetch failed" });
    }
};

export const StoreUserId = async (req, res) => {
    const userId = req.user.id;
    const songId = req.params.songId;

    try {
        const data = await SongModel.findByIdAndUpdate(
            songId,
            { $addToSet: { likedBy: userId } },
            { new: true }
        );

        if (!data) return res.status(404).json({ success: false, msg: "Song not found" });

        return res.status(200).json({ success: true, msg: "User added successfully" });
    } catch (error) {
        console.error("StoreUserId Error:", error);
        return res.status(500).json({ success: false, msg: "User ID post failed in song" });
    }
};

export const getFavouriteSongs = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!userId) {
            return res.status(401).send({ msg: "Unauthorized access", success: false });
        }

        // 1. Get User's favorite song IDs
        const user = await UserModel.findById(userId)
            .select("favoriteSongs")
            .lean();

        if (!user || !user.favoriteSongs || user.favoriteSongs.length === 0) {
            return res.status(200).json({
                success: true,
                songs: [],
                totalPages: 0
            });
        }

        // 2. Fetch actual song details with pagination
        const songs = await SongModel.find({
            _id: { $in: user.favoriteSongs },
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            songs,
            totalPages: Math.ceil(user.favoriteSongs.length / limit),
            currentPage: page
        });

    } catch (error) {
        console.error("getFavouriteSongs Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to fetch favorites" });
    }
};

export const removeFromFavourite = async (req, res) => {
    try {
        const userId = req.user.id;
        const songId = req.params.songId;

        // Perform both updates concurrently for better performance
        await Promise.all([
            UserModel.findByIdAndUpdate(userId, {
                $pull: { favoriteSongs: ObjectId.createFromHexString(songId) }
            }),
            SongModel.findByIdAndUpdate(songId, {
                $pull: { likedBy: ObjectId.createFromHexString(userId) }
            })
        ]);

        return res.status(200).json({
            success: true,
            msg: "Song removed from favourites",
        });
    } catch (error) {
        console.error("removeFromFavourite Error:", error);
        return res.status(500).json({
            success: false,
            msg: "Failed to remove favourite",
        });
    }
};