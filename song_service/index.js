import express from "express";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import { exec } from "child_process";
import path from "path";
import { parseFile } from "music-metadata";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import multer from "multer";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createClient } from "redis";

// Import Models and Config
import { SingerModel } from "./Models/Singer.model.js";
import { SongModel } from "./Models/song.model.js";
import { UserPlaylistModel } from "./Models/User.playlist.model.js";
import { protect, protectforapp } from "./Middlewares/Toke.auth.js";
import { DBConnect } from "./Config/connection1.config.js";
import { PlaylistRouter } from "./Routes/playlist.route.js";
import { SongRouter } from "./Routes/song.route.js";

dotenv.config();

const app = express();
const port = 3500;
let UploadedAudioPath = "";

// Database Connection
DBConnect();

// Redis Setup
const client = createClient();
client.on("error", (err) => console.log("Redis Client Error", err));
await client.connect();

// Middleware Configuration
app.use(morgan("dev"));
app.use(cors({
    origin: [
        "http://localhost:5173", 
        "http://localhost:4173", 
        "http://192.168.1.155:8081", 
        "http://localhost:8081"
    ],
    credentials: true,
}));

ffmpeg.setFfprobePath(ffprobeStatic.path);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static File Serving
app.use(express.static("./Uploads"));
app.use(express.static("./Images/PlaylistImg"));
app.use(express.static("./Images/SongImages"));
app.use(express.static("./Images/Singerimg"));
app.use(express.static("./Images/UserPlaylistImg"));
app.use("/AAC-song", express.static(path.join(process.cwd(), "AAC-song")));
app.use("/hls-output", express.static(path.join(process.cwd(), "hls-output")));

// --- Multer Storage Configurations ---

const ProfileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, `./Images/Profile`),
    filename: (req, file, cb) => cb(null, `${Date.now().toString()}UserProfile.png`),
});

const UserPlaylistImgStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, `./Images/UserPlaylistImg`),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const SongUploadStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, `./Upload`),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage: ProfileStorage });
const upload_for_UserPlaylistImg = multer({ storage: UserPlaylistImgStorage });
const upload_for_song_upload = multer({ storage: SongUploadStorage });

// --- Helper Functions ---

const CreateKeyForRedis = (req, page, limit) => {
    return `${String(req.path).replace("/", "")}:page=${page}:limit=${limit}`;
};

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

const executeFFmpegCommands = async (ffmpegCommands) => {
    try {
        for (const command of ffmpegCommands) {
            console.log("🚀 Running:", command);
            await runCommand(command);
        }
        console.log("🎵 All qualities generated successfully!");
        
        setTimeout(() => {
            if (UploadedAudioPath) {
                if (fs.existsSync(UploadedAudioPath)) fs.unlinkSync(UploadedAudioPath);
                console.log("Successfully deleted source file ✅");
            }
            UploadedAudioPath = null;
        }, 3000);

        return true;
    } catch (err) {
        console.error("❌ Conversion failed:", err);
        throw err;
    }
};

// --- Route Controllers ---

const getAllSingers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const mykey = CreateKeyForRedis(req, page, limit);

        const cachedData = await client.get(mykey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                singers: JSON.parse(cachedData),
            });
        }

        const skip = (page - 1) * limit;
        const totalSingers = await SingerModel.countDocuments();
        const totalPages = Math.ceil(totalSingers / limit);

        if (page > totalPages && totalSingers > 0) {
            return res.status(204).send({ success: true, msg: "no data for return" });
        }

        const singers = await SingerModel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        await client.set(mykey, JSON.stringify(singers), { EX: 3600 });
        
        return res.status(200).json({
            success: true,
            total: totalSingers,
            page,
            totalPages,
            singers,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: "Failed to fetch singers" });
    }
};

const createUserPlaylist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, title, description } = req.body;

        if (!name) return res.status(400).json({ success: false, msg: "Playlist name is required" });
        if (!req.file) return res.status(400).json({ success: false, msg: "Playlist image is required" });

        const existingPlaylist = await UserPlaylistModel.findOne({ name, owner: userId });
        if (existingPlaylist) {
            return res.status(409).json({ success: false, msg: "You already have a playlist with this name" });
        }

        const playlist = await UserPlaylistModel.create({
            name,
            coverImage: req.file.filename,
            title,
            description,
            owner: userId,
            userId,
            isPublic: false,
            songs: [],
        });

        return res.status(201).json({ success: true, msg: "Playlist created successfully", playlist });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(500).json({ success: false, msg: "This Playlist already exists" });
        }
        return res.status(500).json({ success: false, msg: "Internal server error" });
    }
};

const getAllUserPlaylist = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await UserPlaylistModel.countDocuments({ owner: userId });
        const singers = await UserPlaylistModel.find({ owner: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            singers,
        });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to fetch user playlists" });
    }
};

// --- Audio Transcoding Middleware ---

const TranscodeAudio = async (req, res, next) => {
    if (!req.file) return res.status(400).send("Audio not sent!");

    const AudioId = req.file.filename;
    const uploadedAudioPath = req.file.path;
    const outputRoot = `./hls-output/${AudioId}`;
    const outputAac = `./AAC-song/${AudioId}`;

    const paths = ["Low", "Mid", "High"];

    // Ensure directories exist
    paths.forEach(p => {
        fs.mkdirSync(`${outputRoot}/${p}`, { recursive: true });
        fs.mkdirSync(`${outputAac}/${p}`, { recursive: true });
    });

    const hlsCmds = [
        `ffmpeg -i ${uploadedAudioPath} -c:a aac -b:a 64k -f hls -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputRoot}/Low/segment%03d.ts" "${outputRoot}/Low/index.m3u8"`,
        `ffmpeg -i ${uploadedAudioPath} -c:a aac -b:a 128k -f hls -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputRoot}/Mid/segment%03d.ts" "${outputRoot}/Mid/index.m3u8"`,
        `ffmpeg -i ${uploadedAudioPath} -c:a aac -b:a 320k -f hls -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputRoot}/High/segment%03d.ts" "${outputRoot}/High/index.m3u8"`
    ];

    const aacCmds = [
        `ffmpeg -i "${uploadedAudioPath}" -c:a aac -b:a 64k -ar 44100 "${outputAac}/Low/Low.aac"`,
        `ffmpeg -i "${uploadedAudioPath}" -c:a aac -b:a 128k -ar 44100 "${outputAac}/Mid/Mid.aac"`,
        `ffmpeg -i "${uploadedAudioPath}" -c:a aac -b:a 320k -ar 44100 "${outputAac}/High/High.aac"`
    ];

    try {
        await executeFFmpegCommands(aacCmds);
        await Promise.all(hlsCmds.map(cmd => runCommand(cmd)));

        // Create Master Playlist
        const masterContent = `#EXTM3U\n#EXT-X-VERSION:3\n\n#EXT-X-STREAM-INF:BANDWIDTH=64000,NAME="Low"\nLow/index.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=128000,NAME="Mid"\nMid/index.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=320000,NAME="High"\nHigh/index.m3u8`;
        fs.writeFileSync(`${outputRoot}/index.m3u8`, masterContent);

        req.uploadedAudioPath = uploadedAudioPath;
        req.audioURL = {
            master: `http://localhost:${port}/hls-output/${AudioId}/index.m3u8`,
            Low: `http://localhost:${port}/hls-output/${AudioId}/Low/index.m3u8`,
            Mid: `http://localhost:${port}/hls-output/${AudioId}/Mid/index.m3u8`,
            High: `http://localhost:${port}/hls-output/${AudioId}/High/index.m3u8`,
        };
        req.AACaudioURL = {
            Low: `http://localhost:${port}/AAC-song/${AudioId}/Low/Low.aac`,
            Mid: `http://localhost:${port}/AAC-song/${AudioId}/Mid/Mid.aac`,
            High: `http://localhost:${port}/AAC-song/${AudioId}/High/High.aac`,
        };
        next();
    } catch (error) {
        console.error("Transcoding failed", error);
        res.status(500).send("HLS conversion failed!");
    }
};

// --- Routes ---

app.get("/singers", getAllSingers);
app.post("/CreateUserPlaylist", upload_for_UserPlaylistImg.single("image"), protect, createUserPlaylist);
app.post("/CreateUserPlaylist-for-app", upload_for_UserPlaylistImg.single("image"), protectforapp, createUserPlaylist);
app.get("/get-all-user-playlist", protect, getAllUserPlaylist);
app.get("/get-all-user-playlist-for-app", protectforapp, getAllUserPlaylist);

app.use("/playlist", PlaylistRouter);
app.use("/songs", SongRouter);

// --- Final Upload Pipeline ---

app.post("/api/upload", upload_for_song_upload.single("video"), TranscodeAudio, async (req, res) => {
    const filePath = req.uploadedAudioPath;
    UploadedAudioPath = filePath;

    try {
        const coverCollection = ['one.jpeg', 'two.jpeg', 'third.jpeg', 'fourth.jpeg', 'five.webp', 'six.webp', 'seven.webp'];
        const metadata = await parseFile(filePath, { duration: true });
        const { common, format } = metadata;

        const ffprobeData = await new Promise((res, rej) => {
            ffmpeg.ffprobe(filePath, (err, data) => (err ? rej(err) : res(data)));
        });

        const audioStream = ffprobeData.streams.find(s => s.codec_type === "audio");
        const randomCover = coverCollection[Math.floor(Math.random() * coverCollection.length)];

        const song = await SongModel.create({
            title: common.title || "Unknown Title",
            artist: common.artist || "Unknown Artist",
            album: common.album || "Unknown Album",
            genre: common.genre ? common.genre.join(", ") : "Unknown",
            year: common.year,
            duration: format.duration,
            coverImage: randomCover,
            audioURL: {
                low: req.audioURL.Low,
                medium: req.audioURL.Mid,
                high: req.audioURL.High,
                master: req.audioURL.master
            },
            audioURLAac: {
                low: req.AACaudioURL.Low,
                medium: req.AACaudioURL.Mid,
                high: req.AACaudioURL.High
            }
        });

        res.status(200).send({ success: true, song });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, msg: "Metadata extraction failed" });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});