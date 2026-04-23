import { useEffect, useRef, useState } from "react";

export default function Game() {
  const canvasRef = useRef(null);

  const [running, setRunning] = useState(false);

  const keys = useRef({});
  const bullets = useRef([]);

  const joystick = useRef({
    active: false,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0
  });

  const player = useRef({ x: 100, y: 200, hp: 100 });
  const enemy = useRef({ x: 500, y: 200, hp: 100 });

  // KEYBOARD
  useEffect(() => {
    const down = (e) => {
      keys.current[e.key] = true;

      if (e.key === " ") shoot();
    };

    const up = (e) => (keys.current[e.key] = false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // TOUCH
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    joystick.current.active = true;
    joystick.current.startX = t.clientX;
    joystick.current.startY = t.clientY;

    shoot(); // tap to shoot
  };

  const handleTouchMove = (e) => {
    if (!joystick.current.active) return;
    const t = e.touches[0];

    joystick.current.dx = t.clientX - joystick.current.startX;
    joystick.current.dy = t.clientY - joystick.current.startY;
  };

  const handleTouchEnd = () => {
    joystick.current.active = false;
    joystick.current.dx = 0;
    joystick.current.dy = 0;
  };

  function shoot() {
    bullets.current.push({
      x: player.current.x + 15,
      y: player.current.y + 15,
      vx: 6,
      vy: 0
    });
  }

  // GAME LOOP
  useEffect(() => {
    if (!running) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    function update() {
      // keyboard movement
      if (keys.current["w"]) player.current.y -= 4;
      if (keys.current["s"]) player.current.y += 4;
      if (keys.current["a"]) player.current.x -= 4;
      if (keys.current["d"]) player.current.x += 4;

      // joystick movement
      if (joystick.current.active) {
        player.current.x += joystick.current.dx * 0.05;
        player.current.y += joystick.current.dy * 0.05;
      }

      // bullets move
      bullets.current.forEach((b) => {
        b.x += b.vx;
      });

      // collision
      bullets.current.forEach((b) => {
        if (
          b.x > enemy.current.x &&
          b.x < enemy.current.x + 30 &&
          b.y > enemy.current.y &&
          b.y < enemy.current.y + 30
        ) {
          enemy.current.hp -= 2;
        }
      });

      // keep inside screen
      player.current.x = Math.max(0, Math.min(canvas.width - 30, player.current.x));
      player.current.y = Math.max(0, Math.min(canvas.height - 30, player.current.y));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // background
      ctx.fillStyle = "#eee";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // player
      ctx.fillStyle = "blue";
      ctx.fillRect(player.current.x, player.current.y, 30, 30);

      // enemy
      ctx.fillStyle = "red";
      ctx.fillRect(enemy.current.x, enemy.current.y, 30, 30);

      // bullets
      ctx.fillStyle = "black";
      bullets.current.forEach((b) => {
        ctx.fillRect(b.x, b.y, 5, 5);
      });

      // health bars
      ctx.fillStyle = "green";
      ctx.fillRect(player.current.x, player.current.y - 10, player.current.hp, 5);

      ctx.fillStyle = "green";
      ctx.fillRect(enemy.current.x, enemy.current.y - 10, enemy.current.hp, 5);

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

      ctx.fillStyle = "black";
      ctx.fillText("WASD + SPACE | Tap to shoot", 10, 20);
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
      cancelAnimationFrame(id);
    };
  }, [running]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🔥 PvP Game (Working)</h2>

      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <button
        style={{ position: "relative", zIndex: 10 }}
        onClick={() => setRunning(true)}
      >
        Start Game
      </button>
    </div>
  );
}