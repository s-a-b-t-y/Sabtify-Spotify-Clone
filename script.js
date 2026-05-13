// ===== SONG DATA =====
async function getSongs() {
  const res = await fetch("./Library/songs/songs.json");
  if (!res.ok) throw new Error("Failed to load songs.json");
  const allFiles = await res.json();
  // Filter only playable audio files (.mp3)
  return allFiles.filter((f) => f.endsWith(".mp3"));
}

// ===== GLOBALS =====
let audio = new Audio();
let songs = []; // original songs array
let playOrder = []; // shuffled play sequence (indices into songs[])
let playOrderPos = 0; // current position within playOrder
let isSeeking = false;

// ===== DOM REFS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== HELPERS =====
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function sanitizeSongName(filename) {
  let decoded = decodeURIComponent(filename);
  decoded = decoded.replace(/\.mp3$/i, "");
  let name = decoded.split(" - ")[0].trim();
  return name || decoded;
}

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== SONG-TO-IMAGE MAPPING =====
// Maps each song filename to its local cover image inside Library/songImg/
const songImageMap = {
  "Itna Na Mujhse Tu Pyar Badha - Talat Mahmood.mp3": "inta-na-mujhse.jpg",
  "Khayaal - Talwiinder.mp3":                          "khayaal.jpg",
  "Majboor - Sheheryar Rehan.mp3":                     "majboor.png",
  "MAST NAZRON SE (REMIX) - NUSRAT FATEH ALI KHAN.mp3":"mast-nazron-se.jpg",
  "Sanson Ki Mala Pe - Nusrat Fateh Ali Khan.mp3":     "sanson-ki-mala-pe.jpg",
  "Sochta Houn - Nusrat Fateh Ali Khan.mp3":           "sochta-hoon.jpg",
  "Shudu Tomake.mp3":                                  "shudu-tomake.jpg",
  "Tumi.mp3":                                          "tumi.jfif",
  "A Thousand Years.mp3":                              "a-thousand-years.jpg",
  "Blue.mp3":                                          "blue.jfif",
  "Lady Gaga.mp3":                                     "if-the-world-was ending.jfif",
  "Ruth B.mp3":                                        "ruth-b.jpg",
  "Sailor Song.mp3":                                   "sailor-song.jpg",
  "The Chainsmokers Closer.mp3":                       "the-chainsmoker-closer.jpg",
  "The Night We Met.mp3":                              "the-night-we-met.jfif",
};

function getCardImageUrl(songName, songIndex) {
  // We need to find the song filename from the global `songs` array using songIndex
  const songFilename = songs[songIndex];
  if (songFilename && songImageMap[songFilename]) {
    return `./Library/songImg/${encodeURIComponent(songImageMap[songFilename])}`;
  }
  // Fallback: generic music note placeholder
  return `./Library/img/music.svg`;
}


// ===== RENDER SONG CARDS (Shuffled) =====
function renderSongCards() {
  const container = $("#cardContainer");
  container.innerHTML = "";

  // Shuffle once and store as the global play order
  const indices = songs.map((_, i) => i);
  playOrder = shuffleArray(indices);

  playOrder.forEach((songIndex, displayIndex) => {
    const song = songs[songIndex];
    const name = sanitizeSongName(song);
    const imgUrl = getCardImageUrl(name, songIndex);

    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${displayIndex * 0.05}s`;
    // store BOTH original song index AND its position in playOrder
    card.setAttribute("data-song-index", songIndex);
    card.setAttribute("data-order-pos", displayIndex);

    card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${imgUrl}" alt="${name}" loading="lazy">
                <div class="card-play-btn" role="button" aria-label="Play ${name}">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="black">
                        <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z"/>
                    </svg>
                </div>
            </div>
            <h2 class="card-title">${name}</h2>
            <p class="card-desc">Song</p>
        `;

    // Click card: jump to this card's position in playOrder
    card.addEventListener("click", () => {
      playSongAtOrderPos(displayIndex);
    });

    container.appendChild(card);
  });
}

// ===== RENDER SONG LIST =====
function renderSongList() {
  const ul = $("#songListUL");
  ul.innerHTML = "";

  songs.forEach((song, index) => {
    const name = sanitizeSongName(song);
    const li = document.createElement("li");
    li.setAttribute("data-index", index);
    li.innerHTML = `
            <img class="invert song-icon" src="./Library/img/music.svg" alt="♪">
            <div class="song-info">
                <span class="song-name">${name}</span>
            </div>
            <div class="song-play-hint">
                <img class="invert" src="./Library/img/play.svg" alt="▶">
                <span>Play</span>
            </div>
        `;
    li.addEventListener("click", () => {
      // Find this song's position in the current playOrder
      const orderPos = playOrder.indexOf(index);
      if (orderPos !== -1) {
        playSongAtOrderPos(orderPos);
      } else {
        playSongAtOrderPos(0);
      }
    });
    ul.appendChild(li);
  });
}

// ===== HIGHLIGHT ACTIVE SONG =====
function highlightActiveSong(songIndex) {
  // Highlight sidebar list item (by original song index)
  $$(".songList ul li").forEach((li) => {
    const idx = parseInt(li.getAttribute("data-index"));
    li.classList.toggle("active-song", idx === songIndex);
  });
  // Highlight active card
  $$(".card").forEach((card) => {
    const idx = parseInt(card.getAttribute("data-song-index"));
    card.style.outline =
      idx === songIndex ? "2px solid var(--accent-green)" : "none";
    card.style.outlineOffset = idx === songIndex ? "2px" : "0";
  });
}

// ===== PLAY SONG BY ORDER POSITION (serial navigation) =====
// This is the core play function — always called with a position in playOrder[]
function playSongAtOrderPos(orderPos, autoPlay = true) {
  if (orderPos < 0 || orderPos >= playOrder.length) return;
  playOrderPos = orderPos;
  const songIndex = playOrder[playOrderPos]; // actual song index
  const track = songs[songIndex];

  audio.src =
    "./Library/songs/" + encodeURIComponent(decodeURIComponent(track));

  if (autoPlay) {
    audio.play().catch(() => {});
    $("#playPauseIcon").src = "./Library/img/pause.svg";
  }

  // Update playbar display
  const name = sanitizeSongName(track);
  $("#playbarSong").textContent = name;

  // Update playbar cover image
  const imgUrl = getCardImageUrl(name, songIndex);
  $("#playbarCover").src = imgUrl;

  // Reset seekbar
  updateSeekbar(0, 0);

  // Highlight in list & cards
  highlightActiveSong(songIndex);

  // Close sidebar on mobile after selecting
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

// ===== PLAY / PAUSE TOGGLE =====
function togglePlayPause() {
  if (!audio.src || audio.src === window.location.href) {
    playSongAtOrderPos(0);
    return;
  }
  if (audio.paused) {
    audio.play().catch(() => {});
    $("#playPauseIcon").src = "./Library/img/pause.svg";
  } else {
    audio.pause();
    $("#playPauseIcon").src = "./Library/img/play.svg";
  }
}

// ===== NEXT / PREVIOUS (serial through playOrder) =====
function playNext() {
  // Move one step forward in the shuffled play order
  const next = (playOrderPos + 1) % playOrder.length;
  playSongAtOrderPos(next);
}

function playPrev() {
  // If more than 3s in, restart current song
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  // Move one step backward in the shuffled play order
  const prev = (playOrderPos - 1 + playOrder.length) % playOrder.length;
  playSongAtOrderPos(prev);
}

// ===== SEEKBAR =====
function updateSeekbar(current, duration) {
  if (isSeeking) return;
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  $("#seekbarFill").style.width = pct + "%";
  $("#seekbarCircle").style.left = pct + "%";
  $("#currentTime").textContent = formatTime(current);
  $("#totalTime").textContent = formatTime(duration);
}

function initSeekbar() {
  const seekbar = $("#seekbar");

  function seekTo(e) {
    const rect = seekbar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = x / rect.width;
    if (!isNaN(audio.duration) && audio.duration > 0) {
      audio.currentTime = pct * audio.duration;
    }
  }

  seekbar.addEventListener("click", seekTo);

  seekbar.addEventListener("mousedown", (e) => {
    isSeeking = true;
    seekTo(e);
    const onMove = (ev) => seekTo(ev);
    const onUp = () => {
      isSeeking = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  seekbar.addEventListener(
    "touchstart",
    (e) => {
      isSeeking = true;
      seekTo(e.touches[0]);
    },
    { passive: true },
  );

  seekbar.addEventListener(
    "touchmove",
    (e) => {
      seekTo(e.touches[0]);
    },
    { passive: true },
  );

  seekbar.addEventListener("touchend", () => {
    isSeeking = false;
  });
}

// ===== VOLUME =====
function initVolume() {
  const volumeBar = $("#volumeBar");
  const volumeFill = $("#volumeFill");
  const volumeCircle = $("#volumeCircle");
  const volumeIcon = $("#volumeIcon");
  let lastVolume = 0.8;

  audio.volume = 0.8;

  function setVolume(pct) {
    pct = Math.max(0, Math.min(1, pct));
    audio.volume = pct;
    audio.muted = false;
    volumeFill.style.width = pct * 100 + "%";
    volumeCircle.style.left = pct * 100 + "%";
    updateVolumeIcon(pct);
  }

  function updateVolumeIcon(vol) {
    if (vol === 0 || audio.muted) {
      volumeIcon.src = "./Library/img/mute.svg";
    } else {
      volumeIcon.src = "./Library/img/volume.svg";
    }
  }

  function volumeFromEvent(e) {
    const rect = volumeBar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return x / rect.width;
  }

  volumeBar.addEventListener("click", (e) => {
    setVolume(volumeFromEvent(e));
  });

  volumeBar.addEventListener("mousedown", (e) => {
    setVolume(volumeFromEvent(e));
    const onMove = (ev) => setVolume(volumeFromEvent(ev));
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  // Mute toggle
  $("#btnVolume").addEventListener("click", () => {
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      setVolume(lastVolume || 0.5);
    } else {
      lastVolume = audio.volume;
      audio.muted = true;
      volumeFill.style.width = "0%";
      volumeCircle.style.left = "0%";
      updateVolumeIcon(0);
    }
  });
}

// ===== SIDEBAR MOBILE =====
function openSidebar() {
  $("#sidebar").classList.add("open");
  $("#sidebarOverlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  $("#sidebar").classList.remove("open");
  $("#sidebarOverlay").classList.remove("active");
  document.body.style.overflow = "";
}

function initSidebar() {
  $("#hamburgerBtn").addEventListener("click", openSidebar);
  $("#sidebarClose").addEventListener("click", closeSidebar);
  $("#sidebarOverlay").addEventListener("click", closeSidebar);
}

// ===== AUDIO EVENTS =====
function initAudioEvents() {
  audio.addEventListener("timeupdate", () => {
    updateSeekbar(audio.currentTime, audio.duration);
  });

  audio.addEventListener("ended", () => {
    playNext();
  });

  audio.addEventListener("loadedmetadata", () => {
    $("#totalTime").textContent = formatTime(audio.duration);
  });
}

// ===== KEYBOARD SHORTCUTS =====
function initKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        togglePlayPause();
        break;
      case "ArrowRight":
        if (e.shiftKey) playNext();
        else
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        break;
      case "ArrowLeft":
        if (e.shiftKey) playPrev();
        else audio.currentTime = Math.max(0, audio.currentTime - 5);
        break;
      case "ArrowUp":
        e.preventDefault();
        audio.volume = Math.min(1, audio.volume + 0.05);
        break;
      case "ArrowDown":
        e.preventDefault();
        audio.volume = Math.max(0, audio.volume - 0.05);
        break;
      case "KeyM":
        audio.muted = !audio.muted;
        break;
    }
  });
}

// ===== LOADING SCREEN =====
function hideLoadingScreen() {
  const loader = $("#loadingScreen");
  if (loader) {
    loader.classList.add("hidden");
    setTimeout(() => {
      loader.remove();
    }, 600);
  }
}

function showLoadingThenReload() {
  // Re-insert loader if it was already removed
  let loader = $("#loadingScreen");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "loadingScreen";
    loader.className = "loading-screen";
    loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-disc">
                    <svg class="loader-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="60" r="56" fill="none" stroke="url(#loaderGrad2)" stroke-width="3" opacity="0.3"/>
                        <circle cx="60" cy="60" r="56" fill="none" stroke="url(#loaderGrad2)" stroke-width="3"
                            stroke-dasharray="88 264" stroke-linecap="round" class="loader-ring"/>
                        <circle cx="60" cy="60" r="38" fill="#181818"/>
                        <circle cx="60" cy="60" r="30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
                        <circle cx="60" cy="60" r="24" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
                        <circle cx="60" cy="60" r="6" fill="#1db954"/>
                        <circle cx="60" cy="60" r="3" fill="#121212"/>
                        <g transform="translate(46, 42)" fill="none" stroke="#1db954" stroke-width="2.5"
                            stroke-linecap="round" stroke-linejoin="round" class="loader-note">
                            <path d="M6 8v18c0 3-2.5 5-5.5 5S-2 29 0 27s3-2 6-2V8"/>
                            <path d="M6 8c0-2 8-5 8-5v6s-8 3-8 5"/>
                            <circle cx="22" cy="14" r="4" fill="none" stroke="#f472b6" stroke-width="2" class="loader-note2"/>
                        </g>
                        <defs>
                            <linearGradient id="loaderGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#1db954"/>
                                <stop offset="100%" stop-color="#f472b6"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div class="loader-text">
                    <span class="loader-brand">Sabtify</span>
                    <span class="loader-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
            </div>`;
    document.body.prepend(loader);
  } else {
    loader.classList.remove("hidden");
  }
  // Reload after animation plays briefly
  setTimeout(() => {
    window.location.reload();
  }, 900);
}

// ===== HOME & LOGO → RELOAD =====
function initHomeReload() {
  // Logo icon
  $("#logoClick").addEventListener("click", showLoadingThenReload);
  $("#logoClick").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") showLoadingThenReload();
  });
  // Logo text
  $("#logoText").addEventListener("click", showLoadingThenReload);
  $("#logoText").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") showLoadingThenReload();
  });
  // Home nav link
  $("#navHome").addEventListener("click", (e) => {
    e.preventDefault();
    showLoadingThenReload();
  });
}

// ===== SEARCH MODAL =====
function initSearch() {
  const overlay = $("#searchOverlay");
  const input = $("#searchInput");
  const results = $("#searchResults");
  const clearBtn = $("#searchClear");
  const closeBtn = $("#searchClose");
  const navSearch = $("#navSearch");

  function openSearch() {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    // Small delay so animation runs after display:flex kicks in
    requestAnimationFrame(() => input.focus());
  }

  function closeSearch() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    input.value = "";
    clearBtn.classList.remove("visible");
    results.innerHTML = `<p class="search-placeholder">Start typing to search songs...</p>`;
  }

  // Highlight matched portion of text
  function highlight(text, query) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      text.slice(0, idx) +
      `<span class="search-highlight">${text.slice(idx, idx + query.length)}</span>` +
      text.slice(idx + query.length)
    );
  }

  function runSearch(query) {
    query = query.trim();

    if (!query) {
      results.innerHTML = `<p class="search-placeholder">Start typing to search songs...</p>`;
      clearBtn.classList.remove("visible");
      return;
    }

    clearBtn.classList.add("visible");

    // Filter songs by sanitized name
    const matched = songs
      .map((song, idx) => ({ song, idx, name: sanitizeSongName(song) }))
      .filter(({ name }) => name.toLowerCase().includes(query.toLowerCase()));

    if (matched.length === 0) {
      results.innerHTML = `
                <div class="search-not-found">
                    <strong>🎵 Song not found</strong>
                    <span>"${query}" isn't available in our application.</span>
                </div>`;
      return;
    }

    results.innerHTML = matched
      .map(({ name, idx }) => {
        const imgUrl = getCardImageUrl(name, idx);
        const orderPos = playOrder.indexOf(idx);
        return `
                <div class="search-result-item" data-order-pos="${orderPos}" data-song-idx="${idx}" role="button" tabindex="0">
                    <img class="search-result-thumb" src="${imgUrl}" alt="${name}" loading="lazy">
                    <div class="search-result-info">
                        <div class="search-result-name">${highlight(name, query)}</div>
                        <div class="search-result-label">Song</div>
                    </div>
                    <svg class="search-result-play" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z"/>
                    </svg>
                </div>`;
      })
      .join("");

    // Attach click listeners
    results.querySelectorAll(".search-result-item").forEach((item) => {
      const play = () => {
        const orderPos = parseInt(item.getAttribute("data-order-pos"));
        const songIdx = parseInt(item.getAttribute("data-song-idx"));
        if (orderPos !== -1) {
          playSongAtOrderPos(orderPos);
        } else {
          // Song exists but not in playOrder (edge case) — push to end
          playOrder.push(songIdx);
          playSongAtOrderPos(playOrder.length - 1);
        }
        closeSearch();
      };
      item.addEventListener("click", play);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") play();
      });
    });
  }

  // Open via nav Search button
  navSearch.addEventListener("click", (e) => {
    e.preventDefault();
    openSearch();
  });

  // Input → live search
  input.addEventListener("input", () => runSearch(input.value));

  // Clear button
  clearBtn.addEventListener("click", () => {
    input.value = "";
    runSearch("");
    input.focus();
  });

  // Close button
  closeBtn.addEventListener("click", closeSearch);

  // Click outside modal to close
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSearch();
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeSearch();
  });
}

// ===== INIT =====
async function main() {
  try {
    songs = await getSongs();
  } catch (err) {
    console.error("Could not load songs:", err);
    hideLoadingScreen();
    return;
  }

  if (songs.length === 0) {
    $("#playbarSong").textContent = "No songs found";
    hideLoadingScreen();
    return;
  }

  renderSongList();
  renderSongCards();

  // Load first song in shuffled order without auto-playing
  playSongAtOrderPos(0, false);

  // Wire up playbar buttons
  $("#btnPlayPause").addEventListener("click", togglePlayPause);
  $("#btnNext").addEventListener("click", playNext);
  $("#btnPrev").addEventListener("click", playPrev);

  // Wire up header prev/next arrows (serial navigation)
  $("#headerPrev").addEventListener("click", playPrev);
  $("#headerNext").addEventListener("click", playNext);

  // Init modules
  initSeekbar();
  initVolume();
  initSidebar();
  initAudioEvents();
  initKeyboard();
  initHomeReload();
  initSearch();

  // Hide loading after animation plays
  setTimeout(hideLoadingScreen, 1200);
}

main();
