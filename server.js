require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const posts = require('./routes/posts');
const users = require('./routes/users');
const auth = require('./middleware/auth');  // 미들웨어 추가
const faq_posts = require('./routes/faq_posts');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/srtest')
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

app.use('/posts', posts);
app.use('/users', users);
app.use('/faq_posts',faq_posts); // Add this line
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/view', (req, res) => {  // 인증된 사용자만 접근 가능
    res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/Sujung', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Sujung.html'));
});

app.get('/Unjung', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Unjung.html'));
});

app.get('/Bus', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Bus.html'));
});



app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/qa_post', auth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qa_post.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
