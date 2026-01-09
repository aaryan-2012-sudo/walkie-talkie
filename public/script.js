const socket = io();

const usersList = document.getElementById("users");
const talkingStatus = document.getElementById("talkingStatus");

const talkBtn = document.getElementById("talk");
const joinBtn = document.getElementById("join");
const status = document.getElementById("status");

let recorder;
let stream;
let joined = false;

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
  const username = document.getElementById("username").value;
  const room = document.getElementById("room").value;

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
  if (!joined) {
    alert("Join a room first");
    return;
  }

  beep();

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = (e) => {
    socket.emit("audio", e.data);
  };

  recorder.start();
}

// stop talking
function stopTalk() {
  if (!recorder) return;

  recorder.stop();
  stream.getTracks().forEach(t => t.stop());
}

// desktop
talkBtn.onmousedown = startTalk;
talkBtn.onmouseup = stopTalk;

// mobile
talkBtn.ontouchstart = startTalk;
talkBtn.ontouchend = stopTalk;

// play incoming audio
socket.on("audio", ({ audio, username }) => {
  status.innerText = `${username} is talking`;
  const audioURL = URL.createObjectURL(audio);
  const a = new Audio(audioURL);
  a.play();
});

// system messages
socket.on("system", (msg) => {
  status.innerText = msg;
});
