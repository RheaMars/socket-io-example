document.addEventListener("DOMContentLoaded", () => {

    const connectButton = document.querySelector("#connect");
    const clientName = document.querySelector("#clientName")
    const roomName = document.querySelector("#roomName");
    const connectionControls = document.querySelector("#connectionControls");
    const serverMessagesContainer = document.querySelector("#serverMessagesContainer");
    const serverMessages = document.querySelector("#serverMessages");

    if (userIsAdmin()) {

        const socket = io();

        socket.emit("admin.retrieveCurrentRooms");

        socket.on("server.retrieveCurrentRooms", response => {
            const rooms = response.rooms;
            fillRoomTableForAdmin(rooms);
        });

        return;
    }

    connectButton.addEventListener("click", () => {
        if (!isUserInputValid()) {
            alert("Please fill out Name and Room Name.");
            return;
        }

        startConnection();
    })

    function startConnection() {

        const socket = io();

        const joinType = document.querySelector("input[name='joinType']:checked");

        socket.emit("user.connectToRoom", {
            clientName: clientName.value,
            roomName: roomName.value,
            joinType: joinType.value
        });

        socket.on("server.roomConnectionResult", response => {

            if (response.status === "success") {
                connectionControls.style.display = "none";
                serverMessagesContainer.style.display = "block";

                const newMessage = document.createElement("div");
                newMessage.innerHTML = response.timestamp + ": " + response.message;
                serverMessages.append(newMessage);

                newMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            else if (response.status === "error") {
                alert(response.message)
            }
        });

        socket.on("server.serverMessage", response => {
            const newMessage = document.createElement("div");
            newMessage.innerHTML = response.timestamp + ": " + response.message;
            serverMessages.appendChild(newMessage);

            newMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    }

    function isUserInputValid() {
        return !(clientName.value === "" || roomName.value === "");
    }

    function userIsAdmin() {
        return window.location.href.indexOf("multiplayer-admin") > -1;
    }

    function fillRoomTableForAdmin(rooms) {

        let counter = 1;

        rooms.forEach(room => {

            let tdCounter = document.createElement("td");
            tdCounter.innerHTML = counter;
            let tdRoomName = document.createElement("td");
            tdRoomName.innerHTML = room.roomName;
            let tdCreatedAt = document.createElement("td");
            tdCreatedAt.innerHTML = room.createdAt;
            let tdPlayer1 = document.createElement("td");
            tdPlayer1.innerHTML = Object.hasOwn(room, "player1") ? room.player1 : "-";
            let tdPlayer2 = document.createElement("td");
            tdPlayer2.innerHTML = Object.hasOwn(room, "player2") ? room.player2 : "-";

            let tableRow = document.createElement("tr");
            tableRow.appendChild(tdCounter);
            tableRow.appendChild(tdRoomName);
            tableRow.appendChild(tdCreatedAt);
            tableRow.appendChild(tdPlayer1);
            tableRow.appendChild(tdPlayer2);

            document.getElementById("adminCurrentRooms").appendChild(tableRow);

            counter++;
        });
    }
})