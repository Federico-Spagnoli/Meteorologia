# 🌤️ Mappa Meteorologica Interattiva

Un'applicazione web interattiva che permette di cliccare su una mappa geografica per registrare punti di interesse, ottenendo automaticamente il nome della località e la temperatura attuale. I dati vengono salvati in un database locale e visualizzati con statistiche in tempo reale.



## ✨ Funzionalità

* **Mappa Interattiva**: Basata su Leaflet, permette di navigare ed esplorare il mondo.
* **Click & Add**: Cliccando sulla mappa vengono salvate le coordinate, il nome del luogo (tramite **Nominatim**) e la temperatura attuale (tramite **Open-Meteo**).
* **Marker Dinamici**: I punti sulla mappa cambiano colore in base alla temperatura:
    * 🔴 **> 20°C**: Caldo
    * 🟡 **10°C - 20°C**: Mite
    * 🟢 **0°C - 10°C**: Fresco
    * 🔵 **≤ 0°C**: Freddo
* **Database Persistente**: Tutti i dati sono salvati su **PocketBase**.
* **Statistiche**: Calcolo automatico di temperatura media, massima e minima.
* **UI "Paper Style"**: Interfaccia curata con uno stile color carta/beige per una lettura piacevole.

## 🛠️ Tecnologie Utilizzate

* **Vite** - Build tool e server di sviluppo.
* **Leaflet.js** - Libreria per la mappa interattiva.
* **PocketBase** - Backend e database realtime.
* **Open-Meteo API** - Dati meteorologici.
* **Nominatim API** - Geocoding inverso (da coordinate a indirizzo).

## ⚙️ Installazione e Configurazione

### 1. Prerequisiti
Assicurati di avere installato [Node.js](https://nodejs.org/) e [PocketBase](https://pocketbase.io/).

### 2. Setup del Progetto
Clona la repository e installa le dipendenze:

```bash
git clone [https://github.com/TUO-USERNAME/NOME-REPO.git](https://github.com/TUO-USERNAME/NOME-REPO.git)
cd NOME-REPO
npm install
