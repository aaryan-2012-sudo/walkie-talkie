const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join-room", ({ username, room }) => {
    socket.username = username;
    socket.room = room;
    socket.join(room);

    socket.to(room).emit("system", `${username} joined the room`);
  });

  socket.on("audio", (audioBlob) => {
    if (!socket.room) return;

    socket.to(socket.room).emit("audio", {
      audio: audioBlob,
      username: socket.username
    });
  });

  socket.on("disconnect", () => {
    if (socket.username && socket.room) {
      socket.to(socket.room).emit(
        "system",
        `${socket.username} left the room`
      );
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
