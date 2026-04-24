(function () {
  "use strict";

  var canvas = document.getElementById("dream-stars");
  if (!canvas) {
    return;
  }

  var context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var state = {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    width: 0,
    height: 0,
    stars: [],
    sparks: [],
    pointer: {
      x: 0,
      y: 0,
      active: false,
      lastSparkAt: 0
    },
    scrollY: window.scrollY || window.pageYOffset || 0,
    scrollVelocity: 0,
    lastFrameTime: 0
  };

  var starPalette = [
    [255, 244, 250],
    [219, 236, 255],
    [242, 225, 255],
    [255, 237, 224],
    [215, 255, 241]
  ];

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function resizeCanvas() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;

    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = state.width + "px";
    canvas.style.height = state.height + "px";

    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    createStars();
  }

  function createStars() {
    var area = state.width * state.height;
    var count = Math.round(area / 12000);
    count = clamp(count, 65, 165);

    if (motionQuery.matches) {
      count = Math.round(count * 0.55);
    }

    state.stars = [];
    for (var i = 0; i < count; i++) {
      var color = starPalette[Math.floor(Math.random() * starPalette.length)];
      state.stars.push({
        x: Math.random() * state.width,
        y: Math.random() * state.height,
        size: randomBetween(0.6, 2.2),
        alpha: randomBetween(0.3, 0.85),
        depth: randomBetween(0.18, 1),
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: randomBetween(0.7, 1.8),
        driftX: randomBetween(4, 18),
        driftY: randomBetween(4, 24),
        spark: Math.random() < 0.18,
        color: color
      });
    }
  }

  function rgba(color, alpha) {
    return "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", " + alpha + ")";
  }

  function wrap(value, min, max) {
    var range = max - min;
    while (value < min) {
      value += range;
    }
    while (value > max) {
      value -= range;
    }
    return value;
  }

  function spawnSparks(x, y, amount, sourceDelta) {
    if (motionQuery.matches) {
      return;
    }

    for (var i = 0; i < amount; i++) {
      var color = starPalette[Math.floor(Math.random() * starPalette.length)];
      state.sparks.push({
        x: x + randomBetween(-10, 10),
        y: y + randomBetween(-10, 10),
        vx: randomBetween(-0.45, 0.45) + sourceDelta * 0.002,
        vy: randomBetween(-0.5, 0.25),
        size: randomBetween(0.8, 2.8),
        life: 0,
        ttl: randomBetween(380, 1100),
        color: color
      });
    }
  }

  function handlePointerMove(event) {
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
    state.pointer.active = true;

    if (event.timeStamp - state.pointer.lastSparkAt > 42) {
      spawnSparks(state.pointer.x, state.pointer.y, 2, 0);
      state.pointer.lastSparkAt = event.timeStamp;
    }
  }

  function handlePointerLeave() {
    state.pointer.active = false;
  }

  function handleScroll() {
    var nextScrollY = window.scrollY || window.pageYOffset || 0;
    var delta = nextScrollY - state.scrollY;
    state.scrollY = nextScrollY;
    state.scrollVelocity = clamp(state.scrollVelocity + delta * 0.18, -28, 28);

    if (Math.abs(delta) > 10) {
      var edgeY = delta > 0 ? state.height + 6 : -6;
      spawnSparks(randomBetween(0, state.width), edgeY, 3, delta);
    }
  }

  function drawSparkStar(x, y, size, color, alpha) {
    context.save();
    context.translate(x, y);
    context.strokeStyle = rgba(color, alpha);
    context.lineWidth = Math.max(0.65, size * 0.35);
    context.shadowBlur = size * 10;
    context.shadowColor = rgba(color, alpha * 0.9);

    context.beginPath();
    context.moveTo(-size * 2.2, 0);
    context.lineTo(size * 2.2, 0);
    context.moveTo(0, -size * 2.2);
    context.lineTo(0, size * 2.2);
    context.stroke();

    context.rotate(Math.PI / 4);
    context.globalAlpha = alpha * 0.7;
    context.beginPath();
    context.moveTo(-size * 1.5, 0);
    context.lineTo(size * 1.5, 0);
    context.moveTo(0, -size * 1.5);
    context.lineTo(0, size * 1.5);
    context.stroke();

    context.globalAlpha = 1;
    context.fillStyle = rgba(color, alpha);
    context.beginPath();
    context.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawStar(star, time) {
    var driftX = Math.cos(time * 0.00011 + star.phase) * star.driftX;
    var driftY = Math.sin(time * 0.00016 + star.phase) * star.driftY;
    var x = star.x + driftX;
    var y = star.y + driftY + state.scrollY * star.depth * 0.14;
    y = wrap(y, -20, state.height + 20);

    var twinkle = 0.55 + 0.45 * Math.sin(time * 0.001 * star.twinkleSpeed + star.phase);
    var alpha = star.alpha * twinkle;

    if (state.pointer.active) {
      var dx = x - state.pointer.x;
      var dy = y - state.pointer.y;
      var distance = Math.sqrt(dx * dx + dy * dy) || 1;
      var radius = 120;

      if (distance < radius) {
        var force = 1 - distance / radius;
        x += (dx / distance) * force * 10 * star.depth;
        y += (dy / distance) * force * 10 * star.depth;
        alpha += force * 0.35;
      }
    }

    alpha += Math.min(Math.abs(state.scrollVelocity) * 0.01, 0.18);
    alpha = clamp(alpha, 0.08, 1);

    if (star.spark) {
      drawSparkStar(x, y, star.size, star.color, alpha);
      return;
    }

    context.save();
    context.fillStyle = rgba(star.color, alpha);
    context.shadowBlur = star.size * 10;
    context.shadowColor = rgba(star.color, alpha * 0.85);
    context.beginPath();
    context.arc(x, y, star.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawSparks(deltaTime) {
    for (var i = state.sparks.length - 1; i >= 0; i--) {
      var spark = state.sparks[i];
      spark.life += deltaTime;

      if (spark.life >= spark.ttl) {
        state.sparks.splice(i, 1);
        continue;
      }

      spark.x += spark.vx * deltaTime * 0.04;
      spark.y += spark.vy * deltaTime * 0.04 - state.scrollVelocity * 0.02;
      spark.vy -= 0.00015 * deltaTime;

      var lifeRatio = 1 - spark.life / spark.ttl;
      var alpha = lifeRatio * 0.8;
      var size = spark.size * (0.55 + lifeRatio);

      context.save();
      context.fillStyle = rgba(spark.color, alpha);
      context.shadowBlur = size * 12;
      context.shadowColor = rgba(spark.color, alpha);
      context.beginPath();
      context.arc(spark.x, spark.y, size, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  }

  function render(time) {
    if (!state.lastFrameTime) {
      state.lastFrameTime = time;
    }

    var deltaTime = Math.min(time - state.lastFrameTime, 36);
    state.lastFrameTime = time;

    context.clearRect(0, 0, state.width, state.height);

    for (var i = 0; i < state.stars.length; i++) {
      drawStar(state.stars[i], time);
    }

    drawSparks(deltaTime);
    state.scrollVelocity *= 0.94;
    window.requestAnimationFrame(render);
  }

  resizeCanvas();
  window.requestAnimationFrame(render);

  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  window.addEventListener("pointercancel", handlePointerLeave, { passive: true });

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", resizeCanvas);
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(resizeCanvas);
  }
})();
