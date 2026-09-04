// search.js
// Allyoulike Video - Main JavaScript File

const DATA_URL = "https://alyoulikevideo.pages.dev/p/daftar.json";
const BASE_URL = "https://alyoulikevideo.pages.dev/p/";
const HOME_URL = "https://alyoulikevideo.pages.dev/index.html";
const COMIC_URL = "https://allyoulikecomic.pages.dev/";
const VIDEO34_URL = "comingsoon.html";
const SEARCH_PAGE_URL = "https://alyoulikevideo.pages.dev/search.html";
const ITEMS_PER_PAGE = 24;

let allVideos = [];
let currentQuery = "";
let currentPageNum = 1;
let currentFilteredResults = [];
let currentGenre = "";

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function getRandomVideo() {
    if (!allVideos.length) return;
    const randomItem = allVideos[Math.floor(Math.random() * allVideos.length)];
    window.open(randomItem.link.startsWith('http') ? randomItem.link : BASE_URL + randomItem.link, '_blank');
}

function goHome() { 
    window.location.href = HOME_URL; 
}

function goComic() { 
    window.location.href = COMIC_URL; 
}

function openVideo34() { 
    window.open(VIDEO34_URL, '_blank'); 
}

function goToSearchPage(query) {
    if (query && query.trim()) {
        window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(query.trim())}`;
    } else {
        window.location.href = SEARCH_PAGE_URL;
    }
}

function filterByGenre(genre) {
    currentGenre = genre;
    currentQuery = "";
    const searchInput = document.getElementById('mainSearchInput');
    if (searchInput) searchInput.value = "";
    const searchInfoBar = document.getElementById('searchInfoBar');
    if (searchInfoBar) searchInfoBar.style.display = 'none';
    
    if (!genre || genre === "") {
        currentFilteredResults = [...allVideos];
    } else {
        currentFilteredResults = allVideos.filter(video => {
            const videoGenre = (video.genre || "").toLowerCase();
            return videoGenre.includes(genre.toLowerCase());
        });
    }
    currentPageNum = 1;
    renderPaginatedGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const genreDropdown = document.getElementById('genreDropdown');
    if (genreDropdown) genreDropdown.classList.remove('show');
}

async function loadData() {
    try {
        const resultGrid = document.getElementById('resultGrid');
        if (resultGrid) {
            resultGrid.innerHTML = "";
        }
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        allVideos = (data.pages || []).filter(item => (item.lengkap || "").trim().toLowerCase() === "yes").map(item => ({ ...item }));
        allVideos.sort((a, b) => new Date(b.date) - new Date(a.date));
        const urlParams = new URLSearchParams(window.location.search);
        const q = urlParams.get('q');
        if (q && q.trim()) { 
            const searchInput = document.getElementById('mainSearchInput');
            if (searchInput) searchInput.value = q;
            performSearch(q); 
        } else { 
            currentFilteredResults = [...allVideos]; 
            renderPaginatedGrid(); 
            const searchInfoBar = document.getElementById('searchInfoBar');
            if (searchInfoBar) searchInfoBar.style.display = 'none'; 
        }
    } catch(err) {
        const resultGrid = document.getElementById('resultGrid');
        if (resultGrid) {
            resultGrid.innerHTML = "";
        }
        console.error('Failed to load videos:', err);
    }
}

function renderPaginatedGrid() {
    const start = (currentPageNum - 1) * ITEMS_PER_PAGE;
    const paginatedData = currentFilteredResults.slice(start, start + ITEMS_PER_PAGE);
    renderGrid(paginatedData);
    renderPagination();
}

function renderGrid(videos) {
    const grid = document.getElementById('resultGrid');
    if (!grid) return;
    
    if (!videos.length) {
        const queryText = escapeHtml(currentQuery || currentGenre || '');
        grid.innerHTML = `<div class="search-empty-state"><div class="search-empty-title">No results to show with "${queryText}"</div><div class="search-empty-suggestions">Suggestions:</div><div class="search-empty-subtitle"><div class="search-empty-item"><span class="search-empty-dot"></span>Make sure all words are spelled correctly.</div><div class="search-empty-item"><span class="search-empty-dot"></span>Try different keywords.</div><div class="search-empty-item"><span class="search-empty-dot"></span>Try more general keywords.</div></div></div>`;
        return;
    }
    grid.style.display = 'grid';
    grid.innerHTML = videos.map(v => {
        let ratingBadge = '';
        if (v.rating && v.rating.trim()) {
            const r = parseFloat(v.rating.trim());
            const display = isNaN(r) ? v.rating.trim() : (Math.floor(r * 10) / 10).toFixed(1);
            ratingBadge = `<div class="search-rating">Rating: ${escapeHtml(display)}</div>`;
        }
        const genreText = v.genre && v.genre.trim() ? `<div class="search-genre-chips">` + v.genre.split(',').map(g => {
            const gg = g.trim();
            return gg ? `<span class="search-genre-chip">${escapeHtml(gg)}</span>` : '';
        }).join('') + `</div>` : '';
        const year = v['First air date'] && v['First air date'].trim() ? v['First air date'].trim().slice(-4) : '';
        const yearText = year ? `<div class="search-year">${escapeHtml(year)}</div>` : '';
        const metaRow = (ratingBadge || yearText) ? `<div class="search-meta-row">${ratingBadge}${yearText}</div>` : '';
        return `<div class="search-item" data-url="${v.link.startsWith('http') ? v.link : BASE_URL + v.link}"><div class="thumb-box"><img src="${v.image || 'https://placehold.co/300x450?text=Video+Thumb'}" loading="lazy" onerror="this.src='https://placehold.co/300x450?text=No+Image'"></div><div class="search-info"><div class="search-title">${escapeHtml(v.title || 'Untitled')}</div>${metaRow}${genreText}</div></div>`;
    }).join('');
    
    document.querySelectorAll('.search-item').forEach(c => c.addEventListener('click', () => window.open(c.dataset.url, '_blank')));
}

function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = "";
    const totalPages = Math.ceil(currentFilteredResults.length / ITEMS_PER_PAGE);
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
    renderPaginatedGrid(); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

function updateInfoBar() { 
    let b = document.getElementById('searchInfoBar'); 
    let t = document.getElementById('resultCountText'); 
    if (currentQuery.trim()) { 
        if (b) b.style.display = 'flex'; 
        if (t) t.innerHTML = `Search results for "${escapeHtml(currentQuery)}" - Found ${currentFilteredResults.length} video${currentFilteredResults.length !== 1 ? 's' : ''}`; 
    } else if (b) b.style.display = 'none'; 
}

function performSearch(q) { 
    let term = q.trim().toLowerCase(); 
    currentQuery = term; 
    currentGenre = "";
    currentPageNum = 1; 
    if (!term) { 
        clearSearch(); 
        return; 
    } 
    currentFilteredResults = allVideos.filter(v => (v.title || "").toLowerCase().includes(term)); 
    renderPaginatedGrid(); 
    updateInfoBar(); 
    window.history.pushState({}, '', `${window.location.pathname}?q=${encodeURIComponent(term)}`); 
}

function clearSearch() { 
    currentQuery = ""; 
    currentGenre = "";
    currentPageNum = 1; 
    currentFilteredResults = [...allVideos]; 
    const searchInput = document.getElementById('mainSearchInput');
    if (searchInput) searchInput.value = ""; 
    const searchInfoBar = document.getElementById('searchInfoBar');
    if (searchInfoBar) searchInfoBar.style.display = 'none'; 
    renderPaginatedGrid(); 
    window.history.pushState({}, '', window.location.pathname); 
}

// Fungsi untuk menginisialisasi header nav (hamburger & dropdown)
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

// Fungsi untuk menginisialisasi event listener header
function initializeHeaderEvents() {
    const navHome = document.getElementById('navHome');
    if (navHome) {
        navHome.onclick = (e) => { e.preventDefault(); goHome(); };
    }
    
    const navRandom = document.getElementById('navRandom');
    if (navRandom) {
        navRandom.onclick = (e) => { e.preventDefault(); getRandomVideo(); };
    }
    
    const navComic = document.getElementById('navComic');
    if (navComic) {
        navComic.onclick = (e) => { e.preventDefault(); goComic(); };
    }
    
    const navVideo34 = document.getElementById('navVideo34');
    if (navVideo34) {
        navVideo34.onclick = (e) => { e.preventDefault(); openVideo34(); };
    }
    
    const logoClick = document.getElementById('logoClick');
    if (logoClick) {
        logoClick.onclick = () => goHome();
    }
    
    const genreBtn = document.getElementById('navGenre');
    const genreDropdown = document.getElementById('genreDropdown');
    
    if (genreBtn && genreDropdown) {
        const newGenreBtn = genreBtn.cloneNode(true);
        genreBtn.parentNode.replaceChild(newGenreBtn, genreBtn);
        
        newGenreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dropdown = document.getElementById('genreDropdown');
            if (dropdown) dropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!newGenreBtn.contains(e.target) && !genreDropdown.contains(e.target)) {
                genreDropdown.classList.remove('show');
            }
        });
    }
    
    // ==================== INI SATU-SATUNYA YANG DIUBAH ====================
    const genreLinks = document.querySelectorAll('.genre-dropdown-content a');
    genreLinks.forEach(link => {
        link.removeEventListener('click', link._listener);
        const listener = (e) => {
            e.preventDefault();
            const genre = link.getAttribute('data-genre');
            // REDIRECT KE GENRE.HTML
            window.location.href = `genre.html?genre=${encodeURIComponent(genre)}`;
        };
        link._listener = listener;
        link.addEventListener('click', listener);
    });
    // ==================== SAMPAI SINI ====================

    const searchInputDesktop = document.getElementById('searchInputDesktop');
    const searchBtnDesktop = document.getElementById('searchBtnDesktop');
    if (searchBtnDesktop) searchBtnDesktop.onclick = () => goToSearchPage(searchInputDesktop?.value || '');
    if (searchInputDesktop) searchInputDesktop.onkeypress = (e) => { if(e.key === 'Enter') goToSearchPage(e.target.value); };

    initHeaderNav();
}

// Initialize event listeners when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    
    const mainSearchBtn = document.getElementById('mainSearchBtn');
    if (mainSearchBtn) {
        mainSearchBtn.onclick = () => performSearch(document.getElementById('mainSearchInput').value);
    }
    
    const mainSearchInput = document.getElementById('mainSearchInput');
    if (mainSearchInput) {
        mainSearchInput.onkeypress = e => { if (e.key === 'Enter') performSearch(e.target.value); };
    }
    
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        clearSearchBtn.onclick = () => clearSearch();
    }
    
    // Wait for header to load and initialize events
    const checkHeader = setInterval(() => {
        if (document.getElementById('logoClick')) {
            clearInterval(checkHeader);
            initializeHeaderEvents();
        }
    }, 100);
});

window.addEventListener('popstate', () => { 
    let q = new URLSearchParams(window.location.search).get('q'); 
    if (q && q.trim()) { 
        const searchInput = document.getElementById('mainSearchInput');
        if (searchInput) searchInput.value = q;
        performSearch(q); 
    } else { 
        clearSearch(); 
    } 
});
