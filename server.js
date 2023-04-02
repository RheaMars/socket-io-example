const socketio = require("socket.io");
const express = require("express");
const path = require("path");
const http = require("http");
const server = startServer();
io = socketio(server);

const occupiedRooms = [];
const minutesToTimeout = 20;

handleClientConnections();

function handleClientConnections() {

    io.on("connection", (socket) => {

        //console.log("Client connected");

        handleAdminRequestForCurrentRooms(socket, occupiedRooms);

        handleUserRoomConnection(socket, occupiedRooms);

        socket.on("disconnect", () => {
            //console.log("Client disconnected");
        });
    });
}

function handleAdminRequestForCurrentRooms(socket, occupiedRooms) {
    socket.on("admin.retrieveCurrentRooms", () => {
        socket.emit("server.retrieveCurrentRooms", {
            rooms: occupiedRooms
        });
    })
}

function handleUserRoomConnection(socket, occupiedRooms) {

    socket.on("user.connectToRoom", ({clientName, roomName, joinType}) => {

        if (joinType === "create") {
            handleConnectionToNewRoom(roomName, clientName);
        }
        else if (joinType === "join") {
            handleConnectionToExistingRoom(roomName, clientName);
        }
    });

    function handleConnectionToNewRoom(roomName, clientName) {

        if (roomExists(occupiedRooms, roomName)) {
            socket.emit("server.roomConnectionResult", {
                status: "error",
                message: "Room Name is already taken - try again with another Room Name.",
                timestamp: getCurrentTimestamp(new Date()),
            });
            return;
        }

        const room = createRoom(roomName, clientName);
        occupiedRooms.push(room);

        socket.join(roomName);
        handleConnectionTimeout(socket, occupiedRooms, roomName, clientName, 1);

        socket.emit("server.roomConnectionResult", {
            status: "success",
            message: "Welcome to Room \"" + roomName + "\", " + clientName + ". We are now waiting for your teammate.",
            timestamp: getCurrentTimestamp(new Date()),
            clientName: clientName,
            roomName: roomName,
            playerNumber: 1
        });
    }

    function handleConnectionToExistingRoom(roomName, clientName) {

        if (!roomExists(occupiedRooms, roomName)) {
            socket.emit("server.roomConnectionResult", {
                status: "error",
                message: "Room does not exist.",
                timestamp: getCurrentTimestamp(new Date()),
            });
            return;
        }

        const room = getRoomByRoomName(occupiedRooms, roomName);

        if (roomHasProperty(room, "player2")) {
            socket.emit("server.roomConnectionResult", {
                status: "error",
                message: "Room is already full - try again with another Room or create a new one.",
                timestamp: getCurrentTimestamp(new Date()),
            });
            return;
        }

        room.player2 = clientName;

        socket.join(roomName);
        handleConnectionTimeout(socket, occupiedRooms, roomName, clientName, 2);

        socket.emit("server.roomConnectionResult", {
            status: "success",
            message: "Welcome to Room \"" + roomName + "\", " + clientName + ".",
            timestamp: getCurrentTimestamp(new Date()),
            clientName: clientName,
            roomName: roomName,
            playerNumber: 2
        });

        socket.broadcast.to(room.roomName).emit("server.serverMessage", {
            message: clientName + " joined the Room.",
            timestamp: getCurrentTimestamp(new Date()),
        });
    }

    function createRoom(roomName, clientName) {

        const creationDate = new Date();
        return {
            "roomName": roomName,
            "player1": clientName,
            "createdAt": creationDate.toLocaleDateString() + " " + creationDate.toLocaleTimeString()
        };
    }
}

function getNumberOfClientsConnectedToRoom(roomName) {
    return io.sockets.adapter.rooms.get(roomName)
        ? io.sockets.adapter.rooms.get(roomName).size : 0;
}

/**
 * Disconnect the user after x minutes of idle time and delete the room if nobody is left there.
 */
function handleConnectionTimeout(socket, rooms, roomName, clientName, playerNumber) {

    setTimeout(() => {

        connectionTimeoutHandleSocketCleanup();
        connectionTimeoutHandleRoomCleanup();

    }, 60 * minutesToTimeout * 1000);

    function connectionTimeoutHandleSocketCleanup() {
        socket.emit("server.serverMessage", {
            message: "You were disconnected due to inactivity.",
            timestamp: getCurrentTimestamp(new Date()),
        });
        socket.disconnect();
        socket.broadcast.to(roomName).emit("server.serverMessage", {
            message: clientName + " was disconnected due to inactivity.",
            timestamp: getCurrentTimestamp(new Date()),
        });
    }

    function connectionTimeoutHandleRoomCleanup() {

        if (getNumberOfClientsConnectedToRoom(roomName) === 0) {
            deleteRoom(rooms, roomName);
        }
        else {
            const room = getRoomByRoomName(rooms, roomName);

            if (playerNumber === 1) {
                delete room.player1;
            } else if (playerNumber === 2) {
                delete room.player2;
            }
        }
    }
}

function roomExists(rooms, roomName) {
    return getRoomIndex(rooms, roomName) !== -1;
}

function roomHasProperty(room, propertyString) {
    return Object.hasOwn(room, propertyString);
}

function getRoomIndex(rooms, roomName) {
    return rooms.map(function (o) {
        return o.roomName;
    }).indexOf(roomName);
}

function getRoomByRoomName(rooms, roomName) {
    return rooms[getRoomIndex(rooms, roomName)];
}

function deleteRoom(rooms, roomName) {
    rooms.splice(rooms.findIndex(room => room.roomName === roomName), 1);
}

function getCurrentTimestamp(d) {
    return ('0'+d.getDate()).slice(-2) + "."
        + ('0'+(d.getMonth() + 1)).slice(-2) + "."
        + d.getFullYear() + " "
        + ('0'+d.getHours()).slice(-2) + ":"
        + ('0'+d.getMinutes()).slice(-2);
}

function startServer() {
    const express = require("express");
    const http = require("http");
    const path = require("path");

    const PORT = process.env.PORT || 5000;

    const app = express();
    app.use(express.static(path.join(__dirname, "public")));

    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`server running at port ${PORT}`);
    });

    return server;
}

