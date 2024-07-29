const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const posts = require('./routes/posts');
const users = require('./routes/users');
const auth = require('./middleware/auth');  // 미들웨어 추가

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/srtest')
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

app.use('/posts', posts);
app.use('/users', users);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html')); // 기본 경로를 /main으로 리디렉션
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.get('/write', auth, (req, res) => {  // 인증된 사용자만 접근 가능
    res.sendFile(path.join(__dirname, 'public', 'write.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
