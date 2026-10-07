# Full-Stack Music Streaming Platform

A full-stack music streaming platform inspired by Spotify, built from scratch using the MERN stack. The platform supports music upload and delivery, playlists, favourites, user management, custom audio playback, and **Adaptive Bitrate Streaming (ABS)** for dynamically delivering appropriate audio quality based on network conditions.

> **Built from Scratch — No Vibe Coding**
>
> This project was designed and implemented manually to understand the underlying architecture, backend APIs, media delivery, streaming behavior, database design, containerization, and deployment workflow rather than relying on AI-generated application code.

---

## 🚀 Key Features

- 🎵 Full-stack music streaming platform
- ▶️ Custom HTML5 Audio player
- 📡 **Adaptive Bitrate Streaming (ABS)**
- 👤 User management and authentication
- ❤️ Favourite songs
- 📚 Playlist creation and management
- 🔎 Music search and filtering
- ☁️ ImageKit.io-based media upload and delivery
- 🗄️ MongoDB-based data persistence
- 🔌 RESTful backend APIs
- 🐳 Dockerized backend services
- ⚙️ GitHub Actions CI/CD
- 📱 Responsive React frontend

---

## 🏗️ Architecture

```text
                        ┌──────────────────────┐
                        │      React.js        │
                        │      Frontend        │
                        └──────────┬───────────┘
                                   │
                             REST API Calls
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Node.js / Express  │
                        │       Backend        │
                        └───────┬───────┬──────┘
                                │       │
                     ┌──────────┘       └──────────┐
                     ▼                             ▼
             ┌───────────────┐             ┌───────────────┐
             │   MongoDB     │             │  ImageKit.io  │
             │               │             │               │
             │ Users         │             │ Music Files   │
             │ Songs         │             │ Media Delivery│
             │ Playlists     │             │               │
             │ Favourites    │             └───────────────┘
             └───────────────┘
```

The application separates application data from media storage:

- **MongoDB** stores users, songs, playlists, favourites, and related metadata.
- **ImageKit.io** handles music file upload, storage, and delivery.
- **Node.js/Express.js** exposes REST APIs and handles application logic.
- **React.js** provides the user interface and custom music player.
- **Docker** containerizes backend services.
- **GitHub Actions** automates CI/CD.

---

# 📡 Adaptive Bitrate Streaming (ABS)

One of the key technical features of this project is **Adaptive Bitrate Streaming**.

Instead of always delivering a single fixed-quality audio stream, the system can provide multiple audio quality variants. The client can select an appropriate bitrate based on the current network conditions.

### Why ABS?

Consider a user streaming music over different network conditions:

```text
Fast Network
     │
     ▼
 High Bitrate
     │
     ▼
 Better Audio Quality


Slow Network
     │
     ▼
 Lower Bitrate
     │
     ▼
 Reduced Buffering
```

A fixed high-bitrate stream can cause excessive buffering on slower connections.

ABS addresses this by allowing playback to adapt to available bandwidth.

### Example Quality Levels

```text
                 Music Source
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Low Quality  Medium      High Quality
          │           │           │
        Low kbps    Mid kbps     High kbps
          │           │           │
          └───────────┼───────────┘
                      ▼
                Audio Player
```

The objective is to balance:

- Audio quality
- Network bandwidth
- Buffering
- Playback continuity
- User experience

### Why this matters

Implementing ABS required thinking beyond simply storing an `.mp3` file and returning its URL.

The streaming architecture has to consider:

1. Media representation
2. Multiple bitrate variants
3. Media delivery
4. Client playback
5. Network conditions
6. Buffering behavior
7. Switching between available representations

This was one of the main engineering aspects of the project.

---

# 🎧 Custom Audio Player

The application uses the browser's **HTML5 Audio API** to implement a custom music player instead of relying entirely on a third-party player.

The player handles common playback operations such as:

- Play / pause
- Seeking
- Volume control
- Track progress
- Current playback state
- Track switching

Conceptually:

```text
React UI
   │
   ▼
Audio Player State
   │
   ▼
HTML5 Audio API
   │
   ▼
Media URL
   │
   ▼
ImageKit.io
   │
   ▼
Audio Stream
```

This gave control over the playback experience and allowed the streaming logic to be integrated with the application's state.

---

# 🗄️ Database Design

MongoDB is used as the primary application database.

The core entities include:

```text
User
 │
 ├── Favourite Songs
 └── Playlists
        │
        └── Songs

Song
 │
 ├── Metadata
 └── Media URL / Media Information

Playlist
 │
 └── Collection of Songs

Favourite
 │
 └── User ↔ Song relationship
```

The database design separates users, songs, playlists, and favourites so that application data can be queried and managed independently.

---

# ☁️ Media Upload & Delivery

**ImageKit.io** is used for music/media upload and delivery.

Instead of keeping large media files directly inside the application server, the application uses ImageKit for media handling.

```text
Client
  │
  │ Upload
  ▼
Backend
  │
  │ Media Upload
  ▼
ImageKit.io
  │
  │ CDN / Media Delivery
  ▼
Client Audio Player
```

This separation keeps the application server focused on business logic and API operations while media delivery is handled by a dedicated media platform.

---

# 🔌 RESTful API Architecture

The backend follows a REST-based architecture.

The API layer is responsible for operations such as:

- User operations
- Authentication
- Song management
- Playlist management
- Favourite management
- Music search
- Media handling

The frontend communicates with the backend through HTTP APIs rather than directly accessing the database.

```text
React Client
     │
     │ HTTP
     ▼
Express Routes
     │
     ▼
Controllers / Business Logic
     │
     ├──────────────► MongoDB
     │
     └──────────────► ImageKit.io
```

---

# 🐳 Dockerization

The backend services are containerized using **Docker**.

Containerization provides:

- Consistent runtime environments
- Isolated services
- Reproducible deployments
- Easier local development
- Simplified deployment workflows

Conceptually:

```text
Docker Environment
│
├── Backend Service
│
└── Supporting Services
```

---

# ⚙️ CI/CD

The project uses **GitHub Actions** for continuous integration and deployment.

```text
Developer
    │
    ▼
Git Push
    │
    ▼
GitHub Repository
    │
    ▼
GitHub Actions
    │
    ├── Build
    ├── Test
    └── Deploy
```

This reduces manual deployment work and provides a repeatable deployment pipeline.

---

# 🛠️ Technology Stack

### Frontend

- React.js
- JavaScript (ES6+)
- HTML5
- CSS3
- HTML5 Audio API

### Backend

- Node.js
- Express.js
- REST APIs

### Database

- MongoDB

### Media Infrastructure

- ImageKit.io

### DevOps

- Docker
- GitHub Actions

---

# 📂 Project Structure

A high-level structure of the application:

```text
music-streaming-platform/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── ...
│
├── docker/
│
├── .github/
│   └── workflows/
│
└── README.md
```

> The exact structure may differ depending on the current repository organization.

---

# 🔐 Configuration

Create the required environment variables for the backend.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
```

Never commit production credentials or secret keys to Git.

---

# ▶️ Running the Project

Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

Install dependencies for the frontend and backend:

```bash
npm install
```

Configure the required environment variables.

Start the development servers:

```bash
npm run dev
```

The exact commands may vary according to the repository's current package configuration.

---

# 🧠 Engineering Challenges

The project was not limited to implementing CRUD functionality. The major engineering challenges included:

### 1. Media Streaming

Designing the application around large media files rather than treating music as ordinary application data.

### 2. Adaptive Bitrate Streaming

Handling multiple audio representations and designing playback around changing network conditions.

### 3. Custom Audio Playback

Building the playback experience around the HTML5 Audio API and synchronizing player state with the React application.

### 4. Media Storage & Delivery

Separating media infrastructure from the application backend through ImageKit.io.

### 5. Backend Architecture

Designing REST APIs and MongoDB models for users, songs, playlists, and favourites.

### 6. Containerization

Running backend components in reproducible Docker environments.

### 7. Deployment Automation

Creating a GitHub Actions pipeline to automate the build, test, and deployment workflow.

---

# 📈 What I Learned

This project helped me understand the engineering behind a real-world media platform, particularly:

- Full-stack MERN architecture
- REST API design
- MongoDB data modeling
- Media upload and delivery
- HTML5 audio streaming
- **Adaptive Bitrate Streaming (ABS)**
- Client-side playback state management
- Docker containerization
- CI/CD pipelines
- Separation of application and media infrastructure
- Designing a system beyond basic CRUD operations

---

# 🎯 Project Philosophy

This project was intentionally built as an engineering exercise rather than simply reproducing Spotify's UI.

The goal was to understand **how a music streaming platform works internally**:

```text
User
 │
 ▼
React Application
 │
 ▼
REST API
 │
 ├──────────────► MongoDB
 │
 └──────────────► Media Infrastructure
                         │
                         ▼
                    Audio Delivery
                         │
                         ▼
                  Adaptive Streaming
                         │
                         ▼
                   Audio Player
```

The implementation was done **from scratch without vibe coding**, with the focus on understanding the architecture, implementation decisions, trade-offs, and underlying technologies.

---

## 📌 Future Improvements

Potential improvements include:

- More sophisticated bitrate selection algorithms
- Improved network-condition detection
- Audio quality preference controls
- Playback queue management
- Listening history
- Recommendation system
- Caching strategies
- Improved observability
- Horizontal backend scaling
- Dedicated streaming infrastructure for larger traffic volumes

---

## 👨‍💻 Author

**Ravi Prajapati**

Full Stack AI Developer

Technologies: MERN · Python · FastAPI · LangChain · LangGraph · RAG · Docker

---

## ⭐ Project Highlight

> **A full-stack music streaming platform built from scratch, featuring custom HTML5 audio playback, Adaptive Bitrate Streaming, cloud-based media delivery through ImageKit.io, Dockerized services, and automated CI/CD.**
