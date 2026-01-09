const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server);

app.use(express.static("public"));

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("offer", offer => socket.broadcast.emit("offer", offer));
  socket.on("answer", answer => socket.broadcast.emit("answer", answer));
  socket.on("ice-candidate", candidate => socket.broadcast.emit("ice-candidate", candidate));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

