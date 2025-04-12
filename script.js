// Get DOM elements
const fileInput = document.getElementById("audio-upload");
const fileInfo = document.getElementById("file-info");
const bpmOutput = document.getElementById("bpm-output");
const startBtn = document.getElementById("start-metronome");
const flashBox = document.getElementById("flash-box");
const progressBar = document.getElementById("progress-bar");
const timeDisplay = document.getElementById("time-display");

let audioContext;
let audioBuffer;
let musicSource;
let metronomeRunning = false;
let metronomeBPM = 0;
let beatCounter = 1;

let startTimestamp = null;
let duration = 0;

// Handle file upload
fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  fileInfo.textContent = `Loading: ${file.name}`;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  fileInfo.textContent = `Loaded: ${file.name} (${audioBuffer.duration.toFixed(2)}s)`;

  startBtn.disabled = false;
  detectBPM(audioBuffer);
});

// Detect BPM from first 4 beats
function detectBPM(buffer) {
  const rawData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const durationToAnalyze = 10; // 10 seconds
  const samplesToAnalyze = Math.min(rawData.length, durationToAnalyze * sampleRate);
  const chunkSize = 512;
  const threshold = 0.15;

  let energyPeaks = [];

  for (let i = 0; i < samplesToAnalyze; i += chunkSize) {
    let sum = 0;
    for (let j = i; j < i + chunkSize && j < samplesToAnalyze; j++) {
      sum += Math.abs(rawData[j]);
    }

    const energy = sum / chunkSize;
    const time = i / sampleRate;

    if (energy > threshold) {
      if (
        energyPeaks.length === 0 ||
        time - energyPeaks[energyPeaks.length - 1] > 0.1
      ) {
        energyPeaks.push(time);
        console.log(`Detected beat at: ${time.toFixed(3)}s`);
      }
    }

    if (energyPeaks.length >= 4) break;
  }

  if (energyPeaks.length < 4) {
    bpmOutput.textContent = "BPM: Not enough beats detected";
    console.warn("Detected peaks:", energyPeaks);
    return;
  }

  let intervals = [];
  for (let i = 1; i < energyPeaks.length; i++) {
    intervals.push(energyPeaks[i] - energyPeaks[i - 1]);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60 / avgInterval);

  bpmOutput.textContent = `BPM: ${bpm}`;
  startBtn.dataset.bpm = bpm;
  metronomeBPM = bpm;
}

// Start/Stop metronome and music
startBtn.addEventListener("click", () => {
  if (metronomeRunning) {
    stopMetronome();
    return;
  }

  const bpm = parseInt(startBtn.dataset.bpm);
  if (!bpm || !audioBuffer) return;

  const startTime = audioContext.currentTime + 0.1;
  playMusic(startTime);
  metronomeRunning = true;
  startBtn.textContent = "Stop Metronome";
  beatCounter = 1;

  scheduleMetronome(bpm, startTime);
});

// Accurate scheduling using requestAnimationFrame
function scheduleMetronome(bpm, startTime) {
  const interval = 60 / bpm;
  let count = 0;

  function tickScheduler() {
    if (!metronomeRunning) return;

    const currentTime = audioContext.currentTime;
    const nextTickTime = startTime + count * interval;

    if (currentTime >= nextTickTime) {
      playClick();
      flash();
      count++;
    }

    requestAnimationFrame(tickScheduler);
  }

  requestAnimationFrame(tickScheduler);
}

// Play metronome tick sound
function playClick() {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.frequency.value = 1000;
  gain.gain.value = 0.1;

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();
  osc.stop(audioContext.currentTime + 0.05);
}

// Flash on beat 1, show beat number on all
function flash() {
  flashBox.textContent = beatCounter;

  if (beatCounter === 1) {
    flashBox.style.backgroundColor = "green";
    setTimeout(() => {
      flashBox.style.backgroundColor = "transparent";
    }, 100);
  }

  beatCounter++;
  if (beatCounter > 4) beatCounter = 1;
}

// Start music and begin progress tracking
function playMusic(startTime) {
    stopMusic();
  
    musicSource = audioContext.createBufferSource();
    musicSource.buffer = audioBuffer;
    musicSource.connect(audioContext.destination);
    musicSource.start(startTime);
  
    startTimestamp = Date.now(); // record actual start clock time
    duration = audioBuffer.duration;
  
    updateProgress();
  }

// Update progress bar and time
function updateProgress() {
    if (!metronomeRunning) return;
  
    const elapsed = (Date.now() - startTimestamp) / 1000;
    const percent = Math.min(elapsed / duration, 1);
  
    progressBar.value = percent;
  
    const elapsedStr = formatTime(elapsed);
    const totalStr = formatTime(duration);
    timeDisplay.textContent = `${elapsedStr} / ${totalStr}`;
  
    if (elapsed < duration) {
      requestAnimationFrame(updateProgress);
    } else {
      stopMetronome();
    }
  }

// Format seconds to mm:ss
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// Stop everything
function stopMetronome() {
  metronomeRunning = false;
  stopMusic();
  startBtn.textContent = "Start Metronome";
}

// Stop music playback
function stopMusic() {
  if (musicSource) {
    try {
      musicSource.stop();
    } catch (e) {
      // Already stopped
    }
    musicSource.disconnect();
    musicSource = null;
  }
}