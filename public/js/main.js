const joinContainer = document.getElementById("join-container");
const chatContainer = document.getElementById("chat-container");
const joinChatForm = document.getElementById("join-chat-form");
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const leaveRoomButton = document.getElementById("leaveRoomButton");
const userNameInput = document.getElementById("username");
const roomNameInput = document.getElementById("room");

document.addEventListener("DOMContentLoaded", () => {

    const socket = io({
        autoConnect: false
    });
    
    joinChatForm.addEventListener("submit", (e) => {
        e.preventDefault();

        this.usersInRoom = [];

        socket.auth = {
            username : userNameInput.value,
            room: roomNameInput.value
        };
        socket.connect();

        joinContainer.style.display = "none";
        chatContainer.style.display = "block";
    });

    leaveRoomButton.addEventListener("click", (e) => {
        e.preventDefault();
        
        joinContainer.style.display = "block";
        chatContainer.style.display = "none";

        socket.disconnect();
    });
    
    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const msg = e.target.elements.msg.value;

        socket.emit("chatMessage", msg);

        // Clear input
        e.target.elements.msg.value = "";
        e.target.elements.msg.focus();
    });

    socket.on("usersInRoom", ({usersInRoom, room}) => {
        usersInRoom.forEach((user) => {
            for (let i = 0; i < this.usersInRoom.length; i++) {
                const existingUser = this.usersInRoom[i];
                if (existingUser.userID === user.userID) {
                    existingUser.connected = user.connected;
                    return;
                }
            }
            user.self = user.userID === socket.userID;
            this.usersInRoom.push(user);
        });

        // Put the current user first, and sort by username
        this.usersInRoom.sort((a, b) => {
            if (a.self) return -1;
            if (b.self) return 1;
            if (a.username < b.username) return -1;
            return a.username > b.username ? 1 : 0;
        });

        outputRoomName(room);
        outputUsers(this.usersInRoom);
    });

    // Note that this might be called on a new connection but also on a reconnection (e.g. after TCP transport close)
    socket.on("userConnected", (user) => {

        // Check for reconnection:
        for (let i = 0; i < this.usersInRoom.length; i++) {
            const existingUser = this.usersInRoom[i];
            if (existingUser.userID === user.userID) {
                existingUser.connected = true;
                outputUsers(this.usersInRoom);
                return;
            }
        }

        // Handle new connection:
        this.usersInRoom.push(user);
        outputUsers(this.usersInRoom);
        outputMessage(user.message);
    });

    socket.on("userDisconnected", (userID) => {
        for (let i = 0; i < this.usersInRoom.length; i++) {
            const user = this.usersInRoom[i];
            if (user.userID === userID) {
                user.connected = false;
                break;
            }
        }

        outputUsers(this.usersInRoom);
    });

    socket.on("userLeftTheRoom", (userID) => {
        this.usersInRoom = this.usersInRoom.filter(function( obj ) {
            return obj.userID !== userID;
        });
        outputUsers(this.usersInRoom);
    });

    socket.on("sessionDetails", ({ sessionID, userID }) => {
        // Attach the session ID to the next reconnection attempts
        socket.auth = { sessionID };
        // Save the ID of the user
        socket.userID = userID;
    });

    socket.on("disconnect", () => {
        this.usersInRoom.forEach((user) => {
            if (user.self) {
                user.connected = false;
            }
        });
        outputUsers(this.usersInRoom);
    });
    
    socket.on("message", message => {
        outputMessage(message);
        // Scroll to the newest message:
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    socket.onAny((event, ...args) => {
        console.log("Catch-all-listener", event, args);
    });
});

// Output message to DOM
function outputMessage(message) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `
        <p class="meta">${message.username}<span> - ${message.time} Uhr</span></p>
		<p class="text">
			${message.text}
		</p>
        `;
    document.querySelector(".chat-messages").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
        ${users.map(user => `
            <li>
            ${user.username}  ${ user.self ? " (yourself)" : "" } 
                <span class="circle ${user.connected ? "connected" : "disconnected" }" 
                    title="${user.connected ? "Online" : "Offline" }"
                />
                
        </li>`).join("")}
    `;
}