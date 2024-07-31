const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Login a user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('로그인 시도:', { username, password }); // 디버깅용 로그

        // Check if the user exists
        let user = await User.findOne({ username });
        if (!user) {
            console.log('사용자 없음'); // 디버깅용 로그
            return res.status(400).json({ msg: '존재하지 않는 사용자입니다.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('비밀번호 불일치'); // 디버깅용 로그
            return res.status(400).json({ msg: '잘못된 비밀번호입니다.' });
        }

        // Create and send token
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('서버 오류:', err.message);
        res.status(500).send('서버 오류');
    }
});

module.exports = router;
