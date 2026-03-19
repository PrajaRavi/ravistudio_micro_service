// Import necessary modules
import express from "express";
import cors from "cors";
import fs from "fs"; // NEW
import dotenv from "dotenv";
// exec - Needed to execute command in shell
import { exec } from "child_process"; // NEW
import path from "path"; // NEW

// for audio transcoding
import { parseFile } from "music-metadata";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";

import { SingerModel } from "./Models/Singer.model.js";
import multer from "multer";
import { protect, protectforapp } from "./Middlewares/Toke.auth.js";
import { DBConnect } from "./Config/connection1.config.js";
import { PlaylistRouter } from "./Routes/playlist.route.js";
import { SongRouter } from "./Routes/song.route.js";
import cookieParser from "cookie-parser";
import { SongModel } from "./Models/song.model.js";
import { UserPlaylistModel } from "./Models/User.playlist.model.js";
import morgan from "morgan";

let UploadedAudioPath=""

dotenv.config();
// Set up port, defaulting to 2000 if not specified in environment
const port = 3500;

// Initialize Express application
const app = express();
DBConnect();

app.use(morgan("dev"))

app.use
// Enable CORS for all routes
app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:4173","http://192.168.1.155:8081","http://localhost:8081"],
    credentials: true,
  }),
);
ffmpeg.setFfprobePath(ffprobeStatic.path);
app.use(cookieParser());
// Parse JSON and URL-encoded bodiesk
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("./Uploads"));
app.use(express.static("./Images/PlaylistImg"));
app.use(express.static("./Images/SongImages"));
app.use(express.static("./Images/Singerimg"));
app.use(express.static("./Images/UserPlaylistImg"));
app.use("/AAC-song",express.static(path.join(process.cwd(), "AAC-song")));

// creating roots
app.use("/playlist", PlaylistRouter);
app.use("/songs", SongRouter);
let dt=new Date()

// Serve HLS output files statically (NEW)
app.use("/hls-output", express.static(path.join(process.cwd(), "hls-output")));
const Storage = multer.diskStorage({
  // DESTINATION MEANS ALL ABOUT THAT WHERE WE HAVE TO SAVE OUR FILES
  destination: function (req, file, cb) {
    cb(null, `./Images/Profile`);
  },
  //HERE FILENAME MEANS IT IS ALL ABOUT WHAT WILL BE NAME OF OUR FILE
  filename: function (req, file, cb) {
    cb(null, `${Date.now().toString()}UserProfile.png`); //file.originalname.split('.').pop() it will basically remove all the sentance before . means at 0th position
  },
});

const upload = multer({ storage: Storage });
const Storage_for_UserPlaylistImg = multer.diskStorage({
  // DESTINATION MEANS ALL ABOUT THAT WHERE WE HAVE TO SAVE OUR FILES
  destination: function (req, file, cb) {
    cb(null, `./Images/UserPlaylistImg`);
  },
  //HERE FILENAME MEANS IT IS ALL ABOUT WHAT WILL BE NAME OF OUR FILE
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); //file.originalname.split('.').pop() it will basically remove all the sentance before . means at 0th position
  },
});
const upload_for_UserPlaylistImg = multer({ storage: Storage_for_UserPlaylistImg });

// Define route for video upload

const getAllSingers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalSingers = await SingerModel.countDocuments();

    const singers = await SingerModel.find()
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

// call getallsinger something like this
//  GET /singers?page=1&limit=10
app.get("/singers", getAllSingers);

 const createUserPlaylist = async (req, res) => {
  try {
    const userId = req.user.id; // from protect middleware
    const { name,title,description } = req.body;
    // 1️⃣ Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        msg: "Playlist name is required",
      });
    }
    if(!req.file){
      return res.status(400).json({
        success: false,
        msg: "Playlist image is required",
      });
    }

    // 2️⃣ Prevent duplicate playlist name for same user
    const existingPlaylist = await UserPlaylistModel.findOne({
      name,
      userId,
    });

    if (existingPlaylist) {
      return res.status(409).json({
        success: false,
        msg: "You already have a playlist with this name",
      });
    }

    // 3️⃣ Create playlist
    const playlist = await UserPlaylistModel.create({
      name,
      coverImage:req.file.filename||"Unknown",
      title,
      userId,
      description,
      owner:userId,
      isPublic: false,
      songs: [],
    });

    // 4️⃣ Response
    return res.status(201).json({
      success: true,
      msg: "Playlist created successfully",
      playlist,
    });
  } catch (error) {
    console.log(error)
    console.log("error in creating the user playlist")
    if(error.code==11000){
    return res.status(500).json({
      success: false,
      msg: "This Playlist already exist",
    });  
    }
    else{

      return res.status(500).json({
        success: false,
        msg: "Internal server error",
      });
    }
  }
};

app.post("/CreateUserPlaylist/",upload_for_UserPlaylistImg.single("image"),protect,createUserPlaylist)
app.post("/CreateUserPlaylist-for-app/",upload_for_UserPlaylistImg.single("image"),protectforapp,createUserPlaylist)

const getAllUserPlaylist = async (req, res) => {
  try {
    const userId = req.user.id;
    // console.log(userId)

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalSingers = await UserPlaylistModel.countDocuments();

    const singers = await UserPlaylistModel.find({ owner: userId })
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
const getAllUserPlaylistForApp = async (req, res) => {
  try {
    const userId = req.user.id;//this is owner id remmber
    // console.log(userId)

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalSingers = await UserPlaylistModel.countDocuments();

    const singers = await UserPlaylistModel.find({ owner: userId })
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
    console.log(error)
    res.status(500).json({
      success: false,
      msg: "Failed to fetch singers for app",
    });
  }
};


app.get("/get-all-user-playlist",protect,getAllUserPlaylist)
app.get("/get-all-user-playlist-for-app",protectforapp,getAllUserPlaylistForApp)







// executing a single command
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ FFmpeg Error:", stderr);
        return reject(error);
      }

      console.log("✅ Completed:", command);
      resolve(stdout);
    });
  });
};

// executing multiple command
const executeFFmpegCommands = async (ffmpegCommands) => {
  try {
    for (const command of ffmpegCommands) {
      console.log("🚀 Running:", command);
      await runCommand(command); // waits until finished
    }

    console.log("🎵 All qualities generated successfully!");
    setTimeout(() => {
      if(UploadedAudioPath){
        fs.unlinkSync(UploadedAudioPath)
        console.log("successfully deleted ✅✅✅")
      }
      UploadedAudioPath=null;
      
    }, 3000);

    return true;

  } catch (err) {
    console.error("❌ Conversion failed:", err);
    throw err;
  }
};
// Serve HLS output files statically (NEW)
app.use("/hls-output", express.static(path.join(process.cwd(), "hls-output")));
const Storage_for_song_upload = multer.diskStorage({
  // DESTINATION MEANS ALL ABOUT THAT WHERE WE HAVE TO SAVE OUR FILES
  destination: function (req, file, cb) {
    cb(null, `./Upload`);
  },
  //HERE FILENAME MEANS IT IS ALL ABOUT WHAT WILL BE NAME OF OUR FILE
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); //file.originalname.split('.').pop() it will basically remove all the sentance before . means at 0th position
  },
});
const upload_for_song_upload = multer({ storage: Storage_for_song_upload });

const TranscodeAudio = async (req, res, next) => {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).send("Video not sent!");
  }

  // Generate a unique ID for the video
  const AudioId = req.file.filename;
  const uploadedAudioPath = req.file.path;

  // Define output folder structure (NEW)
  const outputFolderRootPath = `./hls-output/${AudioId}`;
  const outputFolderRootPathforaac = `./AAC-song/${AudioId}`;

  const outputFolderSubDirectoryPath = {
    Low: `${outputFolderRootPath}/Low`,
    Mid: `${outputFolderRootPath}/Mid`,
    High: `${outputFolderRootPath}/High`,
  };
  const outputFolderSubDirectoryPathForAac = {
    Low: `${outputFolderRootPathforaac}/Low`,
    Mid: `${outputFolderRootPathforaac}/Mid`,
    High: `${outputFolderRootPathforaac}/High`,
  };


  // Create directories if they don't exist, for storing output video (NEW)
  if (!fs.existsSync(outputFolderRootPath)) {
    // ./hls-output/video-id/360p/
    fs.mkdirSync(outputFolderSubDirectoryPath["Low"], { recursive: true });
    // ./hls-output/video-id/480p/
    fs.mkdirSync(outputFolderSubDirectoryPath["Mid"], { recursive: true });
    // ./hls-output/video-id/720p/
    fs.mkdirSync(outputFolderSubDirectoryPath["High"], { recursive: true });
    // ./hls-output/video-id/1080p/
    
    // these directories are for .aac songs
    fs.mkdirSync(outputFolderSubDirectoryPathForAac["Low"], { recursive: true });
    // ./hls-output/video-id/480p/
    fs.mkdirSync(outputFolderSubDirectoryPathForAac["Mid"], { recursive: true });
    // ./hls-output/video-id/720p/
    fs.mkdirSync(outputFolderSubDirectoryPathForAac["High"], { recursive: true });
    // ./hls-output/video-id/1080p/
  }

  // Define FFmpeg commands for different resolutions (NEW)
  const ffmpegCommands = [
    // Low Quality (64kbps) - For slow connections / 3G
    `ffmpeg -i ${uploadedAudioPath} -c:a aac -b:a 64k -f hls -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath["Low"]}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath["Low"]}/index.m3u8"`,

    // Mid Quality (128kbps) - Standard mobile/web streaming
    `ffmpeg -i ${uploadedAudioPath} -c:a aac -b:a 128k -f hls -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath["Mid"]}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath["Mid"]}/index.m3u8"`,


    // High Quality (320kbps) - For high-end audio / WiFi
    `ffmpeg -i ${uploadedAudioPath} -c:a aac -b:a 320k -f hls -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath["High"]}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath["High"]}/index.m3u8"`,


  ];

  const ffmpegCommandsForAac = [

  // ✅ Low Quality (64 kbps)
  `ffmpeg -i "${uploadedAudioPath}" -map 0:a -c:a aac -profile:a aac_low -b:a 64k -ar 44100 -ac 2 "${outputFolderSubDirectoryPathForAac["Low"]}/Low.aac"`,

  // ✅ Mid Quality (128 kbps)
  `ffmpeg -i "${uploadedAudioPath}" -map 0:a -c:a aac -profile:a aac_low -b:a 128k -ar 44100 -ac 2 "${outputFolderSubDirectoryPathForAac["Mid"]}/Mid.aac"`,

  // ✅ High Quality (320 kbps)
  `ffmpeg -i "${uploadedAudioPath}" -map 0:a -c:a aac -profile:a aac_low -b:a 320k -ar 44100 -ac 2 "${outputFolderSubDirectoryPathForAac["High"]}/High.aac"`,

];
executeFFmpegCommands(ffmpegCommandsForAac)
  // Function to execute a single FFmpeg command (NEW)
  const executeCommand = (command) => {
    return new Promise((resolve, reject) => {
      // Execute ffmpeg command in shell
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };

  // Execute all FFmpeg commands concurrently (NEW)
  Promise.all(ffmpegCommands.map((cmd) => executeCommand(cmd)))
    .then(() => {
      // Create master playlist
      const masterPlaylistPath = `${outputFolderRootPath}/index.m3u8`; // ./hls-output/video-id/index.m3u8
      const masterPlaylistContent = `
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=64000,NAME="Low"
low/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=128000,NAME="Mid"
mid/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=320000,NAME="High"
high/index.m3u8
`.trim();
      fs.writeFileSync(masterPlaylistPath, masterPlaylistContent); // write the above content in the index.m3u8 file

      // Creating URLs for accessing the video streams
      const videoUrls = {
        master: `http://localhost:${port}/hls-output/${AudioId}/index.m3u8`,
        Low: `http://localhost:${port}/hls-output/${AudioId}/Low/index.m3u8`,
        Mid: `http://localhost:${port}/hls-output/${AudioId}/Mid/index.m3u8`,
        High: `http://localhost:${port}/hls-output/${AudioId}/High/index.m3u8`,
      };
const AACaudioURL={
  Low:`http://localhost:${port}/AAC-song/${AudioId}/Low/Low.aac`,
  Mid:`http://localhost:${port}/AAC-song/${AudioId}/Mid/Mid.aac`,
  High:`http://localhost:${port}/AAC-song/${AudioId}/High/High.aac`,
}
      // just(uploadedAudioPath,videoUrls)
      // Send success response with video URLs
      req.uploadedAudioPath = uploadedAudioPath;
      req.audioURL = videoUrls;
      req.AACaudioURL=AACaudioURL;
      // res.status(200).json({ AudioId, videoUrls })
      next();
    })
    .catch((error) => {
      console.error(`HLS conversion error: ${error}`);

      // Clean up: Delete the uploaded video file
      try {
        fs.unlinkSync(uploadedAudioPath);
      } catch (err) {
        console.error(`Failed to delete original video file: ${err}`);
      }

      // Clean up: Delete the generated HLS files and folders
      try {
        fs.unlinkSync(outputFolderRootPath);
      } catch (err) {
        console.error(`Failed to delete generated HLS files: ${err}`);
      }

      // Send error response
      return res.status(500).send("HLS conversion failed!");
    });
};

// Whole pipe line to transcode the audio
app.post(
  "/api/upload",
  upload_for_song_upload.single("video"),
  TranscodeAudio,
  async (req, res) => {
    let filePath =
      "./Upload/" +
      String(req.uploadedAudioPath).substring(
        7,
        String(req.uploadedAudioPath).length,
      );
    let AudioURLObj = req.audioURL;
    let AACaudioURL=req.AACaudioURL;
    console.log(filePath);
    UploadedAudioPath=filePath;
   
    try {
      const coverImageCollection=['five.webp','fourth.jpeg','one.jpeg','seven.webp','six.webp','third.jpeg','two.jpeg']
      /* ------------------ MUSIC METADATA ------------------ */
      const metadata = await parseFile(filePath, {
        native: true,
        duration: true,
      });

      const { common, format } = metadata;

      /* ------------------ COVER ART ------------------ */
      let coverImage = null;

      if (common.picture && common.picture.length > 0) {
        const pic = common.picture[0];

        coverImage = {
          format: pic.format,
          size: pic.data.length,
          buffer: pic.data,
        };

        if (coverOutputDir) {
          if (!fs.existsSync(coverOutputDir)) {
            fs.mkdirSync(coverOutputDir, { recursive: true });
          }

          const coverPath = path.join(
            coverOutputDir,
            `cover-${Date.now()}.${pic.format.split("/")[1]}`,
          );

          fs.writeFileSync(coverPath, pic.data);
          coverImage.path = coverPath;
        }
      }

      /* ------------------ FFPROBE (TECHNICAL DATA) ------------------ */
      const ffprobeData = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      const audioStream = ffprobeData.streams.find(
        (s) => s.codec_type === "audio",
      );

      /* ------------------ FINAL STRUCTURED RESPONSE ------------------ */
      const myobj = {
        /* 🎵 Tags */
        title: common.title || "Unknow title",
        artist: common.artist || "Unknown artist",
        album: common.album || "Unknown album",
        genre: common.genre || [],
        year: common.year || null,
        language: common.language || "en",
        track: common.track?.no || "nothing",

        /* ⏱ Duration & Quality */
        duration: format.duration, // seconds
        bitrate: format.bitrate,
        sampleRate: format.sampleRate,
        numberOfChannels: format.numberOfChannels,

        /* 🎚 Codec / Stream Info */
        codec: audioStream?.codec_name,
        codecLong: audioStream?.codec_long_name,
        channels: audioStream?.channels,
        channelLayout: audioStream?.channel_layout,

        /* 🖼 Cover Art */
        coverImage,

        /* 📦 Raw (optional use) */
        raw: {
          musicMetadata: metadata,
          ffprobe: ffprobeData,
        },
      };
      console.log(AudioURLObj?.Low);
      console.log(AudioURLObj?.Mid);
      
       coverImage=coverImageCollection[Math.round(Math.random()*(coverImageCollection.length-1))]
      let data = await SongModel.create({
        title: String(myobj.title),
        artist: String(myobj.artist),
        album: String(myobj.album),
        genre: String(myobj.genre),
        year: myobj.year,
        language: myobj.language,
        track: myobj.track,
        duration: myobj.duration,
        coverImage:coverImage||"nothing",
        audioURL: {
          low: String(AudioURLObj?.Low),
          medium: String(AudioURLObj?.Mid),
          high: String(AudioURLObj?.High),
          master: String(AudioURLObj?.master),
        },
        audioURLAac: {
          low: String(AACaudioURL?.Low),
          medium: String(AACaudioURL?.Mid),
          high: String(AACaudioURL?.High),
         
        },
      });

      console.log(await data.save());
     
        

      return res
        .status(200)
        .send({ success: true, msg: "sub thik hai bhai!!!!!" });
    } catch (error) {
      console.error("Audio metadata extraction failed:", error);
      throw error;
    }
    finally{
      
        
    }
  },
);

/**
 * Extract full metadata + cover art + duration from an audio file
 * @param {string} filePath - absolute path to master audio file
 * @param {string} [coverOutputDir] - optional directory to save cover image
 */




app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
