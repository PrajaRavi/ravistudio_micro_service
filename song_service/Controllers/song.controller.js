
import { SongModel } from "../Models/song.model.js";

import {ObjectId} from "mongodb";
export const GetAllSongs=async (req,res)=>{
   const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
const TotalSongs = await SongModel.countDocuments();
    const skip = (page - 1) * limit;
  try {
    let data=await SongModel.find()
     .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if(!data) return;
    console.log(data)
    console.log("end",page,Math.ceil(TotalSongs / limit))
      
    return res.status(200).send({success:true,
      msg:data,
      totalPages:Math.ceil(TotalSongs / limit),
      page})
  } catch (error) {
    console.log(error)
    return res.send({success:false,msg:"song fetch failed"})
  }
}
export const StoreUserId=async (req,res)=>{
  const userId = req.user.id;       // from protect middleware
  const songId=req.params.songId;
    
  try {
    let data=await SongModel.findByIdAndUpdate(
      songId,
      {
        $addToSet: { likedBy: userId }, // 👈 NO DUPLICATES
      },
      { new: true }
    );
    if(!data) return;
    return res.send({success:true,msg:"User added succesfully"})
  } catch (error) {
    console.log(error)
    return res.send({success:false,msg:"userid post failed in song"})
  }
}

export const getFavouriteSongs = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    try {
    const userId = req.user.id; // from protect middleware
if(!userId){
return res.status(401).send({msg:"Unothorized access",success:true})
}
    const user = await UserModel.findById(userId)
      .select("favoriteSongs")
      .lean();

    if (!user || !user.favoriteSongs.length) {
      return res.status(200).json({
        success: true,
        songs: [],
      });
    }
// console.log(limit)
    const songs = await SongModel.find({
      _id: { $in: user.favoriteSongs },
    })
    .skip(skip)
    .limit(limit)
  console.log(songs.length)
console.log("favourite song fetching")
    res.status(200).json({
      success: true,
      songs,
      totalPages:Math.ceil(songs.length/limit)
    });
  } catch (error) {
    console.log(error)
    return res.send({success:false,msg:error});
  }
};

export const removeFromFavourite = async (req, res) => {
  try {
    const userId = req.user.id;      // from protect middleware
    const songId  = req.params.songId;
    console.log(songId)
    // remove song from user's favourites
    let  data=await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { favoriteSongs: ObjectId.createFromHexString(songId) } }
    );

    // remove user from song's likedBy
    let data1=await SongModel.findByIdAndUpdate(
      songId,
      { $pull: { likedBy: ObjectId.createFromHexString(userId) } }
    );
    res.status(200).json({
      success: true,
      msg: "Song removed from favourites",
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      msg: "Failed to remove favourite",
    });
  }
};
