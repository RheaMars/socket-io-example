/* abstract */ class MessageStore {
    findMessage(id) {}
    saveMessageToRoom(roomName, message) {}
    findAllMessages() {}
}

class InMemoryMessageStore extends MessageStore {
    constructor() {
        super();
        this.messages = new Map();
    }

    // findMessage(id) {
    //     return this.messages.get(id);
    // }

    saveMessageToRoom(roomName, message) {
        let messages = this.messages.get(roomName);
        if (typeof messages === "undefined"){
            messages = [];
        }
        messages.push(message);
        this.messages.set(roomName, messages);
    }

    //"javascript" => [msg1, msg2]

    // deleteMessagesFromRoom(roomID) {
    //     this.messages.delete(roomID);
    // }

    // findAllMessages() {
    //     return [...this.messages.values()];
    // }
}

module.exports = {
    InMemoryMessageStore
};