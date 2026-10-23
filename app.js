/**
 * WAKE & ROLL PARK ŁÓDŹ - SILNIK INTERAKTYWNY I ANIMACJE DESKI
 * Zawiera:
 * 1. Rozprysk wody i fali (Water Spray Canvas) za kursorem
 * 2. Symulator skoku z kickera (Kicker Wakeboard Canvas Game)
 * 3. Efekt 3D Tilt krawędziowania deski
 * 4. Ambient szumu letniej wody (Web Audio API)
 * 5. Stories, Kalkulator rezerwacji, Cennik
 */

document.addEventListener('DOMContentLoaded', () => {

  // ====================================================================
  // 1. WATER SPRAY CANVAS (Rozprysk wody za deską pod kursorem)
  // ====================================================================
  const canvas = document.getElementById('waterTrailCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    let mouse = { x: -100, y: -100, lastX: -100, lastY: -100, speed: 0 };

    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - mouse.lastX;
      const dy = e.clientY - mouse.lastY;
      mouse.speed = Math.sqrt(dx * dx + dy * dy);
      mouse.lastX = mouse.x;
      mouse.lastY = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Generuj kropelki wody proporcjonalnie do prędkości ruchu
      if (mouse.speed > 2) {
        const count = Math.min(Math.floor(mouse.speed / 2.5), 8);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: mouse.x + (Math.random() - 0.5) * 15,
            y: mouse.y + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 4 - dx * 0.15,
            vy: (Math.random() - 0.5) * 4 - dy * 0.15 + 1.2, // grawitacja wody
            radius: Math.random() * 3 + 1,
            alpha: 0.8,
            color: Math.random() > 0.4 ? 'rgba(0, 242, 254,' : 'rgba(255, 255, 255,'
          });
        }
      }
    });

    function animateWaterSpray() {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        p.radius *= 0.97;

        if (p.alpha <= 0 || p.radius <= 0.2) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(animateWaterSpray);
    }
    animateWaterSpray();
  }

  // ====================================================================
  // 2. INTERAKTYWNY SYMULATOR SKOKU Z KICKERA (CANVAS GAME)
  // ====================================================================
  const gameCanvas = document.getElementById('kickerGameCanvas');
  if (gameCanvas) {
    const gctx = gameCanvas.getContext('2d');
    const simAltitude = document.getElementById('simAltitude');
    const simTrick = document.getElementById('simTrick');
    const simVibe = document.getElementById('simVibe');
    const simJumpBtn = document.getElementById('simJumpBtn');
    const simCarveBtn = document.getElementById('simCarveBtn');
    const sim360Btn = document.getElementById('sim360Btn');

    let rider = {
      x: 180,
      y: 280,
      baseY: 280,
      vy: 0,
      isJumping: false,
      rotation: 0,
      targetRotation: 0,
      carveOffset: 0,
      score: 100
    };

    let kicker = {
      x: 950,
      y: 270,
      width: 75,
      height: 35
    };

    let gameSpray = [];
    let waves = [0, 0, 0, 0];

    function triggerJump(is360 = false) {
      if (!rider.isJumping) {
        rider.isJumping = true;
        rider.vy = -13.5;
        rider.rotation = 0;
        rider.targetRotation = is360 ? Math.PI * 2 : -0.35;
        
        simTrick.textContent = is360 ? "🔥 Stylowe 360° Spin!" : "🚀 Air Grab z Kickera!";
        simTrick.className = "text-cyan";
        rider.score += 25;
        simVibe.textContent = `${rider.score}%`;

        // Generuj wybuch wody na starcie skoku
        for (let i = 0; i < 25; i++) {
          gameSpray.push({
            x: rider.x,
            y: rider.baseY + 10,
            vx: (Math.random() - 0.7) * 9,
            vy: -Math.random() * 8,
            radius: Math.random() * 4 + 2,
            alpha: 1
          });
        }
      }
    }

    if (simJumpBtn) simJumpBtn.addEventListener('click', () => triggerJump(false));
    if (sim360Btn) sim360Btn.addEventListener('click', () => triggerJump(true));

    if (simCarveBtn) {
      simCarveBtn.addEventListener('click', () => {
        rider.carveOffset = rider.carveOffset === 0 ? -18 : 0;
        simTrick.textContent = "🌊 Głęboka krawędź (Carve)";
      });
    }

    // Spacebar to jump
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        triggerJump(false);
      }
    });

    let waveTick = 0;

    function gameLoop() {
      gctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
      waveTick += 0.05;

      // 1. Tło nieba i zachodu słońca (Golden Hour)
      const grad = gctx.createLinearGradient(0, 0, 0, gameCanvas.height);
      grad.addColorStop(0, '#0a1426');
      grad.addColorStop(0.55, '#1e1b4b');
      grad.addColorStop(0.75, '#ea580c');
      grad.addColorStop(0.78, '#0d2238');
      grad.addColorStop(1, '#05111d');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

      // Złote słońce nad horyzontem
      gctx.beginPath();
      gctx.arc(750, 190, 48, 0, Math.PI * 2);
      gctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
      gctx.fill();

      // Lina wyciągu Sesitec 2.0 (górna lina stalowa)
      gctx.beginPath();
      gctx.moveTo(0, 60);
      gctx.lineTo(gameCanvas.width, 60);
      gctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      gctx.lineWidth = 2;
      gctx.stroke();

      // Orczyk i lina do ridera
      gctx.beginPath();
      gctx.moveTo(rider.x + 30, 60);
      gctx.lineTo(rider.x + 8, rider.y - 30);
      gctx.strokeStyle = '#00f2fe';
      gctx.lineWidth = 1.5;
      gctx.stroke();

      // 2. Woda i fale
      gctx.fillStyle = '#081726';
      gctx.fillRect(0, 275, gameCanvas.width, 105);

      gctx.beginPath();
      gctx.moveTo(0, 275);
      for (let x = 0; x <= gameCanvas.width; x += 30) {
        const y = 275 + Math.sin(x * 0.02 + waveTick) * 4;
        gctx.lineTo(x, y);
      }
      gctx.lineTo(gameCanvas.width, gameCanvas.height);
      gctx.lineTo(0, gameCanvas.height);
      gctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
      gctx.fill();

      // 3. Kicker (Przeszkoda przemieszczająca się w prawo i lewo)
      kicker.x -= 3.5;
      if (kicker.x < -100) kicker.x = gameCanvas.width + 100;

      // Rysuj Kicker
      gctx.beginPath();
      gctx.moveTo(kicker.x, kicker.y + kicker.height);
      gctx.lineTo(kicker.x + kicker.width, kicker.y);
      gctx.lineTo(kicker.x + kicker.width, kicker.y + kicker.height);
      gctx.closePath();
      gctx.fillStyle = '#ff7e5f';
      gctx.fill();
      gctx.strokeStyle = '#ffffff';
      gctx.lineWidth = 2;
      gctx.stroke();

      // Detekcja najechania na kicker
      if (rider.x >= kicker.x && rider.x <= kicker.x + kicker.width && !rider.isJumping) {
        triggerJump(Math.random() > 0.5);
      }

      // 4. Fizyka skoku ridera
      if (rider.isJumping) {
        rider.y += rider.vy;
        rider.vy += 0.45; // grawitacja

        if (rider.rotation < rider.targetRotation) {
          rider.rotation += 0.18;
        }

        const altMeters = Math.max(0, ((rider.baseY - rider.y) / 25)).toFixed(1);
        simAltitude.textContent = `${altMeters} m`;

        if (rider.y >= rider.baseY) {
          rider.y = rider.baseY;
          rider.isJumping = false;
          rider.vy = 0;
          rider.rotation = 0;
          simAltitude.textContent = "0.0 m";

          // Rozbryzg przy lądowaniu
          for (let i = 0; i < 20; i++) {
            gameSpray.push({
              x: rider.x,
              y: rider.baseY + 5,
              vx: (Math.random() - 0.5) * 8,
              vy: -Math.random() * 5,
              radius: Math.random() * 3 + 1,
              alpha: 1
            });
          }
        }
      } else {
        rider.y = rider.baseY + rider.carveOffset + Math.sin(waveTick * 2) * 2;
      }

      // 5. Ciągły spray za deską
      if (!rider.isJumping) {
        gameSpray.push({
          x: rider.x - 20,
          y: rider.y + 8,
          vx: -Math.random() * 5 - 2,
          vy: (Math.random() - 0.5) * 3,
          radius: Math.random() * 3 + 1,
          alpha: 0.8
        });
      }

      // Rysuj i aktualizuj spray
      for (let i = gameSpray.length - 1; i >= 0; i--) {
        const s = gameSpray[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.03;
        if (s.alpha <= 0) {
          gameSpray.splice(i, 1);
          continue;
        }
        gctx.beginPath();
        gctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        gctx.fillStyle = `rgba(0, 242, 254, ${s.alpha})`;
        gctx.fill();
      }

      // 6. Rysuj postać Wakeboardera na desce
      gctx.save();
      gctx.translate(rider.x, rider.y);
      gctx.rotate(rider.rotation);

      // Deska wakeboardowa
      gctx.beginPath();
      gctx.ellipse(0, 5, 26, 6, 0, 0, Math.PI * 2);
      gctx.fillStyle = '#00f2fe';
      gctx.fill();
      gctx.strokeStyle = '#ffffff';
      gctx.lineWidth = 1.5;
      gctx.stroke();

      // Ciało ridera (sylwetka)
      gctx.fillStyle = '#f8fafc';
      // Nogi i tułów
      gctx.fillRect(-6, -18, 5, 18);
      gctx.fillRect(3, -18, 5, 18);
      gctx.fillRect(-6, -35, 14, 18);
      // Ręce trzymające orczyk
      gctx.strokeStyle = '#f8fafc';
      gctx.lineWidth = 3;
      gctx.beginPath();
      gctx.moveTo(0, -30);
      gctx.lineTo(12, -26);
      gctx.stroke();
      // Głowa i kask
      gctx.beginPath();
      gctx.arc(0, -42, 7, 0, Math.PI * 2);
      gctx.fillStyle = '#ff7e5f'; // kask
      gctx.fill();

      gctx.restore();

      requestAnimationFrame(gameLoop);
    }
    gameLoop();
  }

  // ====================================================================
  // 3. 3D TILT EFFECT NA KARTACH (Krawędziowanie deski)
  // ====================================================================
  const tiltBoxes = document.querySelectorAll('.tilt-box, .tilt-card-inner');
  tiltBoxes.forEach(box => {
    box.addEventListener('mousemove', (e) => {
      const rect = box.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      box.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    box.addEventListener('mouseleave', () => {
      box.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });

  // ====================================================================
  // 4. WEB AUDIO AMBIENT (Szum letniego jeziora)
  // ====================================================================
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundBtnText = document.getElementById('soundBtnText');
  let audioCtx = null;
  let noiseNode = null;
  let gainNode = null;
  let isPlayingSound = false;

  function toggleAmbientSound() {
    if (!isPlayingSound) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, audioCtx.currentTime);

        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(0.22, audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(180, audioCtx.currentTime);
        lfo.connect(filter.frequency);

        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        noiseNode.start();
        lfo.start();

        isPlayingSound = true;
        soundToggleBtn.classList.add('playing');
        soundBtnText.textContent = 'Wstrzymaj szum wody';
        soundToggleBtn.querySelector('i').className = 'fa-solid fa-volume-xmark';
      } catch (e) {
        console.warn('Audio blocked:', e);
      }
    } else {
      if (gainNode && audioCtx) {
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
        setTimeout(() => {
          if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
        }, 300);
      }
      isPlayingSound = false;
      soundToggleBtn.classList.remove('playing');
      soundBtnText.textContent = 'Poczuj dźwięk wody';
      soundToggleBtn.querySelector('i').className = 'fa-solid fa-volume-high';
    }
  }

  if (soundToggleBtn) soundToggleBtn.addEventListener('click', toggleAmbientSound);

  // ====================================================================
  // 5. STORIES, KALKULATOR, CENNIK, LIGHTBOX & MENU
  // ====================================================================
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      icon.className = navMenu.classList.contains('active') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    });

    navMenu.querySelectorAll('.nav-link, .nav-btn').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
      });
    });
  }

  const bookingDateInput = document.getElementById('bookingDate');
  if (bookingDateInput) {
    const today = new Date().toISOString().split('T')[0];
    bookingDateInput.value = today;
    bookingDateInput.min = today;
  }

  // Stories Data
  const storiesData = {
    wake: {
      title: "🌊 Wake & Triki na Kickerze",
      time: "2 godz. temu",
      img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
      desc: "Tafla gładka jak lustro na Stawach Stefańskiego! Chłopaki testują nowy profil kickera. Wpadajcie poczuć wolność!"
    },
    beachbar: {
      title: "🍹 Beach Bar & Chillout",
      time: "4 godz. temu",
      img: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
      desc: "Zimne piwa z regionalnych browarów, orzeźwiające drinki i leżaki z widokiem na wodę. Najlepszy chillout w Łodzi."
    },
    wakewakacje: {
      title: "👶 WakeWakacje 2026",
      time: "Wczoraj",
      img: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80",
      desc: "Kolejna grupa na zajęciach wakeboardowych! Dzieciaki robią niesamowite postępy – uśmiechy od ucha do ucha bez telefonów!"
    },
    events: {
      title: "🎵 Coffee Rave & Sunset Beats",
      time: "3 dni temu",
      img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
      desc: "Magiczna niedziela z cyklu 'Wstań i Tańcz'. Najlepsza elektronika, pyszna kawa i taniec na deskach pomostu!"
    },
    sup: {
      title: "🏄‍♀️ Deski SUP & Relaks",
      time: "4 dni temu",
      img: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80",
      desc: "Szukasz spokoju? Wypożycz deskę SUP i opłyń cały akwen w promieniach zachodzącego słońca."
    },
    sauna: {
      title: "🧖‍♂️ Morsy & Mobilna Sauna",
      time: "Wyróżnione",
      img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80",
      desc: "Spot żyje cały rok! Jesienią i zimą zapraszamy na gorące seanse w saunie panoramicznej i morsowanie!"
    }
  };

  const storyModal = document.getElementById('storyModal');
  const storyOverlay = document.getElementById('storyOverlay');
  const storyCloseBtn = document.getElementById('storyCloseBtn');
  const storyProgress = document.getElementById('storyProgress');
  const storyModalImg = document.getElementById('storyModalImg');
  const storyModalTitle = document.getElementById('storyModalTitle');
  const storyModalTime = document.getElementById('storyModalTime');
  const storyModalDesc = document.getElementById('storyModalDesc');

  let storyInterval = null;

  function openStory(storyKey) {
    const data = storiesData[storyKey];
    if (!data) return;

    storyModalTitle.textContent = data.title;
    storyModalTime.textContent = data.time;
    storyModalImg.src = data.img;
    storyModalDesc.textContent = data.desc;

    storyModal.classList.add('active');

    let progress = 0;
    storyProgress.style.width = '0%';
    clearInterval(storyInterval);
    storyInterval = setInterval(() => {
      progress += 2;
      storyProgress.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(storyInterval);
        closeStory();
      }
    }, 100);
  }

  function closeStory() {
    clearInterval(storyInterval);
    storyModal.classList.remove('active');
  }

  document.querySelectorAll('.story-circle-item').forEach(item => {
    item.addEventListener('click', () => {
      openStory(item.dataset.story);
    });
  });

  if (storyCloseBtn) storyCloseBtn.addEventListener('click', closeStory);
  if (storyOverlay) storyOverlay.addEventListener('click', closeStory);

  // Booking Calculator
  const sessionTypeSelect = document.getElementById('sessionType');
  const numPeopleInput = document.getElementById('numPeople');
  const numHoursSelect = document.getElementById('numHours');
  const addBoardCheck = document.getElementById('addBoard');
  const addWetsuitCheck = document.getElementById('addWetsuit');
  const addHelmetCheck = document.getElementById('addHelmet');
  const totalPriceElem = document.getElementById('totalPrice');
  const bookingForm = document.getElementById('bookingForm');
  const bookingNotification = document.getElementById('bookingNotification');

  function calculateBookingPrice() {
    if (!sessionTypeSelect || !totalPriceElem) return;

    const selectedOption = sessionTypeSelect.options[sessionTypeSelect.selectedIndex];
    const basePrice = parseFloat(selectedOption.dataset.price) || 45;
    const people = parseInt(numPeopleInput?.value) || 1;
    const hours = parseInt(numHoursSelect?.value) || 1;

    let gearAddons = 0;
    if (addBoardCheck?.checked) gearAddons += parseFloat(addBoardCheck.dataset.cost) || 20;
    if (addWetsuitCheck?.checked) gearAddons += parseFloat(addWetsuitCheck.dataset.cost) || 10;
    if (addHelmetCheck?.checked) gearAddons += parseFloat(addHelmetCheck.dataset.cost) || 10;

    let total = 0;
    const isExclusive = sessionTypeSelect.value.startsWith('exclusive');
    if (isExclusive) {
      total = (basePrice * hours) + (gearAddons * people * hours);
    } else {
      total = (basePrice * people * hours) + (gearAddons * people * hours);
    }

    totalPriceElem.textContent = `${total} PLN`;
  }

  [sessionTypeSelect, numPeopleInput, numHoursSelect, addBoardCheck, addWetsuitCheck, addHelmetCheck].forEach(input => {
    if (input) {
      input.addEventListener('change', calculateBookingPrice);
      input.addEventListener('input', calculateBookingPrice);
    }
  });

  calculateBookingPrice();

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userName = document.getElementById('userName')?.value;
      const userPhone = document.getElementById('userPhone')?.value;
      const date = document.getElementById('bookingDate')?.value;
      const time = document.getElementById('bookingTime')?.value;

      bookingNotification.className = 'notification-toast success';
      bookingNotification.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <strong>Dziękujemy, ${userName}!</strong><br>
        Twoje wstępne zapytanie na dzień <strong>${date}</strong> o godz. <strong>${time}</strong> zostało zapisane. 
        Nasz operator skontaktuje się z Tobą telefonicznie (${userPhone}) w celu potwierdzenia dostępności toru.
      `;

      bookingForm.reset();
      calculateBookingPrice();
    });
  }

  // Pricing Tabs
  const pricingTabBtns = document.querySelectorAll('.pricing-tab-btn');
  const pricingTabPanes = document.querySelectorAll('.pricing-tab-pane');

  pricingTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pricingTabBtns.forEach(b => b.classList.remove('active'));
      pricingTabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`pane-${btn.dataset.tab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

});
