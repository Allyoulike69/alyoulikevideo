// main.js - Semua script termasuk video player

// ==================== VIDEO PLAYER FUNCTION ====================
function initVideoPlayer(containerId, videoIds) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container tidak ditemukan:', containerId);
        return;
    }
    
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
        console.error('videoIds harus berupa array yang berisi ID video');
        container.innerHTML = '<div style="color:red;padding:20px;text-align:center">Error: Video IDs tidak ditemukan</div>';
        return;
    }
    
    console.log('Membuat daftar episode untuk ID:', videoIds);
    container.innerHTML = '';
    
    let currentEpisode = -1;
    
    const storageKey = 'vh_ep_' + (window.location.pathname.split('/').pop() || 'index');
    const savedEpisode = sessionStorage.getItem(storageKey);
    if (savedEpisode !== null) {
        const parsed = parseInt(savedEpisode, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < videoIds.length) {
            currentEpisode = parsed;
        }
    }
    
    let posterUrl = '';
    let autoTitle = (typeof getAutoTitleFromFileName === 'function') ? getAutoTitleFromFileName() : '';
    const currentFileName = decodeURIComponent(window.location.pathname.split('/').pop());
    let posterMatch = allVideos.find(v => {
        const vLink = (v.link || "").trim();
        return vLink === currentFileName ||
               vLink === currentFileName.replace('.html', '') + '.html' ||
               vLink === currentFileName.replace('.html', '');
    });
    if (!posterMatch) posterMatch = allVideos.find(v => titleMatches(v.title, autoTitle));
    if (!posterMatch && window.CURRENT_TITLE) posterMatch = allVideos.find(v => titleMatches(v.title, window.CURRENT_TITLE));
    if (posterMatch) posterUrl = posterMatch.image || '';
    if (posterMatch && posterMatch.title) window.SELECTED_VIDEO_TITLE = posterMatch.title;
    
    function renderEpisodeList() {
        const episodeListContainer = document.getElementById('episodeListContainer');
        const episodeButtons = document.getElementById('episodeButtons');
        const episodeListContainer2 = document.getElementById('episodeListContainer2');
        const episodeButtons2 = document.getElementById('episodeButtons2');
        const targets = [episodeButtons, episodeButtons2].filter(Boolean);
        
        targets.forEach(target => {
            const useActive = target.id === 'episodeButtons2';
            target.innerHTML = videoIds.map((_, index) => {
                const num = (index + 1).toString().padStart(2, '0');
                const episodeImg = (window.EPISODE_IMAGES && window.EPISODE_IMAGES[index]) ? window.EPISODE_IMAGES[index] : posterUrl;
                const thumbHtml = episodeImg
                    ? `<img class="episode-thumb" src="${escapeHtml(episodeImg)}" alt="Episode ${num}" loading="lazy">`
                    : `<div class="episode-thumb episode-thumb-placeholder"><i class="fa-solid fa-play"></i></div>`;
                const rawTitle = (posterMatch && posterMatch.title) || window.SELECTED_VIDEO_TITLE || '';
                const videoTitle = rawTitle.replace(/\s*\[Sub-ENG\]\s*/gi, '').trim();
                return `
                    <div class="episode-item${useActive && index === currentEpisode ? ' active' : ''}" data-index="${index}">
                        <div class="episode-thumb-wrap">${thumbHtml}</div>
                        <div class="episode-item-title">Episode ${num}</div>
                        <div class="video-hover-title">${escapeHtml(videoTitle)}</div>
                    </div>
                `;
            }).join('');
            
            target.querySelectorAll('.episode-item').forEach(item => {
                item.addEventListener('click', () => {
                    if (item.classList.contains('active')) return;
                    currentEpisode = parseInt(item.getAttribute('data-index'), 10);
                    renderEpisodeList();
                    playEpisode(currentEpisode);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            });
        });
    }
    
    function playEpisode(index) {
        sessionStorage.setItem(storageKey, String(index));
        const num = (index + 1).toString().padStart(2, '0');
        const embedUrl = `https://abyssplayer.com/${videoIds[index]}`;
        const fullTitle = (posterMatch && posterMatch.title) ? posterMatch.title : (window.SELECTED_VIDEO_TITLE || autoTitle || '');
        if (typeof window.VH_hitWatch === 'function') window.VH_hitWatch(fullTitle);
        const hasPrev = index > 0;
        const hasNext = index < videoIds.length - 1;
        container.innerHTML = `
            <div class="episode-container">
                <div class="ep-label">${escapeHtml(fullTitle)} - Episode ${num}</div>
                <div class="video-player-wrapper">
                    <div class="v-frame">
                        <iframe 
                            src="${embedUrl}" 
                            allowfullscreen 
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    </div>
                </div>
                <div class="episode-nav">
                    <button class="episode-nav-btn" id="epPrevBtn" ${hasPrev ? '' : 'disabled'}><i class="fa-solid fa-chevron-left"></i> Prev</button>
                    <button class="episode-nav-btn episode-nav-center" id="epListBtn"><i class="fa-solid fa-list"></i> Daftar Episode</button>
                    <button class="episode-nav-btn" id="epNextBtn" ${hasNext ? '' : 'disabled'}>Next <i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>
        `;
        const epContainer = container.querySelector('.episode-container');
        if (epContainer) epContainer.style.display = 'block';

        function showInitialView() {
            sessionStorage.removeItem(storageKey);
            if (epContainer) epContainer.style.display = 'none';
            const infoV1 = document.getElementById('videoInfoContainer');
            const infoV2 = document.getElementById('videoInfoContainer2');
            const listV1 = document.getElementById('episodeListContainer');
            const listV2 = document.getElementById('episodeListContainer2');
            if (infoV1) infoV1.style.display = 'flex';
            if (listV1) listV1.style.display = 'block';
            if (infoV2) infoV2.style.display = 'none';
            if (listV2) listV2.style.display = 'none';
        }

        const centerBtn = container.querySelector('.episode-nav-center');
        if (centerBtn) centerBtn.addEventListener('click', () => {
            showInitialView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const prevBtn = document.getElementById('epPrevBtn');
        const nextBtn = document.getElementById('epNextBtn');
        if (prevBtn) prevBtn.addEventListener('click', () => {
            if (index > 0) {
                currentEpisode = index - 1;
                renderEpisodeList();
                playEpisode(currentEpisode);
            }
        });
        if (nextBtn) nextBtn.addEventListener('click', () => {
            if (index < videoIds.length - 1) {
                currentEpisode = index + 1;
                renderEpisodeList();
                playEpisode(currentEpisode);
            }
        });

        const infoV1 = document.getElementById('videoInfoContainer');
        const infoV2 = document.getElementById('videoInfoContainer2');
        const listV1 = document.getElementById('episodeListContainer');
        const listV2 = document.getElementById('episodeListContainer2');
        if (infoV1) infoV1.style.display = 'none';
        if (listV1) listV1.style.display = 'none';
        if (infoV2) infoV2.style.display = 'flex';
        if (listV2) listV2.style.display = 'block';
    }
    
    renderEpisodeList();
    
    if (currentEpisode >= 0) {
        playEpisode(currentEpisode);
    }
    
    console.log('Daftar episode selesai, jumlah episode:', videoIds.length);
}

// ==================== KONSTANTA ====================
const DATA_URL = "https://alyoulikevideo.pages.dev/p/daftar.json";
const BASE_URL = "https://alyoulikevideo.pages.dev/p/";
const HOME_URL = "https://alyoulikevideo.pages.dev/index.html";
const COMIC_URL = "https://allyoulikecomic.pages.dev/";
const VIDEO34_URL = "../comingsoon.html";
const SEARCH_PAGE_URL = "https://alyoulikevideo.pages.dev//search.html";

let allVideos = [];
let selectedVideo = null;

// ==================== FUNGSI UTILITY ====================
function escapeHtml(str) { 
    if (!str) return ''; 
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m); 
}

function goHome() { window.location.href = HOME_URL; }
function goComic() { window.location.href = COMIC_URL; }
function openVideo34() { window.open(VIDEO34_URL, '_blank'); }
function goToSearchPage(query) { 
    if (query.trim()) window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(query.trim())}`; 
}
function filterByGenre(genre) { window.location.href = `${HOME_URL}?genre=${encodeURIComponent(genre)}`; }

function getRandomVideo() { 
    if (!allVideos.length) return; 
    const randomItem = allVideos[Math.floor(Math.random() * allVideos.length)]; 
    window.open(randomItem.link.startsWith('http') ? randomItem.link : BASE_URL + randomItem.link, '_blank'); 
}

// ==================== PENCOCOKAN JUDUL (TAHAN BEDA TANDA BACA) ====================
function titleMatches(videoTitle, queryTitle) {
    if (!videoTitle) return false;
    if (videoTitle.toLowerCase().includes(queryTitle.toLowerCase())) return true;
    const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const clean = (n) => n
        .replace(/gyaru/g, 'gal')
        .replace(/ananii/g, 'ananie')
        .replace(/(ova|sub|eng|subeng|theanimation|episode|season|subindonesia|batch)+$/g, '');
    const v = clean(normalize(videoTitle));
    const q = clean(normalize(queryTitle));
    return q !== '' && (v.includes(q) || q.includes(v));
}

// ==================== FUNGSI OTOMATIS AMBIL JUDUL DARI NAMA FILE ====================
function getAutoTitleFromFileName() {
    const fileName = window.location.pathname.split('/').pop();
    let titleFromFileName = fileName.replace('.html', '').replace(/%20/g, ' ').replace(/\+/g, ' ');
    titleFromFileName = decodeURIComponent(titleFromFileName);
    return titleFromFileName;
}

// ==================== FUNGSI REKOMENDASI BERDASARKAN GENRE (BARU, TANPA CACHE) ====================
function getGenreRecommendations(videos, currentVideo, count = 12, minSameGenre = 1, excludeLinks = []) {
    // TIDAK PAKAI CACHE, selalu generate baru setiap load
    
    if (excludeLinks && excludeLinks.length > 0) {
        videos = videos.filter(v => !excludeLinks.includes(v.link));
    }
    
    if (!currentVideo || !currentVideo.genre || currentVideo.genre.trim() === '') {
        // Jika tidak ada genre, random saja
        let randomVideos = videos.filter(v => v.title !== currentVideo?.title);
        for (let i = randomVideos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [randomVideos[i], randomVideos[j]] = [randomVideos[j], randomVideos[i]];
        }
        return randomVideos.slice(0, count);
    }
    
    // Ambil genre dari video saat ini
    const currentGenres = currentVideo.genre.split(',').map(g => g.trim().toLowerCase());
    
    // Cari video dengan genre yang sama (prioritas utama)
    let sameGenreVideos = videos.filter(v => {
        if (v.title === currentVideo.title) return false;
        if (!v.genre) return false;
        const videoGenres = v.genre.split(',').map(g => g.trim().toLowerCase());
        const matchCount = currentGenres.filter(g => videoGenres.includes(g)).length;
        return matchCount >= minSameGenre;
    });
    
    // Urutkan berdasarkan jumlah genre yang cocok (tertinggi dulu), lalu acak dalam grup yang sama
    sameGenreVideos = sameGenreVideos.map(v => {
        const videoGenres = v.genre.split(',').map(g => g.trim().toLowerCase());
        const matchCount = currentGenres.filter(g => videoGenres.includes(g)).length;
        return { video: v, matchCount };
    });
    sameGenreVideos.sort((a, b) => {
        if (a.matchCount !== b.matchCount) return b.matchCount - a.matchCount;
        return Math.random() - 0.5;
    });
    sameGenreVideos = sameGenreVideos.map(x => x.video);
    
    // Jika kurang dari count, tambahkan video random lainnya
    if (sameGenreVideos.length < count) {
        const otherVideos = videos.filter(v => 
            v.title !== currentVideo.title && 
            !sameGenreVideos.some(existing => existing.title === v.title)
        );
        
        // Acak video lainnya
        for (let i = otherVideos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherVideos[i], otherVideos[j]] = [otherVideos[j], otherVideos[i]];
        }
        
        const needed = count - sameGenreVideos.length;
        sameGenreVideos = [...sameGenreVideos, ...otherVideos.slice(0, needed)];
    }
    
    return sameGenreVideos.slice(0, count);
}

// ==================== RENDER SLIDER ====================
function renderSlider(trackId, videos, isNewUpdate = false) {
    const track = document.getElementById(trackId);
    if (!track) return;
    if (videos.length === 0) { 
        track.innerHTML = '<div style="padding:20px;text-align:center">Tidak ada video</div>'; 
        return; 
    }
    track.innerHTML = '';
    videos.forEach((video) => {
        const link = video.link.startsWith('http') ? video.link : BASE_URL + video.link;
        const imgUrl = video.image || 'https://placehold.co/400x225/222/fff?text=No+Image';
        const title = video.title || 'Untitled';
        const newBadge = isNewUpdate ? '<span class="badge-new">NEW</span>' : '';
        track.innerHTML += `
            <div class="slider-item" data-url="${link}">
                <div class="slider-thumb">
                    <img src="${imgUrl}" loading="lazy" onerror="this.src='https://placehold.co/400x225/222/fff?text=Error'">
                    <div class="slider-play-overlay"><i class="fa-solid fa-play"></i></div>
                    ${newBadge}
                </div>
                <div class="title-post">${escapeHtml(title)}</div>
            </div>
        `;
    });
    document.querySelectorAll(`#${trackId} .slider-item`).forEach(item => {
        item.addEventListener('click', () => { 
            const url = item.getAttribute('data-url'); 
            if(url) window.open(url, '_blank'); 
        });
    });
}

function createSlider(trackId, prevBtnId, nextBtnId) {
    let currentIdx = 0;
    const track = document.getElementById(trackId);
    if (!track) return;
    
    function updateDimensions() {
        const itemsList = document.querySelectorAll(`#${trackId} .slider-item`);
        if (itemsList.length === 0) return;
        let visibleColumns = 4;
        if (window.innerWidth <= 600) visibleColumns = 2;
        else if (window.innerWidth <= 900) visibleColumns = 3;
        let maxIndex = Math.max(0, itemsList.length - visibleColumns);
        if (currentIdx > maxIndex) currentIdx = maxIndex;
        if (currentIdx < 0) currentIdx = 0;
        const itemWidth = itemsList[0].offsetWidth;
        const gap = 15;
        track.style.transform = `translateX(-${currentIdx * (itemWidth + gap)}px)`;
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        if (prevBtn) prevBtn.disabled = (currentIdx === 0);
        if (nextBtn) nextBtn.disabled = (currentIdx === maxIndex || maxIndex === 0);
    }
    
    function moveSlide(direction) {
        const itemsList = document.querySelectorAll(`#${trackId} .slider-item`);
        if (itemsList.length === 0) return;
        let visibleColumns = 4;
        if (window.innerWidth <= 600) visibleColumns = 2;
        else if (window.innerWidth <= 900) visibleColumns = 3;
        let maxIndex = Math.max(0, itemsList.length - visibleColumns);
        currentIdx += direction;
        if (currentIdx < 0) currentIdx = 0;
        if (currentIdx > maxIndex) currentIdx = maxIndex;
        const itemWidth = itemsList[0].offsetWidth;
        const gap = 15;
        track.style.transform = `translateX(-${currentIdx * (itemWidth + gap)}px)`;
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        if (prevBtn) prevBtn.disabled = (currentIdx === 0);
        if (nextBtn) nextBtn.disabled = (currentIdx === maxIndex || maxIndex === 0);
    }
    
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    if (prevBtn) prevBtn.onclick = () => moveSlide(-1);
    if (nextBtn) nextBtn.onclick = () => moveSlide(1);
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
}

// ==================== DRAG-TO-SCROLL UNTUK SLIDER GRID ====================
function enableSliderDrag(slider) {
    if (!slider) return;
    slider.style.touchAction = 'pan-x pan-y';
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
        const gap = parseInt(getComputedStyle(slider).gap) || 5;
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

// ==================== RENDER VIDEO GRID (seperti index) ====================
function renderVideoGrid(videos, gridId, isNewUpdate = false) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    if (videos.length === 0) {
        grid.innerHTML = '<div style="padding:20px;text-align:center">Tidak ada video</div>';
        return;
    }
    grid.innerHTML = '';
    videos.forEach((video, idx) => {
        const link = video.link.startsWith('http') ? video.link : BASE_URL + video.link;
        const imgUrl = video.image || 'https://placehold.co/300x450?text=Video+Thumb';
        const title = video.title || 'Untitled Video';
        let newBadge = '';
        let ratingBadge = '';
        if (isNewUpdate && idx < 11) {
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

// ==================== HEADER EVENTS ====================
window.attachHeaderEvents = function() {
    const searchBtnDesktop = document.getElementById('searchBtnDesktop');
    const searchInputDesktop = document.getElementById('searchInputDesktop');
    if (searchBtnDesktop) searchBtnDesktop.onclick = () => goToSearchPage(searchInputDesktop?.value || '');
    if (searchInputDesktop) searchInputDesktop.onkeypress = (e) => { if(e.key === 'Enter') goToSearchPage(e.target.value); };
    
    const mobileIcon = document.getElementById('searchIconMobile');
    const mobileOverlay = document.getElementById('mobileSearchOverlay');
    const closeSearch = document.getElementById('closeSearchBtn');
    const mobileSearchBtn = document.getElementById('searchBtnMobile');
    const mobileSearchInput = document.getElementById('searchInputMobile');
    
    if(mobileIcon) mobileIcon.onclick = () => { if(mobileOverlay) mobileOverlay.style.display = 'block'; setTimeout(() => mobileSearchInput?.focus(), 100); };
    if(closeSearch) closeSearch.onclick = () => { if(mobileOverlay) mobileOverlay.style.display = 'none'; if(mobileSearchInput) mobileSearchInput.value = ''; };
    if(mobileSearchBtn) mobileSearchBtn.onclick = () => { const q = mobileSearchInput?.value.trim() || ''; if(mobileOverlay) mobileOverlay.style.display = 'none'; goToSearchPage(q); };
    if(mobileSearchInput) mobileSearchInput.onkeypress = (e) => { if(e.key === 'Enter') { const q = e.target.value.trim(); if(mobileOverlay) mobileOverlay.style.display = 'none'; goToSearchPage(q); } };
    if(mobileOverlay) mobileOverlay.addEventListener('click', (e) => { if(e.target === mobileOverlay) mobileOverlay.style.display = 'none'; });
    
    const navHome = document.getElementById('navHome');
    const navRandom = document.getElementById('navRandom');
    const navComic = document.getElementById('navComic');
    const navVideo34 = document.getElementById('navVideo34');
    const logoClick = document.getElementById('logoClick');
    
    if(navHome) navHome.onclick = (e) => { e.preventDefault(); goHome(); };
    if(navRandom) navRandom.onclick = (e) => { e.preventDefault(); getRandomVideo(); };
    if(navComic) navComic.onclick = (e) => { e.preventDefault(); goComic(); };
    if(navVideo34) navVideo34.onclick = (e) => { e.preventDefault(); openVideo34(); };
    if(logoClick) logoClick.onclick = () => goHome();
    
    const genreBtn = document.getElementById('navGenre');
    const genreDropdown = document.getElementById('genreDropdown');
    if(genreBtn) genreBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if(genreDropdown) genreDropdown.classList.toggle('show'); });
    document.addEventListener('click', (e) => { if(!genreBtn?.contains(e.target) && !genreDropdown?.contains(e.target)) genreDropdown?.classList.remove('show'); });
    
    document.addEventListener('click', (e) => {
        if(genreDropdown && genreDropdown.contains(e.target) && e.target.getAttribute('data-genre')) {
            const genre = e.target.getAttribute('data-genre');
            window.location.href = `../genre.html?genre=${encodeURIComponent(genre)}`;
            genreDropdown.classList.remove('show');
        }
    });

    initHeaderNav();
};

// ==================== LOAD DATA UTAMA ====================
async function loadData() {
    try {
        const response = await fetch(DATA_URL + '?t=' + Date.now());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        allVideos = (data.pages || []).filter(item => (item.lengkap || "").trim().toLowerCase() === "yes").map(item => ({ ...item }));
        
        console.log("Data loaded:", allVideos.length);
        
        if (window.VIDEO_IDS && window.VIDEO_IDS.length > 0) {
            console.log("Memanggil initVideoPlayer dengan IDs:", window.VIDEO_IDS);
            initVideoPlayer('videoArea', window.VIDEO_IDS);
        } else {
            console.error('VIDEO_IDS tidak ditemukan di window!');
            document.getElementById('videoArea').innerHTML = '<div style="color:red;padding:20px;text-align:center">Error: VIDEO_IDS tidak ditemukan</div>';
        }
        
        selectedVideo = null;
        const urlParams = new URLSearchParams(window.location.search);
        const titleParam = urlParams.get('title') || urlParams.get('v');
        
        // ==================== OTOMATIS AMBIL JUDUL DARI NAMA FILE ====================
        let autoTitle = getAutoTitleFromFileName();
        const currentFileName = decodeURIComponent(window.location.pathname.split('/').pop());
        
        // CEK dari link/NAMA FILE (paling akurat - link di daftar.json = nama file)
        if (!selectedVideo && currentFileName && allVideos.length > 0) {
            selectedVideo = allVideos.find(video => {
                const vLink = (video.link || "").trim();
                return vLink === currentFileName ||
                       vLink === currentFileName.replace('.html', '') + '.html' ||
                       vLink === currentFileName.replace('.html', '');
            });
            if (selectedVideo) {
                console.log("Video ditemukan dari nama file (link):", currentFileName, "→", selectedVideo.title);
            }
        }
        
        // CEK dari autoTitle (nama file) - PAKAI includes
        if (!selectedVideo && autoTitle && autoTitle !== '' && autoTitle !== 'index' && allVideos.length > 0) {
            selectedVideo = allVideos.find(video => 
                titleMatches(video.title, autoTitle)
            );
            if (selectedVideo) {
                console.log("Video ditemukan dari nama file (includes):", autoTitle, "â†’", selectedVideo.title);
            }
        }
        
        // Jika tidak ketemu, cek dari window.CURRENT_TITLE (jika ada)
        if (!selectedVideo && window.CURRENT_TITLE && allVideos.length > 0) {
            selectedVideo = allVideos.find(video => 
                titleMatches(video.title, window.CURRENT_TITLE)
            );
            if (selectedVideo) {
                console.log("Video ditemukan dari window.CURRENT_TITLE (includes):", window.CURRENT_TITLE, "â†’", selectedVideo.title);
            }
        }
        
        // Jika tidak ketemu, cek dari URL parameter
        if (!selectedVideo && titleParam && allVideos.length > 0) {
            selectedVideo = allVideos.find(video => 
                titleMatches(video.title, titleParam)
            );
            if (selectedVideo) {
                console.log("Video ditemukan dari URL parameter (includes):", titleParam, "â†’", selectedVideo.title);
            }
        }
        
if (selectedVideo) {
            window.SELECTED_VIDEO_TITLE = selectedVideo.title;
        } else {
            selectedVideo = null;
        }
        
        if (!selectedVideo) {
            console.error("VIDEO TIDAK DITEMUKAN! AutoTitle:", autoTitle);
            const videoInfoContainer = document.getElementById('videoInfoContainer');
            const videoInfoContainer2 = document.getElementById('videoInfoContainer2');
            [videoInfoContainer, videoInfoContainer2].filter(Boolean).forEach(container => {
                container.innerHTML = `
                    <h1><i class="fa-solid fa-circle-exclamation"></i> Video Tidak Ditemukan</h1>
                    <div class="genre-tags-container">
                        <span class="genre-label">Judul "${autoTitle || window.CURRENT_TITLE || titleParam || 'Unknown'}" tidak ada di database</span>
                    </div>
                `;
            });
        }
        
        const videoInfoContainer = document.getElementById('videoInfoContainer');
        const videoInfoContainer2 = document.getElementById('videoInfoContainer2');
        const infoContainers = [videoInfoContainer, videoInfoContainer2].filter(Boolean);
        if (infoContainers.length > 0 && selectedVideo) {
            let genresHtml = '';
            if (selectedVideo.genre && selectedVideo.genre.trim() !== '') {
                const genreList = selectedVideo.genre.split(',').map(g => g.trim());
                genresHtml = genreList.map(genre => `
                    <div class="genre-tag" data-genre="${escapeHtml(genre)}">
                        ${escapeHtml(genre)}
                    </div>
                `).join('');
            } else {
                genresHtml = '<div style="color:#666">Tidak ada genre tersedia</div>';
            }
            
            let studiosHtml = '';
            if (selectedVideo.studio && selectedVideo.studio.trim() !== '') {
                const studioList = selectedVideo.studio.split(',').map(s => s.trim()).filter(Boolean);
                studiosHtml = studioList.map(studio => `
                    <span class="studio-tag" data-studio="${escapeHtml(studio)}">${escapeHtml(studio)}</span>
                `).join('');
            } else {
                studiosHtml = '<span style="color:#666">-</span>';
            }
            
            document.title = `${selectedVideo.title} - Allyoulike Video`;

            const posterHtml = selectedVideo.image && selectedVideo.image.trim() !== ''
                ? `<img class="video-poster" src="${escapeHtml(selectedVideo.image)}" alt="${escapeHtml(selectedVideo.title || 'Poster')}" onerror="this.style.display='none'">`
                : '';

            const months = ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.'];
            const formatDate = (d) => {
                if (!d) return '-';
                const dt = new Date(d);
                if (isNaN(dt.getTime())) return d;
                return `${months[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
            };

            const airDate = formatDate(selectedVideo['First air date']);
            const lastAirDate = formatDate(selectedVideo['Last air date']);
            let rating = '';
            if (selectedVideo.rating && selectedVideo.rating.trim() !== '') {
                const numericRating = parseFloat(selectedVideo.rating.trim());
                const filledStars = isNaN(numericRating) ? 0 : Math.max(0, Math.min(10, Math.round(numericRating)));
                const emptyStars = 10 - filledStars;
                const starsHtml = `${'<i class="fa-solid fa-star star-filled"></i>'.repeat(filledStars)}${'<i class="fa-regular fa-star star-empty"></i>'.repeat(emptyStars)}`;
                rating = `<div class="video-rating"><span class="rating-box">${escapeHtml(selectedVideo.rating.trim())}</span><span class="rating-stars">${starsHtml}</span></div>`;
            }
            const sinopsis = selectedVideo.sinopsis && selectedVideo.sinopsis.trim() !== ''
                ? `<p class="video-sinopsis">${escapeHtml(selectedVideo.sinopsis)}</p>`
                : '';

            const pageUrl = window.location.href;
            const shareButtons = `
                <div class="share-buttons">
                    <span class="share-label">Share <span class="vh-share-el">0</span></span>
                    <button class="share-btn share-fb" data-platform="facebook" data-url="${escapeHtml(pageUrl)}"><i class="fa-brands fa-facebook-f"></i> Facebook</button>
                    <button class="share-btn share-tw" data-platform="twitter" data-url="${escapeHtml(pageUrl)}"><i class="fa-brands fa-twitter"></i> Twitter</button>
                    <button class="share-btn share-tg" data-platform="telegram" data-url="${escapeHtml(pageUrl)}"><i class="fa-brands fa-telegram"></i> Telegram</button>
                </div>
            `;

            const infoHtml = `
                ${posterHtml}
                <div class="video-info-content">
                    <h1 class="video-title-plain">${escapeHtml(selectedVideo.title || 'Untitled')}</h1>
                    <div class="video-airdate"><i class="fa-regular fa-calendar"></i> ${escapeHtml(airDate)}</div>
                    <div class="genre-tags-container">${genresHtml}</div>
                    <hr class="info-separator">
                    ${rating}
                    <hr class="info-separator">
                    ${sinopsis}
                    <div class="video-details">
                        <div class="detail-row"><span class="detail-label">Original</span><span class="detail-value">${escapeHtml(selectedVideo.title || '-')}</span></div>
                        <div class="detail-row"><span class="detail-label">First air date</span><span class="detail-value date-value">${escapeHtml(airDate)}</span></div>
                        <div class="detail-row"><span class="detail-label">Last air date</span><span class="detail-value date-value">${escapeHtml(lastAirDate)}</span></div>
                        <div class="detail-row"><span class="detail-label">Episodes</span><span class="detail-value">${escapeHtml(selectedVideo.episode || '-')}</span></div>
                        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value status-value">${escapeHtml(selectedVideo.Status || '-')}</span></div>
                    </div>
                    ${shareButtons}
                </div>
            `;

            const infoHtml2 = `
                ${posterHtml}
                <div class="video-info-content">
                    <h1 class="video-title-plain">${escapeHtml(selectedVideo.title || 'Untitled')}</h1>
                    <div class="video-airdate"><i class="fa-regular fa-calendar"></i> ${escapeHtml(airDate)}</div>
                    <div class="genre-tags-container">${genresHtml}</div>
                    <hr class="info-separator">
                    ${rating}
                    <div class="video-details">
                        <div class="detail-row"><span class="detail-label">Studio</span><span class="detail-value">${studiosHtml}</span></div>
                    </div>
                    ${shareButtons}
                </div>
            `;

            infoContainers.forEach((container, idx) => {
                container.innerHTML = (idx === 1) ? infoHtml2 : infoHtml;
            });

            infoContainers.forEach(container => {
                container.querySelectorAll('.detail-value.status-value').forEach(el => {
                    const s = (el.textContent || "").trim().toLowerCase();
                    if (s.includes('complete') || s.includes('selesai') || s.includes('lengkap')) {
                        el.classList.add('status-complete');
                    } else if (s.includes('ongoing') || s.includes('berjalan')) {
                        el.classList.add('status-ongoing');
                    }
                });
            });

            if (typeof window.VH_hitVideoPage === 'function') window.VH_hitVideoPage(selectedVideo.title);
            if (typeof window.VH_fillVideoStats === 'function') window.VH_fillVideoStats(selectedVideo.title);

            document.querySelectorAll('.share-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const platform = btn.getAttribute('data-platform');
                    const url = btn.getAttribute('data-url');
                    const title = selectedVideo.title || '';
                    const encUrl = encodeURIComponent(url);
                    const encTitle = encodeURIComponent(title);
                    let shareUrl = '';
                    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
                    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`;
                    if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${encUrl}&text=${encTitle}`;

                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(url).catch(() => {});
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = url;
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy'); } catch (e) {}
                        document.body.removeChild(ta);
                    }
                    // hit dulu (keepalive) baru buka popup biar tidak ke-cancel
                    if (typeof window.VH_hitShare === 'function' && title) {
                        try{ window.VH_hitShare(title); }catch(e){ console.warn('hitShare err',e); }
                    } else {
                        console.warn('[VH] hitShare tidak ada/title kosong', title);
                    }
                    window.open(shareUrl, '_blank');
                });
            });

            document.querySelectorAll('.genre-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    const genre = tag.getAttribute('data-genre');
                    if (genre) window.location.href = `../genre.html?genre=${encodeURIComponent(genre)}`;
                });
            });

            document.querySelectorAll('.studio-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    const studio = tag.getAttribute('data-studio');
                    if (studio) window.location.href = `../genre.html?genre=${encodeURIComponent(studio)}`;
                });
            });
        }
        
        // ==================== NEW UPDATE (SELALU FRESH, TIDAK PAKAI CACHE) ====================
        const sortedByDate = [...allVideos].sort((a, b) => new Date(b.date) - new Date(a.date));
        let newUpdates = sortedByDate.slice(0, 16);
        
        if (selectedVideo) {
            newUpdates = newUpdates.filter(video => video.title !== selectedVideo.title);
            
            if (newUpdates.length < 12 && allVideos.length > newUpdates.length) {
                const additional = allVideos.filter(v => 
                    v.title !== selectedVideo.title && 
                    !newUpdates.some(existing => existing.title === v.title)
                ).slice(0, 12 - newUpdates.length);
                newUpdates = [...newUpdates, ...additional];
            }
        }
        newUpdates = newUpdates.slice(0, 12);
        
        // ==================== REKOMENDASI (BERDASARKAN GENRE, TANPA CACHE) ====================
        let recommendLinks = [];
        try {
            const stored = JSON.parse(localStorage.getItem('vh_side_recommend_v1') || 'null');
            if (stored && Array.isArray(stored.links)) recommendLinks = stored.links;
        } catch (e) {}
        let recommendations = getGenreRecommendations(allVideos, selectedVideo, 12, 2, recommendLinks);
        window.SIDE_SIMILAR_TITLES = recommendations.map(v => v.title);
        
        renderVideoGrid(recommendations, 'similar-videos-grid', false);
        enableSliderDrag(document.getElementById('similar-videos-grid'));
        
        // ==================== SIDE PANEL (GENRE / YEARS / PRODUCTION) ====================
        renderSidePanel();
        
        const genreDropdown = document.getElementById('genreDropdown');
        if (genreDropdown && allVideos.length > 0) {
            const allGenres = new Set();
            allVideos.forEach(video => {
                if (video.genre) {
                    video.genre.split(',').forEach(g => allGenres.add(g.trim()));
                }
            });
            genreDropdown.innerHTML = Array.from(allGenres).map(genre => 
                `<a href="#" data-genre="${escapeHtml(genre)}">${escapeHtml(genre)}</a>`
            ).join('');
        }
        
    } catch(err) {
        console.error('Gagal load data:', err);
        const videoInfoContainer = document.getElementById('videoInfoContainer');
        if (videoInfoContainer) {
            videoInfoContainer.innerHTML = `
                <h1><i class="fa-solid fa-circle-exclamation"></i> Gagal Memuat Data</h1>
                <div class="genre-tags-container"><span class="genre-label">Error loading data</span></div>
            `;
        }
    }
}

// ==================== SIDE PANEL (GENRE / YEARS / PRODUCTION) ====================
function renderSidePanel() {
    const panel = document.querySelector('.side-panel');
    if (!panel || !allVideos || allVideos.length === 0) return;
    
    const styleId = 'side-panel-style';
    if (!document.getElementById(styleId)) {
        const st = document.createElement('style');
        st.id = styleId;
        st.textContent = `
            .side-tabs {
                display: flex;
                border-bottom: 2px solid #a200f9;
            }
            .side-tab {
                flex: 1;
                background: none;
                border: none;
                color: #999;
                padding: 10px 4px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                cursor: pointer;
                transition: all 0.2s;
                letter-spacing: 0.5px;
            }
            .side-tab:hover { color: #fff; background: #1c1c1c; }
            .side-tab.active { color: #fff; background: #a200f9; }
            .side-block { padding: 12px; border-bottom: 1px solid #333; }
            .side-block:last-child { border-bottom: none; }
            .side-block-title {
                color: #a200f9;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-bottom: 10px;
                border-bottom: 2px solid #a200f9;
                padding-bottom: 6px;
            }
            .side-items { display: flex; flex-direction: column; gap: 2px; max-height: 320px; overflow-y: auto; }
            .side-items::-webkit-scrollbar { width: 4px; }
            .side-items::-webkit-scrollbar-thumb { background: #a200f9; border-radius: 4px; }
            .side-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #ccc;
                padding: 6px 8px;
                border-radius: 4px;
                font-size: 13px;
                text-decoration: none;
                transition: all 0.2s;
            }
            .side-item:hover { background: #a200f9; color: #fff; padding-left: 12px; }
            .side-item:hover .side-count { color: #fff6f6; }
            .side-item:hover .side-icon { color: #fffeff; }
            .side-icon { color: #a200f9; font-size: 12px; margin-right: 6px; flex-shrink: 0; }
            .side-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .side-count { color: #a200f9; font-size: 12px; margin-left: 8px; flex-shrink: 0; }
            .side-empty { color: #666; font-size: 13px; }
            .side-recommend-title {
                color: #a200f9;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-bottom: 10px;
                border-bottom: 2px solid #a200f9;
                padding-bottom: 6px;
            }
            .side-recommend-items { display: flex; flex-direction: column; gap: 8px; max-height: 500px; overflow-y: auto; }
            .side-recommend-items::-webkit-scrollbar { width: 4px; }
            .side-recommend-items::-webkit-scrollbar-thumb { background: #a200f9; border-radius: 4px; }
            .side-recommend-item {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                padding: 4px;
                border-radius: 4px;
                text-decoration: none;
                transition: all 0.2s;
                background: #1a1a1a;
                border: 1px solid #333;
            }
            .side-recommend-item:hover { border-color: #a200f9; background: #222; }
            .side-recommend-thumb-wrap {
                position: relative;
                width: 280px;
                height: 130px;
                border-radius: 3px;
                overflow: hidden;
                flex-shrink: 0;
                background: #111;
            }
            .side-recommend-thumb {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: top;
                display: block;
            }
            .side-recommend-overlay {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                padding: 6px;
                background: linear-gradient(transparent, rgba(0,0,0,0.85));
            }
            .side-recommend-name {
                color: #fff;
                font-size: 12px;
                line-height: 1.4;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            .side-recommend-item:hover .side-recommend-name { color: #fff; }
        `;
        document.head.appendChild(st);
    }
    
    const genreMap = new Map();
    const studioMap = new Map();
    const yearMap = new Map();
    
    allVideos.forEach(video => {
        if (video.genre) {
            video.genre.split(',').map(g => g.trim()).filter(Boolean).forEach(g => {
                genreMap.set(g, (genreMap.get(g) || 0) + 1);
            });
        }
        if (video.studio) {
            video.studio.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                if (s.toLowerCase() !== "n/a") {
                    studioMap.set(s, (studioMap.get(s) || 0) + 1);
                }
            });
        }
        const year = (video['First air date'] || video.date || "").toString().slice(-4);
        if (year && year.length === 4) {
            yearMap.set(year, (yearMap.get(year) || 0) + 1);
        }
    });
    
    const buildList = (title, map, block, isYear = false) => {
        const items = Array.from(map.entries())
            .sort((a, b) => isYear ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0]))
            .map(([name, count]) => `
                <a class="side-item" data-filter="${escapeHtml(name)}" href="../genre.html?genre=${encodeURIComponent(name)}">
                    <span class="side-icon"><i class="fa-solid fa-caret-right"></i></span><span class="side-name">${escapeHtml(name)}</span><span class="side-count">${count}</span>
                </a>
            `).join('');
        return `
            <div class="side-block" data-block="${block}" style="display:${block === 'genre' ? 'block' : 'none'}">
                <div class="side-items">${items || '<div class="side-empty">Kosong</div>'}</div>
            </div>
        `;
    };
    
    panel.innerHTML = `
        <div class="side-tabs">
            <button class="side-tab active" data-tab="genre">Genre</button>
            <button class="side-tab" data-tab="years">Years</button>
            <button class="side-tab" data-tab="production">Production</button>
        </div>
        ${buildList('Genre', genreMap, 'genre')}
        ${buildList('Years', yearMap, 'years', true)}
        ${buildList('Production', studioMap, 'production')}
        <div class="side-block">
            <div class="side-recommend-title">Recommend</div>
            <div class="side-recommend-items">${renderSideRecommend()}</div>
        </div>
    `;
    
    panel.querySelectorAll('.side-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            panel.querySelectorAll('.side-block').forEach(b => b.style.display = 'none');
            const target = panel.querySelector(`.side-block[data-block="${tab.dataset.tab}"]`);
            if (target) target.style.display = 'block';
        });
    });
}

// ==================== SIDE PANEL RECOMMEND ====================
function renderSideRecommend(count = 6) {
    if (!allVideos || allVideos.length === 0) return '<div class="side-empty">Kosong</div>';
    
    const REC_KEY = 'vh_side_recommend_v1';
    const DAY_MS = 24 * 60 * 60 * 1000;
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(REC_KEY) || 'null'); } catch (e) { stored = null; }
    
    let recommended = [];
    const now = Date.now();
    if (stored && stored.ts && (now - stored.ts) < DAY_MS && Array.isArray(stored.links) && stored.links.length > 0) {
        recommended = stored.links
            .map(link => allVideos.find(v => v.link === link))
            .filter(Boolean);
    }
    
    if (recommended.length === 0) {
        let pool = allVideos.slice();
        if (window.SELECTED_VIDEO_TITLE) {
            pool = pool.filter(v => !titleMatches(v.title, window.SELECTED_VIDEO_TITLE));
        }
        if (window.SIDE_SIMILAR_TITLES && window.SIDE_SIMILAR_TITLES.length > 0) {
            pool = pool.filter(v => !window.SIDE_SIMILAR_TITLES.includes(v.title));
        }
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        recommended = pool.slice(0, count);
        if (recommended.length > 0) {
            try {
                localStorage.setItem(REC_KEY, JSON.stringify({ ts: now, links: recommended.map(v => v.link) }));
            } catch (e) {}
        }
    }
    
    if (recommended.length === 0) {
        recommended = allVideos.slice(0, count);
    }
    
    return recommended.map(v => {
        const img = (v.image && v.image.trim() !== '')
            ? `<img class="side-recommend-thumb" src="${escapeHtml(v.image)}" alt="" onerror="this.style.display='none'">`
            : '<div class="side-recommend-thumb"></div>';
        return `
            <a class="side-recommend-item" href="${encodeURIComponent(v.link)}">
                <div class="side-recommend-thumb-wrap">
                    ${img}
                    <div class="side-recommend-overlay"><span class="side-recommend-name">${escapeHtml(v.title)}</span></div>
                </div>
            </a>
        `;
    }).join('');
}

// ==================== START ====================
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM ready, memulai aplikasi...");
    loadData();
});
