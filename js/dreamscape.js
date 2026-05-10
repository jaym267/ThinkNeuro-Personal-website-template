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
    [255, 255, 248],
    [226, 242, 255],
    [255, 240, 218],
    [219, 255, 246],
    [236, 232, 255]
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
    var count = Math.round(area / 7800);
    count = clamp(count, 95, 260);

    if (motionQuery.matches) {
      count = Math.round(count * 0.55);
    }

    state.stars = [];
    for (var i = 0; i < count; i++) {
      var color = starPalette[Math.floor(Math.random() * starPalette.length)];
      state.stars.push({
        x: Math.random() * state.width,
        y: Math.random() * state.height,
        size: Math.pow(randomBetween(0.38, 1.55), 1.35),
        alpha: randomBetween(0.34, 0.96),
        depth: randomBetween(0.18, 1),
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: randomBetween(0.28, 1.35),
        driftX: randomBetween(0.8, 6.5),
        driftY: randomBetween(0.8, 8.5),
        spark: Math.random() < 0.09,
        halo: Math.random() < 0.22,
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
    context.shadowBlur = size * 6;
    context.shadowColor = rgba(color, alpha * 0.75);

    context.beginPath();
    context.moveTo(-size * 2.7, 0);
    context.lineTo(size * 2.7, 0);
    context.moveTo(0, -size * 2.7);
    context.lineTo(0, size * 2.7);
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
    context.arc(0, 0, Math.max(0.55, size * 0.58), 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawTinyStar(x, y, size, color, alpha) {
    var outer = Math.max(1.25, size * 2.6);
    var inner = Math.max(0.42, outer * 0.38);

    context.save();
    context.translate(x, y);
    context.rotate(Math.PI / 10);
    context.fillStyle = rgba(color, alpha);
    context.shadowBlur = size * 4.2;
    context.shadowColor = rgba(color, alpha * 0.55);
    context.beginPath();

    for (var i = 0; i < 10; i++) {
      var radius = i % 2 === 0 ? outer : inner;
      var angle = -Math.PI / 2 + i * Math.PI / 5;
      var pointX = Math.cos(angle) * radius;
      var pointY = Math.sin(angle) * radius;

      if (i === 0) {
        context.moveTo(pointX, pointY);
      } else {
        context.lineTo(pointX, pointY);
      }
    }

    context.closePath();
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

    if (star.halo) {
      var gradient = context.createRadialGradient(x, y, 0, x, y, star.size * 5.6);
      gradient.addColorStop(0, rgba(star.color, alpha * 0.34));
      gradient.addColorStop(0.42, rgba(star.color, alpha * 0.12));
      gradient.addColorStop(1, rgba(star.color, 0));
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, star.size * 5.6, 0, Math.PI * 2);
      context.fill();
    }

    drawTinyStar(x, y, star.size, star.color, alpha);

    if (star.size > 1.08 && alpha > 0.48) {
      context.globalAlpha = alpha * 0.56;
      context.strokeStyle = rgba(star.color, alpha);
      context.lineWidth = 0.55;
      context.beginPath();
      context.moveTo(x - star.size * 2.1, y);
      context.lineTo(x + star.size * 2.1, y);
      context.moveTo(x, y - star.size * 2.1);
      context.lineTo(x, y + star.size * 2.1);
      context.stroke();
    }

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

  function initReveal() {
    var revealItems = document.querySelectorAll(".reveal");
    if (!revealItems.length) {
      return;
    }

    if (motionQuery.matches || !("IntersectionObserver" in window)) {
      for (var i = 0; i < revealItems.length; i++) {
        revealItems[i].classList.add("is-visible");
      }
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add("is-visible");
          observer.unobserve(entries[i].target);
        }
      }
    }, {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.16
    });

    for (var j = 0; j < revealItems.length; j++) {
      observer.observe(revealItems[j]);
    }
  }

  initReveal();
})();
