// ==================== KONFIGURASI ====================
const DATA_URL = "https://alyoulikevideo.pages.dev/p/daftar.json";
const BASE_URL = "https://alyoulikevideo.pages.dev/p/";
const HOME_URL = "https://alyoulikevideo.pages.dev/index.html";
const COMIC_URL = "https://allyoulikecomic.neocities.org/";
const VIDEO34_URL = "https://www.google.com";
const SEARCH_PAGE_URL = "https://alyoulikevideo.pages.dev/search.html";

// ==================== VARIABEL GLOBAL ====================
let allVideos = [];
let currentPageNum = 1;
let currentGenre = "All";
let currentFilteredByGenre = [];
let currentSort = sessionStorage.getItem('genreSort') || "rating";
const itemsPerPage = 12;

// ==================== SESSION STATE (reset saat tab ditutup) ====================
function saveSessionState() {
    sessionStorage.setItem('genreSort', currentSort);
    sessionStorage.setItem('genrePage', currentPageNum);
    if (currentGenre && currentGenre !== "All") {
        sessionStorage.setItem('genreCurrent', currentGenre);
    } else {
        sessionStorage.removeItem('genreCurrent');
    }
}

function restoreSessionState() {
    const sort = sessionStorage.getItem('genreSort');
    const page = sessionStorage.getItem('genrePage');
    const genre = sessionStorage.getItem('genreCurrent');
    if (sort) currentSort = sort;
    if (page) currentPageNum = parseInt(page, 10) || 1;
    return genre;
}

// ==================== BACA GENRE DARI URL ====================
function getGenreFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('genre');
}

// ==================== HAPUS PARAMETER URL ====================
function removeGenreParamFromURL() {
    const url = new URL(window.location.href);
    if (url.searchParams.has('genre')) {
        url.searchParams.delete('genre');
        window.history.replaceState({}, '', url.toString());
    }
}

// ==================== SIMPAN & BACA GENRE DARI LOCALSTORAGE ====================
function saveGenreToLocalStorage(genre) {
    localStorage.setItem('selectedGenre', genre);
}

function getGenreFromLocalStorage() {
    return localStorage.getItem('selectedGenre');
}

// ==================== FUNGSI UTILITY ====================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function renderVideoGrid(videoArray, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    
    if (!videoArray || videoArray.length === 0) {
        grid.innerHTML = '<div class="no-data-message">🎬 No videos in this genre.</div>';
        return;
    }
    
    for (let i = 0; i < videoArray.length; i++) {
        const video = videoArray[i];
        let link = video.link.startsWith('http') ? video.link : BASE_URL + video.link;
        let imgUrl = video.image || "https://placehold.co/300x450?text=Video+Thumb";
        let title = video.title || "Untitled Video";
        let ratingBadge = '';
        if (video.rating && video.rating.trim()) {
            const r = parseFloat(video.rating.trim());
            const display = isNaN(r) ? video.rating.trim() : (Math.floor(r * 10) / 10).toFixed(1);
            ratingBadge = `<span class="rating-badge"><i class="fa-solid fa-star"></i> ${escapeHtml(display)}</span>`;
        }
        
        grid.innerHTML += `
            <div class="video-item" data-url="${link}">
                <div class="video-thumb-container">
                    <img src="${imgUrl}" class="video-thumb" loading="lazy" 
                         onerror="this.src='https://placehold.co/300x450?text=Video+Unavailable'">
                    <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                    ${ratingBadge}
                    <div class="video-title">${escapeHtml(title)}</div>
                </div>
            </div>
        `;
    }
    
    document.querySelectorAll(`#${gridId} .video-item`).forEach(card => {
        card.addEventListener('click', () => {
            const url = card.getAttribute('data-url');
            if (url) window.open(url, '_blank');
        });
    });
}

function renderPaginatedGrid() {
    const start = (currentPageNum - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = currentFilteredByGenre.slice(start, end);
    renderVideoGrid(paginatedData, 'genre-videos-grid');
}

function updatePagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = "";
    const totalPages = Math.ceil(currentFilteredByGenre.length / itemsPerPage);
    if (totalPages <= 1) return;
    
    const btn = (t, o, d, a = true) => { 
        let b = document.createElement('button'); 
        b.innerHTML = t; 
        b.className = a ? 'pagination-arrow' : 'pagination-btn'; 
        if (d) b.classList.add('disabled'); 
        b.onclick = o; 
        return b; 
    };
    
    const addPageBtn = (p) => {
        let pb = document.createElement('button'); 
        pb.innerText = p; 
        pb.className = `pagination-btn ${p === currentPageNum ? 'active' : ''}`; 
        pb.onclick = () => goToPage(p); 
        container.appendChild(pb); 
    };
    
    const addDots = () => {
        let dt = document.createElement('button'); 
        dt.innerText = '...'; 
        dt.className = 'pagination-btn pagination-dots'; 
        dt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' }); 
        container.appendChild(dt); 
    };
    
    container.appendChild(btn('«', () => { if (currentPageNum > 1) goToPage(1); }, currentPageNum === 1));
    
    const n = 3;
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) addPageBtn(i);
    } else {
        let start = currentPageNum - 1;
        let end = currentPageNum + 1;
        if (start < 1) { start = 1; end = 3; }
        if (end > totalPages) { end = totalPages; start = totalPages - 2; }
        if (start > 1) {
            addPageBtn(1);
            if (start > 2) addDots();
        }
        for (let i = start; i <= end; i++) addPageBtn(i);
        if (end < totalPages) {
            if (end < totalPages - 1) addDots();
            addPageBtn(totalPages);
        }
    }
    
    container.appendChild(btn('»', () => { if (currentPageNum < totalPages) goToPage(totalPages); }, currentPageNum === totalPages));
}

function goToPage(p) { 
    currentPageNum = p; 
    saveSessionState();
    renderPaginatedGrid(); 
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

// ==================== FUNGSI FILTER GENRE ====================
function filterByGenre(genre) {
    currentGenre = genre;
    currentPageNum = 1;
    
    if (!genre || genre === "All") {
        currentFilteredByGenre = [...allVideos];
        saveGenreToLocalStorage('All');
    } else {
        const searchParts = genre.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        currentFilteredByGenre = allVideos.filter(video => {
            const videoGenre = (video.genre || "").toLowerCase();
            const videoStudio = (video.studio || "").toLowerCase();
            const videoYear = (video.firstAirDate || "").slice(0, 4);
            return searchParts.some(part => (
                videoGenre.includes(part)
                || videoStudio.split(',').some(s => s.trim().toLowerCase() === part)
                || (videoYear === part)
            ));
        });
        saveGenreToLocalStorage(genre);
    }
    
    // Update judul
    const genretitle = document.getElementById('genretitle');
    if (genretitle) {
        if (genre && genre !== "All") {
            genretitle.innerHTML = `${genre}`;
        } else {
            genretitle.innerHTML = `New Uploads`;
        }
    }
    
    applySort();
    renderPaginatedGrid();
    updatePagination();
    syncSortButtons();
}

// ==================== FUNGSI SORT ====================
function syncSortButtons() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === currentSort);
    });
}

function sortByRating(arr) {
    return [...arr].sort((a, b) => {
        const ra = parseFloat(a.rating);
        const rb = parseFloat(b.rating);
        const va = isNaN(ra) ? -1 : ra;
        const vb = isNaN(rb) ? -1 : rb;
        return vb - va;
    });
}

function sortByAZ(arr) {
    return [...arr].sort((a, b) => {
        const ta = (a.title || "").replace(/\s*\[Sub-ENG\]\s*/gi, '').toLowerCase();
        const tb = (b.title || "").replace(/\s*\[Sub-ENG\]\s*/gi, '').toLowerCase();
        return ta.localeCompare(tb);
    });
}

function sortByYears(arr) {
    return [...arr].sort((a, b) => {
        const ya = (a.firstAirDate || "").slice(0, 4);
        const yb = (b.firstAirDate || "").slice(0, 4);
        if (ya === yb) return new Date(b.date) - new Date(a.date);
        return yb.localeCompare(ya);
    });
}

function applySort() {
    if (currentSort === 'rating') {
        currentFilteredByGenre = sortByRating(currentFilteredByGenre);
    } else if (currentSort === 'az') {
        currentFilteredByGenre = sortByAZ(currentFilteredByGenre);
    } else {
        currentFilteredByGenre = sortByYears(currentFilteredByGenre);
    }
}

function setSort(sortKey) {
    currentSort = sortKey;
    currentPageNum = 1;
    applySort();
    renderPaginatedGrid();
    updatePagination();
    syncSortButtons();
    saveSessionState();
}

// ==================== ATTACH HEADER EVENTS ====================
function attachHeaderEvents() {
    const searchDesktopBtn = document.getElementById('searchBtnDesktop');
    const searchDesktopInput = document.getElementById('searchInputDesktop');
    if (searchDesktopBtn && searchDesktopInput) {
        searchDesktopBtn.onclick = () => {
            const query = searchDesktopInput.value;
            if (query.trim()) {
                window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(query.trim())}`;
            }
        };
        searchDesktopInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value;
                if (query.trim()) {
                    window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(query.trim())}`;
                }
            }
        };
    }
    
    const mobileIcon = document.getElementById('searchIconMobile');
    const mobileOverlay = document.getElementById('mobileSearchOverlay');
    const closeSearch = document.getElementById('closeSearchBtn');
    const mobileSearchBtn = document.getElementById('searchBtnMobile');
    const mobileSearchInput = document.getElementById('searchInputMobile');
    
    if (mobileIcon && mobileOverlay) {
        mobileIcon.onclick = () => { mobileOverlay.style.display = 'flex'; };
    }
    if (closeSearch && mobileOverlay) {
        closeSearch.onclick = () => { mobileOverlay.style.display = 'none'; };
    }
    if (mobileSearchBtn && mobileSearchInput && mobileOverlay) {
        mobileSearchBtn.onclick = () => {
            const q = mobileSearchInput.value.trim();
            mobileOverlay.style.display = 'none';
            if (q) window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(q)}`;
        };
        mobileSearchInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                const q = e.target.value.trim();
                mobileOverlay.style.display = 'none';
                if (q) window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(q)}`;
            }
        };
    }
    
    const navHome = document.getElementById('navHome');
    const navRandom = document.getElementById('navRandom');
    const navComic = document.getElementById('navComic');
    const navVideo34 = document.getElementById('navVideo34');
    const logoElem = document.getElementById('logoClick');
    
    if (navHome) navHome.onclick = (e) => { e.preventDefault(); window.location.href = HOME_URL; };
    if (navRandom) {
        navRandom.onclick = (e) => { 
            e.preventDefault(); 
            if (allVideos.length) {
                const randomIndex = Math.floor(Math.random() * allVideos.length);
                const randomItem = allVideos[randomIndex];
                let targetLink = randomItem.link.startsWith('http') ? randomItem.link : BASE_URL + randomItem.link;
                window.open(targetLink, '_blank');
            }
        };
    }
    if (navComic) navComic.onclick = (e) => { e.preventDefault(); window.location.href = COMIC_URL; };
    if (navVideo34) navVideo34.onclick = (e) => { e.preventDefault(); window.open(VIDEO34_URL, '_blank'); };
    if (logoElem) logoElem.onclick = () => { window.location.href = HOME_URL; };
    
    const genreBtn = document.getElementById('navGenre');
    const genreDropdown = document.getElementById('genreDropdown');
    
    if (genreBtn && genreDropdown) {
        genreBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            genreDropdown.classList.toggle('show');
        };
        
        const genreItems = genreDropdown.querySelectorAll('a');
        genreItems.forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                const genre = item.getAttribute('data-genre');
                if (genre) {
                    filterByGenre(genre);
                    saveSessionState();
                }
                genreDropdown.classList.remove('show');
                
                genreItems.forEach(a => {
                    a.style.background = '';
                    a.style.color = '';
                });
                item.style.background = '#ff3b6f';
                item.style.color = 'white';
            };
        });
    }
    
    document.addEventListener('click', function(e) {
        if (genreDropdown && genreBtn) {
            if (!genreBtn.contains(e.target) && !genreDropdown.contains(e.target)) {
                genreDropdown.classList.remove('show');
            }
        }
    });
}

// ==================== HEADER NAV (HAMBURGER & DROPDOWN) ====================
function initHeaderNav() {
    const dropdownBtn = document.querySelector('.dropbtn-click');
    const dropdownContent = document.querySelector('.dropdown-content-click');
    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });
    }

    document.querySelectorAll('.more-sites-trigger').forEach((trigger) => {
        const dropdown = trigger.nextElementSibling;
        if (dropdown && dropdown.classList.contains('more-sites-dropdown')) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            document.addEventListener('click', (e) => {
                if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });
        }
    });

    const hamburger = document.getElementById('hamburgerMenu');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    if (hamburger && mobileNavOverlay) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileNavOverlay.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mobile-nav-sidebar a')) {
                mobileNavOverlay.classList.remove('show');
            }
        });
    }

    const navRandomMobile = document.getElementById('navRandomMobile');
    if (navRandomMobile) {
        navRandomMobile.addEventListener('click', (e) => {
            e.preventDefault();
            if (allVideos.length) {
                const randomIndex = Math.floor(Math.random() * allVideos.length);
                const item = allVideos[randomIndex];
                window.open(item.link.startsWith('http') ? item.link : BASE_URL + item.link, '_blank');
            }
        });
    }
}

// ==================== LOAD DATA ====================
async function loadHeader() {
    try {
        const response = await fetch('genre-header.html');
        const headerHtml = await response.text();
        document.getElementById('header-placeholder').innerHTML = headerHtml;
        attachHeaderEvents();
        initHeaderNav();
    } catch (error) {
        console.error('Gagal load header:', error);
    }
}

async function loadFooter() {
    try {
        const response = await fetch('footer.html');
        const footerHtml = await response.text();
        document.getElementById('footer-placeholder').innerHTML = footerHtml;
    } catch (error) {
        console.error('Gagal load footer:', error);
    }
}

async function loadVideoData() {
    try {
        const newGrid = document.getElementById('genre-videos-grid');
        if (newGrid) newGrid.innerHTML = '<div class="no-data-message"><i class="fa-solid fa-spinner fa-pulse"></i> Loading...</div>';
        
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        let pages = (data.pages || []).filter(item => (item.lengkap || "").trim().toLowerCase() === "yes");
        
        allVideos = pages.map((item) => ({
            title: item.title || "Untitled",
            link: item.link || "#",
            image: item.image || "https://placehold.co/300x450?text=No+Image",
            genre: item.genre || "",
            studio: item.studio || "",
            rating: item.rating || "",
            firstAirDate: (() => { const d = item['First air date'] || ''; const m = d.match(/\b(\d{4})\b/); return m ? m[1] : (item.date || '').slice(0,4); })(),
            date: item.date || ""
        }));
        
        const uniqueLinks = new Map();
        allVideos.forEach(video => {
            if (!uniqueLinks.has(video.link)) {
                uniqueLinks.set(video.link, video);
            }
        });
        allVideos = Array.from(uniqueLinks.values());
        
        console.log('Total video unik:', allVideos.length);
        
        // CEK GENRE DARI URL, SESSION, ATAU LOCALSTORAGE
        const sessionGenre = restoreSessionState();
        const genreFromURL = getGenreFromURL();
        const genreFromStorage = getGenreFromLocalStorage();
        
        if (genreFromURL && genreFromURL !== "All") {
            filterByGenre(genreFromURL);
            removeGenreParamFromURL();
            saveSessionState();
        } else if (sessionGenre && sessionGenre !== "All") {
            filterByGenre(sessionGenre);
            currentPageNum = sessionStorage.getItem('genrePage') ? parseInt(sessionStorage.getItem('genrePage'), 10) || 1 : 1;
            renderPaginatedGrid();
            updatePagination();
            saveSessionState();
        } else if (genreFromStorage && genreFromStorage !== "All") {
            filterByGenre(genreFromStorage);
            saveSessionState();
        } else {
            currentFilteredByGenre = [...allVideos];
            currentGenre = "All";
            currentPageNum = sessionStorage.getItem('genrePage') ? parseInt(sessionStorage.getItem('genrePage'), 10) || 1 : 1;
            applySort();
            renderPaginatedGrid();
            updatePagination();
            syncSortButtons();
        }
        
    } catch (err) {
        console.error('Error:', err);
        const newGrid = document.getElementById('genre-videos-grid');
        if (newGrid) newGrid.innerHTML = `<div class="no-data-message">❌ Error: ${err.message}</div>`;
    }
}

// ==================== START ====================
document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadFooter();
    loadVideoData();
});
