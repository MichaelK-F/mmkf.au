let currentlyPlaying = null;

class AudioClipPlayer extends HTMLElement {
  constructor() {
    super();
    this.audio = new Audio();
    this.start = 0;
    this.end = 0;
    this.remainingEl = null;
    this.interval = null;
  }

  connectedCallback() {
    const src = this.getAttribute("location");
    this.start = parseFloat(this.getAttribute("start"));
    this.end = parseFloat(this.getAttribute("end"));

    this.audio.src = src;
    this.audio.preload = "metadata";

    const playBtn = document.createElement("button");
    playBtn.textContent = "Play";

    const stopBtn = document.createElement("button");
    stopBtn.textContent = "Stop";

    this.remainingEl = document.createElement("span");
    this.remainingEl.style.marginLeft = "8px";
    this.remainingEl.textContent = `(${this.end - this.start}s)`;

    playBtn.onclick = () => this.play();
    stopBtn.onclick = () => this.stop();

    this.audio.addEventListener("timeupdate", () => {
      if (this.audio.currentTime >= this.end) {
        this.stop();
      }
    });

    this.appendChild(playBtn);
    this.appendChild(stopBtn);
    this.appendChild(this.remainingEl);
  }

  play() {
    if (currentlyPlaying && currentlyPlaying !== this) {
      currentlyPlaying.stop();
    }

    currentlyPlaying = this;
    this.audio.currentTime = this.start;
    this.audio.play();

    this.startTimer();
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = this.start;
    this.stopTimer();

    if (currentlyPlaying === this) {
      currentlyPlaying = null;
    }

    this.remainingEl.textContent = `(${this.end - this.start}s)`;
  }

  startTimer() {
    this.stopTimer();

    this.interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil(this.end - this.audio.currentTime)
      );
      this.remainingEl.textContent = `(${remaining}s remaining)`;
    }, 250);
  }

  stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

customElements.define("player", AudioClipPlayer);
