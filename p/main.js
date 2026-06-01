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
    
    console.log('Membuat video player untuk ID:', videoIds);
    container.innerHTML = '';
    
    videoIds.forEach((videoId, index) => {
        const episodeNumber = (index + 1).toString().padStart(2, '0');
        const embedUrl = `https://abyssplayer.com/${videoId}`;
        
        container.innerHTML += `
            <div class="episode-container">
                <div class="ep-label"><i class="fa-solid fa-play"></i> EPISODE ${episodeNumber}</div>
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
            </div>
        `;
    });
    
    console.log('Video player selesai, jumlah episode:', videoIds.length);
}

// ==================== KONSTANTA ====================
const DATA_URL = "https://allyoulike69.github.io/alyoulikevideo/p/daftar.json";
const BASE_URL = "https://allyoulike69.github.io/alyoulikevideo/p/";
const HOME_URL = "https://allyoulike69.github.io/alyoulikevideo/";
const COMIC_URL = "https://allyoulikecomic.neocities.org/";
const VIDEO34_URL = "https://www.google.com";
const SEARCH_PAGE_URL = "https://allyoulike69.github.io/alyoulikevideo/search";

let allVideos = [];

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

// ==================== FUNGSI OTOMATIS AMBIL JUDUL DARI NAMA FILE ====================
function getAutoTitleFromFileName() {
    const fileName = window.location.pathname.split('/').pop();
    let titleFromFileName = fileName.replace('.html', '').replace(/%20/g, ' ').replace(/\+/g, ' ');
    titleFromFileName = decodeURIComponent(titleFromFileName);
    return titleFromFileName;
}

// ==================== FUNGSI REKOMENDASI BERDASARKAN GENRE (BARU, TANPA CACHE) ====================
function getGenreRecommendations(videos, currentVideo, count = 12) {
    // TIDAK PAKAI CACHE, selalu generate baru setiap load
    
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
        return currentGenres.some(g => videoGenres.includes(g));
    });
    
    // Acak urutan video yang sama genre
    for (let i = sameGenreVideos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sameGenreVideos[i], sameGenreVideos[j]] = [sameGenreVideos[j], sameGenreVideos[i]];
    }
    
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
            window.location.href = `https://allyoulikevideo.neocities.org/genre.html?genre=${encodeURIComponent(genre)}`;
            genreDropdown.classList.remove('show');
        }
    });
};

// ==================== LOAD DATA UTAMA ====================
async function loadData() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        allVideos = (data.pages || []).map(item => ({ ...item }));
        
        console.log("Data loaded:", allVideos.length);
        
        if (window.VIDEO_IDS && window.VIDEO_IDS.length > 0) {
            console.log("Memanggil initVideoPlayer dengan IDs:", window.VIDEO_IDS);
            initVideoPlayer('videoArea', window.VIDEO_IDS);
        } else {
            console.error('VIDEO_IDS tidak ditemukan di window!');
            document.getElementById('videoArea').innerHTML = '<div style="color:red;padding:20px;text-align:center">Error: VIDEO_IDS tidak ditemukan</div>';
        }
        
        let selectedVideo = null;
        const urlParams = new URLSearchParams(window.location.search);
        const titleParam = urlParams.get('title') || urlParams.get('v');
        
        // ==================== OTOMATIS AMBIL JUDUL DARI NAMA FILE ====================
        let autoTitle = getAutoTitleFromFileName();
        
        // CEK dari autoTitle (nama file) - PAKAI includes
        if (autoTitle && autoTitle !== '' && autoTitle !== 'index' && allVideos.length > 0) {
            selectedVideo = allVideos.find(video => 
                video.title?.toLowerCase().includes(autoTitle.toLowerCase())
            );
            if (selectedVideo) {
                console.log("Video ditemukan dari nama file (includes):", autoTitle, "→", selectedVideo.title);
            }
        }
        
        // Jika tidak ketemu, cek dari window.CURRENT_TITLE (jika ada)
        if (!selectedVideo && window.CURRENT_TITLE && allVideos.length > 0) {
            selectedVideo = allVideos.find(video => 
                video.title?.toLowerCase().includes(window.CURRENT_TITLE.toLowerCase())
            );
            if (selectedVideo) {
                console.log("Video ditemukan dari window.CURRENT_TITLE (includes):", window.CURRENT_TITLE, "→", selectedVideo.title);
            }
        }
        
        // Jika tidak ketemu, cek dari URL parameter
        if (!selectedVideo && titleParam && allVideos.length > 0) {
            selectedVideo = allVideos.find(video => 
                video.title?.toLowerCase().includes(titleParam.toLowerCase())
            );
            if (selectedVideo) {
                console.log("Video ditemukan dari URL parameter (includes):", titleParam, "→", selectedVideo.title);
            }
        }
        
        // Jika masih tidak ketemu, TAMPILKAN ERROR
        if (!selectedVideo) {
            console.error("VIDEO TIDAK DITEMUKAN! AutoTitle:", autoTitle);
            const videoInfoContainer = document.getElementById('videoInfoContainer');
            if (videoInfoContainer) {
                videoInfoContainer.innerHTML = `
                    <h1><i class="fa-solid fa-circle-exclamation"></i> Video Tidak Ditemukan</h1>
                    <div class="genre-tags-container">
                        <span class="genre-label">Judul "${autoTitle || window.CURRENT_TITLE || titleParam || 'Unknown'}" tidak ada di database</span>
                    </div>
                `;
            }
        }
        
        const videoInfoContainer = document.getElementById('videoInfoContainer');
        if (videoInfoContainer && selectedVideo) {
            let genresHtml = '';
            if (selectedVideo.genre && selectedVideo.genre.trim() !== '') {
                const genreList = selectedVideo.genre.split(',').map(g => g.trim());
                genresHtml = genreList.map(genre => `
                    <div class="genre-tag" data-genre="${escapeHtml(genre)}">
                        <i class="fa-solid fa-tag"></i> ${escapeHtml(genre)}
                    </div>
                `).join('');
            } else {
                genresHtml = '<div style="color:#666">Tidak ada genre tersedia</div>';
            }
            
            document.title = `${selectedVideo.title} - Allyoulike Video`;
            
            videoInfoContainer.innerHTML = `
                <h1><i class="fa-solid fa-play-circle"></i> ${escapeHtml(selectedVideo.title || 'Untitled')}</h1>
                <div class="genre-tags-container">
                    <span class="genre-label"><i class="fa-solid fa-tags"></i> Genre:</span>
                    ${genresHtml}
                </div>
            `;
            
            document.querySelectorAll('.genre-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    const genre = tag.getAttribute('data-genre');
                    window.location.href = `https://allyoulike69.github.io/alyoulikevideo/genre.html?genre=${encodeURIComponent(genre)}`;
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
        let recommendations = getGenreRecommendations(allVideos, selectedVideo, 12);
        
        renderSlider('newUpdateTrack', newUpdates, true);
        renderSlider('recommendTrack', recommendations, false);
        
        setTimeout(() => {
            createSlider('newUpdateTrack', 'newPrevBtn', 'newNextBtn');
            createSlider('recommendTrack', 'recPrevBtn', 'recNextBtn');
        }, 100);
        
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

// ==================== START ====================
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM ready, memulai aplikasi...");
    loadData();
});
