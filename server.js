const rooms = {};

io.on("connection", (socket) => {
  socket.on("join-room", ({ username, room }) => {
    socket.username = username;
    socket.room = room;

    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(username);

    io.to(room).emit("users", rooms[room]);
    socket.to(room).emit("system", `${username} joined`);
  });

  socket.on("start-talking", () => {
    socket.to(socket.room).emit("talking", socket.username);
  });

  socket.on("stop-talking", () => {
    socket.to(socket.room).emit("stopped", socket.username);
  });

  socket.on("audio", (audio) => {
    socket.to(socket.room).emit("audio", {
      audio,
      username: socket.username
    });
  });

  socket.on("disconnect", () => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    rooms[room] = rooms[room].filter(u => u !== socket.username);
    io.to(room).emit("users", rooms[room]);
    socket.to(room).emit("system", `${socket.username} left`);
  });
});
