document.addEventListener("DOMContentLoaded", () => {
    const channelListContainer = document.getElementById("channel-list");
    const videoElement = document.getElementById("tv-player");
    
    // URL de ejemplo o ruta a tu archivo M3U (ej: en GitHub u otro servidor)
    // Puedes reemplazar esto por una URL cruda o un archivo local de prueba
    const m3uUrl = "https://iptv-org.github.io/iptv/index.m3u"; // O tu propia URL/archivo .m3u

    let focusables = [];
    let currentIndex = 0;

    // 1. Cargar y parsear el archivo M3U
    fetch(m3uUrl)
        .then(response => response.text())
        .then(data => {
            const channels = parseM3U(data);
            renderChannels(channels);
        })
        .catch(error => {
            console.error("Error al cargar la lista M3U:", error);
            channelListContainer.innerHTML = "<li>Error al cargar canales</li>";
        });

    // Función analizadora de M3U
    function parseM3U(content) {
        const lines = content.split("\n");
        let channels = [];
        let currentChannel = {};

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#EXTINF:")) {
                // Extraer el nombre del canal después de la coma
                const nameMatch = line.split(",");
                currentChannel.name = nameMatch[nameMatch.length - 1] || "Canal sin nombre";
            } else if (line && !line.startsWith("#")) {
                // La línea que no es comentario es la URL del stream
                currentChannel.url = line;
                if (currentChannel.name && currentChannel.url) {
                    channels.push({ ...currentChannel });
                }
                currentChannel = {};
            }
        }
        // Limitamos para pruebas a los primeros 30 canales para que la lista no sea infinita de golpe
        return channels.slice(0, 30); 
    }

    // Renderizar canales en el HTML
    function renderChannels(channels) {
        channelListContainer.innerHTML = "";
        
        channels.forEach((channel, index) => {
            const li = document.createElement("li");
            li.textContent = channel.name;
            li.setAttribute("tabindex", "0");
            li.setAttribute("data-stream", channel.url);
            li.classList.add("focusable");
            
            // Evento click con mouse/touch
            li.addEventListener("click", () => {
                currentIndex = index;
                selectChannel(index);
            });

            channelListContainer.appendChild(li);
        });

        // Actualizar lista de elementos interactivos
        focusables = document.querySelectorAll(".focusable");
        if (focusables.length > 0) {
            focusables[0].focus();
            selectChannel(0);
        }
    }

    // Reproducir y actualizar selección visual
    function selectChannel(index) {
        currentIndex = index;
        focusables.forEach((item, idx) => {
            item.classList.toggle("selected", idx === currentIndex);
        });
        focusables[currentIndex].focus();
        
        const url = focusables[currentIndex].getAttribute("data-stream");
        playStream(url);
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

    // 2. Control de navegación por Teclado / Control Remoto
    document.addEventListener("keydown", (event) => {
        if (focusables.length === 0) return;

        switch (event.key) {
            case "ArrowUp":
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : focusables.length - 1;
                selectChannel(currentIndex);
                event.preventDefault();
                break;

            case "ArrowDown":
                currentIndex = (currentIndex < focusables.length - 1) ? currentIndex + 1 : 0;
                selectChannel(currentIndex);
                event.preventDefault();
                break;

            case "Enter":
                // Forzar reproducción del canal actual si fuera necesario
                const url = focusables[currentIndex].getAttribute("data-stream");
                playStream(url);
                event.preventDefault();
                break;
        }
    });
});
