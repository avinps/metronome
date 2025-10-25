# Metronome BPM Detector

A web-based **Metronome app** that can **analyze an uploaded music file**, detect its **tempo (BPM)** from the first few beats, and then **play both the metronome and the music together** in sync — complete with a visual beat indicator and progress tracking.

## Features

- Upload any music file (MP3, WAV, etc.)
- Automatically detects BPM from the **first four beats**
- Start/Stop synchronized **metronome and music playback**
- Large visual **beat display** with flashing color
- Real-time **progress bar** and elapsed/total time display
- Highlights beat **1** with a green flash for rhythm guidance

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Web Audio API)
- **Hosting:** GitHub Pages
- **Version Control:** Git & GitHub

## How It Works

1. Upload a music file that includes **4 beats before the actual song starts**.
2. The app analyzes the **first four beats** to estimate the **tempo (BPM)**.
3. Click **"Start Metronome"** to:
   - Play the metronome and music together.
   - Display beat counts (1–4) on a large box.
   - Highlight the first beat in green.
4. Progress bar and time display track playback in real-time.

## Future Possible Enhancements

- Adjustable tempo and beat subdivisions  
- Option to generate metronome sound only (without music)  
- Visual waveform preview  
- Optional backend using Python (for advanced BPM analysis)  
- Convert to mobile and desktop app (using Capacitor / Tauri)

## Live Demo

**[View on GitHub Pages](https://avinps.github.io/metronome/)**

## Contributing

Contributions, issues, and feature requests are welcome!
Feel free to fork this repo and submit a pull request.

## License

This project is open source and available under the MIT License.

