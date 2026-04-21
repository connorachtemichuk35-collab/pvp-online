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

  const player = useRef({ x: 50, y: 200, w: 30, h: 30 });
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
  const opponent = useRef({ x: 300, y: 200, w: 30, h: 30 });

  // keyboard controls
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

  // game + socket
  useEffect(() => {
    if (!running) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    socket.current = io("https://online-pvp-server.onrender.com");

    socket.current.on("connect", () => {
      setStatus("Connected");
      socket.current.emit("join-room", room);
    });

    socket.current.on("opponent-move", (data) => {
      opponent.current = data;
    });

    const sendPosition = () => {
      socket.current.emit("player-move", player.current);
    };

    function update() {
      if (keys.current["w"]) player.current.y -= 4;
      if (keys.current["s"]) player.current.y += 4;
      if (keys.current["a"]) player.current.x -= 4;
      if (keys.current["d"]) player.current.x += 4;
	  if (joystick.current.active) {
  player.current.x += joystick.current.dx * 0.05;
  player.current.y += joystick.current.dy * 0.05;
}

      player.current.x = Math.max(0, Math.min(370, player.current.x));
      player.current.y = Math.max(0, Math.min(370, player.current.y));

      sendPosition();
    }

    function draw() {
      ctx.clearRect(0, 0, 400, 400);

      ctx.fillStyle = "#ddd";
      ctx.fillRect(0, 0, 400, 400);

      // player
      ctx.fillStyle = "blue";
      ctx.fillRect(player.current.x, player.current.y, 30, 30);

      // opponent
      ctx.fillStyle = "red";
      ctx.fillRect(opponent.current.x, opponent.current.y, 30, 30);

      ctx.fillStyle = "black";
      ctx.fillText("WASD to move", 10, 20);
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }

    loop();
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
  width="400"
  height="400"
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
/>
	  

      <br />

      <button onClick={() => setRunning(true)}>Join Game</button>

      <p>{status}</p>
    </div>
  );
}