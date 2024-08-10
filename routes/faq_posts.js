const express = require('express');
const router = express.Router();
const FAQ_Post = require('../models/FAQ_Post');
const auth = require('../middleware/auth');

// Create a new FAQ post
router.post('/', auth, async (req, res) => {
    const { title, subhead, content } = req.body;

    try {
        const newFAQPost = new FAQ_Post({
            title,
            content
        });

        await newFAQPost.save();
        res.json(newFAQPost);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Get FAQ posts with pagination
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Number of posts per page

    try {
        const totalPosts = await FAQ_Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);
        const posts = await FAQ_Post.find()
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ posts, totalPages });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
