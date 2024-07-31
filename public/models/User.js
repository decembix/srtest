const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true // 고유 인덱스 추가
    },
    studentID: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // 고유 인덱스 추가
    }
});

module.exports = mongoose.model('User', UserSchema);
