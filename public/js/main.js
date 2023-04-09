const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');

// Get  username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

const socket = io({
    autoConnect: false
});
socket.auth = { username, room };
socket.connect();

// Join chatroom
socket.emit('joinRoom', { username, room });

socket.on("users", ({usersInRoom, room}) => {
    usersInRoom.forEach((user) => {
        user.self = user.userID === socket.id;
        initReactiveProperties(user);
    });
    // put the current user first, and sort by username
    this.users = usersInRoom.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
    });

    outputRoomName(room);
    outputUsers(this.users);
});

socket.on("user connected", (user) => {
    initReactiveProperties(user);
    this.users.push(user);
    outputUsers(this.users);
});

socket.on("user disconnected", (id) => {
    for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        if (user.userID === id) {
            user.connected = false;
            break;
        }
    }
    outputUsers(this.users);
});

// Message from server
socket.on('message', message => {
    outputMessage(message);
    // Scroll automatically down to the newest message
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("disconnect", () => {
    this.users.forEach((user) => {
        if (user.self) {
            user.connected = false;
        }
    });
    outputUsers(this.users);
});

// Catch-all-listener
// TODO Remove when developing is done!
socket.onAny((event, ...args) => {
    console.log("Catch-all-listener", event, args);
});

const initReactiveProperties = (user) => {
    user.connected = true;
    //user.messages = [];
};

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // get message text
    const msg = e.target.elements.msg.value;
    // Emit message to server
    socket.emit('chatMessage', msg);
    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

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