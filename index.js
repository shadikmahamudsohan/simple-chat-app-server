const express = require('express');
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require('cors');
const { default: mongoose, set } = require('mongoose');
const Message = require('./model/Message');
app.use(cors());
const dotenv = require('dotenv').config();


const server = http.createServer(app);

// connecting the client with the server 
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
    },
});

// for now connecting to local mongodb server with mongoose
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9fuoli1.mongodb.net/?retryWrites=true&w=majority`).then(() => {
    console.log("Connected to database");
});
io.on("connection", (socket) => {
    let roomId = "";

    // joining the room and if the room already has data then adding it's id to roomId
    socket.on("join_room", async (data) => {
        socket.join(data);
        const chatData = await Message.find({ room: data });
        if (chatData) {
            roomId = chatData[0]?._id;
            io.to(data).emit("all_messages", chatData);
        }
    });

    socket.on("send_message", async (data) => {
        try {
            const chatData = await Message.find({ room: data.room });
            // getting the chat data for the room where the user joined
            const dataToUpdate = await Message.findById(chatData[0]?._id);
            if (!dataToUpdate) {

                // if the room has no data it will create the room with the first message sent
                const newData = new Message({
                    messages: [{ id: data.id, message: data.message }],
                    room: data.room
                });
                const savedData = await newData.save();
                if (savedData) {
                    socket.to(data.room).emit("receive_mongodb_id", savedData._id);
                    io.to(data.room).emit("all_messages", [savedData]);
                    console.log("new chat created");
                }
            } else {
                // if the room has that it will update the messages array and add the new message obj
                Message.findOneAndUpdate(
                    { _id: chatData[0]?._id },
                    { $push: { messages: { id: data.id, message: data.message } } },
                    { new: true }
                )
                    .then((doc) => {
                        // Handle success case
                        // console.log(data.room);
                        io.to(data.room).emit("all_messages", [doc]);
                        // console.log(doc);
                        console.log("old chat updated");
                    })
                    .catch((err) => {
                        // Handle error case
                        console.error(err);
                    });
            }
        } catch (error) {
            console.log(error.message);
        }
    });
});

// running the server at http://localhost:3001/
server.listen(3001, () => {
    console.log("server is running on 3001");
});