const socket = io();
let localStream;
let peer;

const button = document.getElementById("talk");

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function init() {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  peer = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track =>
    peer.addTrack(track, localStream)
  );

  peer.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("ice-candidate", e.candidate);
    }
  };

  peer.ontrack = e => {
    const audio = document.createElement("audio");
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };
}

socket.on("offer", async offer => {
  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit("answer", answer);
});

socket.on("answer", answer => {
  peer.setRemoteDescription(answer);
});

socket.on("ice-candidate", candidate => {
  peer.addIceCandidate(candidate);
});

button.onmousedown = async () => {
  if (!peer) await init();
  localStream.getTracks().forEach(t => (t.enabled = true));
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("offer", offer);
};

button.onmouseup = () => {
  localStream.getTracks().forEach(t => (t.enabled = false));
};
