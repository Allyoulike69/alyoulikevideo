// ==================== KONFIGURASI ====================
const DATA_URL = "https://alyoulikevideo.pages.dev/p/daftar.json";
const BASE_URL = "https://alyoulikevideo.pages.dev/p/";
const HOME_URL = "https://alyoulikevideo.pages.dev/index.html";
const COMIC_URL = "https://allyoulikecomic.neocities.org/";
const VIDEO34_URL = "https://www.google.com";
const SEARCH_PAGE_URL = "https://alyoulikevideo.pages.dev/search.html";
const GENRE_PAGE_URL = "https://alyoulikevideo.pages.dev/genre.html";

// ==================== VARIABEL GLOBAL ====================
let allVideos = [];
let allGenres = [];
let allStudios = [];
let allYears = [];

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

// ==================== RENDER DAFTAR GENRE ====================
function renderGenreList(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    
    if (!allGenres || allGenres.length === 0) {
        grid.innerHTML = '<div class="no-data-message">🎬 No genres found.</div>';
        return;
    }
    
    for (let i = 0; i < allGenres.length; i++) {
        const g = allGenres[i];
        grid.innerHTML += `
            <div class="genrelist-item" data-genre="${escapeHtml(g.name)}">
                <span>${escapeHtml(g.name)}</span>
            </div>
        `;
    }
    
    grid.querySelectorAll('.genrelist-item').forEach(item => {
        item.addEventListener('click', () => {
            const genre = item.getAttribute('data-genre');
            if (genre) window.location.href = `${GENRE_PAGE_URL}?genre=${encodeURIComponent(genre)}`;
        });
    });
}

// ==================== RENDER DAFTAR STUDIO ====================
function renderStudioList(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    
    if (!allStudios || allStudios.length === 0) {
        grid.innerHTML = '<div class="no-data-message">🎬 No studios found.</div>';
        return;
    }
    
    for (let i = 0; i < allStudios.length; i++) {
        const s = allStudios[i];
        grid.innerHTML += `
            <div class="genrelist-item" data-studio="${escapeHtml(s.name)}">
                <span>${escapeHtml(s.name)}</span>
            </div>
        `;
    }
    
    grid.querySelectorAll('.genrelist-item').forEach(item => {
        item.addEventListener('click', () => {
            const studio = item.getAttribute('data-studio');
            if (studio) window.location.href = `${GENRE_PAGE_URL}?genre=${encodeURIComponent(studio)}`;
        });
    });
}

// ==================== RENDER DAFTAR TAHUN ====================
function renderYearList(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    
    if (!allYears || allYears.length === 0) {
        grid.innerHTML = '<div class="no-data-message">🎬 No years found.</div>';
        return;
    }
    
    for (let i = 0; i < allYears.length; i++) {
        const y = allYears[i];
        grid.innerHTML += `
            <div class="genrelist-item" data-year="${escapeHtml(y.name)}">
                <span>${escapeHtml(y.name)}</span>
            </div>
        `;
    }
    
    grid.querySelectorAll('.genrelist-item').forEach(item => {
        item.addEventListener('click', () => {
            const year = item.getAttribute('data-year');
            if (year) window.location.href = `${GENRE_PAGE_URL}?genre=${encodeURIComponent(year)}`;
        });
    });
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
                    window.location.href = `${GENRE_PAGE_URL}?genre=${encodeURIComponent(genre)}`;
                }
                genreDropdown.classList.remove('show');
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
        const grid = document.getElementById('genrelist-videos-grid');
        if (grid) grid.innerHTML = '<div class="no-data-message"><i class="fa-solid fa-spinner fa-pulse"></i> Loading...</div>';
        
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
            firstAirDate: item["First air date"] || "",
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
        
        // KUMPULKAN GENRE UNIK + JUMLAH VIDEO
        const genreMap = new Map();
        allVideos.forEach(video => {
            const genres = video.genre.split(',').map(g => g.trim()).filter(Boolean);
            genres.forEach(g => {
                genreMap.set(g, (genreMap.get(g) || 0) + 1);
            });
        });
        
        allGenres = Array.from(genreMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('Total genre:', allGenres.length);
        
        renderGenreList('genrelist-videos-grid');
        
        // KUMPULKAN STUDIO UNIK + JUMLAH VIDEO
        const studioMap = new Map();
        allVideos.forEach(video => {
            const studios = (video.studio || "").split(',').map(s => s.trim()).filter(Boolean);
            studios.forEach(s => {
                studioMap.set(s, (studioMap.get(s) || 0) + 1);
            });
        });
        
        allStudios = Array.from(studioMap.entries())
            .map(([name, count]) => ({ name, count }))
            .filter(s => s.name.toLowerCase() !== "n/a")
            .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('Total studio:', allStudios.length);
        
        renderStudioList('studiolist-videos-grid');
        
        // KUMPULKAN TAHUN (dari First air date) + JUMLAH VIDEO
        const yearMap = new Map();
        allVideos.forEach(video => {
            const year = (video.firstAirDate || "").slice(-4);
            if (/^\d{4}$/.test(year)) {
                yearMap.set(year, (yearMap.get(year) || 0) + 1);
            }
        });
        
        allYears = Array.from(yearMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.name.localeCompare(a.name));
        
        console.log('Total tahun:', allYears.length);
        
        renderYearList('yearslist-videos-grid');
        
    } catch (err) {
        console.error('Error:', err);
        const grid = document.getElementById('genrelist-videos-grid');
        if (grid) grid.innerHTML = `<div class="no-data-message">❌ Error: ${err.message}</div>`;
    }
}

// ==================== START ====================
document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadFooter();
    loadVideoData();
});
