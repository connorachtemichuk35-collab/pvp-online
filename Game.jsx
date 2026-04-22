import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function Game() {
  const canvasRef = useRef(null);
  const socket = useRef(null);

  const [running, setRunning] = useState(false);
  const [room, setRoom] = useState("room1");
  const [status, setStatus] = useState("Not connected");

  const keys = useRef({});
  const bullets = useRef([]);

  const player = useRef({ x: 100, y: 200, hp: 100 });
  const opponent = useRef({ x: 400, y: 200, hp: 100 });

  // KEYBOARD
  useEffect(() => {
    const down = (e) => {
      keys.current[e.key] = true;

      // SHOOT
      if (e.key === " ") {
        bullets.current.push({
          x: player.current.x + 15,
          y: player.current.y + 15,
          vx: 6,
          vy: 0
        });
      }
    };

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

    // CONNECT
    socket.current = io("https://online-pvp-server.onrender.com", {
      transports: ["websocket"]
    });

    socket.current.on("connect", () => {
      setStatus("Connected");
      socket.current.emit("join-room", room);
    });

    socket.current.on("connect_error", () => {
      setStatus("Server offline");
    });

    socket.current.on("opponent-update", (data) => {
      opponent.current = data;
    });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    function update() {
      // movement
      if (keys.current["w"]) player.current.y -= 4;
      if (keys.current["s"]) player.current.y += 4;
      if (keys.current["a"]) player.current.x -= 4;
      if (keys.current["d"]) player.current.x += 4;

      // bullets
      bullets.current.forEach((b) => {
        b.x += b.vx;
      });

      // collision
      bullets.current.forEach((b) => {
        if (
          b.x > opponent.current.x &&
          b.x < opponent.current.x + 30 &&
          b.y > opponent.current.y &&
          b.y < opponent.current.y + 30
        ) {
          opponent.current.hp -= 5;
        }
      });

      // send to server
      if (socket.current && socket.current.connected) {
        socket.current.emit("player-update", {
          ...player.current
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // background
      ctx.fillStyle = "#ddd";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // player
      ctx.fillStyle = "blue";
      ctx.fillRect(player.current.x, player.current.y, 30, 30);

      // opponent
      ctx.fillStyle = "red";
      ctx.fillRect(opponent.current.x, opponent.current.y, 30, 30);

      // bullets
      ctx.fillStyle = "black";
      bullets.current.forEach((b) => {
        ctx.fillRect(b.x, b.y, 5, 5);
      });

      // health bars
      ctx.fillStyle = "green";
      ctx.fillRect(player.current.x, player.current.y - 10, player.current.hp, 5);

      ctx.fillStyle = "green";
      ctx.fillRect(
        opponent.current.x,
        opponent.current.y - 10,
        opponent.current.hp,
        5
      );

      ctx.fillStyle = "black";
      ctx.fillText("WASD to move, SPACE to shoot", 10, 20);
    }

    let id;
    function loop() {
      update();
      draw();
      id = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      window.removeEventListener("resize", resize);
      if (socket.current) socket.current.disconnect();
      cancelAnimationFrame(id);
    };
  }, [running, room]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Online PvP Game</h2>

      <input
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1
        }}
      />

      <br />

      <button
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