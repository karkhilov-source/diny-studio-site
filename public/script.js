document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.registration-form');
  const ageInput = document.getElementById('age');
  const photoInput = document.getElementById('photo');
  const agreeCheckbox = document.getElementById('agree');
  const hero = document.querySelector('.hero');
  const bg = document.querySelector('.hero-bg');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav-links');
  
  const MAX_SIZE_MB = 1;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  burger.addEventListener('click', () => {
   nav.classList.toggle('active');
  });

  // Проверка размера при выборе файла
  photoInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      alert(`Размер фото не должен превышать ${MAX_SIZE_MB} МБ. Пожалуйста, выбери файл поменьше.`);
      this.value = '';
    }
  });

  // Общая валидация при отправке формы
  form.addEventListener('submit', function (e) {
    const file = photoInput.files[0];

    // Возраст
    if (ageInput.value < 18) {
      e.preventDefault();
      alert('Возраст должен быть 18+');
      ageInput.focus();
      return;
    }

    // Фото обязательно
    if (!file) {
      e.preventDefault();
      alert('Пожалуйста, прикрепи фото (до 1 МБ).');
      photoInput.focus();
      return;
    }

    // Размер фото
    if (file.size > MAX_SIZE_BYTES) {
      e.preventDefault();
      alert(`Размер фото не должен превышать ${MAX_SIZE_MB} МБ. Пожалуйста, выбери файл поменьше.`);
      return;
    }

    // Согласие
    if (!agreeCheckbox.checked) {
      e.preventDefault();
      alert('Подтверди согласие (18+ и обработка данных).');
      agreeCheckbox.focus();
      return;
    }

    // Всё ок – блокируем кнопку
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Отправляем...';
    btn.disabled = true;
  });

  window.addEventListener('scroll', () => {

  const rect = hero.getBoundingClientRect();
  const speed = 0.25;

  const offset = rect.top * speed;

  bg.style.transform = `scale(1.06) translateY(${offset}px)`;

});

});
