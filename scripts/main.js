// main.js - Lógica principal de la aplicación Sakura Tarot

import { getAllCards, getMultipleRandomCards } from './api.js';
import { 
    saveFavoriteReading, 
    getFavoriteReadings, 
    isCurrentReadingInFavorites,
    showNotification,
    initializeStorage,
    shuffleArray
} from './utils.js';

// Estado global de la aplicación
let appState = {
    allCards: [],
    selectedCards: {
        past: null,
        present: null,
        future: null
    },
    currentReading: null,
    isReadingRevealed: false
};

// Elementos del DOM
let elements = {};

/**
 * Inicializa la aplicación
 */
async function initializeApp() {
    try {
        // Inicializar almacenamiento
        initializeStorage();
        
        // Obtener referencias a elementos del DOM
        elements = {
            cardContainer: document.getElementById('card-container'),
            selectedCards: document.getElementById('selected-cards'),
            revealBtn: document.getElementById('reveal-btn'),
            newReadingBtn: document.getElementById('new-reading-btn'),
            favBtn: document.getElementById('fav-btn'),
            meaningsSection: document.getElementById('meanings'),
            slots: {
                past: document.querySelector('[data-slot="past"]'),
                present: document.querySelector('[data-slot="present"]'),
                future: document.querySelector('[data-slot="future"]')
            }
        };
        
        // Cargar cartas desde la API
        await loadCards();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Renderizar cartas iniciales
        renderCards();
        
        showNotification('¡Bienvenido a Sakura Tarot! 🌸', 'success');
        
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showNotification('Error al cargar la aplicación', 'error');
    }
}

/**
 * Carga las cartas desde la API
 */
async function loadCards() {
    try {
        const cards = await getAllCards();
        appState.allCards = shuffleArray(cards);
        console.log(`Cargadas ${cards.length} cartas de Sakura`);
    } catch (error) {
        console.error('Error al cargar cartas:', error);
        // Fallback con cartas dummy si falla la API
        appState.allCards = createDummyCards();
        showNotification('Usando cartas de respaldo', 'info');
    }
}

/**
 * Crea cartas de respaldo si falla la API
 */
function createDummyCards() {
    const dummyCards = [];
    for (let i = 1; i <= 52; i++) {
        dummyCards.push({
            id: i,
            name: `Carta ${i}`,
            image: 'assets/back.png',
            meaning: `Esta es la carta número ${i} de Sakura. Representa energías místicas y transformación.`
        });
    }
    return dummyCards;
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Botón revelar significado
    elements.revealBtn.addEventListener('click', revealMeaning);
    
    // Botón nueva lectura
    elements.newReadingBtn.addEventListener('click', startNewReading);
    
    // Botón favoritos
    elements.favBtn.addEventListener('click', handleFavorites);
    
    // Event listener para los slots (permitir reemplazar cartas)
    Object.values(elements.slots).forEach(slot => {
        slot.addEventListener('click', () => {
            if (appState.isReadingRevealed) return;
            
            const slotType = slot.dataset.slot;
            if (appState.selectedCards[slotType]) {
                // Reemplazar carta existente
                const currentCard = appState.selectedCards[slotType];
                appState.selectedCards[slotType] = null;
                clearSlot(slot, slotType);
                
                // Devolver la carta al mazo visual
                addCardBackToContainer(currentCard);
                
                updateRevealButton();
            }
        });
    });
}

/**
 * Renderiza las cartas en el contenedor
 */
function renderCards() {
    elements.cardContainer.innerHTML = '';
    
    appState.allCards.forEach((card, index) => {
        // No mostrar cartas ya seleccionadas
        if (Object.values(appState.selectedCards).some(selected => selected && selected.id === card.id)) {
            return;
        }
        
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.cardIndex = index;
        
        // Usar imagen de respaldo por defecto
        cardElement.style.backgroundImage = "url('assets/back.png')";
        
        cardElement.addEventListener('click', () => selectCard(card, cardElement));
        
        elements.cardContainer.appendChild(cardElement);
    });
}

/**
 * Selecciona una carta para la lectura
 */
function selectCard(card, cardElement) {
    if (appState.isReadingRevealed) {
        showNotification('Inicia una nueva lectura para seleccionar cartas', 'info');
        return;
    }
    
    // Encontrar el primer slot disponible
    const slots = ['past', 'present', 'future'];
    const availableSlot = slots.find(slot => !appState.selectedCards[slot]);
    
    if (!availableSlot) {
        showNotification('Ya has seleccionado todas las cartas necesarias', 'info');
        return;
    }
    
    // Asignar carta al slot
    appState.selectedCards[availableSlot] = card;
    
    // Actualizar visual del slot
    updateSlot(availableSlot, card);
    
    // Remover carta del contenedor
    cardElement.remove();
    
    // Actualizar botón de revelar
    updateRevealButton();
    
    // Mostrar progreso
    const selectedCount = Object.values(appState.selectedCards).filter(c => c !== null).length;
    showNotification(`Carta ${selectedCount}/3 seleccionada para ${translateSlot(availableSlot)}`, 'success');
}

/**
 * Actualiza la visualización de un slot
 */
function updateSlot(slotType, card) {
    const slot = elements.slots[slotType];
    slot.textContent = '';
    slot.style.backgroundImage = "url('assets/back.png')";
    slot.style.backgroundSize = 'cover';
    slot.style.border = '3px solid #ff66a3';
    slot.style.color = 'transparent';
}

/**
 * Limpia un slot
 */
function clearSlot(slot, slotType) {
    slot.textContent = translateSlot(slotType);
    slot.style.backgroundImage = '';
    slot.style.border = '3px dashed #b5838d';
    slot.style.color = '#8e5a7f';
}

/**
 * Agrega una carta de vuelta al contenedor
 */
function addCardBackToContainer(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.cardId = card.id;
    cardElement.style.backgroundImage = "url('assets/back.png')";
    
    cardElement.addEventListener('click', () => selectCard(card, cardElement));
    
    elements.cardContainer.appendChild(cardElement);
}

/**
 * Actualiza el estado del botón revelar
 */
function updateRevealButton() {
    const allSelected = Object.values(appState.selectedCards).every(card => card !== null);
    elements.revealBtn.disabled = !allSelected || appState.isReadingRevealed;
    elements.revealBtn.setAttribute('aria-disabled', (!allSelected || appState.isReadingRevealed).toString());
}

async function revealMeaning() {
  if (appState.isReadingRevealed) return;

  elements.revealBtn.disabled = true;
  elements.revealBtn.textContent = 'Revelando...';

  try {
    const updatedCards = {};
    const updatedMeanings = {};

    for (const [position, card] of Object.entries(appState.selectedCards)) {
      const cardWithMeaning = await getCardById(card.id);
      updatedCards[position] = cardWithMeaning;
      updatedMeanings[position] = cardWithMeaning.meaning || 'Sin significado disponible.';
    }

    appState.currentReading = {
      cards: updatedCards,
      meanings: updatedMeanings,
      timestamp: Date.now()
    };

    appState.isReadingRevealed = true;

    await showReading(appState.currentReading);
    elements.revealBtn.textContent = 'Significado Revelado';
    updateFavoriteButton();
    showNotification('Lectura revelada desde la API ✨', 'success');

  } catch (error) {
    console.error('Error al revelar significado:', error);
    showNotification('Error al obtener los significados.', 'error');
    elements.revealBtn.disabled = false;
    elements.revealBtn.textContent = 'Revelar Significado';
  }
}


/**
 * Muestra la lectura completa
 */
async function displayReading(reading) {
    // Actualizar slots con imágenes reales si están disponibles
    for (const [position, card] of Object.entries(reading.cards)) {
        const slot = elements.slots[position];
        if (card.image && card.image !== 'assets/back.png') {
            slot.style.backgroundImage = `url('${card.image}')`;
        }
    }
    
    // Mostrar significados
    const meaningsHtml = `
        <div class="meanings-container">
            <h3>Tu Lectura del Tarot Sakura</h3>
            <div class="meaning-card">
                <h4>Pasado</h4>
                <p><strong>${reading.cards.past.name || `Carta ${reading.cards.past.id}`}</strong></p>
                <p>${reading.meanings.past}</p>
            </div>
            <div class="meaning-card">
                <h4>Presente</h4>
                <p><strong>${reading.cards.present.name || `Carta ${reading.cards.present.id}`}</strong></p>
                <p>${reading.meanings.present}</p>
            </div>
            <div class="meaning-card">
                <h4>Futuro</h4>
                <p><strong>${reading.cards.future.name || `Carta ${reading.cards.future.id}`}</strong></p>
                <p>${reading.meanings.future}</p>
            </div>
        </div>
    `;
    
    elements.meaningsSection.innerHTML = meaningsHtml;
    
    // Agregar estilos para los significados
    addMeaningStyles();
}

/**
 * Agrega estilos para la sección de significados
 */
function addMeaningStyles() {
    if (!document.querySelector('#meaning-styles')) {
        const style = document.createElement('style');
        style.id = 'meaning-styles';
        style.textContent = `
            .meanings-container {
                background: linear-gradient(135deg, #fff0f6 0%, #ffccf9 100%);
                border-radius: 20px;
                padding: 2rem;
                margin: 2rem 0;
                box-shadow: 0 8px 25px rgba(197, 143, 170, 0.3);
                border: 2px solid #ffb3d9;
            }
            
            .meanings-container h3 {
                color: #4c2564;
                font-size: 1.8rem;
                margin-bottom: 1.5rem;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            
            .meaning-card {
                background: rgba(255, 255, 255, 0.8);
                border-radius: 15px;
                padding: 1.5rem;
                margin: 1rem 0;
                border-left: 5px solid #ff66a3;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                transition: transform 0.3s ease;
            }
            
            .meaning-card:hover {
                transform: translateY(-2px);
            }
            
            .meaning-card h4 {
                color: #4c2564;
                font-size: 1.3rem;
                margin-bottom: 0.5rem;
            }
            
            .meaning-card p {
                margin: 0.5rem 0;
                line-height: 1.6;
                text-align: left;
            }
            
            .meaning-card p:first-of-type {
                font-weight: 600;
                color: #794CAE;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Inicia una nueva lectura
 */
function startNewReading() {
    // Limpiar estado
    appState.selectedCards = { past: null, present: null, future: null };
    appState.currentReading = null;
    appState.isReadingRevealed = false;
    
    // Limpiar slots
    Object.entries(elements.slots).forEach(([slotType, slot]) => {
        clearSlot(slot, slotType);
    });
    
    // Limpiar significados
    elements.meaningsSection.innerHTML = '';
    
    // Resetear botones
    elements.revealBtn.disabled = true;
    elements.revealBtn.textContent = 'Revelar Significado';
    elements.revealBtn.setAttribute('aria-disabled', 'true');
    
    updateFavoriteButton();
    
    // Re-renderizar todas las cartas
    renderCards();
    
    showNotification('Nueva lectura iniciada 🔄', 'info');
}

 // Crear modal simple
    const modal = document.createElement('div');
    modal.className = 'favorites-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>💖 Tus Lecturas Favoritas</h3>
                <button class="close-modal" aria-label="Cerrar">✕</button>
            </div>
            <div class="modal-body">
                ${favorites.map(fav => `
                    <div class="favorite-item">
                        <div class="favorite-date">${new Date(fav.date).toLocaleDateString('es-ES')}</div>
                        <div class="favorite-cards">
                            <span>${fav.cards.past.name || `Carta ${fav.cards.past.id}`}</span> •
                            <span>${fav.cards.present.name || `Carta ${fav.cards.present.id}`}</span> •
                            <span>${fav.cards.future.name || `Carta ${fav.cards.future.id}`}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Agregar estilos del modal
    addModalStyles();
    
    // Event listener para cerrar
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('close-modal')) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);

/**
 * Agrega estilos para el modal
 */
function addModalStyles() {
    if (!document.querySelector('#modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .favorites-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .modal-content {
                background: white;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                max-height: 70vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #eee;
                background: #ffccf9;
                border-radius: 15px 15px 0
                                background: #ffccf9;
                border-radius: 15px 15px 0 0;
            }

            .modal-header h3 {
                margin: 0;
                font-size: 1.5rem;
                color: #4c2564;
            }

            .close-modal {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #794CAE;
            }

            .modal-body {
                padding: 1.5rem;
            }

            .favorite-item {
                background: #fff0f6;
                padding: 1rem;
                border-radius: 10px;
                margin-bottom: 1rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }

            .favorite-date {
                font-size: 0.9rem;
                color: #888;
                margin-bottom: 0.5rem;
            }

            .favorite-cards span {
                background: #ffb3d9;
                padding: 0.3rem 0.6rem;
                border-radius: 5px;
                margin-right: 0.5rem;
                color: #4c2564;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeApp);


import { saveFavoriteReading } from './utils.js'; // o ajusta según tu estructura

document.getElementById('fav-btn').addEventListener('click', () => {
  const currentReading = {
    cards: {
      past: selectedCards.past,
      present: selectedCards.present,
      future: selectedCards.future
    },
    meanings: {
      past: selectedCards.past?.meaning,
      present: selectedCards.present?.meaning,
      future: selectedCards.future?.meaning
    }
  };

  // Solo guardar si hay una lectura completa
  if (selectedCards.past && selectedCards.present && selectedCards.future) {
    saveFavoriteReading(currentReading);
    window.location.href = 'favorites.html';
  } else {
    alert('Selecciona las 3 cartas antes de guardar en favoritos.');
  }
});


