const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const formatMessage = require('./server-utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./server-utils/users');

const botName = 'ChatApp Bot';

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to handle authentication
io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    const room = socket.handshake.auth.room;
    if (!username) {
        return next(new Error("invalid username"));
    }
    if (!room) {
        return next(new Error("invalid room"));
    }
    socket.username = username;
    socket.room = room;
    next();
});

// Run when client connects
io.on('connection', socket => {

    console.log(socket.username + " is connecting to room " + socket.room);

    const room = socket.room;

    socket.join(room);

    // Fetch existing users
    const usersInRoom = [];
    for (let [id, socket] of io.of("/").sockets) {
        if (room === socket.room) {
            usersInRoom.push({
                userID: id,
                username: socket.username,
                room: socket.room
            });
        }
    }
    // console.log("Users in room:");
    // console.log(usersInRoom);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Chat App!'));

    // Broadcast when a user connects
    socket.broadcast.to(room).emit('message', formatMessage(botName, `${socket.username} has joined the chat.`));


    socket.emit("users", { usersInRoom, room });

    // Notify existing users in room
    socket.broadcast.to(room).emit("user connected", {
        userID: socket.id,
        username: socket.username,
        room: room
    });

    // Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        // emit message to everyone in room
        io.to(socket.room).emit('message', formatMessage(socket.username, msg));
    })

    // Runs when user disconnects
    socket.on('disconnect', () => {

        console.log(socket.username + " is disconnecting");

        io.to(socket.room).emit('message', formatMessage(botName, `${socket.username} has left the chat.`));

        // notify users upon disconnection
        socket.broadcast.to(socket.room).emit("user disconnected", socket.id);
    });
});

const PORT = 5000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));