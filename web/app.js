document.addEventListener("DOMContentLoaded", () => {
    const channelListContainer = document.getElementById("channel-list");
    const categorySelect = document.getElementById("category-select");
    const videoElement = document.getElementById("tv-player");
    const topBar = document.getElementById("top-bar");
    const sliderContainer = document.getElementById("slider-container");
    const appContainer = document.getElementById("app-container");
    const osdInfo = document.getElementById("osd-info");
    const currentChannelName = document.getElementById("current-channel-name");
    const lightToggleBtn = document.getElementById("light-toggle-btn");
    const homeBtn = document.getElementById("home-btn");
    
    // URL de tu archivo M3U (según tu proyecto en [stratusnexon/clients](https://github.com/stratusnexon/clients))
    const m3uUrl = "https://stratusnex.intinet.com.ar/channels/canales.m3u"; 

    let allChannels = [];
    let activeChannels = [];
    let focusables = [];
    let currentIndex = 0;
    let hideMenuTimer = null;
    let lightsOn = true;

    // 1. Cargar y parsear M3U
    fetch(m3uUrl)
        .then(response => response.text())
        .then(data => {
            allChannels = parseM3UWithLogos(data);
            populateCategories(allChannels);
            filterChannelsByGroup("ALL");
        })
        .catch(error => {
            console.error("Error al cargar la lista M3U:", error);
            channelListContainer.innerHTML = "<li style='flex:1; text-align:center;'>Error al cargar canales</li>";
        });

    function parseM3UWithLogos(content) {
        const lines = content.split("\n");
        let channels = [];
        let currentChannel = {};

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#EXTINF:")) {
                currentChannel = {};
                
                const groupMatch = line.match(/group-title="([^"]+)"/);
                currentChannel.group = groupMatch ? groupMatch[1] : "General";

                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                currentChannel.logo = logoMatch ? logoMatch[1] : "";

                const nameParts = line.split(",");
                currentChannel.name = nameParts[nameParts.length - 1].trim() || "Canal sin nombre";
            } else if (line && !line.startsWith("#")) {
                currentChannel.url = line;
                if (currentChannel.name && currentChannel.url) {
                    channels.push({ ...currentChannel });
                }
            }
        }
        return channels;
    }

    function populateCategories(channels) {
        const groups = [...new Set(channels.map(c => c.group))].sort();
        groups.forEach(group => {
            const option = document.createElement("option");
            option.value = group;
            option.textContent = group;
            categorySelect.appendChild(option);
        });
    }

    function filterChannelsByGroup(group) {
        if (group === "ALL") {
            activeChannels = allChannels.slice(0, 50);
        } else {
            activeChannels = allChannels.filter(c => c.group === group);
        }
        renderChannels(activeChannels);
    }

    function renderChannels(channels) {
        channelListContainer.innerHTML = "";
        
        channels.forEach((channel, index) => {
            const li = document.createElement("li");
            li.setAttribute("tabindex", "0");
            li.setAttribute("data-stream", channel.url);
            li.classList.add("focusable");
            
            // Número de canal formateado (01, 02, etc.)
            const numBadge = document.createElement("span");
            numBadge.classList.add("channel-number");
            numBadge.textContent = String(index + 1).padStart(2, '0');

            const img = document.createElement("img");
            img.classList.add("channel-logo");
            img.src = channel.logo || "data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'></svg>";
            img.onerror = () => { img.style.display = 'none'; };

            const span = document.createElement("span");
            span.classList.add("channel-name");
            span.textContent = channel.name;

            li.appendChild(numBadge);
            li.appendChild(img);
            li.appendChild(span);
            
            li.addEventListener("click", (e) => {
                e.stopPropagation();
                selectChannel(index);
                hideMenu();
            });

            channelListContainer.appendChild(li);
        });

        updateFocusables();
        if (focusables.length > 0) {
            // Autoreproducción automática del primer canal al iniciar
            selectChannel(0);
        }
    }

    function updateFocusables() {
        focusables = document.querySelectorAll(".focusable");
    }

    function selectChannel(index) {
        currentIndex = index;
        const listItems = channelListContainer.querySelectorAll("li");
        
        listItems.forEach((item, idx) => {
            item.classList.toggle("selected", idx === currentIndex);
        });

        if (listItems[currentIndex]) {
            listItems[currentIndex].focus();
            listItems[currentIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            
            const url = listItems[currentIndex].getAttribute("data-stream");
            const name = listItems[currentIndex].querySelector(".channel-name").textContent;
            const num = listItems[currentIndex].querySelector(".channel-number").textContent;
            
            currentChannelName.textContent = `${num} - ${name}`;
            playStream(url);
            showOSD();
        }
    }

    let hlsInstance = null; // Variable global para controlar la instancia actual

let hlsInstance = null;

function playStream(url) {
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }

    videoElement.pause();
    videoElement.removeAttribute('src');
    videoElement.load();

    if (!url) return;

    // Mostrar en el OSD que está cargando
    currentChannelName.textContent = "🔄 Cargando stream...";
    showOSD();

    // Validar si es HTTP en sitio HTTPS (Contenido Mixto)
    if (window.location.protocol === 'https:' && url.startsWith('http://')) {
        console.warn("Advertencia: Intentando reproducir HTTP en una página HTTPS. Los navegadores bloquean esto.");
    }

    if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = url;
        videoElement.addEventListener('loadedmetadata', () => {
            videoElement.play().catch(e => console.log("Error de reproducción:", e));
        });
    } 
    else if (Hls.isSupported()) {
        hlsInstance = new Hls({
            maxBufferLength: 30,
            liveSyncDurationCount: 3,
            xhrSetup: function (xhr, url) {
                xhr.withCredentials = false;
            }
        });

        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(videoElement);
        
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            videoElement.play().then(() => {
                // Restaurar el nombre real una vez que arranca
                const activeLi = channelListContainer.querySelector("li.selected");
                if (activeLi) {
                    const num = activeLi.querySelector(".channel-number").textContent;
                    const name = activeLi.querySelector(".channel-name").textContent;
                    currentChannelName.textContent = `${num} - ${name}`;
                }
            }).catch(e => {
                console.log("Autoplay bloqueado por el navegador:", e);
                currentChannelName.textContent = "⚠️ Toca la pantalla para reproducir";
            });
        });

        // Capturar errores específicos de carga
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error("Error de red o stream caído:", data);
                        currentChannelName.textContent = "❌ Canal offline o sin conexión";
                        hlsInstance.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error("Error de medios (códec no soportado):", data);
                        currentChannelName.textContent = "❌ Formato no compatible";
                        hlsInstance.recoverMediaError();
                        break;
                    default:
                        currentChannelName.textContent = "❌ Error al reproducir canal";
                        hlsInstance.destroy();
                        hlsInstance = null;
                        break;
                }
                showOSD();
            }
        });
    } else {
        currentChannelName.textContent = "❌ HLS no soportado en este navegador";
        showOSD();
    }
}

    // Funciones de control de interfaz
    function showMenu() {
        topBar.classList.remove("hidden");
        sliderContainer.classList.remove("hidden");
        resetHideTimer();
    }

    function hideMenu() {
        topBar.classList.add("hidden");
        sliderContainer.classList.add("hidden");
    }

    function resetHideTimer() {
        clearTimeout(hideMenuTimer);
        hideMenuTimer = setTimeout(() => {
            if (document.activeElement.tagName !== "SELECT" && document.activeElement !== lightToggleBtn && document.activeElement !== homeBtn) {
                hideMenu();
            }
        }, 6000);
    }

    function showOSD() {
        osdInfo.classList.add("visible");
        setTimeout(() => {
            osdInfo.classList.remove("visible");
        }, 3000);
    }

    // Botón Home (Ir al Canal 1)
    function goHome() {
        categorySelect.value = "ALL";
        filterChannelsByGroup("ALL");
        selectChannel(0);
        showMenu();
    }

    homeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        goHome();
    });

    // Alternar luz
    function toggleLights() {
        lightsOn = !lightsOn;
        if (lightsOn) {
            appContainer.classList.remove("lights-out");
            lightToggleBtn.textContent = "💡";
        } else {
            appContainer.classList.add("lights-out");
            lightToggleBtn.textContent = "🌙";
        }
        resetHideTimer();
    }

    lightToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleLights();
    });

    // Tocar la pantalla desvanece o muestra la interfaz
    appContainer.addEventListener("click", (e) => {
        if (!topBar.contains(e.target) && !sliderContainer.contains(e.target)) {
            if (sliderContainer.classList.contains("hidden")) {
                showMenu();
            } else {
                hideMenu();
            }
        }
    });

    categorySelect.addEventListener("change", (e) => {
        filterChannelsByGroup(e.target.value);
        resetHideTimer();
    });

    // Control por teclado / Control Remoto
    document.addEventListener("keydown", (event) => {
        showMenu();
        updateFocusables();
        if (focusables.length === 0) return;

        const activeElement = document.activeElement;
        const currentActiveIndex = Array.from(focusables).indexOf(activeElement);

        switch (event.key) {
            case "ArrowLeft":
                if (currentActiveIndex > 0) {
                    focusables[currentActiveIndex - 1].focus();
                    if (focusables[currentActiveIndex - 1].tagName === "LI") {
                        const idx = Array.from(channelListContainer.querySelectorAll("li")).indexOf(focusables[currentActiveIndex - 1]);
                        if (idx !== -1) selectChannel(idx);
                    }
                }
                event.preventDefault();
                break;

            case "ArrowRight":
                if (currentActiveIndex < focusables.length - 1) {
                    focusables[currentActiveIndex + 1].focus();
                    if (focusables[currentActiveIndex + 1].tagName === "LI") {
                        const idx = Array.from(channelListContainer.querySelectorAll("li")).indexOf(focusables[currentActiveIndex + 1]);
                        if (idx !== -1) selectChannel(idx);
                    }
                }
                event.preventDefault();
                break;

            case "Enter":
                if (activeElement === homeBtn) {
                    goHome();
                } else if (activeElement === lightToggleBtn) {
                    toggleLights();
                } else if (activeElement.tagName === "LI") {
                    const idx = Array.from(channelListContainer.querySelectorAll("li")).indexOf(activeElement);
                    if (idx !== -1) {
                        selectChannel(idx);
                        hideMenu();
                    }
                }
                event.preventDefault();
                break;
                
            case "Escape":
            case "Backspace":
                if (sliderContainer.classList.contains("hidden")) {
                    showMenu();
                } else {
                    hideMenu();
                }
                event.preventDefault();
                break;
        }
        resetHideTimer();
    });
});
