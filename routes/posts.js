const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');

// Create a new post
router.post('/', auth, async (req, res) => {
    const { title, content } = req.body;

    try {
        const newPost = new Post({
            title,
            content,
            author: req.user.id
        });

        await newPost.save();
        res.json(newPost);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Get Q&A posts with pagination and search
router.get('/qa', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const query = req.query.query || '';

    try {
        const totalPosts = await Post.countDocuments({ title: { $regex: query, $options: 'i' } });
        const totalPages = Math.ceil(totalPosts / limit);
        const posts = await Post.find({ title: { $regex: query, $options: 'i' } })
            .populate('author', ['username'])
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ posts, totalPages });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check user
        if (post.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await Post.deleteOne({ _id: req.params.id });

        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
