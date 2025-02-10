require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded images

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Define Mongoose Schema
const postSchema = new mongoose.Schema({
  image: String,
  caption: String,
  likes: { type: Number, default: 0 },
  comments: [{ username: String, text: String }]
});

const Post = mongoose.model('Post', postSchema);

// Set up image storage with multer
const storage = multer.diskStorage({
  destination: './uploads',  // Ensure the uploads folder exists in your project directory
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save file with a unique name based on timestamp
  }
});
const upload = multer({ storage });

// Route to upload an image
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Save only the filename in the database
    const newPost = new Post({
      image: `/uploads/${req.file.filename}`,  // Store the path that can be accessed via the URL
      caption: req.body.caption,
    });

    await newPost.save();
    res.json({ message: 'Post created successfully', post: newPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch all posts
app.get('/posts', async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

// Route to like a post
app.post('/like/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.likes += 1;
  await post.save();
  res.json({ message: 'Liked', likes: post.likes });
});

// Route to add a comment
app.post('/comment/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({ username: req.body.username, text: req.body.text });
  await post.save();
  res.json({ message: 'Comment added', comments: post.comments });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
