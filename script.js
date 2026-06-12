const audio = document.getElementById("royal-audio");
const mBtn = document.getElementById("music-btn");
audio.volume = 0.45; 

let selectedSide = "Groom Side";
let selectedResponse = "Joyfully Accept";
let totalPersonsCount = 1;
let audioCtx = null;

function forceAudioPlay() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    audio.play().then(() => {
        mBtn.style.display = "flex";
        mBtn.classList.add("music-playing");
    }).catch(err => {
        console.log("Local audio pipeline stream bypass required.");
        audio.muted = false;
        audio.play();
    });
}

function playScratchSFX() {
    if (!audioCtx) return;
    try {
        let size = audioCtx.sampleRate * 0.04, buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate), data = buf.getChannelData(0);
        for (let i = 0; i < size; i++) { data[i] = Math.random() * 2 - 1; }
        let src = audioCtx.createBufferSource(); src.buffer = buf;
        let filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1150;
        let gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
        src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); src.start();
    } catch(e){}
}

function playGateSFX() {
    if (!audioCtx) return;
    try {
        let freqs = [261.63, 329.63, 392.00, 523.25];
        freqs.forEach((f, i) => {
            let osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
            osc.type = 'triangle'; osc.frequency.value = f;
            gain.gain.setValueAtTime(0.015, audioCtx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.08 + 0.45);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + i * 0.08); osc.stop(audioCtx.currentTime + i * 0.08 + 0.45);
        });
    } catch(e){}
}

function handleMusicControl() {
    if (audio.paused) { audio.play(); mBtn.classList.add("music-playing"); }
    else { audio.pause(); mBtn.classList.remove("music-playing"); }
}

document.getElementById("trigger-tap-node").addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    document.getElementById("envelope-gate-stage").classList.add("envelope-opened");
    
    const flare = document.getElementById("flare-node");
    flare.style.opacity = "1";
    setTimeout(() => { flare.style.opacity = "0"; }, 500);

    forceAudioPlay();
    try { playGateSFX(); } catch(e){}

    setTimeout(() => {
        document.getElementById("envelope-gate-stage").style.display = "none";
        const portal = document.getElementById("main-canvas-portal");
        portal.style.display = "block";
        setTimeout(() => { 
            portal.style.opacity = "1"; 
            portal.style.transform = "scale(1)";
            setupScratchEngine("nikahCanvas"); 
            setupScratchEngine("walimahCanvas");
            startClockEngineLoop();
        }, 100);
    }, 2100);
});

function setupScratchEngine(id) {
    const cvs = document.getElementById(id); const ctx = cvs.getContext("2d");
    ctx.fillStyle = "#A3863C"; ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = "#FAF6EE"; ctx.font = "bold 11px Montserrat"; ctx.textAlign = "center";
    ctx.fillText("✨ SCRATCH GOLD SHEETS WITH LOVE ✨", cvs.width/2, cvs.height/2 + 5);

    let draw = false; let lastSfx = 0;
    function scratch(x, y) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
        let now = Date.now();
        if (now - lastSfx > 60) { playScratchSFX(); lastSfx = now; }
    }
    cvs.addEventListener("mousedown", (e) => { draw = true; let r = cvs.getBoundingClientRect(); scratch(e.clientX - r.left, e.clientY - r.top); });
    cvs.addEventListener("mousemove", (e) => { if(draw) { let r = cvs.getBoundingClientRect(); scratch(e.clientX - r.left, e.clientY - r.top); } });
    window.addEventListener("mouseup", () => draw = false);
    cvs.addEventListener("touchstart", (e) => { draw = true; let r = cvs.getBoundingClientRect(); let t = e.touches[0]; scratch(t.clientX - r.left, t.clientY - r.top); });
    cvs.addEventListener("touchmove", (e) => { if(draw) { let r = cvs.getBoundingClientRect(); let t = e.touches[0]; scratch(t.clientX - r.left, t.clientY - r.top); e.preventDefault(); } });
    window.addEventListener("touchend", () => draw = false);
}

function startClockEngineLoop() {
    const target = new Date("June 06, 2027 22:00:00").getTime();
    setInterval(() => {
        const diff = target - new Date().getTime();
        document.getElementById("d-val").innerText = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        document.getElementById("h-val").innerText = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        document.getElementById("m-val").innerText = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
        document.getElementById("s-val").innerText = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));
    }, 1000);
}

function setSideDataBinder(side) {
    selectedSide = side;
    document.getElementById("opt-groom").classList.remove("selected-active");
    document.getElementById("opt-bride").classList.remove("selected-active");
    if(side === 'Groom Side') document.getElementById("opt-groom").classList.add("selected-active");
    else document.getElementById("opt-bride").classList.add("selected-active");
}

function setResponseBinder(resp) {
    selectedResponse = resp;
    document.getElementById("opt-accept").classList.remove("selected-active");
    document.getElementById("opt-decline").classList.remove("selected-active");
    if(resp === 'Joyfully Accept') document.getElementById("opt-accept").classList.add("selected-active");
    else document.getElementById("opt-decline").classList.add("selected-active");
}

function setPersonsBinder(num, elem) {
    totalPersonsCount = num;
    document.getElementById("ins-manual-persons").value = "";
    let row = elem.parentNode.querySelectorAll('.counter-number-node');
    row.forEach(n => n.classList.remove('active-num'));
    elem.classList.add('active-num');
}

document.getElementById("rsvpFormNode").addEventListener("submit", function(e) {
    e.preventDefault();
    let eventsArr = [];
    if(document.getElementById("chk-nikah").checked) eventsArr.push("Nikah Ceremony");
    if(document.getElementById("chk-walimah").checked) eventsArr.push("Walimah Ceremony");
    let finalEvents = eventsArr.length > 0 ? eventsArr.join(" & ") : "None";
    let finalPersons = document.getElementById("ins-manual-persons").value ? document.getElementById("ins-manual-persons").value : totalPersonsCount;

    const pipelinePayload = {
        side: selectedSide,
        guestName: document.getElementById("ins-name").value,
        phoneNumber: document.getElementById("ins-phone").value,
        rsvpResponse: selectedResponse,
        numberOfPersons: finalPersons,
        attendingFrom: selectedSide,
        attendingFor: finalEvents,
        message: document.getElementById("ins-msg").value
    };

    // 🌟 100% HARD-LOCKED: Your brand new correct Web App URL embedded perfectly
    const webAppUrl = "https://script.google.com/macros/s/AKfycbwBi719LH0gCYIUf5bwKzLhEYX-8yX68tGOL2akPu1uLyzkf3FJ_NmWYdGQ5rz0Pw_H5g/exec";

    fetch(webAppUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pipelinePayload)
    }).then(() => {
        openModal("JazakAllah Khair! ✨", `Wishes captured into the ${selectedSide} team database sheets!`);
        document.getElementById("rsvpFormNode").reset();
    }).catch(err => alert("Pipeline endpoint connection error: " + err));
});

function openModal(title, text) {
    document.getElementById("modal-heading").innerText = title;
    document.getElementById("modal-text").innerText = text;
    document.getElementById("custom-modal").classList.add("active");
}
function closeModal() { document.getElementById("custom-modal").classList.remove("active"); }

const scrollRevealElements = document.querySelectorAll('.scroll-reveal-node');
const scrollObserverInstance = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('activated'); });
}, { threshold: 0.1 });
scrollRevealElements.forEach(el => scrollObserverInstance.observe(el));
