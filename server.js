const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/test.html');
});

io.on('connection', (socket) => {

    console.log(socket.id + " connected");

    socket.on('chat message', msg => {
        console.log(socket.id + " sent message: " + msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', (reason) => {
        console.log(socket.id + ' disconnected: ' + reason);
    });
});

http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});



// const socketio = require("socket.io");
// const server = startServer();
// io = socketio(server);
//
// const DEBUG = process.env.DEBUG || false;
//
// console.log("Debugging enabled: " + DEBUG);
//
// const occupiedRooms = [];
// const minutesToTimeout = 20;
//
// serve();
//
// function serve() {
//
//     io.on("connection", (socket) => {
//
//         if (DEBUG) {
//             console.log("Connection set up.");
//         }
//
//         handleAdminRequestForCurrentRooms(socket, occupiedRooms);
//
//         handleUserRoomConnection(socket, occupiedRooms);
//     });
// }
//
// function handleAdminRequestForCurrentRooms(socket, occupiedRooms) {
//     socket.on("admin.retrieveCurrentRooms", () => {
//         socket.emit("server.retrieveCurrentRooms", {
//             rooms: occupiedRooms
//         });
//     })
// }
//
// function handleUserRoomConnection(socket, occupiedRooms) {
//
//     let socketRoomName;
//     let socketClientName;
//     let socketPlayerNumber;
//
//     socket.on("user.connectToRoom", ({clientNameInput, roomNameInput, joinTypeInput}) => {
//
//         if (joinTypeInput === "create") {
//             handleConnectionToNewRoom(roomNameInput, clientNameInput);
//         }
//         else if (joinTypeInput === "join") {
//             handleConnectionToExistingRoom(roomNameInput, clientNameInput);
//         }
//
//         handleDisconnectionOfUser(socket);
//     });
//
//     function handleConnectionToNewRoom(roomNameInput, clientNameInput) {
//
//         if (roomExists(occupiedRooms, roomNameInput)) {
//             socket.emit("server.roomConnectionResult", {
//                 status: "error",
//                 message: "Room Name is already taken - try again with another Room Name.",
//                 timestamp: getCurrentTimestamp(new Date()),
//             });
//             return;
//         }
//
//         const room = createRoom(roomNameInput, clientNameInput);
//         occupiedRooms.push(room);
//
//         socketRoomName = roomNameInput;
//         socketClientName = clientNameInput;
//         socketPlayerNumber = 1;
//
//         socket.join(socketRoomName);
//
//         handleConnectionTimeout(socket);
//
//         socket.emit("server.roomConnectionResult", {
//             status: "success",
//             message: "Welcome to Room \"" + socketRoomName + "\", " + socketClientName
//                 + ". You are Player " + socketPlayerNumber + ". We are now waiting for your teammate.",
//             timestamp: getCurrentTimestamp(new Date()),
//             clientName: socketClientName,
//             roomName: socketRoomName,
//             playerNumber: socketPlayerNumber
//         });
//
//         if (DEBUG) {
//             console.log(socketClientName + " connected to room " + socketRoomName);
//         }
//
//         handleChatMessages(socket, room, socketClientName);
//
//         handleDraggableElements(socket, room);
//     }
//
//     function handleConnectionToExistingRoom(roomNameInput, clientNameInput) {
//
//         if (!roomExists(occupiedRooms, roomNameInput)) {
//             socket.emit("server.roomConnectionResult", {
//                 status: "error",
//                 message: "Room does not exist.",
//                 timestamp: getCurrentTimestamp(new Date()),
//             });
//             return;
//         }
//
//         const room = getRoomByRoomName(occupiedRooms, roomNameInput);
//
//         if (isRoomFull(room)) {
//             socket.emit("server.roomConnectionResult", {
//                 status: "error",
//                 message: "Room is already full - try again with another Room or create a new one.",
//                 timestamp: getCurrentTimestamp(new Date()),
//             });
//             return;
//         }
//
//         const playerNumber = addPlayerToExistingRoom(room, clientNameInput);
//
//         socketRoomName = roomNameInput;
//         socketClientName = clientNameInput;
//         socketPlayerNumber = playerNumber;
//
//         socket.join(socketRoomName);
//
//         handleConnectionTimeout(socket);
//
//         const clientNameOfOtherPlayer = getClientNameOfOtherPlayer(room, socketPlayerNumber);
//
//         socket.emit("server.roomConnectionResult", {
//             status: "success",
//             message: "Welcome to Room \"" + socketRoomName + "\", " + socketClientName
//                 + ". You are Player " + socketPlayerNumber +". "
//                 + clientNameOfOtherPlayer + " is already waiting for you.",
//             timestamp: getCurrentTimestamp(new Date()),
//             clientName: socketClientName,
//             roomName: socketRoomName,
//             playerNumber: socketPlayerNumber
//         });
//
//         socket.broadcast.to(room.roomName).emit("server.serverMessage", {
//             message: socketClientName + " joined the Room.",
//             timestamp: getCurrentTimestamp(new Date()),
//         });
//
//         handleChatMessages(socket, room, socketClientName);
//
//         handleDraggableElements(socket, room);
//     }
//
//     function handleChatMessages(socket, room, socketClientName) {
//
//         socket.on("user.sendChatMessage", function(message) {
//
//             if (DEBUG) {
//                 console.log(socketClientName + " sent message in room " + room.roomName + ": " + message);
//             }
//
//             io.in(room.roomName).emit("server.chatMessage", {
//                 message: socketClientName + ": " + message,
//                 timestamp: getCurrentTimestamp(new Date()),
//             });
//         });
//     }
//
//     function handleDraggableElements(socket, room) {
//
//         let draggableElements = room.draggableElements;
//
//         for (const draggableElementId in draggableElements) {
//             socket.emit('server.updatePositionOfDraggableElement', draggableElements[draggableElementId]);
//         }
//
//         socket.on("user.dragElement", function(data) {
//             draggableElements[data.id] = data;
//             socket.broadcast.to(room.roomName).emit('server.updatePositionOfDraggableElement', draggableElements[data.id])
//         });
//     }
//
//     function handleDisconnectionOfUser(socket) {
//
//         socket.on("disconnecting", (reason) => {
//
//             if (DEBUG) {
//                 console.log(socketClientName + " is disconnecting from room " + socketRoomName + ": " + reason);
//             }
//
//             io.in(socketRoomName).emit("server.serverMessage", {
//                 message: socketClientName + " left the Room (" + reason + ").",
//                 timestamp: getCurrentTimestamp(new Date()),
//             });
//
//             if (reason === "transport close") {
//                 if (DEBUG) {
//                     console.log("Client number " + socketPlayerNumber + " is not deleted from rooms and room is not deleted.");
//                 }
//                 return;
//             }
//
//             // Last player is about to leave:
//             if (getNumberOfClientsConnectedToRoom(socketRoomName) === 1) {
//                 deleteRoom(occupiedRooms, socketRoomName);
//                 if (DEBUG) {
//                     console.log(socketRoomName + " was deleted.");
//                 }
//             }
//             else {
//                 deletePlayerFromRoom(occupiedRooms, socketRoomName, socketPlayerNumber);
//                 if (DEBUG) {
//                     console.log("Player " + socketPlayerNumber + " was deleted from room " + socketRoomName + ".");
//                 }
//             }
//         })
//     }
//
//     function createRoom(roomName, clientName) {
//
//         const creationDate = new Date();
//         return {
//             "roomName": roomName,
//             "player1": clientName,
//             "createdAt": creationDate.toLocaleDateString() + " " + creationDate.toLocaleTimeString(),
//             "draggableElements": []
//         };
//     }
// }
//
// /**
//  * Disconnect the socket after x minutes of idle time.
//  */
// function handleConnectionTimeout(socket) {
//
//     setTimeout(() => {
//
//         if (DEBUG) {
//             console.log("Client is disconnected due to inactivity.");
//         }
//
//         socket.emit("server.serverMessage", {
//             message: "You were disconnected due to inactivity.",
//             timestamp: getCurrentTimestamp(new Date()),
//         });
//
//         socket.disconnect();
//
//     }, 60 * minutesToTimeout * 1000);
// }
//
// function getNumberOfClientsConnectedToRoom(roomName) {
//     return io.sockets.adapter.rooms.get(roomName)
//         ? io.sockets.adapter.rooms.get(roomName).size : 0;
// }
//
// function roomExists(occupiedRooms, roomName) {
//     return getRoomIndex(occupiedRooms, roomName) !== -1;
// }
//
// function roomHasProperty(room, propertyString) {
//     return typeof room !== "undefined" && Object.hasOwn(room, propertyString);
// }
//
// function isRoomFull(room) {
//     return roomHasProperty(room, "player1") && roomHasProperty(room, "player2");
// }
//
// function getRoomIndex(occupiedRooms, roomName) {
//     return occupiedRooms.map(function (o) {
//         return o.roomName;
//     }).indexOf(roomName);
// }
//
// function getRoomByRoomName(rooms, roomName) {
//     return rooms[getRoomIndex(rooms, roomName)];
// }
//
// /**
//  * @returns {number} playerNumber
//  */
// function addPlayerToExistingRoom(room, clientName) {
//     if (roomHasProperty(room, "player1")) {
//         room.player2 = clientName;
//         return 2;
//     }
//     else if (roomHasProperty(room, "player2")) {
//         room.player1 = clientName;
//         return 1;
//     }
// }
//
// function deleteRoom(occupiedRooms, roomName) {
//     occupiedRooms.splice(occupiedRooms.findIndex(room => room.roomName === roomName), 1);
// }
//
// function deletePlayerFromRoom(occupiedRooms, socketRoomName, playerNumber) {
//
//     const room = getRoomByRoomName(occupiedRooms, socketRoomName);
//
//     if (playerNumber === 1 && roomHasProperty(room, "player1")) {
//         delete room.player1;
//     } else if (playerNumber === 2 && roomHasProperty(room, "player2")) {
//         delete room.player2;
//     }
// }
//
// function getClientNameOfOtherPlayer(room, socketPlayerNumber) {
//     if (socketPlayerNumber === 1) {
//         return room.player2;
//     }
//     return room.player1;
// }
//
// function getCurrentTimestamp(d) {
//     return ('0'+d.getDate()).slice(-2) + "."
//         + ('0'+(d.getMonth() + 1)).slice(-2) + "."
//         + d.getFullYear() + " "
//         + ('0'+d.getHours()).slice(-2) + ":"
//         + ('0'+d.getMinutes()).slice(-2);
// }
//
// function startServer() {
//     const express = require("express");
//     const http = require("http");
//     const path = require("path");
//
//     const PORT = process.env.PORT || 5000;
//
//     const app = express();
//     app.use(express.static(path.join(__dirname, "public")));
//
//     const server = http.createServer(app);
//
//     server.listen(PORT, () => {
//         console.log(`server running at port ${PORT}`);
//     });
//
//     return server;
// }

