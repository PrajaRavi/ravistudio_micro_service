import express from "express"
import {  addSongToMultiplePlaylists, DeleteUserPlaylist, DeleteUserPlaylistSong, getAllPlaylist, GetPlaylistById, GetUserPlaylistById, GetUserPlaylistSongs,  } from "../Controllers/playlist.controller.js";
export const PlaylistRouter=express.Router();
import {protect, protectforapp} from "../Middlewares/Toke.auth.js"

PlaylistRouter.get("/get-all-playlist", getAllPlaylist);
PlaylistRouter.get("/get-playlist-by-id/:id", GetPlaylistById);
PlaylistRouter.get("/get-user-playlist-by-id/:id",protect, GetUserPlaylistById);
PlaylistRouter.get("/get-user-playlist-for-app-by-id/:id",protectforapp, GetUserPlaylistById);
PlaylistRouter.get("/get-user-playlist-song-by-id/:id",protect,GetUserPlaylistSongs);
PlaylistRouter.get("/get-user-playlist-song-for-app-by-id/:id",protectforapp,GetUserPlaylistSongs);
PlaylistRouter.post("/post-user-playlist-song-by-userplaylistid/",protect,addSongToMultiplePlaylists);
PlaylistRouter.post("/post-user-playlist-song-by-userplaylistid-for-app/",protectforapp,addSongToMultiplePlaylists);
PlaylistRouter.delete("/delete-user-playlist/:id",protect,DeleteUserPlaylist)
PlaylistRouter.delete("/delete-user-playlist-for-app/:id",protectforapp,DeleteUserPlaylist)
PlaylistRouter.delete("/delete-user-playlist-song/:playlistid/:songid",protect,DeleteUserPlaylistSong)
PlaylistRouter.delete("/delete-user-playlist-song-for-app/:playlistid/:songid",protectforapp,DeleteUserPlaylistSong)

