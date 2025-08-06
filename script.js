let audioContext;
let audioBuffer;
let sourceNode;
let bpm = null;
let intervalId;
let beatIndex = 0;

const uploadInput = document.getElementById('audio-upload');
const bpmOutput = document.getElementById('bpm-output');
const startButton = document.getElementById('start-metronome');
const flashBox = document.getElementById('flash-box');
const fileInfo = document.getElementById('file-info');
const progressBar = document.getElementById('progress-bar');
const timeDisplay = document.getElementById('time-display');

uploadInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  fileInfo.textContent = `Loaded file: ${file.name}`;

  const arrayBuffer = await file.arrayBuffer();
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  bpm = estimateBPM(audioBuffer, audioContext.sampleRate);
  bpmOutput.textContent = `BPM: ${bpm}`;
  startButton.disabled = false;
});

startButton.addEventListener('click', () => {
  if (!audioBuffer || !bpm) return;

  // Reset beat
  beatIndex = 0;

  // Play audio
  sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.connect(audioContext.destination);
  sourceNode.start();

  const duration = audioBuffer.duration;
  const startTime = audioContext.currentTime;

  // Update progress
  const progressInterval = setInterval(() => {
    const elapsed = audioContext.currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    progressBar.value = progress;
    timeDisplay.textContent = `${formatTime(elapsed)} / ${formatTime(duration)}`;

    if (progress >= 1) clearInterval(progressInterval);
  }, 100);

  // Start metronome click
  const intervalMs = (60 / bpm) * 1000;
  intervalId = setInterval(() => {
    beatIndex = (beatIndex + 1) % 4;

    flashBeat(beatIndex);

    // Only play click on the first beat of each 4-beat measure
    if (beatIndex === 0) {
      playClick();
    }
  }, intervalMs);
});

function flashBeat(index) {
  flashBox.textContent = index + 1;
  flashBox.style.backgroundColor = 'lightgreen';
  setTimeout(() => {
    flashBox.style.backgroundColor = 'transparent';
  }, 100);
}

function playClick() {
  const click = audioContext.createOscillator();
  const gain = audioContext.createGain();
  click.frequency.value = 1000;
  click.connect(gain);
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
  click.start(audioContext.currentTime);
  click.stop(audioContext.currentTime + 0.1);
}

function formatTime(time) {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function estimateBPM(buffer, sampleRate) {
  const channelData = buffer.getChannelData(0);
  const threshold = 0.2;
  let beats = [];
  let lastBeat = 0;
  const minInterval = sampleRate * 60 / 200; // 200 BPM max

  for (let i = 0; i < channelData.length; i++) {
    if (Math.abs(channelData[i]) > threshold && (i - lastBeat) > minInterval) {
      beats.push(i);
      lastBeat = i;
      if (beats.length >= 4) break;
    }
  }

  if (beats.length < 2) return 0;
  const intervals = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push((beats[i] - beats[i - 1]) / sampleRate);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return Math.round(60 / avgInterval);
}