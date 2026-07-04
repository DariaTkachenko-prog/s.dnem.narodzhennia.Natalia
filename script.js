// Основна логіка: клік по кульці -> «світлячки» -> показати привітання
(function () {
  const balloon = document.getElementById('smiley');
  const hint = document.querySelector('.click-text');
  const congrats = document.querySelector('.congrats-wrapper');
  const bgMusic = document.getElementById('bg-music');
  const openSound = document.getElementById('open-sound');
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');

  // Розміри canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ======= «Світлячки» — сяючі частинки =======
  // Пастельні відтінки: золотий/рожевий/блакитний/білий
  const COLORS = [
    { r: 255, g: 223, b: 128 },   // м'який золотий
    { r: 255, g: 182, b: 193 },   // світло-рожевий
    { r: 173, g: 216, b: 230 },   // світло-блакитний
    { r: 255, g: 255, b: 255 }    // білий
  ];

  let sparks = [];
  const COUNT = 140;        // кількість світлячків
  const DURATION = 5200;    // тривалість «дихання світла», мс
  let running = false;
  let startTs = 0;

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function createSparks() {
    sparks = [];
    for (let i = 0; i < COUNT; i++) {
      const c = pick(COLORS);
      sparks.push({
        x: rand(0, canvas.width),
        y: rand(canvas.height * 0.55, canvas.height + 60), // старт нижче середини
        vx: rand(-0.25, 0.25),
        vy: rand(-0.8, -1.8),             // повільно пливуть ВГОРУ
        baseR: rand(2.0, 4.2),            // базовий радіус
        pulseAmp: rand(0.6, 1.4),         // амплітуда пульсації
        pulseSpeed: rand(0.003, 0.007),   // швидкість пульсації
        twist: rand(0.0015, 0.004),       // легкий «змій» по X
        hueShift: rand(0, Math.PI * 2),   // фаза пульсації
        col: c,
        alpha: rand(0.85, 1.0)
      });
    }
  }

  function drawSpark(s, t) {
    // Радіальний градієнт для м'якого сяйва
    const r = s.baseR + Math.sin(t * s.pulseSpeed + s.hueShift) * s.pulseAmp;
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.2);
    const c = s.col;
    const inner = `rgba(${c.r},${c.g},${c.b},${Math.min(1, s.alpha)})`;
    const mid   = `rgba(${c.r},${c.g},${c.b},${Math.max(0, s.alpha * 0.75)})`;
    const outer = `rgba(${c.r},${c.g},${c.b},0)`;
    grad.addColorStop(0.0, inner);
    grad.addColorStop(0.35, mid);
    grad.addColorStop(1.0, outer);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateSpark(s, t) {
    s.x += s.vx + Math.sin(t * s.twist + s.y * 0.01) * 0.15;
    s.y += s.vy;
    // легке мерехтіння alpha
    s.alpha = Math.min(1, 0.9 + 0.3 * Math.sin(t * s.pulseSpeed * 1.2 + s.hueShift));

    // якщо вийшов за верх — «респавн» знизу
    if (s.y < -20) {
      s.y = canvas.height + 20;
      s.x = rand(0, canvas.width);
    }
  }

  function animateSparks(ts) {
    if (!running) return;
    if (!startTs) startTs = ts;
    const elapsed = ts - startTs;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Додаємо режим додавання для м’якого складання сяйва
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const s of sparks) {
      updateSpark(s, elapsed);
      drawSpark(s, elapsed);
    }

    ctx.restore();

    if (elapsed < DURATION) {
      requestAnimationFrame(animateSparks);
    } else {
      fadeOut(1200);
    }
  }

  function fadeOut(ms) {
    const steps = 32;
    let step = 0;
    const timer = setInterval(() => {
      const k = 1 - step / steps;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // Малюємо зі зменшенням альфи
      for (const s of sparks) {
        const tmp = Object.assign({}, s, { alpha: Math.max(0, s.alpha * k) });
        drawSpark(tmp, performance.now());
      }
      ctx.restore();
      step++;
      if (step > steps) {
        clearInterval(timer);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        running = false;
      }
    }, ms / steps);
  }

  function revealCongrats() {
    congrats.classList.remove('hidden');
    congrats.classList.add('show-dissolve');
    const lines = document.querySelectorAll('.congrats-text .line');
    lines.forEach((line, i) => {
      setTimeout(() => line.classList.add('visible'), 250 + i * 250);
    });
  }

  function startExperience() {
    // Приховати кульку і підказку
    balloon.classList.add('hidden');
    if (hint) hint.classList.add('hidden');

    // Звук + музика
    try { openSound && openSound.play(); } catch (e) {}
    try { bgMusic && bgMusic.play(); } catch (e) {}

    // Запуск «світлячків»
    createSparks();
    running = true;
    startTs = 0;
    requestAnimationFrame(animateSparks);

    // Показати привітання трохи пізніше
    setTimeout(revealCongrats, 1100);
  }

  // Події
  balloon.addEventListener('click', startExperience);
  balloon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') startExperience();
  });
})();

  // Wrap smiley (flower) to draw glow aura
  (function(){
    var img = document.getElementById('smiley');
    if(!img) return;
    var wrap = document.createElement('div');
    wrap.className = 'smiley-wrap floating';
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
  })();

  // Subtle parallax tilt on hover (desktop only)
  (function(){
    var img = document.getElementById('smiley');
    if(!img) return;
    var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if(isTouch) return;

    var maxTilt = 6; // degrees
    function onMove(e){
      var rect = img.getBoundingClientRect();
      var x = (e.clientX - rect.left)/rect.width;  // 0..1
      var y = (e.clientY - rect.top)/rect.height;  // 0..1
      var tiltX = (0.5 - y) * maxTilt;
      var tiltY = (x - 0.5) * maxTilt;
      img.style.transform = 'rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) scale(1.03)';
    }
    function reset(){ img.style.transform = ''; }
    img.addEventListener('mousemove', onMove);
    img.addEventListener('mouseleave', reset);
  })();
