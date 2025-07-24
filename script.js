// === Firebase config (рабочий для tapalka-1229d) ===
const firebaseConfig = {
  apiKey: "AIzaSyBnhMLJpIB-yBShMnsOagnAFfAjfB0CtM8",
  authDomain: "tapalka-1229d.firebaseapp.com",
  projectId: "tapalka-1229d",
  storageBucket: "tapalka-1229d.appspot.com",
  messagingSenderId: "351609386189",
  appId: "1:351609386189:web:026d95d15e477f65ec6584",
  measurementId: "G-LD5Y3J0X00"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// === Telegram Mini App user detection ===
let tgUser = null;
if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
    tgUser = window.Telegram.WebApp.initDataUnsafe.user;
}

// === Загрузка или создание профиля игрока в Firestore ===
async function loadOrCreatePlayer(user) {
  if (!user) return;
  const userRef = db.collection('players').doc(String(user.id));
  const doc = await userRef.get();
  if (doc.exists) {
    // Если игрок уже есть — возвращаем его данные
    return doc.data();
  } else {
    // Если игрока нет — создаём
    const playerData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || '',
      username: user.username || '',
      photo_url: user.photo_url || '',
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      coins: 0,
      checkpoints: [],
    };
    await userRef.set(playerData);
    return playerData;
  }
}

// === Автоматически загружаем профиль при запуске ===
if (tgUser) {
  loadOrCreatePlayer(tgUser).then(playerData => {
    // Здесь можно подгружать прогресс, чекпоинты и т.д.
  });
}

// === Показывать только нужную страницу и bottom-bar ===
function setActiveBar(page) {
  document.querySelectorAll('.bar-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.querySelector('.bar-btn-marker').style.opacity = 0;
  });
  if (page === 'main') {
    const btn = document.querySelector('.bar-btn-home');
    btn.classList.add('active');
    btn.querySelector('.bar-btn-marker').style.opacity = 1;
  }
  if (page === 'profile') {
    const btn = document.querySelector('.bar-btn-profile');
    btn.classList.add('active');
    btn.querySelector('.bar-btn-marker').style.opacity = 1;
  }
  if (page === 'tasks') {
    const btn = document.querySelector('.bar-btn-tasks');
    btn.classList.add('active');
    btn.querySelector('.bar-btn-marker').style.opacity = 1;
  }
}
function showPage(page) {
  document.getElementById('main-page').style.display = 'none';
  document.getElementById('profile-page').style.display = 'none';
  document.getElementById('bottom-bar').style.display = 'none';
  if (page === 'main') {
    document.getElementById('main-page').style.display = 'block';
    document.getElementById('bottom-bar').style.display = 'flex';
  } else if (page === 'profile') {
    document.getElementById('profile-page').style.display = 'block';
    document.getElementById('bottom-bar').style.display = 'flex';
  }
  setActiveBar(page);
}

// === Главная страница: тап и монеты ===
let mainCoins = 0;
let playerDocRef = null;
let tapCount = 0;

function updateMainCoinsUI() {
  document.getElementById('main-coins-value').textContent = mainCoins;
}

function animateTapPlus(amount) {
  tapCount++;
  const plus = document.createElement('span');
  plus.className = 'tap-plus-fx';
  plus.textContent = `+${amount}`;
  // Располагаем по кругу
  const angle = (tapCount * 40) % 360;
  const radius = 110 + Math.random() * 30;
  plus.style.left = `calc(50% + ${Math.cos(angle * Math.PI / 180) * radius}px)`;
  plus.style.top = `calc(50% + ${Math.sin(angle * Math.PI / 180) * radius}px)`;
  document.getElementById('main-tap-area').appendChild(plus);
  setTimeout(() => plus.remove(), 600);
}

function saveCoinsToFirebase() {
  if (playerDocRef) {
    playerDocRef.update({ coins: mainCoins });
  }
}

// === ОНБОРДИНГ ===
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const btn = document.querySelector('.onboarding-btn');
let current = 0;

function showSlide(idx) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === idx);
  });
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === idx);
  });
  btn.textContent = idx === slides.length - 1 ? 'Начать игру' : 'Далее';
}

btn.addEventListener('click', () => {
  console.log('Кнопка нажата, tgUser:', tgUser);
  if (current < slides.length - 1) {
    current++;
    showSlide(current);
  } else {
    if (tgUser) {
      loadOrCreatePlayer(tgUser).then(playerData => {
        mainCoins = playerData.coins || 0;
        playerDocRef = db.collection('players').doc(String(playerData.id));
        updateMainCoinsUI();
        showPage('main');
      });
    } else {
      showToast('Ошибка: не удалось получить данные Telegram пользователя!');
    }
  }
});

// === Bottom bar навигация ===
document.querySelector('.bar-btn-home').onclick = () => showPage('main');
document.querySelector('.bar-btn-profile').onclick = () => {
  if (tgUser) {
    loadOrCreatePlayer(tgUser).then(playerData => {
      showProfilePage(playerData);
      document.getElementById('bottom-bar').style.display = 'flex';
    });
  }
};

function bindTaskButtons() {
  if (document.getElementById('task-join-channel'))
    document.getElementById('task-join-channel').onclick = () => showToast('Функция в разработке!');
  if (document.getElementById('task-get-1000'))
    document.getElementById('task-get-1000').onclick = () => showToast('Функция в разработке!');
  if (document.getElementById('task-invite-friends'))
    document.getElementById('task-invite-friends').onclick = () => showToast('Функция в разработке!');
  if (document.getElementById('task-story'))
    document.getElementById('task-story').onclick = () => showToast('Функция в разработке!');
  if (document.getElementById('task-graffiti'))
    document.getElementById('task-graffiti').onclick = () => showToast('Функция в разработке!');
}
// === Переходы между профилем и заданиями ===
document.querySelector('.profile-action-gold').onclick = () => {
  document.getElementById('profile-page').style.display = 'none';
  document.getElementById('tasks-page').style.display = 'block';
  bindTaskButtons();
};
document.getElementById('tasks-back-btn').onclick = () => {
  document.getElementById('tasks-page').style.display = 'none';
  document.getElementById('profile-page').style.display = 'block';
};
document.querySelector('.bar-btn-tasks').onclick = () => {
  document.getElementById('main-page').style.display = 'none';
  document.getElementById('profile-page').style.display = 'none';
  document.getElementById('tasks-page').style.display = 'block';
  setActiveBar('tasks');
  bindTaskButtons();
};

// === Тап по персонажу ===
const mainTapPers = document.getElementById('main-tap-pers');
const mainTapArea = document.getElementById('main-tap-area');
let shakeToggle = false;
mainTapArea.onclick = () => {
  mainCoins++;
  updateMainCoinsUI();
  animateTapPlus(1);
  saveCoinsToFirebase();
  mainTapPers.classList.remove('vibrate');
  void mainTapPers.offsetWidth; // restart animation
  mainTapPers.classList.add('vibrate');
  // Пульсация круга через отдельный элемент
  const pulse = document.createElement('div');
  pulse.className = 'pulse-fx';
  mainTapArea.appendChild(pulse);
  setTimeout(() => pulse.remove(), 400);
};

// === Показ профиля (обновлённая функция) ===
function showProfilePage(playerData) {
  showPage('profile');
  document.getElementById('profile-greeting').textContent = 'Привет, ' + (playerData.first_name || 'игрок') + '!';
  document.getElementById('profile-name-big').textContent = playerData.first_name + (playerData.last_name ? ' ' + playerData.last_name : '');
  document.getElementById('profile-username-big').textContent = playerData.username ? '@' + playerData.username : '';
  document.getElementById('profile-coins').textContent = playerData.coins || 0;
  document.getElementById('profile-checkpoints').textContent = (playerData.checkpoints && playerData.checkpoints.length) ? playerData.checkpoints.length : 0;
  document.getElementById('profile-record').textContent = playerData.record || 0;
}

// === Переходы между профилем и заданиями ===
document.querySelector('.profile-action-gold').onclick = () => {
  document.getElementById('profile-page').style.display = 'none';
  document.getElementById('tasks-page').style.display = 'block';
};
document.getElementById('tasks-back-btn').onclick = () => {
  document.getElementById('tasks-page').style.display = 'none';
  document.getElementById('profile-page').style.display = 'block';
};
function showToast(message) {
  const toast = document.getElementById('notification-toast');
  toast.textContent = message;
  toast.classList.add('show');
  toast.style.display = 'block';
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.style.display = 'none'; }, 400);
  }, 2500);
}
// Заглушки для кнопок заданий с уведомлением
if (document.getElementById('task-join-channel'))
  document.getElementById('task-join-channel').onclick = () => showToast('Функция в разработке!');
if (document.getElementById('task-get-1000'))
  document.getElementById('task-get-1000').onclick = () => showToast('Функция в разработке!');
if (document.getElementById('task-invite-friends'))
  document.getElementById('task-invite-friends').onclick = () => showToast('Функция в разработке!');
if (document.getElementById('task-story'))
  document.getElementById('task-story').onclick = () => showToast('Функция в разработке!');
if (document.getElementById('task-graffiti'))
  document.getElementById('task-graffiti').onclick = () => showToast('Функция в разработке!');

// Свайп для мобильных
let startX = null;
document.querySelector('.onboarding-container').addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});
document.querySelector('.onboarding-container').addEventListener('touchend', e => {
  if (startX === null) return;
  let endX = e.changedTouches[0].clientX;
  if (endX - startX > 50 && current > 0) {
    current--;
    showSlide(current);
  } else if (startX - endX > 50 && current < slides.length - 1) {
    current++;
    showSlide(current);
  }
  startX = null;
}); 