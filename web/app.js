document.addEventListener("DOMContentLoaded", () => {
    const channelListContainer = document.getElementById("channel-list");
    const categorySelect = document.getElementById("category-select");
    const videoElement = document.getElementById("tv-player");
    const sidebar = document.getElementById("sidebar");
    const appContainer = document.getElementById("app-container");
    const osdInfo = document.getElementById("osd-info");
    const currentChannelName = document.getElementById("current-channel-name");
    const lightToggleBtn = document.getElementById("light-toggle-btn");
    
    const m3uUrl = "https://stratusnex.intinet.com.ar/channels/canales.m3u"; 

    let allChannels = [];
    let activeChannels = [];
    let focusables = [];
    let currentIndex = 0;
    let hideMenuTimer = null;
    let lightsOn = true;

    // 1. Cargar y parsear M3U con logos
    fetch(m3uUrl)
        .then(response => response.text())
        .then(data => {
            allChannels = parseM3UWithLogos(data);
            populateCategories(allChannels);
            filterChannelsByGroup("ALL");
        })
        .catch(error => {
            console.error("Error al cargar la lista M3U:", error);
            channelListContainer.innerHTML = "<li>Error al cargar canales</li>";
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
            
            const img = document.createElement("img");
            img.classList.add("channel-logo");
            img.src = channel.logo || "data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'></svg>";
            img.onerror = () => { img.style.display = 'none'; };

            const span = document.createElement("span");
            span.classList.add("channel-name");
            span.textContent = channel.name;

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
            const url = listItems[currentIndex].getAttribute("data-stream");
            const name = listItems[currentIndex].querySelector(".channel-name").textContent;
            
            currentChannelName.textContent = name;
            playStream(url);
            showOSD();
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

    // Funciones de control de interfaz
    function showMenu() {
        sidebar.classList.remove("hidden");
        resetHideTimer();
    }

    function hideMenu() {
        sidebar.classList.add("hidden");
    }

    function resetHideTimer() {
        clearTimeout(hideMenuTimer);
        hideMenuTimer = setTimeout(() => {
            if (document.activeElement.tagName !== "SELECT" && document.activeElement !== lightToggleBtn) {
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

    // Alternar luz (Apagar / Encender interfaz)
    function toggleLights() {
        lightsOn = !lightsOn;
        if (lightsOn) {
            sidebar.classList.remove("lights-out");
            lightToggleBtn.textContent = "💡";
        } else {
            sidebar.classList.add("lights-out");
            lightToggleBtn.textContent = "🌙";
        }
        resetHideTimer();
    }

    lightToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleLights();
    });

    appContainer.addEventListener("click", (e) => {
        if (!sidebar.contains(e.target)) {
            if (sidebar.classList.contains("hidden")) {
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

    // Control por teclado / control remoto de TV
    document.addEventListener("keydown", (event) => {
        showMenu();
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
                if (activeElement === lightToggleBtn) {
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
                if (sidebar.classList.contains("hidden")) {
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
