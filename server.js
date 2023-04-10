const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const crypto = require("crypto");
const formatMessage = require("./server-utils/messages");
const { InMemorySessionStore } = require("./server-utils/sessionStore");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const randomId = () => crypto.randomBytes(8).toString("hex");
const sessionStore = new InMemorySessionStore();

// Middleware to handle authentication
io.use((socket, next) => {

    // Check if user can be found by session id:
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        const session = sessionStore.findSession(sessionID);
        if (session) {
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.username = session.username;
            socket.room = session.room;
            return next();
        }
    }

    // If no session was found create new session data:
    const username = socket.handshake.auth.username;
    const room = socket.handshake.auth.room;
    if (!username) {
        return next(new Error("invalid username"));
    }
    if (!room) {
        return next(new Error("invalid room"));
    }
    socket.sessionID = randomId();
    socket.userID = randomId();
    socket.username = username;
    socket.room = room;
    next();
});

io.on("connection", socket => {

    console.log(socket.username + " is connecting to room " + socket.room);

    const room = socket.room;

    // Persist session
    sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: true,
        room: room
    });

    // Emit session details
    socket.emit("sessionDetails", {
        sessionID: socket.sessionID,
        userID: socket.userID,
    });

    socket.join(room);

    // Fetch existing users
    const usersInRoom = [];
    sessionStore.findAllSessions().forEach((session) => {
        if (room === session.room) {
            usersInRoom.push({
                userID: session.userID,
                username: session.username,
                connected: session.connected,
                room: session.room
            })
        }
    });

    socket.emit("usersInRoom", { usersInRoom, room });

    socket.broadcast.to(room).emit("userConnected", {
        userID: socket.userID,
        username: socket.username,
        room: room,
        connected: true,
    });

    socket.on("leaveRoom", () => {
        socket.disconnect();
        //sessionStore.deleteSession(socket.sessionID);
    });

    socket.on("disconnect", async () => {

        console.log(socket.username + " is disconnecting from room " + socket.room);

        socket.broadcast.to(socket.room).emit("userDisconnected", socket.userID);

        // Update the connection status of the session
        sessionStore.saveSession(socket.sessionID, {
            userID: socket.userID,
            username: socket.username,
            connected: false,
            room: socket.room
        });
    });

    socket.on("chatMessage", (msg) => {
        io.to(socket.room).emit("message", formatMessage(socket.username, msg));
    });
});

const PORT = 5000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));