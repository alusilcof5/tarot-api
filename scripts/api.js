const API_URL = 'https://6388b6e5a4bb27a7f78f96a5.mockapi.io/sakura-cards/';

const cardContainer = document.getElementById('card-container');
const pastSlot = document.querySelector('[data-slot="past"]');
const presentSlot = document.querySelector('[data-slot="present"]');
const futureSlot = document.querySelector('[data-slot="future"]');
const revealBtn = document.getElementById('reveal-btn');
const newReadingBtn = document.getElementById('new-reading-btn');
const meaningsSection = document.getElementById('meanings');

let cards = [];
let selectedCards = {
  past: null,
  present: null,
  future: null,
};

async function fetchCards() {
  try {
    showNotification('Cargando cartas...', 'info');
    const res = await fetch(API_URL);
    cards = await res.json();
    renderCards();
    showNotification('¡Bienvenida al Tarot de Sakura! 🌸 Elige tus 3 cartas.', 'success');
  } catch (error) {
    cardContainer.innerHTML = '<p>Error cargando cartas. Intenta de nuevo.</p>';
    showNotification('Error al conectar con la API', 'error');
  }
}

function renderCards() {
  cardContainer.innerHTML = '';
  const shuffled = cards.sort(() => Math.random() - 0.5);

  shuffled.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.classList.add('card');
    cardEl.dataset.id = card.id;
    cardEl.title = 'Haz clic para seleccionar esta carta';
    cardEl.tabIndex = 0;
    cardEl.style.backgroundImage = `url(${card.cardsReverse.sakuraReverse})`;

    cardEl.addEventListener('click', () => selectCard(card, cardEl));
    cardEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCard(card, cardEl);
      }
    });

    cardContainer.appendChild(cardEl);
  });
}

function selectCard(card, cardEl) {
  if (Object.values(selectedCards).includes(card)) {
    showNotification('Ya has seleccionado esta carta.', 'warning');
    return;
  }

  if (!selectedCards.past) {
    selectedCards.past = card;
    updateSlot(pastSlot, card);
  } else if (!selectedCards.present) {
    selectedCards.present = card;
    updateSlot(presentSlot, card);
  } else if (!selectedCards.future) {
    selectedCards.future = card;
    updateSlot(futureSlot, card);
  } else {
    showNotification('Ya seleccionaste 3 cartas. Pulsa "Revelar Significado".', 'info');
    return;
  }

  cardEl.style.backgroundImage = `url(${card.sakuraCard})`;

  const ready = selectedCards.past && selectedCards.present && selectedCards.future;
  revealBtn.disabled = !ready;
  revealBtn.setAttribute('aria-disabled', !ready);
}

function updateSlot(slot, card) {
  slot.style.backgroundImage = `url(${card.sakuraCard})`;
  slot.textContent = '';
}

function showMeanings() {
  meaningsSection.innerHTML = `
    <div class="meanings-container">
      <h2>🔮 Significados de la Lectura 🔮</h2>
      <p><strong>🕰️ Pasado:</strong> ${selectedCards.past.meaning}</p>
      <p><strong>⭐ Presente:</strong> ${selectedCards.present.meaning}</p>
      <p><strong>🌙 Futuro:</strong> ${selectedCards.future.meaning}</p>
    </div>
  `;
  showNotification('✨ Tu lectura ha sido revelada ✨', 'success');
  revealBtn.disabled = true;
  revealBtn.setAttribute('aria-disabled', 'true');
}

// Nueva lectura: resetea todo
function resetReading() {
  selectedCards = { past: null, present: null, future: null };
  pastSlot.style.backgroundImage = '';
  presentSlot.style.backgroundImage = '';
  futureSlot.style.backgroundImage = '';
  pastSlot.textContent = 'Pasado';
  presentSlot.textContent = 'Presente';
  futureSlot.textContent = 'Futuro';
  meaningsSection.innerHTML = '';
  revealBtn.disabled = true;
  revealBtn.setAttribute('aria-disabled', 'true');
  renderCards();
  showNotification('🔁 Lectura reiniciada. Elige nuevas cartas.', 'info');
}

// Simple sistema de notificaciones
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

// Estilos básicos para notificaciones y significados
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 1rem 1.5rem;
      border-radius: 8px;
      background-color: #ffe0f0;
      color: #4c2564;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 1000;
      transition: opacity 0.3s ease;
    }

    .toast-success { background-color: #d6ffdc; color: #2e7d32; }
    .toast-warning { background-color: #fff4c4; color: #a67900; }
    .toast-error   { background-color: #ffd6d6; color: #b00020; }

    .meanings-container {
      background: #fff0f6;
      padding: 1.5rem;
      border-radius: 15px;
      border: 2px solid #ffcce6;
      margin-top: 2rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .meanings-container p {
      margin: 0.75rem 0;
      font-size: 1rem;
      line-height: 1.6;
    }

    #reveal-btn[aria-disabled="true"] {
      opacity: 0.5;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

export async function getCardById(id) {
  const res = await fetch(`https://6388b6e5a4bb27a7f78f96a5.mockapi.io/sakura-cards/${id}`);
  if (!res.ok) {
    throw new Error(`Error al buscar carta con ID ${id}`);
  }
  return await res.json();
}

// Listeners
revealBtn.addEventListener('click', showMeanings);
newReadingBtn.addEventListener('click', resetReading);




// Iniciar
injectStyles();
fetchCards();
