// videoplayer.js
// Semua logika pemutar video ada di sini

function initVideoPlayer(containerId, videoIds) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container tidak ditemukan:', containerId);
        return;
    }
    
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
        console.error('videoIds harus berupa array yang berisi ID video');
        return;
    }
    
    // Kosongkan container
    container.innerHTML = '';
    
    // Render setiap video episode
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
}