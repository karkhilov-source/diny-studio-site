document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.registration-form');
  const ageInput = document.getElementById('age');
  const photoInput = document.getElementById('photo');
  const agreeCheckbox = document.getElementById('agree');

  form.addEventListener('submit', function(e) {
    // Валидация возраста
    if (ageInput.value < 18) {
      e.preventDefault();
      alert('Возраст должен быть 18+');
      ageInput.focus();
      return;
    }

    // Фото обязательно
    if (!photoInput.files[0]) {
      e.preventDefault();
      alert('Прикрепи фото');
      photoInput.focus();
      return;
    }

    // Согласие
    if (!agreeCheckbox.checked) {
      e.preventDefault();
      alert('Подтверди согласие (18+)');
      agreeCheckbox.focus();
      return;
    }

    // Всё ок – показываем "отправляем..."
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Отправляем...';
    btn.disabled = true;
  });
});
