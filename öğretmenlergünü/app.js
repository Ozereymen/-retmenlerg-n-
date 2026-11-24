const quotes = {
  female: [
    "Bir çocuğun kalbine dokunan öğretmen, geleceğe açan en güzel çiçektir.",
    "Bilginizle büyütür, şefkatinizle güçlendirirsiniz. İyi ki öğretmenimizsiniz.",
    "Ektiğiniz umut tohumları, yarınların en güzel bahçelerinde açacak.",
    "Bir gülüşünüz, bir cesaretiniz, bir sözünüz… Öğrencinizin dünyasını değiştirebilir."
  ],
  male: [
    "Bir öğretmenin yaktığı ışık, öğrencisinin yolunu ömür boyu aydınlatır.",
    "Bilginizle yol gösterir, emeğinizle geleceği şekillendirirsiniz.",
    "Her öğrencide bir ihtimal gören öğretmen, dünyayı değiştirmeye başlar.",
    "Sabırla öğrettiğiniz her şey, öğrencilerinizin hayatında güzel bir iz bırakır."
  ]
};

const form = document.querySelector("#gift-form");
const welcome = document.querySelector("#welcome");
const giftView = document.querySelector("#gift-view");
const backButton = document.querySelector("#back-button");
const finishButton = document.querySelector("#finish-button");
const returnButton = document.querySelector("#return-button");
const finalMessage = document.querySelector("#final-message");
const themeColor = document.querySelector('meta[name="theme-color"]');
const largeTextToggle = document.querySelector("#large-text");
const highContrastToggle = document.querySelector("#high-contrast");
const largeTapTargetsToggle = document.querySelector("#large-tap-targets");
const flowerBurst = document.querySelector("#flower-burst");
const floatingQuotes = document.querySelector("#floating-quotes");

let activeQuotes = [];
let floatingQuoteIndex = 0;
let selectedGender = "";
let audioContext;
let flowerBurstTimeout;
let floatingQuoteTimer;

const burstPalettes = {
  female: ["#ec6b9b", "#bb75d8", "#f4a1bf", "#9856b8"],
  male: ["#428fbd", "#54b88d", "#8ccde0", "#39876b"]
};

largeTextToggle.addEventListener("change", () => {
  document.body.toggleAttribute("data-large-text", largeTextToggle.checked);
});

highContrastToggle.addEventListener("change", () => {
  document.body.toggleAttribute("data-high-contrast", highContrastToggle.checked);
});

largeTapTargetsToggle.addEventListener("change", () => {
  document.body.toggleAttribute("data-large-tap-targets", largeTapTargetsToggle.checked);
});

function playCelebrationSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext ??= new AudioContextClass();
  audioContext.resume().then(() => {
    const now = audioContext.currentTime;
    const makeNoise = (duration, start, filterType, startFrequency, endFrequency, peak) => {
      const buffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * duration), audioContext.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) {
        samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
      }

      const source = audioContext.createBufferSource();
      const filter = audioContext.createBiquadFilter();
      const gain = audioContext.createGain();
      source.buffer = buffer;
      filter.type = filterType;
      filter.frequency.setValueAtTime(startFrequency, start);
      filter.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter).connect(gain).connect(audioContext.destination);
      source.start(start);
      source.stop(start + duration);
    };

    const fuseDuration = 1.15;
    makeNoise(fuseDuration, now, "bandpass", 420, 5200, 0.08);

    const whistle = audioContext.createOscillator();
    const whistleVolume = audioContext.createGain();
    whistle.type = "sine";
    whistle.frequency.setValueAtTime(520, now);
    whistle.frequency.exponentialRampToValueAtTime(1450, now + 0.82);
    whistleVolume.gain.setValueAtTime(0.0001, now);
    whistleVolume.gain.exponentialRampToValueAtTime(0.018, now + 0.28);
    whistleVolume.gain.exponentialRampToValueAtTime(0.0001, now + fuseDuration);
    whistle.connect(whistleVolume).connect(audioContext.destination);
    whistle.start(now);
    whistle.stop(now + fuseDuration);

    const burstTime = now + fuseDuration;
    makeNoise(0.42, burstTime, "lowpass", 3800, 240, 0.11);
    const pop = audioContext.createOscillator();
    const popVolume = audioContext.createGain();
    pop.type = "triangle";
    pop.frequency.setValueAtTime(190, burstTime);
    pop.frequency.exponentialRampToValueAtTime(42, burstTime + 0.22);
    popVolume.gain.setValueAtTime(0.0001, burstTime);
    popVolume.gain.exponentialRampToValueAtTime(0.16, burstTime + 0.012);
    popVolume.gain.exponentialRampToValueAtTime(0.0001, burstTime + 0.38);
    pop.connect(popVolume).connect(audioContext.destination);
    pop.start(burstTime);
    pop.stop(burstTime + 0.4);
  }).catch((error) => {
    console.error("Celebration sound could not be played.", error);
  });
}

function makeFlower(color) {
  const flower = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  flower.setAttribute("viewBox", "0 0 48 48");
  flower.setAttribute("aria-hidden", "true");
  flower.classList.add("flower-particle__art");

  for (let index = 0; index < 6; index += 1) {
    const petal = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    petal.setAttribute("cx", "24");
    petal.setAttribute("cy", "13");
    petal.setAttribute("rx", "6.5");
    petal.setAttribute("ry", "10");
    petal.setAttribute("fill", color);
    petal.setAttribute("transform", `rotate(${index * 60} 24 24)`);
    flower.append(petal);
  }

  const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  center.setAttribute("cx", "24");
  center.setAttribute("cy", "24");
  center.setAttribute("r", "5");
  center.setAttribute("fill", "#ffd66b");
  flower.append(center);
  return flower;
}

function makePaintSplatter(color) {
  const splatter = document.createElement("span");
  const points = [];
  const tips = 12;

  for (let index = 0; index < tips * 2; index += 1) {
    const angle = (Math.PI * 2 * index) / (tips * 2);
    const radius = index % 2 === 0 ? 11 + Math.random() * 8 : 5 + Math.random() * 4;
    points.push(`${24 + Math.cos(angle) * radius},${24 + Math.sin(angle) * radius}`);
  }

  splatter.className = "paint-splatter";
  splatter.style.setProperty("--paint-color", color);
  splatter.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><polygon points="${points.join(" ")}" fill="${color}"/><circle cx="7" cy="8" r="3" fill="${color}"/><circle cx="41" cy="11" r="2" fill="${color}"/><circle cx="10" cy="40" r="2" fill="${color}"/></svg>`;
  return splatter;
}

function showFlowerBurst() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  window.clearTimeout(flowerBurstTimeout);
  const palette = burstPalettes[selectedGender];
  const fragment = document.createDocumentFragment();
  const flowerCount = 18;
  const splatterCount = 42;

  for (let index = 0; index < flowerCount + splatterCount; index += 1) {
    const isFlower = index < flowerCount;
    const color = palette[Math.floor(Math.random() * palette.length)];
    const particle = isFlower ? document.createElement("span") : makePaintSplatter(color);
    const angle = Math.random() * Math.PI * 2;
    const distance = (isFlower ? 110 : 75) + Math.random() * Math.min(window.innerWidth * 0.48, 320);
    const spin = Math.round(Math.random() * 300 - 150);
    particle.classList.add(isFlower ? "flower-particle" : "burst-particle");
    particle.style.setProperty("--burst-x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--burst-y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--spin", `${spin}deg`);
    particle.style.setProperty("--delay", `${Math.random() * 75}ms`);
    if (isFlower) particle.append(makeFlower(color));
    fragment.append(particle);
  }

  flowerBurst.replaceChildren(fragment);
  flowerBurstTimeout = window.setTimeout(() => flowerBurst.replaceChildren(), 2100);
}

function showFloatingQuote() {
  const message = document.createElement("div");
  const flower = document.createElement("span");
  const text = document.createElement("span");
  const positions = ["top-left", "top-right", "middle-left", "middle-right", "lower-left", "lower-right"];
  const palette = burstPalettes[selectedGender];
  const color = palette[Math.floor(Math.random() * palette.length)];

  message.className = `floating-quote floating-quote--${positions[Math.floor(Math.random() * positions.length)]}`;
  flower.className = "floating-quote__flower";
  flower.append(makeFlower(color));
  text.textContent = activeQuotes[floatingQuoteIndex];
  floatingQuoteIndex = (floatingQuoteIndex + 1) % activeQuotes.length;
  message.append(flower, text);
  floatingQuotes.append(message);
  window.setTimeout(() => message.remove(), 5000);
}

function startAutomaticQuotes() {
  floatingQuoteIndex = 0;
  showFloatingQuote();
  floatingQuoteTimer = window.setInterval(showFloatingQuote, 1400);
}

function stopAutomaticQuotes() {
  window.clearInterval(floatingQuoteTimer);
  floatingQuotes.replaceChildren();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const selection = new FormData(form).get("gender");

  if (selection !== "female" && selection !== "male") {
    form.querySelector('input[name="gender"]').focus();
    return;
  }

  selectedGender = selection;
  activeQuotes = quotes[selectedGender];
  stopAutomaticQuotes();
  finalMessage.hidden = true;
  finishButton.hidden = false;
  finishButton.setAttribute("aria-expanded", "false");

  document.body.dataset.theme = selectedGender;
  document.body.dataset.giftOpen = "";
  themeColor.content = "#ffffff";
  welcome.hidden = true;
  giftView.hidden = false;
  startAutomaticQuotes();
  playCelebrationSound();
  showFlowerBurst();
  window.scrollTo({ top: 0, behavior: "smooth" });
  backButton.focus();
});

finishButton.addEventListener("click", () => {
  stopAutomaticQuotes();
  finalMessage.hidden = false;
  finishButton.setAttribute("aria-expanded", "true");
  finishButton.hidden = true;
  finalMessage.scrollIntoView({ behavior: "smooth", block: "center" });
});

function returnToFirstPage() {
  window.clearTimeout(flowerBurstTimeout);
  stopAutomaticQuotes();
  flowerBurst.replaceChildren();
  finalMessage.hidden = true;
  finishButton.hidden = false;
  finishButton.setAttribute("aria-expanded", "false");
  giftView.hidden = true;
  welcome.hidden = false;
  document.body.removeAttribute("data-theme");
  document.body.removeAttribute("data-gift-open");
  themeColor.content = "#fff6e8";
  form.querySelector(`input[name="gender"][value="${selectedGender}"]`).focus();
}

backButton.addEventListener("click", returnToFirstPage);
returnButton.addEventListener("click", returnToFirstPage);
