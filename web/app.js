document.addEventListener("DOMContentLoaded", () => {
    const el = (id) => document.getElementById(id);
    const channelListContainer = el("channel-list"), categoriesContainer = el("categories-container");
    const moviesBtn = el("movies-btn"), playerSlot = el("player-slot"), topBar = el("top-bar");
    const sliderContainer = el("slider-container"), appContainer = el("app-container");
    const osdInfo = el("osd-info"), currentChannelName = el("current-channel-name");
    const homeBtn = el("home-btn"), streamWatermark = el("stream-watermark");
    const offlineOverlay = el("offline-overlay"), welcomeScreen = el("welcome-screen"), enterBtn = el("enter-btn");
    
    // Rutas protegidas mediante codificación básica Base64 para evitar lectura visual directa
    const decodeUrl = (b64) => atob(b64);
    const m3uChannelsUrl = decodeUrl("aHR0cHM6Ly9zdHJhdHVzbmV4LmludGluZXQuY29tLmFyL2NoYW5uZWxzL2NhbmFsZXMubTN1"); 
    const m3uMoviesUrl = decodeUrl("aHR0cHM6Ly9zdHJhdHVzbmV4LmludGluZXQuY29tLmFyL2NoYW5uZWxzL29uZGVtYW5kLm0zdQ=="); 
    const defaultLogoUrl = decodeUrl("aHR0cHM6Ly9zdHJhdHVzbmV4LmludGluZXQuY29tLmFyL3dlYi9pbWFnZXMvbG9nby5wbmc=");

    let allChannels = [], activeChannels = [], focusables = [], currentIndex = 0;
    let hideMenuTimer = null, hlsInstance = null, currentM3uSource = m3uChannelsUrl, currentCategory = "", appStarted = false;
    let numericInputBuffer = "", numericTimer = null;

    const categoryShortcuts = {
        "4220": "GENERAL", "4221": "ENTRETENIMIENTO", "4222": "DEPORTES", "4223": "MÚSICA",
        "4224": "LATAM", "4225": "RADIOS", "4226": "PACKPREMIUM", "4227": "CULTURA", "4228": "DIGITAL", "9999": "RECENT"
    };

    enterBtn.focus();

    function startApp() {
        if (appStarted) return;
        appStarted = true;
        welcomeScreen.classList.add("hidden");
        loadM3U(m3uChannelsUrl, true);
        showMenu();
    }

    enterBtn.addEventListener("click", (e) => { e.stopPropagation(); startApp(); });

    function loadM3U(url, autoSelectFirst = true) {
        currentM3uSource = url;
        fetch(url)
            .then(res => res.text())
            .then(data => {
                allChannels = parseM3U(data);
                categoriesContainer.innerHTML = "";
                moviesBtn.classList.toggle("active", url === m3uMoviesUrl);
                populateCategoryButtons(allChannels, autoSelectFirst);
            })
            .catch(() => { channelListContainer.innerHTML = "<li style='flex:1; text-align:center;'>Error al cargar</li>"; });
    }

    function parseM3U(content) {
        const lines = content.split("\n");
        let channels = [], currentChannel = {};
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#EXTINF:")) {
                currentChannel = {};
                const groupMatch = line.match(/group-title="([^"]+)"/);
                currentChannel.group = groupMatch ? groupMatch[1].trim() : "General";
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                currentChannel.logo = (logoMatch ? logoMatch[1].trim() : "") || defaultLogoUrl;
                const nameParts = line.split(",");
                currentChannel.name = nameParts[nameParts.length - 1].trim() || "Sin nombre";
            } else if (line && !line.startsWith("#")) {
                currentChannel.url = line;
                if (currentChannel.name && currentChannel.url) channels.push({ ...currentChannel });
            }
        }
        channels.forEach((ch, idx) => { ch.channelNumber = idx + 1; });
        return channels;
    }

    function populateCategoryButtons(channels, autoSelectFirst) {
        const recBtn = document.createElement("button");
        recBtn.className = "category-btn focusable";
        recBtn.setAttribute("tabindex", "0");
        recBtn.setAttribute("data-group", "RECENT");
        recBtn.textContent = "⭐ Recientes";
        recBtn.addEventListener("click", (e) => { e.stopPropagation(); selectCategory("RECENT"); resetHideTimer(); });
        categoriesContainer.appendChild(recBtn);

        ([...new Set(channels.map(c => c.group))].sort()).forEach(group => {
            if (categoriesContainer.querySelector(`[data-group="${group}"]`)) return;
            const btn = document.createElement("button");
            btn.className = "category-btn focusable";
            btn.setAttribute("tabindex", "0");
            btn.setAttribute("data-group", group);
            btn.textContent = group;
            btn.addEventListener("click", (e) => { e.stopPropagation(); selectCategory(group); resetHideTimer(); });
            categoriesContainer.appendChild(btn);
        });

        if (channels.length > 0) selectCategory("RECENT", autoSelectFirst);
    }

    function selectCategory(group, playFirst = false) {
        currentCategory = group;
        categoriesContainer.querySelectorAll(".category-btn").forEach(btn => {
            btn.classList.toggle("selected", btn.getAttribute("data-group") === group);
        });
        activeChannels = (group === "RECENT") ? getRecentChannels() : allChannels.filter(c => c.group === group);
        renderChannels(activeChannels, playFirst);
    }

    function getRecentChannels() {
        try { const saved = localStorage.getItem("stratus_recent_channels"); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    }

    function addRecentChannel(channel) {
        let recents = getRecentChannels().filter(c => c.url !== channel.url);
        recents.unshift(channel);
        if (recents.length > 10) recents.pop();
        try { localStorage.setItem("stratus_recent_channels", JSON.stringify(recents)); } catch (e) {}
    }

    function renderChannels(channels, playFirst = false) {
        channelListContainer.innerHTML = "";
        if (channels.length === 0) {
            channelListContainer.innerHTML = "<li style='flex:1; text-align:center; color:#777; justify-content:center;'>Sin contenido</li>";
            updateFocusables();
            return;
        }

        channels.forEach((channel, index) => {
            const li = document.createElement("li");
            li.setAttribute("tabindex", "0");
            li.setAttribute("data-stream", channel.url);
            li.classList.add("focusable");
            
            const numBadge = document.createElement("span");
            numBadge.classList.add("channel-number");
            numBadge.textContent = String(channel.channelNumber || index + 1).padStart(2, '0');

            const img = document.createElement("img");
            img.classList.add("channel-logo");
            img.src = channel.logo;
            img.onerror = () => { img.src = defaultLogoUrl; };

            const span = document.createElement("span");
            span.classList.add("channel-name");
            span.textContent = channel.name;

            li.appendChild(numBadge); li.appendChild(img); li.appendChild(span);
            li.addEventListener("click", (e) => {
                e.stopPropagation();
                const idx = activeChannels.findIndex(c => c.url === channel.url);
                if (idx !== -1) selectChannel(idx);
                hideMenu();
            });
            channelListContainer.appendChild(li);
        });

        updateFocusables();
        if (playFirst && focusables.length > 0) selectChannel(0);
    }

    function updateFocusables() { focusables = document.querySelectorAll(".focusable"); }

    function selectChannel(index) {
        currentIndex = index;
        const listItems = channelListContainer.querySelectorAll("li");
        listItems.forEach((item, idx) => { item.classList.toggle("selected", idx === currentIndex); });

        if (listItems[currentIndex] && listItems[currentIndex].getAttribute("data-stream")) {
            listItems[currentIndex].focus();
            listItems[currentIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            
            const url = listItems[currentIndex].getAttribute("data-stream");
            const name = listItems[currentIndex].querySelector(".channel-name").textContent;
            const num = listItems[currentIndex].querySelector(".channel-number").textContent;
            
            currentChannelName.textContent = `${num} - ${name}`;
            offlineOverlay.classList.remove("visible");
            playStream(url);
            showOSD();

            const selObj = activeChannels[index];
            streamWatermark.style.display = (selObj && selObj.group.toUpperCase() === "DIGITAL") ? "block" : "none";
            if (selObj && currentCategory !== "RECENT") addRecentChannel(selObj);
        }
    }

    function playStream(url) {
        if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
        if (!playerSlot.querySelector("video")) {
            playerSlot.innerHTML = `<video id="tv-player" autoplay playsinline></video><img src="${defaultLogoUrl}" alt="Watermark" id="stream-watermark" class="watermark-logo">`;
        }
        const videoElement = document.getElementById("tv-player");
        videoElement.pause(); videoElement.removeAttribute('src'); videoElement.load();

        if (!url) { offlineOverlay.classList.add("visible"); return; }

        if (Hls.isSupported()) {
            hlsInstance = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60, liveSyncDurationCount: 3, lowLatencyMode: true, xhrSetup: (xhr) => { xhr.withCredentials = false; } });
            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(videoElement);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => { videoElement.play().catch(() => {}); });
            hlsInstance.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hlsInstance.startLoad();
                    else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hlsInstance.recoverMediaError();
                    else { hlsInstance.destroy(); hlsInstance = null; offlineOverlay.classList.add("visible"); }
                }
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = url;
            videoElement.addEventListener('loadedmetadata', () => { videoElement.play().catch(() => {}); });
            videoElement.addEventListener('error', () => { offlineOverlay.classList.add("visible"); });
        } else {
            offlineOverlay.classList.add("visible");
        }
    }

    function showMenu() {
        if (!appStarted) return;
        topBar.classList.remove("hidden");
        sliderContainer.classList.remove("hidden");
        const listItems = channelListContainer.querySelectorAll("li");
        if (listItems[currentIndex] && listItems[currentIndex].classList.contains("selected")) {
            listItems[currentIndex].focus();
            listItems[currentIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
        resetHideTimer();
    }

    function hideMenu() {
        if (!appStarted) return;
        topBar.classList.add("hidden");
        sliderContainer.classList.add("hidden");
    }

    function resetHideTimer() {
        clearTimeout(hideMenuTimer);
        hideMenuTimer = setTimeout(() => {
            if (appStarted && !topBar.contains(document.activeElement) && document.activeElement !== moviesBtn && document.activeElement !== homeBtn) hideMenu();
        }, 6000);
    }

    function showOSD() {
        osdInfo.classList.add("visible");
        setTimeout(() => { osdInfo.classList.remove("visible"); }, 3000);
    }

    homeBtn.addEventListener("click", (e) => { e.stopPropagation(); currentM3uSource !== m3uChannelsUrl ? loadM3U(m3uChannelsUrl, false) : selectCategory("RECENT", false); showMenu(); });
    moviesBtn.addEventListener("click", (e) => { e.stopPropagation(); loadM3U(m3uMoviesUrl, false); showMenu(); });

    appContainer.addEventListener("click", (e) => {
        if (!appStarted) return;
        if (!topBar.contains(e.target) && !sliderContainer.contains(e.target)) {
            sliderContainer.classList.contains("hidden") ? showMenu() : hideMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (!appStarted) { if (event.key === "Enter") { startApp(); event.preventDefault(); } return; }

        if (/^[0-9]$/.test(event.key)) {
            showMenu();
            numericInputBuffer += event.key;
            currentChannelName.textContent = `Código: ${numericInputBuffer}`;
            showOSD();
            clearTimeout(numericTimer);
            numericTimer = setTimeout(() => {
                const typedCode = numericInputBuffer; numericInputBuffer = "";
                if (categoryShortcuts[typedCode]) {
                    selectCategory(categoryShortcuts[typedCode], false);
                    currentChannelName.textContent = `📁 Categoría: ${categoryShortcuts[typedCode]}`;
                    showOSD();
                } else {
                    const targetNumber = parseInt(typedCode, 10);
                    const itemIndex = activeChannels.findIndex(c => c.channelNumber === targetNumber);
                    if (itemIndex !== -1) { selectChannel(itemIndex); hideMenu(); }
                    else { currentChannelName.textContent = `❌ Canal ${targetNumber} no existe`; showOSD(); }
                }
            }, 1000);
            event.preventDefault();
            return;
        }

        showMenu(); updateFocusables();
        if (focusables.length === 0) return;

        const activeElement = document.activeElement;
        const currentActiveIndex = Array.from(focusables).indexOf(activeElement);

        switch (event.key) {
            case "ArrowLeft": if (currentActiveIndex > 0) focusables[currentActiveIndex - 1].focus(); event.preventDefault(); break;
            case "ArrowRight": if (currentActiveIndex < focusables.length - 1) focusables[currentActiveIndex + 1].focus(); event.preventDefault(); break;
            case "ArrowUp":
                if (activeElement.tagName === "LI") {
                    let idx = Array.from(channelListContainer.querySelectorAll("li")).indexOf(activeElement);
                    if (idx > 0) selectChannel(idx - 1);
                }
                event.preventDefault(); break;
            case "ArrowDown":
                if (activeElement.tagName === "LI") {
                    let idx = Array.from(channelListContainer.querySelectorAll("li")).indexOf(activeElement);
                    if (idx !== -1 && idx < channelListContainer.querySelectorAll("li").length - 1) selectChannel(idx + 1);
                }
                event.preventDefault(); break;
            case "Enter":
                if (activeElement === homeBtn) homeBtn.click();
                else if (activeElement === moviesBtn) moviesBtn.click();
                else if (activeElement.classList.contains("category-btn")) selectCategory(activeElement.getAttribute("data-group"), false);
                else if (activeElement.tagName === "LI") {
                    let idx = Array.from(channelListContainer.querySelectorAll("li")).indexOf(activeElement);
                    if (idx !== -1) { selectChannel(idx); hideMenu(); }
                }
                event.preventDefault(); break;
            case "Escape":
            case "Backspace":
                sliderContainer.classList.contains("hidden") ? showMenu() : hideMenu();
                event.preventDefault(); break;
        }
        resetHideTimer();
    });
});
