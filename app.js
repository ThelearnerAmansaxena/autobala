const PLAYLIST_ID = 'PLGxYaH2nXUuWcVQHYuW_uXj3C5neCC0EL';
const $ = (id) => document.getElementById(id);
const el = { time: $('time'), date: $('date'), status: $('status'), statusText: $('statusText'), fare: $('fare'), distance: $('distance'), meterState: $('meterState'), title: $('trackTitle'), artist: $('trackArtist'), progress: $('progress'), elapsed: $('elapsed'), duration: $('duration'), play: $('play'), prev: $('previous'), next: $('next'), volume: $('volume'), flag: $('hireFlag'), tip: $('tip'), modal: $('modal'), finalFare: $('finalFare'), pay: $('pay'), note: $('paymentNote'), close: $('closeModal') };
let player, playerReady = false, playing = false, fare = 24;
const fmt = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function updateClock() {
  const now = new Date();
  el.time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  el.date.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}
function updateRange(input, value) { input.style.setProperty('--progress', `${value}%`); }
function setMeterState(active) {
  playing = active;
  el.play.classList.toggle('playing', active);
  el.play.setAttribute('aria-label', active ? 'Pause music' : 'Play music');
  el.status.classList.toggle('paused', !active);
  el.statusText.textContent = active ? 'ON THE MOVE' : 'METER ON';
  el.meterState.textContent = active ? 'RUNNING' : 'WAITING';
}
function syncTrack() {
  if (!playerReady || !player?.getDuration) return;
  const duration = Number(player.getDuration()) || 0;
  const currentTime = Math.min(Number(player.getCurrentTime()) || 0, duration);
  const video = player.getVideoData?.() || {};
  if (video.title) el.title.textContent = video.title;
  if (video.author) el.artist.textContent = video.author;
  const percent = duration ? currentTime / duration * 100 : 0;
  el.progress.value = percent; updateRange(el.progress, percent);
  el.elapsed.textContent = fmt(currentTime); el.duration.textContent = fmt(duration);
  fare = 24 + currentTime * .24;
  el.fare.textContent = `₹ ${fare.toFixed(2)}`;
  el.distance.textContent = `${(currentTime * .017).toFixed(1)} KM`;
}
function finishRide() {
  setMeterState(false); syncTrack(); el.finalFare.textContent = `₹ ${fare.toFixed(2)}`; el.modal.hidden = false;
}
function togglePlayback() {
  if (!playerReady) { el.artist.textContent = 'Connecting to YouTube…'; return; }
  if (playing) player.pauseVideo(); else player.playVideo();
}
window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player('youtubePlayer', {
    height: '1', width: '1',
    playerVars: { listType: 'playlist', list: PLAYLIST_ID, autoplay: 0, controls: 0, playsinline: 1, rel: 0, enablejsapi: 1, origin: window.location.origin },
    events: {
      onReady: (event) => { playerReady = true; event.target.setVolume(Number(el.volume.value)); syncTrack(); },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING) { setMeterState(true); syncTrack(); }
        if (event.data === YT.PlayerState.PAUSED) setMeterState(false);
        if (event.data === YT.PlayerState.CUED) syncTrack();
        if (event.data === YT.PlayerState.ENDED) { player.stopVideo(); finishRide(); }
      },
      onError: () => { el.artist.textContent = 'This YouTube track is unavailable — try next.'; }
    }
  });
};

el.play.addEventListener('click', togglePlayback);
el.prev.addEventListener('click', () => playerReady && player.previousVideo());
el.next.addEventListener('click', () => playerReady && player.nextVideo());
el.progress.addEventListener('input', (event) => { if (playerReady) player.seekTo((event.target.value / 100) * (player.getDuration() || 0), true); });
el.volume.addEventListener('input', (event) => { updateRange(el.volume, event.target.value); if (playerReady) player.setVolume(Number(event.target.value)); });
el.flag.addEventListener('click', () => el.flag.classList.toggle('flipped'));
el.tip.addEventListener('click', togglePlayback); el.status.addEventListener('click', togglePlayback);
el.close.addEventListener('click', () => { el.modal.hidden = true; });
el.pay.addEventListener('click', () => { el.pay.disabled = true; el.pay.textContent = 'Processing…'; el.note.textContent = 'Connecting to the driver’s very secure QR code.'; setTimeout(() => { el.pay.textContent = 'Payment successful ✓'; el.pay.style.background = '#177b68'; el.note.textContent = 'Bhaiya says: phir milenge. ★'; }, 1200); });
document.addEventListener('keydown', (event) => { if (event.code === 'Space' && !el.modal.hidden) return; if (event.code === 'Space') { event.preventDefault(); togglePlayback(); } if (event.key === 'Escape') el.modal.hidden = true; });
updateClock(); setInterval(updateClock, 1000); setInterval(syncTrack, 500); updateRange(el.volume, el.volume.value);
const apiScript = document.createElement('script'); apiScript.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(apiScript);
