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

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Run when client connects
io.on('connection', socket => {

    console.log(socket.id + " is connecting");

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        // welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to Chat App!'))
        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat.`));
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    // listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        // emit message to everyone in room
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

    // runs when user disconnects
    socket.on('disconnect', () => {

        console.log(socket.id + " is disconnecting");

        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat.`));
            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = 5000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));