# Socket.io example: Room management, text chat & draggable elements

This is a small example of how to set up a Socket connection between two Clients.

- Clients can create and join Rooms, exactly two Clients are able to join the same Room
- An Admin page gives an overview of all current Rooms and their occupancy
- The connected Clients are able to exchange messages via text chat and to drag elements, which are synced on drag.

## How to test on localhost?

- Checkout the repository.
- Install dependencies e.g. by running `npm install`
- Start the server e.g. by running `npm run dev`
- In the browser:
    - Call http://127.0.0.1:5000 in Tab 1, then choose "Multiplayer" and create a new room
    - Call http://127.0.0.1:5000 in Tab 2, then choose "Multiplayer" and join the existing room
    - You might now write text messages and drag the colored elements, which will be visible for the other Client.
    - For an overview of all current rooms go to: http://127.0.0.1:5000/multiplayer-admin.html.
        - Note that this page needs to be reloaded for an update.

