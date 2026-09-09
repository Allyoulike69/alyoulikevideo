// ==================== KONFIGURASI ====================
const DATA_URL = "https://alyoulikevideo.pages.dev/p/daftar.json";
const BASE_URL = "https://alyoulikevideo.pages.dev/p/";
const HOME_URL = "https://alyoulikevideo.pages.dev/index.html";
const COMIC_URL = "https://allyoulikecomic.neocities.org/";
const VIDEO34_URL = "https://www.google.com";
const SEARCH_PAGE_URL = "https://alyoulikevideo.pages.dev/search.html";

// ==================== VARIABEL GLOBAL ====================
let allVideos = [];

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

// ==================== RENDER DAFTAR JUDUL ====================
function renderTitleList(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    const col1 = document.getElementById('hentai-col-1');
    const col2 = document.getElementById('hentai-col-2');
    if (!col1 && !col2) return;
    
    if (!allVideos || allVideos.length === 0) {
        grid.innerHTML = '<div class="no-data-message">🎬 No titles found.</div>';
        return;
    }
    
    const sorted = [...allVideos].sort((a, b) => {
        const ta = a.title.replace(/\s*\[Sub-ENG\]\s*/gi, '').trim().toLowerCase();
        const tb = b.title.replace(/\s*\[Sub-ENG\]\s*/gi, '').trim().toLowerCase();
        return ta.localeCompare(tb);
    });
    
    if (col1) col1.innerHTML = "";
    if (col2) col2.innerHTML = "";
    
        const lettersArr = [];
    for (let i = 0; i < sorted.length; i++) {
        const title = sorted[i].title.replace(/\s*\[Sub-ENG\]\s*/gi, '').trim() || "Untitled";
        let letter = (title.charAt(0) || '#').toUpperCase();
        if (!/[A-Z]/.test(letter)) letter = '#';
        lettersArr.push(letter);
    }
    
    const letterSetSize = [...new Set(lettersArr)].length;
    const totalUnits = sorted.length + letterSetSize;
    const target = Math.ceil(totalUnits / 2);
    
    let col1Units = 0;
    let inCol2 = false;
    let lastHeaderCol1 = '';
    let lastHeaderCol2 = '';
    
    console.log('Unit kolom 1 target:', target, 'dari total', totalUnits, '(item', sorted.length, '+ header', letterSetSize, ')');
    
    for (let i = 0; i < sorted.length; i++) {
        const video = sorted[i];
        const title = video.title.replace(/\s*\[Sub-ENG\]\s*/gi, '').trim() || "Untitled";
        let link = video.link.startsWith('http') ? video.link : BASE_URL + video.link;
        const letter = lettersArr[i];
        
        if (!inCol2) {
            const renderHeader = letter !== lastHeaderCol1;
            const units = renderHeader ? 2 : 1;
            if (col1Units + units > target) {
                inCol2 = true;
            } else {
                col1Units += units;
                if (renderHeader) {
                    col1.innerHTML += `
                        <div class="hentai-letter-header" data-letter="${letter}">${letter}<i class="fa-solid fa-arrow-turn-up hentai-letter-up"></i></div>
                    `;
                    lastHeaderCol1 = letter;
                }
                col1.innerHTML += `
                    <div class="hentailist-item" data-url="${link}">
                        <span>${escapeHtml(title)}</span>
                    </div>
                `;
            }
        }
        
        if (inCol2) {
            if (letter !== lastHeaderCol2 && letter !== lastHeaderCol1) {
                col2.innerHTML += `
                    <div class="hentai-letter-header" data-letter="${letter}">${letter}<i class="fa-solid fa-arrow-turn-up hentai-letter-up"></i></div>
                `;
            }
            lastHeaderCol2 = letter;
            col2.innerHTML += `
                <div class="hentailist-item" data-url="${link}">
                    <span>${escapeHtml(title)}</span>
                </div>
            `;
        }
    }
    
    grid.querySelectorAll('.hentailist-item').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            if (url) window.open(url, '_blank');
        });
    });
    
    grid.querySelectorAll('.hentai-letter-up').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const nav = document.getElementById('hentai-letter-nav');
            if (nav) {
                const headerOffset = 120;
                const top = nav.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });
    
    buildLetterNav();
}

// ==================== BUILD LETTER NAVIGATION ====================
function buildLetterNav() {
    const nav = document.getElementById('hentai-letter-nav');
    if (!nav) return;
    nav.innerHTML = "";
    
    const headers = document.querySelectorAll('.hentai-letter-header');
    const present = [];
    headers.forEach(h => {
        const letter = h.getAttribute('data-letter');
        if (letter && present.indexOf(letter) === -1) present.push(letter);
    });
    
    const all = ['#'];
    for (let c = 65; c <= 90; c++) all.push(String.fromCharCode(c));
    
    all.forEach(letter => {
        const a = document.createElement('a');
        a.textContent = letter;
        a.className = 'hentai-letter-link';
        if (present.indexOf(letter) === -1) {
            a.style.opacity = '0.35';
            a.style.cursor = 'default';
            a.style.pointerEvents = 'none';
        } else {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector('.hentai-letter-header[data-letter="' + letter + '"]');
                if (target) {
                    const headerOffset = 120;
                    const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
            });
        }
        nav.appendChild(a);
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
                    window.location.href = `${HOME_URL}genre.html?genre=${encodeURIComponent(genre)}`;
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
        const col1 = document.getElementById('hentai-col-1');
        if (col1) col1.innerHTML = '<div class="no-data-message"><i class="fa-solid fa-spinner fa-pulse"></i> Loading...</div>';
        
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        let pages = (data.pages || []).filter(item => (item.lengkap || "").trim().toLowerCase() === "yes");
        
        allVideos = pages.map((item) => ({
            title: item.title || "Untitled",
            link: item.link || "#",
            image: item.image || "https://placehold.co/300x450?text=No+Image",
            genre: item.genre || "",
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
        
        renderTitleList('hentai-list-grid');
        
    } catch (err) {
        console.error('Error:', err);
        const col1 = document.getElementById('hentai-col-1');
        if (col1) col1.innerHTML = `<div class="no-data-message">❌ Error: ${err.message}</div>`;
    }
}

// ==================== START ====================
document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadFooter();
    loadVideoData();
});
