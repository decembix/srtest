const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FAQ_PostSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('FAQ_Post', FAQ_PostSchema);