import mongoose from "mongoose";
import { PlaylistModel } from "../Models/Playlist.model.js";
import { UserPlaylistModel } from "../Models/User.playlist.model.js";
import { SongModel } from "../Models/song.model.js";
import { createClient } from "redis";

// --- REDIS SETUP ---
// Pro-Tip: Connect the client OUTSIDE the function so you don't 
// create a new connection for every single API request.
const client = createClient();
client.on("error", (err) => console.log("Redis Client Error", err));
await client.connect();

const CreateKeyForRedis = (req, page, limit) => {
    let mykey = `${String(req.path).replace("/", "")}:page=${page}:limit=${limit}`;
    return mykey;
};

// --- CONTROLLERS ---

export const getAllPlaylist = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 1. Check Redis Cache
        const mykey = CreateKeyForRedis(req, page, limit);
        const cachedData = await client.get(mykey);

        if (cachedData) {
            return res.status(200).json({
                success: true,
                singers: JSON.parse(cachedData),
            });
        }

        // 2. Database Operations
        const totalSingers = await PlaylistModel.countDocuments();
        const totalPages = Math.ceil(totalSingers / limit);

        if (page > totalPages && totalSingers > 0) {
            return res.status(204).send({ success: true, msg: "no data for return" });
        }

        const singers = await PlaylistModel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // 3. Set Cache & Respond
        await client.set(mykey, JSON.stringify(singers), {
            EX: 3600 // Set an expiry (e.g., 1 hour) so data stays fresh
        });

        return res.status(200).json({
            success: true,
            total: totalSingers,
            page,
            totalPages,
            singers,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Failed to fetch singers",
        });
    }
};

export const GetPlaylistById = async (req, resp) => {
    try {
        const data = await PlaylistModel.findById(req.params.id);
        if (!data) {
            return resp.status(404).json({ success: false, msg: "Playlist not found" });
        }
        return resp.send({ success: true, msg: data });
    } catch (error) {
        resp.status(500).json({
            success: false,
            msg: "Failed to fetch Playlist by id",
        });
    }
};

export const createPlaylist = async (req, res) => {
    try {
        const { name, title, description, playlistimage } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                msg: "Playlist name is required",
            });
        }

        const existingPlaylist = await PlaylistModel.findOne({ name });
        if (existingPlaylist) {
            return res.status(409).json({
                success: false,
                msg: "Playlist with this name already exists",
            });
        }

        const playlist = await PlaylistModel.create({
            name,
            title,
            description,
            playlistimage,
        });

        return res.status(201).json({
            success: true,
            msg: "Playlist created successfully",
            playlist,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error",
        });
    }
};

export const GetUserPlaylistById = async (req, resp) => {
    try {
        const data = await UserPlaylistModel.findById(req.params.id);
        if (!data) {
            return resp.status(404).json({ success: false, msg: "User playlist not found" });
        }
        return resp.send({ success: true, msg: data });
    } catch (error) {
        resp.status(500).json({
            success: false,
            msg: "Failed to fetch UserPlaylist by id",
        });
    }
};

export const GetUserPlaylistSongs = async (req, resp) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const data = await UserPlaylistModel.findById(req.params.id);
        if (!data) return resp.status(404).json({ success: false, msg: "Playlist not found" });

        const songdata = await SongModel.find({ _id: { $in: data.songs } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return resp.send({
            success: true,
            msg: songdata,
            totalPages: Math.ceil(data.songs.length / limit)
        });
    } catch (error) {
        console.error(error);
        resp.status(500).json({
            success: false,
            msg: "Failed to fetch UserPlaylist songs",
        });
    }
};

export const getPlaylistByOwnerAndName = async (req, res) => {
    try {
        const { ownerId, name } = req.params;

        if (!ownerId || !name) {
            return res.status(400).json({
                success: false,
                message: "ownerId and playlist name are required",
            });
        }

        const playlist = await UserPlaylistModel.findOne({
            owner: ownerId,
            name: name,
        })
            .populate("songs", "title artist coverImage duration")
            .lean();

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found",
            });
        }

        return res.status(200).json({
            success: true,
            playlist,
        });
    } catch (error) {
        console.error("Get Playlist Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const addSongToMultiplePlaylists = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { songId, playlistNames } = req.body;

        if (!songId || !Array.isArray(playlistNames) || playlistNames.length === 0) {
            return res.status(400).json({
                success: false,
                message: "songId and playlistNames array are required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(songId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid songId",
            });
        }

        const result = await UserPlaylistModel.updateMany(
            {
                owner: ownerId,
                name: { $in: playlistNames },
            },
            {
                $addToSet: { songs: songId },
            }
        );

        return res.status(200).json({
            success: true,
            message: "Song added to selected playlists",
            matchedPlaylists: result.matchedCount,
            modifiedPlaylists: result.modifiedCount,
        });
    } catch (error) {
        console.error("Add song to multiple playlists error:", error);
        return res.status(500).json({
            success: false,
            msg: "Server error",
        });
    }
};

export const DeleteUserPlaylist = async (req, resp) => {
    try {
        const data = await UserPlaylistModel.deleteOne({ _id: req.params.id });
        if (data.deletedCount > 0) {
            return resp.status(200).json({
                success: true,
                message: "Successfully deleted",
            });
        }
        return resp.status(404).json({ success: false, msg: "Playlist not found" });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const DeleteUserPlaylistSong = async (req, resp) => {
    try {
        const data = await UserPlaylistModel.findByIdAndUpdate(
            { _id: req.params.playlistid },
            { $pull: { songs: req.params.songid } }
        );

        if (data) {
            return resp.status(200).json({
                success: true,
                message: "Successfully deleted",
            });
        }
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};