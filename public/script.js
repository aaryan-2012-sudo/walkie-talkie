const socket = io();

const usersList = document.getElementById("users");
const talkingStatus = document.getElementById("talkingStatus");
const talkBtn = document.getElementById("talk");
const joinBtn = document.getElementById("join");
const status = document.getElementById("status");

let recorder, stream;
let joined = false;
let username, room;

// beep sound
function beep() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 600;
  osc.connect(ctx.destination);
  osc.start();
  setTimeout(() => osc.stop(), 120);
}

// join room
joinBtn.onclick = () => {
  username = document.getElementById("username").value.trim();
  room = document.getElementById("room").value.trim();

  if (!username || !room) {
    alert("Enter name and room");
    return;
  }

  socket.emit("join-room", { username, room });
  joined = true;
  status.innerText = `Joined room "${room}"`;
};

// start talking
async function startTalk() {
  if (!joined) return alert("Join room first");

  beep();
  socket.emit("start-talking");

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = async (e) => {
    // Convert Blob to ArrayBuffer before sending
    const arrayBuffer = await e.data.arrayBuffer();
    socket.emit("audio", arrayBuffer);
  };

  recorder.start(250); // send data every 250ms for smoother streaming
}

// stop talking
function stopTalk() {
  if (!recorder) return;

  recorder.stop();
  stream.getTracks().forEach(t => t.stop());
  socket.emit("stop-talking");
}

// desktop
talkBtn.onmousedown = startTalk;
talkBtn.onmouseup = stopTalk;

// mobile
talkBtn.ontouchstart = startTalk;
talkBtn.ontouchend = stopTalk;

// update users list
socket.on("users", (users) => {
  usersList.innerHTML = "";
  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user;
    usersList.appendChild(li);
  });
});

// show talking status
socket.on("talking", (username) => {
  talkingStatus.textContent = `🎤 ${username} is talking`;
});

// clear talking status
socket.on("stopped", () => {
  talkingStatus.textContent = "";
});

// system messages
socket.on("system", (msg) => {
  status.innerText = msg;
});

// play incoming audio
socket.on("audio", (arrayBuffer) => {
  // Rebuild Blob with correct MIME type
  const audioBlob = new Blob([arrayBuffer], { type: 'audio/webm' });
  const audioURL = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioURL);
  audio.play().catch(err => console.log("Audio play error:", err));
});
