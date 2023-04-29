const mongoose = require('mongoose');
const messageSchema = mongoose.Schema({
    messages: [{
        id: {
            type: String,
            required: [true, "id is messing"]
        },
        message: {
            type: String,
            required: [true, "message is messing"]
        }
    }],
    room: {
        type: String,
        required: [true, "room is messing"]
    }
}, {
    timestamp: true
});

const Message = mongoose.model("message", messageSchema);

module.exports = Message;