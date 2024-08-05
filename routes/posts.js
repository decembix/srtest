const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');

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

// Get FAQ posts
router.get('/faq', async (req, res) => {
    try {
        const faqPosts = await Post.find({ author: 'JBJD' });
        res.json(faqPosts);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Get Q&A posts with pagination and search
router.get('/qa', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // 한 페이지당 보이는 게시글 수 (여기서 조정)
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

// Get single Q&A post with comments
router.get('/qa/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', ['username']);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Get previous and next posts for navigation
router.get('/qa/navigation/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const prevPost = await Post.findOne({ date: { $lt: post.date } }).sort({ date: -1 });
        const nextPost = await Post.findOne({ date: { $gt: post.date } }).sort({ date: 1 });

        res.json({ prevPost, nextPost });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Add comment to Q&A post
router.post('/qa/:id/comments', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        const comment = {
            content: req.body.content,
            author: req.user.id
        };
        post.comments.push(comment);
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
    const { password } = req.body;

    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: '비밀번호가 틀렸습니다.' });
        }

        await post.remove();
        res.json({ success: true, msg: 'Post removed' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
