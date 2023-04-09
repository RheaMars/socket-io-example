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

users = [];

document.addEventListener("DOMContentLoaded", () => {

    const socket = io({
        autoConnect: false
    });
    
    joinChatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        joinChat(socket, userNameInput.value, roomNameInput.value);
    });

    leaveRoomButton.addEventListener("click", (e) => {
        e.preventDefault();
        joinContainer.style.display = 'block';
        chatContainer.style.display = 'none';

        socket.emit("leaveRoom");
    });
    
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = e.target.elements.msg.value;
        socket.emit('chatMessage', msg);

        // Clear input
        e.target.elements.msg.value = '';
        e.target.elements.msg.focus();
    });

    socket.on("usersInRoom", ({usersInRoom, room}) => {
        usersInRoom.forEach((user) => {
            for (let i = 0; i < this.users.length; i++) {
                const existingUser = this.users[i];
                if (existingUser.userID === user.userID) {
                    existingUser.connected = user.connected;
                    return;
                }
            }
            user.self = user.userID === socket.userID;
            this.users.push(user);
        });

        // Put the current user first, and sort by username
        this.users.sort((a, b) => {
            if (a.self) return -1;
            if (b.self) return 1;
            if (a.username < b.username) return -1;
            return a.username > b.username ? 1 : 0;
        });

        outputRoomName(room);
        outputUsers(this.users);
    });

    socket.on("userConnected", (user) => {
        for (let i = 0; i < this.users.length; i++) {
            const existingUser = this.users[i];
            if (existingUser.userID === user.userID) {
                existingUser.connected = true;
                outputUsers(this.users);
                return;
            }
        }
        this.users.push(user);
        outputUsers(this.users);
    });

    socket.on("userDisconnected", (id) => {

        // TODO Better remove user from this.users completely?!
        // Otherwise users stays forever in the list of users with a red circle.
        for (let i = 0; i < this.users.length; i++) {
            const user = this.users[i];
            if (user.userID === id) {
                user.connected = false;
                break;
            }
        }

        outputUsers(this.users);
    });

    socket.on("session", ({ sessionID, userID }) => {
        // Attach the session ID to the next reconnection attempts
        socket.auth = { sessionID };
        // Save the ID of the user
        socket.userID = userID;
    });

    socket.on("disconnect", () => {
        this.users.forEach((user) => {
            if (user.self) {
                user.connected = false;
            }
        });
        outputUsers(this.users);
    });
    
    socket.on('message', message => {
        outputMessage(message);
        // Scroll to the newest message:
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    // Catch-all-listener
    // TODO Remove when developing is done!
    socket.onAny((event, ...args) => {
        console.log("Catch-all-listener", event, args);
    });
});

function joinChat(socket, username, room) {

    this.users = [];

    socket.auth = { username, room };
    socket.connect();

    joinContainer.style.display = 'none';
    chatContainer.style.display = 'block';
}

// Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
        <p class="meta">${message.username}<span> - ${message.time} Uhr</span></p>
		<p class="text">
			${message.text}
		</p>
        `;
    document.querySelector('.chat-messages').appendChild(div);
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
                
        </li>`).join('')}
    `;
}