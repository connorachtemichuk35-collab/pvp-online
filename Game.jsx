import { useEffect, useRef, useState } from "react";

export default function Game() {
  const canvasRef = useRef(null);

  const [running, setRunning] = useState(false);

  const keys = useRef({});
  const bullets = useRef([]);

  const player = useRef({
    x: 200,
    y: 200,
    hp: 100,
    dirX: 1,
    dirY: 0
  });

  const enemy = useRef({
    x: 500,
    y: 300,
    hp: 100
  });

  // keyboard
  useEffect(() => {
    const down = (e) => {
      keys.current[e.key] = true;

      if (e.key === " ") {
        shoot();
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

  function shoot() {
    bullets.current.push({
      x: player.current.x + 15,
      y: player.current.y + 15,
      vx: player.current.dirX * 6,
      vy: player.current.dirY * 6
    });
  }

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
      // movement
      if (keys.current["w"]) {
        player.current.y -= 4;
        player.current.dirX = 0;
        player.current.dirY = -1;
      }
      if (keys.current["s"]) {
        player.current.y += 4;
        player.current.dirX = 0;
        player.current.dirY = 1;
      }
      if (keys.current["a"]) {
        player.current.x -= 4;
        player.current.dirX = -1;
        player.current.dirY = 0;
      }
      if (keys.current["d"]) {
        player.current.x += 4;
        player.current.dirX = 1;
        player.current.dirY = 0;
      }

      // bullets move
      bullets.current.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
      });

      // hit detection
      bullets.current.forEach((b) => {
        if (
          b.x > enemy.current.x &&
          b.x < enemy.current.x + 30 &&
          b.y > enemy.current.y &&
          b.y < enemy.current.y + 30
        ) {
          enemy.current.hp -= 5;
          b.x = -100; // remove bullet
        }
      });

      // simple enemy movement
      if (enemy.current.x > player.current.x) enemy.current.x -= 1;
      if (enemy.current.x < player.current.x) enemy.current.x += 1;
      if (enemy.current.y > player.current.y) enemy.current.y -= 1;
      if (enemy.current.y < player.current.y) enemy.current.y += 1;

      // enemy damage
      if (
        Math.abs(player.current.x - enemy.current.x) < 30 &&
        Math.abs(player.current.y - enemy.current.y) < 30
      ) {
        player.current.hp -= 0.2;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // background
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // player
      ctx.fillStyle = "cyan";
      ctx.fillRect(player.current.x, player.current.y, 30, 30);

      // enemy
      ctx.fillStyle = "red";
      ctx.fillRect(enemy.current.x, enemy.current.y, 30, 30);

      // bullets
      ctx.fillStyle = "yellow";
      bullets.current.forEach((b) => {
        ctx.fillRect(b.x, b.y, 5, 5);
      });

      // health bars
      ctx.fillStyle = "green";
      ctx.fillRect(player.current.x, player.current.y - 10, player.current.hp, 5);

      ctx.fillRect(enemy.current.x, enemy.current.y - 10, enemy.current.hp, 5);

      // UI
      ctx.fillStyle = "white";
      ctx.fillText("WASD + SPACE", 20, 20);
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
    <div>
      <button
        onClick={() => setRunning(true)}
        style={{ position: "absolute", zIndex: 10 }}
      >
        Start Game
      </button>

      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh"
        }}
      />
    </div>
  );
}