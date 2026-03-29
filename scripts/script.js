//слайдер 2 блока

const points = document.querySelectorAll('.microshift__timeline-point');
const slides = document.querySelectorAll('.microshift__slider-img');

points.forEach((point, index) => {
  point.addEventListener('click', () => {
    points.forEach((item) => item.classList.remove('active'));
    slides.forEach((item) => item.classList.remove('active'));

    point.classList.add('active');
    slides[index].classList.add('active');
  });
});