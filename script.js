// ==================== KONFIGURASI ====================
const DATA_URL = "https://alyoulikevideo.pages.dev/p/daftar.json";
const BASE_URL = "https://alyoulikevideo.pages.dev/p/";
const HOME_URL = "https://alyoulikevideo.pages.dev/index.html";
const COMIC_URL = "https://allyoulikecomic.pages.dev/";
const VIDEO34_URL = "comingsoon.html";
const SEARCH_PAGE_URL = "https://alyoulikevideo.pages.dev/search.html";

// ==================== VARIABEL GLOBAL ====================
let allVideos = [];
let currentPageNum = 1;
let currentGenre = "";
let currentFilteredByGenre = [];
const itemsPerPage = 12;
const FEATURED_KEY = 'allyoulike_video_featured';
const FEATURED_TIMESTAMP_KEY = 'allyoulike_video_ts';
const PAGE_KEY = 'allyoulike_video_page';
const SIX_HOURS = 6 * 60 * 60 * 1000;
const FEATURED_COUNT = 4;

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

function goToSearchPage(query) {
    if (query && query.trim()) {
        window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(query.trim())}`;
    } else {
        window.location.href = SEARCH_PAGE_URL;
    }
}

function showRandomVideo() {
    if (allVideos.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allVideos.length);
    const randomItem = allVideos[randomIndex];
    let targetLink = randomItem.link.startsWith('http') ? randomItem.link : BASE_URL + randomItem.link;
    window.open(targetLink, '_blank');
}

function saveCurrentPage(page) {
    localStorage.setItem(PAGE_KEY, page.toString());
}

function getLastPage() {
    const savedPage = localStorage.getItem(PAGE_KEY);
    if (savedPage && !isNaN(parseInt(savedPage))) return parseInt(savedPage);
    return 1;
}

function getFeaturedVideos() {
    const now = Date.now();
    const savedTimestamp = localStorage.getItem(FEATURED_TIMESTAMP_KEY);
    const savedFeatured = localStorage.getItem(FEATURED_KEY);
    
    if (savedTimestamp && savedFeatured && (now - parseInt(savedTimestamp)) < SIX_HOURS) {
        try {
            return JSON.parse(savedFeatured);
        } catch(e) { console.warn(e); }
    }
    if (allVideos.length > 0) {
        const shuffledCopy = [...allVideos];
        for (let i = shuffledCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledCopy[i], shuffledCopy[j]] = [shuffledCopy[j], shuffledCopy[i]];
        }
        const selected = shuffledCopy.slice(0, FEATURED_COUNT);
        localStorage.setItem(FEATURED_KEY, JSON.stringify(selected));
        localStorage.setItem(FEATURED_TIMESTAMP_KEY, now.toString());
        return selected;
    }
    return [];
}

function filterByGenre(genre) {
    currentGenre = genre;
    currentPageNum = 1;
    
    if (!genre || genre === "") {
        currentFilteredByGenre = [...allVideos];
    } else {
        currentFilteredByGenre = allVideos.filter(video => {
            const videoGenre = (video.genre || "").toLowerCase();
            return videoGenre.includes(genre.toLowerCase());
        });
    }
    
    const newUploadsTitle = document.getElementById('newUploadsTitle');
    if (newUploadsTitle && genre) {
        newUploadsTitle.innerHTML = `${genre}`;
    } else if (newUploadsTitle) {
        newUploadsTitle.innerHTML = `New Uploads`;
    }
    
    const sliderVideos = currentFilteredByGenre.slice(0, 11);
    renderVideoGrid(sliderVideos, 'new-videos-grid', false, true, 1);
    enableSliderDrag(document.getElementById('new-videos-grid'));
    
    const genreDropdown = document.getElementById('genreDropdown');
    if (genreDropdown) genreDropdown.classList.remove('show');
}

// ==================== FUNGSI RENDER ====================
function renderVideoGrid(videoArray, gridId, isFeatured = false, isNewUploads = false, currentPage = 1) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    if (!videoArray || videoArray.length === 0) {
        grid.innerHTML = '<div class="no-data-message">🎬 No videos in this category.</div>';
        return;
    }
    videoArray.forEach((video, idx) => {
        let link = video.link.startsWith('http') ? video.link : BASE_URL + video.link;
        let imgUrl = video.image || "https://placehold.co/300x450?text=Video+Thumb";
        let title = video.title || "Untitled Video";
        let newBadge = '';
        let ratingBadge = '';
        
        if (isNewUploads && currentPage === 1 && idx < 11 && !currentGenre) {
            newBadge = '<span class="badge-new">NEW</span>';
        }
        if (video.rating && video.rating.trim()) {
            const r = parseFloat(video.rating.trim());
            const display = isNaN(r) ? video.rating.trim() : (Math.floor(r * 10) / 10).toFixed(1);
            ratingBadge = `<span class="rating-badge"><i class="fa-solid fa-star"></i> ${escapeHtml(display)}</span>`;
        }
        
        grid.innerHTML += `
            <div class="video-item" data-url="${link}">
                <div class="video-thumb-container">
                    <img src="${imgUrl}" class="video-thumb" loading="lazy" draggable="false" 
                         onerror="this.src='https://placehold.co/300x450?text=Video+Unavailable'">
                    <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                    ${newBadge}
                    ${ratingBadge}
                    <div class="video-title">${escapeHtml(title)}</div>
                </div>
            </div>
        `;
    });
    document.querySelectorAll(`#${gridId} .video-item`).forEach(card => {
        card.addEventListener('click', (e) => {
            const url = card.getAttribute('data-url');
            if (url) window.open(url, '_blank');
        });
    });
}

function enableSliderDrag(slider) {
    if (!slider) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let rafId = null;

    const stopAnim = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    };

    const snapToNearest = (currentScroll) => {
        const cards = slider.querySelectorAll('.video-item');
        if (!cards.length) return currentScroll;
        const gap = parseInt(getComputedStyle(slider).gap) || 15;
        const cardWidth = cards[0].offsetWidth + gap;
        const index = Math.round(currentScroll / cardWidth);
        return Math.max(0, Math.min(index * cardWidth, slider.scrollWidth - slider.clientWidth));
    };

    const animateTo = (target, duration, easing) => {
        stopAnim();
        const start = slider.scrollLeft;
        const diff = target - start;
        const startTime = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            const eased = easing(t);
            slider.scrollLeft = start + diff * eased;
            if (t < 1) {
                rafId = requestAnimationFrame(step);
            } else {
                rafId = null;
                slider.scrollLeft = target;
            }
        };
        rafId = requestAnimationFrame(step);
    };

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const release = (e) => {
        if (!isDown) return;
        isDown = false;
        slider.style.cursor = 'grab';
        if (slider.releasePointerCapture) {
            try { slider.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 0) velocity = (slider.scrollLeft - lastX) / dt * 16.7;
        else velocity = 0;

        if (hasDragged && Math.abs(velocity) > 0.5) {
            let target = slider.scrollLeft - velocity * 12;
            target = Math.max(0, Math.min(target, slider.scrollWidth - slider.clientWidth));
            const snap = snapToNearest(target);
            const dist = Math.abs(snap - slider.scrollLeft);
            const duration = Math.min(700, 350 + dist * 0.35);
            animateTo(snap, duration, easeOutQuart);
        } else if (hasDragged) {
            const snap = snapToNearest(slider.scrollLeft);
            animateTo(snap, 300, easeOutCubic);
        }
    };

    slider.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        stopAnim();
        isDown = true;
        hasDragged = false;
        velocity = 0;
        e.preventDefault();
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        lastX = slider.scrollLeft;
        lastTime = performance.now();
        slider.style.cursor = 'grabbing';
        if (slider.setPointerCapture) {
            try { slider.setPointerCapture(e.pointerId); } catch (err) {}
        }
    });

    slider.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = x - startX;
        if (Math.abs(walk) > 5) hasDragged = true;
        slider.scrollLeft = scrollLeft - walk;

        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 0) {
            velocity = ((slider.scrollLeft - lastX) / dt) * 16.7;
        }
        lastX = slider.scrollLeft;
        lastTime = now;
    });

    slider.addEventListener('dragstart', (e) => e.preventDefault());
    slider.addEventListener('pointerup', release);
    slider.addEventListener('pointercancel', release);
    slider.addEventListener('pointerleave', (e) => {
        if (isDown && e.pointerType === 'mouse') {
            release(e);
        }
    });

    slider.addEventListener('click', (e) => {
        if (hasDragged) {
            e.preventDefault();
            e.stopPropagation();
            hasDragged = false;
            return;
        }
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const card = el ? el.closest('.video-item') : null;
        if (card) {
            const url = card.getAttribute('data-url');
            if (url) {
                e.preventDefault();
                e.stopPropagation();
                window.open(url, '_blank');
            }
        }
        hasDragged = false;
    }, true);
}

function renderPaginatedGrid() {
    const start = (currentPageNum - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = currentFilteredByGenre.slice(start, end);
    renderVideoGrid(paginatedData, 'new-videos-grid', false, true, currentPageNum);
}

function goToVideoPage(page) {
    currentPageNum = page;
    renderPaginatedGrid();
    updatePagination();
    saveCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = "";
    const totalPages = Math.ceil(currentFilteredByGenre.length / itemsPerPage);
    if (totalPages <= 1) return;
    
    const createBtn = (text, onClick, isDisabled = false, extraClass = 'pagination-arrow') => {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.className = extraClass;
        if (isDisabled) btn.classList.add('disabled');
        btn.onclick = onClick;
        return btn;
    };
    
    container.appendChild(createBtn('«', () => { if (currentPageNum > 1) goToVideoPage(1); }, currentPageNum === 1));
    
    const n = 3;
    let startPage, endPage;
    if (totalPages <= 5) {
        startPage = 1; endPage = totalPages;
    } else {
        startPage = currentPageNum - 1;
        endPage = currentPageNum + 1;
        if (startPage < 1) { startPage = 1; endPage = 3; }
        if (endPage > totalPages) { endPage = totalPages; startPage = totalPages - 2; }
    }
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.innerText = 1;
        firstBtn.className = `pagination-btn ${1 === currentPageNum ? 'active' : ''}`;
        firstBtn.onclick = () => goToVideoPage(1);
        container.appendChild(firstBtn);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.innerText = '...';
            dots.className = 'pagination-dots';
            container.appendChild(dots);
        }
    }
    for (let i = startPage; i <= endPage; i++) {
        if (i === 1 && startPage === 1) continue; // sudah ada
        if (i === totalPages && endPage === totalPages) continue;
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i;
        pageBtn.className = `pagination-btn ${i === currentPageNum ? 'active' : ''}`;
        pageBtn.onclick = () => goToVideoPage(i);
        container.appendChild(pageBtn);
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.innerText = '...';
            dots.className = 'pagination-dots';
            container.appendChild(dots);
        }
        const lastBtn = document.createElement('button');
        lastBtn.innerText = totalPages;
        lastBtn.className = `pagination-btn ${totalPages === currentPageNum ? 'active' : ''}`;
        lastBtn.onclick = () => goToVideoPage(totalPages);
        container.appendChild(lastBtn);
    }
    container.appendChild(createBtn('»', () => { if (currentPageNum < totalPages) goToVideoPage(totalPages); }, currentPageNum === totalPages));
}

// ==================== EVENT DELEGATION (DIPERBAIKI) ====================
function setupGlobalEventDelegation() {
    // Event delegation untuk semua klik di document
    document.body.addEventListener('click', function(e) {
        // HOME button
        if (e.target.closest('#navHome')) {
            e.preventDefault();
            window.location.href = HOME_URL;
            return;
        }
        
        // RANDOM button
        if (e.target.closest('#navRandom')) {
            e.preventDefault();
            if (allVideos.length) showRandomVideo();
            return;
        }
        
        // COMIC button
        if (e.target.closest('#navComic')) {
            e.preventDefault();
            window.location.href = COMIC_URL;
            return;
        }
        
        // VIDEO34 button
        if (e.target.closest('#navVideo34')) {
            e.preventDefault();
            window.open(VIDEO34_URL, '_blank');
            return;
        }
        
        // LOGO click
        if (e.target.closest('#logoClick')) {
            window.location.href = HOME_URL;
            return;
        }
        
        // GENRE DROPDOWN toggle
        if (e.target.closest('#navGenre')) {
            e.preventDefault();
            e.stopPropagation();
            const genreDropdown = document.getElementById('genreDropdown');
            if (genreDropdown) {
                if (genreDropdown.classList.contains('show')) {
                    genreDropdown.classList.remove('show');
                } else {
                    genreDropdown.classList.add('show');
                }
            }
            return;
        }
        
        // Genre links di dropdown
        if (e.target.closest('.genre-dropdown-content a')) {
            e.preventDefault();
            const genre = e.target.closest('.genre-dropdown-content a').getAttribute('data-genre');
            if (genre) {
                window.location.href = 'genre.html?genre=' + encodeURIComponent(genre);
            }
            return;
        }
    });
    
    // Event delegation untuk SEARCH (keypress)
    document.body.addEventListener('keypress', function(e) {
        // Search desktop
        const searchInputDesktop = document.getElementById('searchInputDesktop');
        if (e.target === searchInputDesktop && e.key === 'Enter') {
            if (searchInputDesktop) goToSearchPage(searchInputDesktop.value);
        }
        
        // Search mobile
        const searchInputMobile = document.getElementById('searchInputMobile');
        if (e.target === searchInputMobile && e.key === 'Enter') {
            const q = searchInputMobile.value.trim();
            const mobileSearchOverlay = document.getElementById('mobileSearchOverlay');
            if (mobileSearchOverlay) mobileSearchOverlay.style.display = 'none';
            goToSearchPage(q);
        }
    });
    
    // Event delegation untuk klik tombol search
    document.body.addEventListener('click', function(e) {
        // Search Desktop button
        if (e.target.closest('#searchBtnDesktop')) {
            const searchInputDesktop = document.getElementById('searchInputDesktop');
            if (searchInputDesktop) goToSearchPage(searchInputDesktop.value);
            return;
        }
        
        // Search Mobile icon (buka overlay)
        if (e.target.closest('#searchIconMobile')) {
            const mobileSearchOverlay = document.getElementById('mobileSearchOverlay');
            if (mobileSearchOverlay) mobileSearchOverlay.style.display = 'block';
            setTimeout(function() {
                const searchInputMobile = document.getElementById('searchInputMobile');
                if (searchInputMobile) searchInputMobile.focus();
            }, 100);
            return;
        }
        
        // Close search button
        if (e.target.closest('#closeSearchBtn')) {
            const mobileSearchOverlay = document.getElementById('mobileSearchOverlay');
            const searchInputMobile = document.getElementById('searchInputMobile');
            if (mobileSearchOverlay) mobileSearchOverlay.style.display = 'none';
            if (searchInputMobile) searchInputMobile.value = '';
            return;
        }
        
        // Search Mobile button
        if (e.target.closest('#searchBtnMobile')) {
            const searchInputMobile = document.getElementById('searchInputMobile');
            const q = searchInputMobile ? searchInputMobile.value.trim() : '';
            const mobileSearchOverlay = document.getElementById('mobileSearchOverlay');
            if (mobileSearchOverlay) mobileSearchOverlay.style.display = 'none';
            goToSearchPage(q);
            return;
        }
    });
    
    // Tutup dropdown saat klik di luar (dengan event delegation)
    document.body.addEventListener('click', function(e) {
        const genreDropdown = document.getElementById('genreDropdown');
        const navGenre = document.getElementById('navGenre');
        if (genreDropdown && navGenre) {
            if (!navGenre.contains(e.target) && !genreDropdown.contains(e.target)) {
                genreDropdown.classList.remove('show');
            }
        }
        
        // Tutup mobile search overlay saat klik di luar
        const mobileSearchOverlay = document.getElementById('mobileSearchOverlay');
        if (mobileSearchOverlay && e.target === mobileSearchOverlay) {
            mobileSearchOverlay.style.display = 'none';
        }
    });
    
    console.log("Global event delegation setup complete");
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

// ==================== LOAD HEADER, FOOTER & DATA ====================
async function loadHeader() {
    try {
        const response = await fetch('header.html?t=' + Date.now());
        const headerHtml = await response.text();
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = headerHtml;
            console.log("Header loaded successfully");
            initHeaderNav();
            // Tidak perlu attachHeaderEvents lagi karena sudah pakai event delegation!
        }
    } catch (error) {
        console.error('Gagal load header:', error);
    }
}

async function loadFooter() {
    try {
        const response = await fetch('footer.html?t=' + Date.now());
        const footerHtml = await response.text();
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.innerHTML = footerHtml;
        }
    } catch (error) {
        console.error('Gagal load footer:', error);
    }
}

async function loadVideoData() {
    try {
        const featuredGrid = document.getElementById('featured-grid');
        const newVideosGrid = document.getElementById('new-videos-grid');
        
        if (featuredGrid) {
            featuredGrid.innerHTML = '<div class="no-data-message"><i class="fa-solid fa-spinner fa-pulse"></i> Loading video gallery...</div>';
        }
        if (newVideosGrid) {
            newVideosGrid.innerHTML = '<div class="no-data-message"><i class="fa-solid fa-spinner fa-pulse"></i> Preparing video collection...</div>';
        }
        
        const response = await fetch(DATA_URL + '?t=' + Date.now());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        let pages = (data.pages || []).filter(item => (item.lengkap || "").trim().toLowerCase() === "yes");
        allVideos = pages.map((item, idx) => ({
            ...item,
            views: Math.floor(Math.random() * 50000) + 1000,
            duration: `${Math.floor(Math.random() * 20) + 2}:${Math.floor(Math.random() * 59)}`,
            type: 'video'
        }));
        allVideos.sort((a, b) => new Date(b.date) - new Date(a.date));
        currentFilteredByGenre = [...allVideos];
        
        if (allVideos.length === 0) {
            if (featuredGrid) featuredGrid.innerHTML = '<div class="no-data-message">📭 No videos available at this time.</div>';
            if (newVideosGrid) newVideosGrid.innerHTML = '<div class="no-data-message">📭 No videos available.</div>';
            return;
        }
        
        const featuredVids = getFeaturedVideos();
        renderVideoGrid(featuredVids, 'featured-grid', false, false);
        
        const sliderVideos = currentFilteredByGenre.slice(0, 11);
        renderVideoGrid(sliderVideos, 'new-videos-grid', false, true, 1);
        enableSliderDrag(document.getElementById('new-videos-grid'));
        
        const recentlyByLastAir = [...currentFilteredByGenre].sort((a, b) => {
            const la = a['Last air date'] ? new Date(a['Last air date']) : new Date(0);
            const lb = b['Last air date'] ? new Date(b['Last air date']) : new Date(0);
            return lb - la;
        });
        const recentlyVideos = recentlyByLastAir.slice(0, 11);
        renderVideoGrid(recentlyVideos, 'recently-videos-grid', false, false);
        enableSliderDrag(document.getElementById('recently-videos-grid'));
        
        const usedLinks = new Set();
        
        function shuffle(arr) {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }
        
        function pickSectionVideos(genreKey) {
            const vids = currentFilteredByGenre.filter(v =>
                !usedLinks.has(v.link) && (v.genre || "").toLowerCase().includes(genreKey)
            );
            const picked = shuffle(vids).slice(0, 11);
            picked.forEach(v => usedLinks.add(v.link));
            return picked;
        }
        
        const uncensoredVideos = pickSectionVideos('uncensored');
        renderVideoGrid(uncensoredVideos, 'uncensored-videos-grid', false, false);
        enableSliderDrag(document.getElementById('uncensored-videos-grid'));
        
        const milfVideos = pickSectionVideos('milf');
        renderVideoGrid(milfVideos, 'milf-videos-grid', false, false);
        enableSliderDrag(document.getElementById('milf-videos-grid'));
        
        const ntrVideos = pickSectionVideos('ntr');
        renderVideoGrid(ntrVideos, 'ntr-videos-grid', false, false);
        enableSliderDrag(document.getElementById('ntr-videos-grid'));
        
        const yuriVideos = pickSectionVideos('yuri');
        renderVideoGrid(yuriVideos, 'yuri-videos-grid', false, false);
        enableSliderDrag(document.getElementById('yuri-videos-grid'));
    } catch (err) {
        console.error(err);
        const featuredGrid = document.getElementById('featured-grid');
        const newVideosGrid = document.getElementById('new-videos-grid');
        if (featuredGrid) featuredGrid.innerHTML = `<div class="no-data-message">❌ Failed to load videos: ${err.message}</div>`;
        if (newVideosGrid) newVideosGrid.innerHTML = '<div class="no-data-message">Failed to load video data.</div>';
    }
}

// ==================== START ====================
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM ready, initializing...");
    
    // Setup global event delegation (hanya sekali, akan tetap bekerja!)
    setupGlobalEventDelegation();
    
    // Load komponen
    loadHeader();
    loadFooter();
    loadVideoData();
});
