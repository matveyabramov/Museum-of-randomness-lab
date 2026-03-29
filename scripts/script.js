//анимация кристалла
const startBtn = document.getElementById('start-experiment');
const crystal = document.querySelector('.hero__model-viewer');
const nextSection = document.getElementById('drift');

let savedScrollY = 0;

function lockScroll() {
  savedScrollY = window.scrollY || window.pageYOffset;
  document.body.style.top = `-${savedScrollY}px`;
  document.body.classList.add('is-scroll-locked');
}

function unlockScroll() {
  const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10));

  document.body.classList.remove('is-scroll-locked');
  document.body.style.top = '';

  window.scrollTo(0, scrollY);
}

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  lockScroll();
});

if (startBtn && crystal && nextSection) {
  startBtn.addEventListener('click', (e) => {
    e.preventDefault();

    if (startBtn.classList.contains('is-running')) return;
    startBtn.classList.add('is-running');

    const originalText = startBtn.textContent;
    startBtn.textContent = '[ ИНИЦИАЛИЗАЦИЯ 0% ]';

    crystal.classList.add('is-activated');

    const steps = [
      { time: 700, text: '[ ИНИЦИАЛИЗАЦИЯ 34% ]' },
      { time: 1500, text: '[ ИНИЦИАЛИЗАЦИЯ 68% ]' },
      { time: 2300, text: '[ ИНИЦИАЛИЗАЦИЯ 92% ]' },
      { time: 3000, text: '[ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА ]' }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        startBtn.textContent = step.text;
      }, step.time);
    });

    setTimeout(() => {
      unlockScroll();
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }, 3200);

    setTimeout(() => {
      crystal.classList.remove('is-activated');
      startBtn.textContent = originalText;
      startBtn.classList.remove('is-running');
    }, 4300);
  });
}

//слайдер 2 блока

document.addEventListener('DOMContentLoaded', () => {
    console.log('slider script loaded');
  const timeline = document.getElementById('microshift-timeline');
  const thumb = document.getElementById('microshift-thumb');
  const points = [...document.querySelectorAll('.microshift__timeline-point')];
  const slides = [...document.querySelectorAll('.microshift__slider-img')];

  if (!timeline || !thumb || !points.length || !slides.length) {
    console.error('Microshift slider: не найдены нужные элементы');
    return;
  }

  let isDragging = false;
  let activeIndex = 0;
  let pointCenters = [];

  function updatePointCenters() {
    pointCenters = points.map((point) => point.offsetLeft + point.offsetWidth / 2);
  }

  function setActive(index) {
    activeIndex = index;

    points.forEach((point) => point.classList.remove('active'));
    slides.forEach((slide) => slide.classList.remove('active'));

    if (points[index]) points[index].classList.add('active');
    if (slides[index]) slides[index].classList.add('active');
    console.log('active slide:', index);
  }

  function setThumbPosition(x, animated = false) {
    thumb.style.transition = animated ? 'left 0.2s ease' : 'none';
    thumb.style.left = `${x}px`;
  }

  function setThumbToIndex(index, animated = false) {
    if (!pointCenters[index]) return;
    setThumbPosition(pointCenters[index], animated);
    setActive(index);
  }

  function getNearestIndex(x) {
    let nearest = 0;
    let minDistance = Infinity;

    pointCenters.forEach((center, index) => {
      const distance = Math.abs(center - x);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = index;
      }
    });

    return nearest;
  }

  function clampX(x) {
    const min = pointCenters[0];
    const max = pointCenters[pointCenters.length - 1];
    return Math.max(min, Math.min(max, x));
  }

  function getLocalX(clientX) {
    const rect = timeline.getBoundingClientRect();
    return clientX - rect.left;
  }

  thumb.addEventListener('pointerdown', () => {
    isDragging = true;
  });

  window.addEventListener('pointermove', (event) => {
    if (!isDragging) return;

    const localX = clampX(getLocalX(event.clientX));
    setThumbPosition(localX, false);

    const nearestIndex = getNearestIndex(localX);
    if (nearestIndex !== activeIndex) {
      setActive(nearestIndex);
    }
  });

  window.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;

    const currentLeft = parseFloat(thumb.style.left) || pointCenters[activeIndex];
    const nearestIndex = getNearestIndex(currentLeft);

    setThumbToIndex(nearestIndex, true);
  });

  points.forEach((point, index) => {
    point.addEventListener('click', () => {
      setThumbToIndex(index, true);
    });
  });

  function init() {
    updatePointCenters();
    setThumbToIndex(0, false);
  }

  window.addEventListener('resize', () => {
    updatePointCenters();
    setThumbToIndex(activeIndex, false);
  });

  init();
});

//разлетающиеся осколки
document.addEventListener('DOMContentLoaded', () => {
  const field = document.getElementById('dispersion-field');
  const shardElements = Array.from(document.querySelectorAll('.dispersion__shard'));

  if (!field) {
    console.error('Не найден #dispersion-field');
    return;
  }

  if (!shardElements.length) {
    console.error('Не найдены .dispersion__shard');
    return;
  }

  const mobileMedia = window.matchMedia('(max-width: 767px)');

  let pointer = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    active: false
  };

  let shards = [];
  let rafId = null;

  function getSettings() {
    const mobile = mobileMedia.matches;

    return {
      radius: mobile ? 140 : 240,
      strength: mobile ? 22 : 34,
      maxOffset: mobile ? 24 : 38,
      pointerLerp: 0.18,
      shardLerp: 0.09
    };
  }

  function buildShardState() {
    const fieldRect = field.getBoundingClientRect();

    shards = shardElements.map((el) => {
      const rect = el.getBoundingClientRect();

      return {
        el,
        baseX: rect.left - fieldRect.left + rect.width / 2,
        baseY: rect.top - fieldRect.top + rect.height / 2,
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
        renderedX: null,
        renderedY: null
      };
    });
  }

  function updatePointerPosition(clientX, clientY) {
    const rect = field.getBoundingClientRect();
    pointer.targetX = clientX - rect.left;
    pointer.targetY = clientY - rect.top;
  }

  function startAnimation() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  field.addEventListener('pointerenter', (e) => {
    pointer.active = true;
    updatePointerPosition(e.clientX, e.clientY);
    pointer.x = pointer.targetX;
    pointer.y = pointer.targetY;
    startAnimation();
  });

  field.addEventListener('pointermove', (e) => {
    pointer.active = true;
    updatePointerPosition(e.clientX, e.clientY);
    startAnimation();
  });

  field.addEventListener('pointerleave', () => {
    pointer.active = false;
    startAnimation();
  });

  field.addEventListener('pointerdown', (e) => {
    pointer.active = true;
    updatePointerPosition(e.clientX, e.clientY);
    startAnimation();
  });

  window.addEventListener('pointerup', () => {
    pointer.active = false;
    startAnimation();
  });

  window.addEventListener('pointercancel', () => {
    pointer.active = false;
    startAnimation();
  });

  function animate() {
    rafId = requestAnimationFrame(animate);

    const { radius, strength, maxOffset, pointerLerp, shardLerp } = getSettings();

    pointer.x += (pointer.targetX - pointer.x) * pointerLerp;
    pointer.y += (pointer.targetY - pointer.y) * pointerLerp;

    let isStillMoving = false;

    shards.forEach((shard) => {
      let targetX = 0;
      let targetY = 0;

      if (pointer.active) {
        const dx = shard.baseX - pointer.x;
        const dy = shard.baseY - pointer.y;
        const distance = Math.hypot(dx, dy);

        if (distance < radius && distance > 0.001) {
          const influence = 1 - distance / radius;
          const force = influence * strength;

          targetX = (dx / distance) * force;
          targetY = (dy / distance) * force;

          targetX = Math.max(-maxOffset, Math.min(maxOffset, targetX));
          targetY = Math.max(-maxOffset, Math.min(maxOffset, targetY));
        }
      }

      shard.targetX = targetX;
      shard.targetY = targetY;

      shard.currentX += (shard.targetX - shard.currentX) * shardLerp;
      shard.currentY += (shard.targetY - shard.currentY) * shardLerp;

      const roundedX = Math.round(shard.currentX * 100) / 100;
      const roundedY = Math.round(shard.currentY * 100) / 100;

      if (roundedX !== shard.renderedX || roundedY !== shard.renderedY) {
        shard.el.style.transform = `translate3d(${roundedX}px, ${roundedY}px, 0)`;
        shard.renderedX = roundedX;
        shard.renderedY = roundedY;
      }

      if (
        Math.abs(shard.targetX - shard.currentX) > 0.05 ||
        Math.abs(shard.targetY - shard.currentY) > 0.05
      ) {
        isStillMoving = true;
      }
    });

    const pointerMoving =
      Math.abs(pointer.targetX - pointer.x) > 0.05 ||
      Math.abs(pointer.targetY - pointer.y) > 0.05;

    if (!pointer.active && !isStillMoving && !pointerMoving) {
      stopAnimation();
    }
  }

  function init() {
    buildShardState();

    shards.forEach((shard) => {
      shard.el.style.transform = 'translate3d(0px, 0px, 0)';
      shard.renderedX = 0;
      shard.renderedY = 0;
    });
  }

  window.addEventListener('resize', () => {
    buildShardState();
    startAnimation();
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(init);
  });
});

//кристалл в футере
document.addEventListener('DOMContentLoaded', () => {
  const field = document.getElementById('footer-field');
  const crystal = document.getElementById('footer-crystal');

  if (!field || !crystal) {
    console.error('Footer block: не найдены #footer-field или #footer-crystal');
    return;
  }

  const mobileMedia = window.matchMedia('(max-width: 767px)');

  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;

  let renderedX = null;
  let renderedY = null;
  let rafId = null;

  function getSettings() {
    const mobile = mobileMedia.matches;

    return {
      factorX: mobile ? 0.12 : 0.16,
      factorY: mobile ? 0.10 : 0.14,
      maxX: mobile ? 50 : 80,
      maxY: mobile ? 40 : 60,
      lerp: 0.08
    };
  }

  function updateTarget(clientX, clientY) {
    const rect = field.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const offsetX = x - centerX;
    const offsetY = y - centerY;

    const { factorX, factorY, maxX, maxY } = getSettings();

    targetX = Math.max(-maxX, Math.min(maxX, offsetX * factorX));
    targetY = Math.max(-maxY, Math.min(maxY, offsetY * factorY));

    startAnimation();
  }

  function startAnimation() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  field.addEventListener('pointerenter', (e) => {
    updateTarget(e.clientX, e.clientY);
  });

  field.addEventListener('pointermove', (e) => {
    updateTarget(e.clientX, e.clientY);
  });

  field.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    startAnimation();
  });

  field.addEventListener('pointerdown', (e) => {
    updateTarget(e.clientX, e.clientY);
  });

  function animate() {
    rafId = requestAnimationFrame(animate);

    const { lerp } = getSettings();

    currentX += (targetX - currentX) * lerp;
    currentY += (targetY - currentY) * lerp;

    const roundedX = Math.round(currentX * 100) / 100;
    const roundedY = Math.round(currentY * 100) / 100;

    if (roundedX !== renderedX || roundedY !== renderedY) {
      crystal.style.transform = `translate(${roundedX}px, ${roundedY}px)`;
      renderedX = roundedX;
      renderedY = roundedY;
    }

    const isStillMoving =
      Math.abs(targetX - currentX) > 0.05 ||
      Math.abs(targetY - currentY) > 0.05;

    if (!isStillMoving) {
      stopAnimation();
    }
  }

  crystal.style.transform = 'translate(0px, 0px)';
  renderedX = 0;
  renderedY = 0;
});