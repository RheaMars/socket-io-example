# Socket.io example: Chat App with Room Management

This is an example of how to implement a Chat app with Socket.io.
Users can join predefined Rooms and exchange text messages.

Disconnections and reconnections - which are in fact pretty normal in the TCP connection world as soon as you're on 
production - are handled based on this [socket.io-Tutorial](https://socket.io/get-started/private-messaging-part-1/).

Thanks to Render I was able to deploy the application for free: 
[https://socket-io-example.onrender.com/](https://socket-io-example.onrender.com/).

## How to test on localhost?

- Install dependencies e.g. by running `npm install`
- Start the server e.g. by running `npm run dev`
- In the browser:
    - Call http://127.0.0.1:5000 in Tab 1, join a Room.
    - Call http://127.0.0.1:5000 in Tab 2, join the same Room.
    - You might now exchange text messages between the two Clients.

