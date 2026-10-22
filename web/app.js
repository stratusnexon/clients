document.addEventListener("DOMContentLoaded", () => {
    const channelListContainer = document.getElementById("channel-list");
    const categorySelect = document.getElementById("category-select");
    const videoElement = document.getElementById("tv-player");
    
    // Puedes cambiar esto por una URL de prueba o la ruta a tu archivo m3u
    const m3uUrl = "https://stratusnex.intinet.com.ar/marjo.m3u"; 

    let allChannels = [];
    let activeChannels = [];
    let focusables = [];
    let currentIndex = 0;

    // 1. Cargar y parsear la lista M3U
    fetch(m3uUrl)
        .then(response => response.text())
        .then(data => {
            allChannels = parseM3UAdvanced(data);
            populateCategories(allChannels);
            filterChannelsByGroup("ALL");
        })
        .catch(error => {
            console.error("Error al cargar la lista M3U:", error);
            channelListContainer.innerHTML = "<li>Error al cargar canales</li>";
        });

    // Analizador avanzado que extrae grupo, logo y nombre
    function parseM3UAdvanced(content) {
        const lines = content.split("\n");
        let channels = [];
        let currentChannel = {};

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#EXTINF:")) {
                currentChannel = {};
                
                // Extraer group-title si existe
                const groupMatch = line.match(/group-title="([^"]+)"/);
                currentChannel.group = groupMatch ? groupMatch[1] : "General";

                // Extraer tvg-logo si existe
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                currentChannel.logo = logoMatch ? logoMatch[1] : "";

                // Extraer el nombre del canal (después de la última coma)
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

    // Poblar el menú desplegable de categorías
    function populateCategories(channels) {
        const groups = [...new Set(channels.map(c => c.group))].sort();
        
        groups.forEach(group => {
            const option = document.createElement("option");
            option.value = group;
            option.textContent = group;
            categorySelect.appendChild(option);
        });
    }

    // Filtrar canales según la categoría seleccionada
    function filterChannelsByGroup(group) {
        if (group === "ALL") {
            activeChannels = allChannels.slice(0, 50); // Límite para rendimiento inicial
        } else {
            activeChannels = allChannels.filter(c => c.group === group);
        }
        renderChannels(activeChannels);
    }

    // Renderizar lista en pantalla
    function renderChannels(channels) {
        channelListContainer.innerHTML = "";
        
        channels.forEach((channel, index) => {
            const li = document.createElement("li");
            li.textContent = channel.name;
            li.setAttribute("tabindex", "0");
            li.setAttribute("data-stream", channel.url);
            li.classList.add("focusable");
            
            li.addEventListener("click", () => {
                selectChannel(index);
            });

            channelListContainer.appendChild(li);
        });

        updateFocusables();
        if (focusables.length > 0) {
            selectChannel(0);
        }
    }

    function updateFocusables() {
        // Incluimos tanto el selector de categorías como los elementos de la lista en la navegación
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
            const url = listItems[currentIndex].getAttribute("data-stream");
            playStream(url);
        }
    }

    function playStream(url) {
        if (Hls.isSupported() && url.includes(".m3u8")) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(e => console.log("Autoplay bloqueado:", e));
            });
        } else {
            videoElement.src = url;
            videoElement.play().catch(e => console.log("Autoplay bloqueado:", e));
        }
    }

    // Evento para cambiar de categoría desde el selector
    categorySelect.addEventListener("change", (e) => {
        filterChannelsByGroup(e.target.value);
    });

    // Navegación por control remoto / teclado optimizada
    document.addEventListener("keydown", (event) => {
        updateFocusables();
        if (focusables.length === 0) return;

        const activeElement = document.activeElement;
        const currentActiveIndex = Array.from(focusables).indexOf(activeElement);

        switch (event.key) {
            case "ArrowUp":
                if (currentActiveIndex > 0) {
                    focusables[currentActiveIndex - 1].focus();
                } else {
                    focusables[focusables.length - 1].focus();
                }
                event.preventDefault();
                break;

            case "ArrowDown":
                if (currentActiveIndex < focusables.length - 1) {
                    focusables[currentActiveIndex + 1].focus();
                } else {
                    focusables[0].focus();
                }
                event.preventDefault();
                break;

            case "Enter":
                if (activeElement.tagName === "LI") {
                    const idx = Array.from(channelListContainer.querySelectorAll("li")).indexOf(activeElement);
                    if (idx !== -1) selectChannel(idx);
                }
                event.preventDefault();
                break;
        }
    });
});
