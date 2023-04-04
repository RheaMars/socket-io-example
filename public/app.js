document.addEventListener("DOMContentLoaded", () => {

    const connectButton = $("#connect");
    const clientName = $("#clientName")
    const roomName = $("#roomName");
    const connectionControls = $("#connectionControls");
    const serverMessagesContainer = $("#serverMessagesContainer");
    const serverMessages = $("#serverMessages");
    const draggableContainer = $("#draggableContainer");
    const draggableElements = $(".syncedDraggable");
    const adminCurrentRooms = $("#adminCurrentRooms");

    if (userIsAdmin()) {

        const socket = io();

        socket.emit("admin.retrieveCurrentRooms");

        socket.on("server.retrieveCurrentRooms", response => {
            const rooms = response.rooms;
            fillRoomTableForAdmin(rooms);
        });

        return;
    }

    connectButton.on("click", () => {
        if (!isUserInputValid()) {
            alert("Please fill out Name and Room Name.");
            return;
        }
        startConnection();
    });

    function startConnection() {

        const socket = io();

        const joinType = $("input[name='joinType']:checked");

        socket.emit("user.connectToRoom", {
            clientNameInput: clientName.val(),
            roomNameInput: roomName.val(),
            joinTypeInput: joinType.val()
        });

        socket.on("server.roomConnectionResult", response => {

            if (response.status === "success") {
                connectionControls.hide();
                serverMessagesContainer.show();

                draggableElements.each(function(i, obj) {
                    const coord = $(this).position();
                    $(this).text(Math.round(coord.left) + " / " + Math.round(coord.top));
                });
                draggableContainer.show();

                const message = ("<div>" + response.timestamp + ": " + response.message + "</div>");
                serverMessages.append(message);
                serverMessages.animate({ scrollTop: serverMessages.prop("scrollHeight")}, 700);

                draggableElements.draggable({
                    drag: function (event, ui) {
                        const coord = $(this).position();
                        $(this).text(Math.round(coord.left) + " / " + Math.round(coord.top));
                        socket.emit('user.dragElement', {
                            id: $(this).attr('id'),
                            x: coord.left,
                            y: coord.top
                        });
                    }
                });

                socket.on("server.updatePositionOfDraggableElement", function (data) {
                    const draggableElement = $("#" + data.id);
                    draggableElement.css({
                        left: data.x + "px",
                        top: data.y + "px"
                    });
                    const coord = draggableElement.position();
                    draggableElement.text(Math.round(coord.left) + " / " + Math.round(coord.top));
                });
            }
            else if (response.status === "error") {
                alert(response.message)
            }
        });

        socket.on("server.serverMessage", response => {
            const message = ("<div>" + response.timestamp + ": " + response.message + "</div>");
            serverMessages.append(message);
            serverMessages.animate({ scrollTop: serverMessages.prop("scrollHeight")}, 700);
        });
    }

    function isUserInputValid() {
        return clientName.val() !== "" && roomName.val() !== "";
    }

    function userIsAdmin() {
        return window.location.href.indexOf("multiplayer-admin") > -1;
    }

    function fillRoomTableForAdmin(rooms) {

        let counter = 1;

        rooms.forEach(room => {

            let row = "<tr>";
            row += "<td>" + counter + "</td>";
            row += "<td>" + room.roomName + "</td>";
            row += "<td>" + room.createdAt + "</td>";
            row += "<td>" + (Object.hasOwn(room, "player1") ? room.player1 : "-") + "</td>";
            row += "<td>" + (Object.hasOwn(room, "player2") ? room.player2 : "-") + "</td>";
            row += "</tr>";

            adminCurrentRooms.append(row);

            counter++;
        });
    }
})