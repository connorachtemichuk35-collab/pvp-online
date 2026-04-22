 import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function Game() {
  const canvasRef = useRef(null);
  const socket = useRef(null);

  const [running, setRunning] = useState(false);
  const [room, setRoom] = useState("room1");
  const [status, setStatus] = useState("Not connected");

  const keys = useRef({});
  const joystick = useRef({
    active: false,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0
  });

  const player = useRef({ x: 50, y: 200 });
  const opponent = useRef({ x: 300, y: 200 });

  // TOUCH
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    joystick.current.active = true;
    joystick.current.startX = touch.clientX;
    joystick.current.startY = touch.clientY;
  };

  const handleTouchMove = (e) => {
    if (!joystick.current.active) return;

    const touch = e.touches[0];
    joystick.current.dx = touch.clientX - joystick.current.startX;
    joystick.current.dy = touch.clientY - joystick.current.startY;
  };

  const handleTouchEnd = () => {
    joystick.current.active = false;
    joystick.current.dx = 0;
    joystick.current.dy = 0;
  };

  // KEYBOARD
  useEffect(() => {
    const down = (e) => (keys.current[e.key] = true);
    const up = (e) => (keys.current[e.key] = false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // GAME LOOP
  useEffect(() => {
    if (!running) return;

    console.log("GAME STARTED");
	// CONNECT TO SERVER
socket.current = io("https://online-pvp-server.onrender.com", {
  transports: ["websocket"],
  timeout: 5000
});

socket.current.on("connect", () => {
  console.log("CONNECTED ✅");
  setStatus("Connected");
  socket.current.emit("join-room", room);
});

socket.current.on("connect_error", (err) => {
  console.log("ERROR ❌", err.message);
  setStatus("Server offline");
});

// RECEIVE OPPONENT
socket.current.on("opponent-move", (data) => {
  opponent.current = data;
});

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function update() {
      // keyboard
      if (keys.current["w"]) player.current.y -= 4;
      if (keys.current["s"]) player.current.y += 4;
      if (keys.current["a"]) player.current.x -= 4;
      if (keys.current["d"]) player.current.x += 4;

      // joystick
      if (joystick.current.active) {
        const max = 50;

        const dx = Math.max(-max, Math.min(max, joystick.current.dx));
        const dy = Math.max(-max, Math.min(max, joystick.current.dy));

        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 2) {
          const maxSpeed = 4;
          const force = Math.min(length / max, 1);

          player.current.x += (dx / length) * maxSpeed * force;
          player.current.y += (dy / length) * maxSpeed * force;

        }
      }

      // bounds
      player.current.x = Math.max(
        0,
        Math.min(canvas.width - 30, player.current.x)
      );
      player.current.y = Math.max(
        0,
        Math.min(canvas.height - 30, player.current.y)
      );
	  if (socket.current) {
  socket.current.emit("player-move", player.current);
}
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // background
      ctx.fillStyle = "#ddd";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // grid
      ctx.strokeStyle = "#ccc";
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // player
      ctx.fillStyle = "blue";
      ctx.fillRect(player.current.x, player.current.y, 30, 30);

      // opponent (static for now)
      ctx.fillStyle = "red";
      ctx.fillRect(opponent.current.x, opponent.current.y, 30, 30);

      // text
      ctx.fillStyle = "black";
      ctx.fillText("WASD or touch to move", 10, 20);

      // joystick UI
      const baseX = 80;
      const baseY = canvas.height - 80;

      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(baseX, baseY, 50, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.fill();

      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(
        baseX + joystick.current.dx * 0.3,
        baseY + joystick.current.dy * 0.3,
        20,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "gray";
      ctx.fill();

      ctx.globalAlpha = 1;
    }

    let animationFrameId;

    function loop() {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    }

    loop();

 return () => {
  window.removeEventListener("resize", resizeCanvas);
  if (socket.current) socket.current.disconnect();
  cancelAnimationFrame(animationFrameId);
};
}, [running, room]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Online PvP Game</h2>

      <input
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        placeholder="Room name"
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          touchAction: "none",
          zIndex: 0
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <br />

      <button
        style={{ position: "relative", zIndex: 10 }}
        onClick={() => {
        setStatus("Connecting...");
          setRunning(true);
        }}
      >
        Join Game
      </button>

      <p>{status}</p>
    </div>
  );
}