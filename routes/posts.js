const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');

// Create a new post
router.post('/write', auth, async (req, res) => {
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

// Get all posts
router.get('/write', async (req, res) => {
    try {
        const posts = await Post.find().populate('author', ['username']).sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Search posts
router.get('/search/:query', async (req, res) => {
    const query = req.params.query;
    try {
        const posts = await Post.find({ title: { $regex: query, $options: 'i' } }).populate('author', 'username');
        res.json(posts);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
    try {
        await Post.findByIdAndRemove(req.params.id);
        res.json({ msg: 'Post removed' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
