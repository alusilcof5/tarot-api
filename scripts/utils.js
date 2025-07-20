// Función para cargar y mostrar las cartas guardadas
function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem('sakuraFavorites') || '[]');
  const savedReadingsContainer = document.getElementById('saved-readings');
  const clearBtn = document.getElementById('clear-favorites-btn');

  savedReadingsContainer.innerHTML = '';

  if (favorites.length === 0) {
    savedReadingsContainer.innerHTML = '<p>No hay lecturas guardadas aún.</p>';
    clearBtn.style.display = 'none';
    return;
  }

  clearBtn.style.display = 'inline-block';

  favorites.forEach(fav => {
    // Creamos un div tipo card para cada lectura guardada
    const card = document.createElement('div');
    card.className = 'card';
    card.title = fav.name || 'Carta guardada';

    // Ponemos imagen de la carta o un placeholder
    card.style.backgroundImage = `url(${fav.image || '../assets/back.png'})`;

    // Tooltip con nombre y fecha lectura (usando aria-label para accesibilidad)
    card.setAttribute('aria-label', `${fav.name}, lectura guardada el ${fav.readingDate || 'fecha desconocida'}`);

    savedReadingsContainer.appendChild(card);
  });
}

// Vaciar favoritos
document.getElementById('clear-favorites-btn').addEventListener('click', () => {
  if (confirm('¿Seguro que quieres eliminar todas las lecturas favoritas?')) {
    localStorage.removeItem('sakuraFavorites');
    loadFavorites();
  }
});

// Cargar al inicio
loadFavorites();
