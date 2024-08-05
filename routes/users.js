const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const path = require('path');
const router = express.Router();

require('dotenv').config();
const secret = process.env.JWT_SECRET || 'mysecret';
const EMAIL_INTERVAL = 5 * 60 * 1000; // 5분

// Nodemailer 설정
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 메모리 내 임시 사용자 데이터 저장소
const tempUsers = {};

// 사용자 정보 반환
router.get('/me', async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(401).json({ msg: '토큰이 유효하지 않습니다.' });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    const { userID, password } = req.body;

    try {
        let user = await User.findOne({ userID });
        if (!user) {
            return res.status(400).json({ msg: '존재하지 않는 사용자입니다.' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ msg: '이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 인증을 완료하세요.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: '잘못된 비밀번호입니다.' });
        }

        const payload = {
            user: {
                id: user.id,
                userID: user.userID
            }
        };

        jwt.sign(
            payload,
            secret,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        res.status(500).send('서버 오류');
    }
});

// 회원가입
router.post('/register', async (req, res) => {
    const { userID, password, username, studentID } = req.body;

    const email = `${studentID}@sungshin.ac.kr`;

    try {
        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            if (user.username === username) {
                return res.status(400).json({ msg: '이미 존재하는 아이디입니다.' });
            }
            if (user.email === email) {
                return res.status(400).json({ msg: '이미 가입된 이메일 주소입니다.' });
            }

            const now = Date.now();
            if (user.lastEmailSent && now - user.lastEmailSent < EMAIL_INTERVAL) {
                return res.status(400).json({ msg: '이메일 전송은 5분에 한 번만 가능합니다. 나중에 다시 시도하세요.' });
            }

            user.lastEmailSent = now;
            await user.save();
        }

        const emailToken = crypto.randomBytes(20).toString('hex');
        const emailTokenExpiry = Date.now() + 3600000; // 1시간 유효

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        tempUsers[emailToken] = {
            userID,
            password: hashedPassword,
            username,
            studentID,
            email,
            emailToken,
            emailTokenExpires: emailTokenExpiry
        };

        const confirmUrl = `http://${req.headers.host}/users/confirm_email?token=${emailToken}`;
        const mailOptions = {
            to: email,
            from: process.env.EMAIL_USER,
            subject: '이메일 인증 요청',
            text: `다음 링크를 클릭하여 이메일을 인증하세요:\n\n${confirmUrl}`
        };

        await transporter.sendMail(mailOptions);

        res.json({ msg: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료하세요.' });
    } catch (err) {
        res.status(500).send('서버 오류');
    }
});

// 이메일 인증
router.get('/confirm_email', async (req, res) => {
    const { token } = req.query;

    try {
        const tempUser = tempUsers[token];
        if (!tempUser || tempUser.emailTokenExpires < Date.now()) {
            return res.status(400).json({ msg: '이메일 인증 토큰이 유효하지 않거나 만료되었습니다.' });
        }

        const { userID, password, username, studentID, email } = tempUser;
        let user = new User({
            userID,
            password,
            username,
            studentID,
            email,
            isVerified: true
        });

        await user.save();

        delete tempUsers[token]; // 임시 데이터 삭제

        res.sendFile(path.join(__dirname, '../public/register_success.html')); // success.html 파일 전송
    } catch (err) {
        res.status(500).send('서버 오류');
    }
});

// 비밀번호 재설정 요청
router.post('/reset_password_request', async (req, res) => {
    const { studentID } = req.body;
    const email = `${studentID}@sungshin.ac.kr`;

    try {
        const user = await User.findOne({ studentID });
        if (!user) {
            return res.status(400).json({ msg: '존재하지 않는 학번입니다.' });
        }

        const now = Date.now();
        if (user.lastEmailSent && now - user.lastEmailSent < EMAIL_INTERVAL) {
            return res.status(400).json({ msg: '이메일 전송은 5분에 한 번만 가능합니다. 나중에 다시 시도하세요.' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1시간 유효

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        user.lastEmailSent = now;
        await user.save();

        const resetUrl = `http://${req.headers.host}/reset_password.html?token=${resetToken}`;
        const mailOptions = {
            to: email,
            from: process.env.EMAIL_USER,
            subject: '비밀번호 재설정 요청',
            text: `다음 링크를 클릭하여 비밀번호를 재설정하세요:\n\n${resetUrl}`
        };

        await transporter.sendMail(mailOptions);

        res.json({ msg: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' });
    } catch (err) {
        res.status(500).send('서버 오류');
    }
});

// 비밀번호 재설정
router.post('/reset_password', async (req, res) => {
    const { token, password } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: '비밀번호 재설정 토큰이 유효하지 않거나 만료되었습니다.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ msg: '비밀번호가 성공적으로 재설정되었습니다.' });
    } catch (err) {
        res.status(500).send('서버 오류');
    }
});

module.exports = router;
