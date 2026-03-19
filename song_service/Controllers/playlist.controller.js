import mongoose from "mongoose";
import { PlaylistModel } from "../Models/Playlist.model.js";
import { UserPlaylistModel } from "../Models/User.playlist.model.js";
import {SongModel} from "../Models/song.model.js"
export const getAllPlaylist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalSingers = await PlaylistModel.countDocuments();

    const singers = await PlaylistModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total: totalSingers,
      page,
      totalPages: Math.ceil(totalSingers / limit),
      singers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Failed to fetch singers",
    });
  }
};
export const GetPlaylistById = async (req, resp) => {
  try {
    let data = await PlaylistModel.findById(req.params.id);
    if (!data) return;
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

    // 1️⃣ Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        msg: "Playlist name is required",
      });
    }

    // 2️⃣ Check if playlist already exists
    const existingPlaylist = await PlaylistModel.findOne({ name });
    if (existingPlaylist) {
      return res.status(409).json({
        success: false,
        msg: "Playlist with this name already exists",
      });
    }

    // 3️⃣ Create playlist
    const playlist = await PlaylistModel.create({
      name,
      title,
      description,
      playlistimage,
    });

    // 4️⃣ Success response
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
    let data = await UserPlaylistModel.findById(req.params.id);
    if (!data) return;
    return resp.send({ success: true, msg: data });
  } catch (error) {
    resp.status(500).json({
      success: false,
      msg: "Failed to fetch UserPlaylist by id",
    });
  }
};

export const GetUserPlaylistSongs=async(req,resp)=>{
  const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
const TotalSongs = await SongModel.countDocuments();
    const skip = (page - 1) * limit;
  try {
    let data = await UserPlaylistModel.findById(req.params.id);
    if (!data) return;
    let songdata=await SongModel.find({_id:{$in:data.songs}})
    .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      console.log(page,Math.ceil(songdata.length/limit))
    return resp.send({ success: true, msg: songdata,totalPages:Math.ceil(songdata.length/limit) });
  } catch (error) {
    console.log(error)
    resp.status(500).json({
      success: false,
      msg: "Failed to fetch UserPlaylist song",
    });
  }
}

export const getPlaylistByOwnerAndName = async (req, res) => {
  try {
    const { ownerId, name } = req.params; 
    // OR: req.query if you prefer query params

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

    // 🔥 Update ALL playlists in ONE query
    const result = await UserPlaylistModel.updateMany(
      {
        owner: ownerId,
        name: { $in: playlistNames },
      },
      {
        $addToSet: { songs: songId }, // prevents duplicates
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

export const DeleteUserPlaylist=async(req,resp)=>{
  try {
    let data=await UserPlaylistModel.deleteOne({_id:req.params.id})
    console.log(data)
    if(data){
    return resp.status(200).json({
      success: true,
      message: "successfully deleted",
    });  
    }
  } catch (error) {
    console.log(error)
    return resp.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export const DeleteUserPlaylistSong=async(req,resp)=>{
  try {
let data=await UserPlaylistModel.findByIdAndUpdate({_id:req.params.playlistid},{
  $pull:{songs:req.params.songid}
})    
if(data) return resp.status(200).json({
      success: true,
      message: "Successfully deleted",
    }); 
  } catch (error) {
console.log(error)
    return resp.status(500).json({
      success: false,
      message: "Server error",
    });
    
  }
}