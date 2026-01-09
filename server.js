const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {}; // { roomName: [usernames] }

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  let currentRoom;
  let username;

  // join room
  socket.on("join-room", ({ username: name, room }) => {
    username = name;
    currentRoom = room;

    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(username);

    // notify all in room
    io.to(room).emit("system", `${username} joined the room`);
    io.to(room).emit("users", rooms[room]);
  });

  // handle audio
  socket.on("audio", (audioChunk) => {
    socket.to(currentRoom).emit("audio", { audio: audioChunk, username });
  });

  // handle talking
  socket.on("start-talking", () => {
    socket.to(currentRoom).emit("talking", username);
  });

  socket.on("stop-talking", () => {
    socket.to(currentRoom).emit("stopped");
  });

  // disconnect
  socket.on("disconnect", () => {
    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom] = rooms[currentRoom].filter(u => u !== username);
      io.to(currentRoom).emit("system", `${username} left the room`);
      io.to(currentRoom).emit("users", rooms[currentRoom]);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on all interfaces at port ${PORT}`);
});
