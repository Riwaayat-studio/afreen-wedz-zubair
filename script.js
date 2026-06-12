const royalAudioNode = document.getElementById("royal-audio");
const musicControlBtn = document.getElementById("music-btn");
if (royalAudioNode) { royalAudioNode.volume = 0.45; }

let selectedSide = "Groom Side";
let selectedResponse = "Joyfully Accept";
let totalPersonsCount = 1;
let audioContextInstance = null;

function forceAudioPlay() {
    if (!royalAudioNode) return;
    if (!audioContextInstance) {
        audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextInstance.state === 'suspended') {
        audioContextInstance.resume();
    }
    
    royalAudioNode.play().then(() => {
        if (musicControlBtn) {
            musicControlBtn.style.display = "flex";
            musicControlBtn.classList.add("music-playing");
        }
    }).catch(err => {
        console.log("Audio pipeline auto-play bypass executed.");
        royalAudioNode.muted = false;
        royalAudioNode.play().catch(e => console.log("Audio trigger pending user interaction."));
    });
}

function playScratchSFX() {
    if (!audioContextInstance) return;
    try {
        let size = audioContextInstance.sampleRate * 0.04;
        let buf = audioContextInstance.createBuffer(1, size, audioContextInstance.sampleRate);
        let data = buf.getChannelData(0);
        for (let i = 0; i < size; i++) { data[i] = Math.random() * 2 - 1; }
        let src = audioContextInstance.createBufferSource();
        src.buffer = buf;
        let filter = audioContextInstance.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1150;
        let gain = audioContextInstance.createGain();
        gain.gain.setValueAtTime(0.025, audioContextInstance.currentTime);
        src.connect(filter); filter.connect(gain); gain.connect(audioContextInstance.destination);
        src.start();
    } catch(e){}
}

function playGateSFX() {
    if (!audioContextInstance) return;
    try {
        let freqs = [261.63, 329.63, 392.00, 523.25];
        freqs.forEach((f, i) => {
            let osc = audioContextInstance.createOscillator();
            let gain = audioContextInstance.createGain();
            osc.type = 'triangle';
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0.015, audioContextInstance.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioContextInstance.currentTime + i * 0.08 + 0.45);
            osc.connect(gain); gain.connect(audioContextInstance.destination);
            osc.start(audioContextInstance.currentTime + i * 0.08);
            osc.stop(audioContextInstance.currentTime + i * 0.08 + 0.45);
        });
    } catch(e){}
}

function handleMusicControl() {
    if (!royalAudioNode) return;
    if (royalAudioNode.paused) {
        royalAudioNode.play();
        if (musicControlBtn) musicControlBtn.classList.add("music-playing");
    } else {
        royalAudioNode.pause();
        if (musicControlBtn) musicControlBtn.classList.remove("music-playing");
    }
}

const triggerTapNode = document.getElementById("trigger-tap-node");
if (triggerTapNode) {
    triggerTapNode.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const envelopeGate = document.getElementById("envelope-gate-stage");
        if (envelopeGate) envelopeGate.classList.add("envelope-opened");
        
        const flare = document.getElementById("flare-node");
        if (flare) {
            flare.style.opacity = "1";
            setTimeout(() => { flare.style.opacity = "0"; }, 500);
        }

        forceAudioPlay();
        try { playGateSFX(); } catch(err){}

        setTimeout(() => {
            if (envelopeGate) envelopeGate.style.display = "none";
            const portal = document.getElementById("main-canvas-portal");
            if (portal) {
                portal.style.display = "block";
                setTimeout(() => { 
                    portal.style.opacity = "1"; 
                    portal.style.transform = "scale(1)";
                    setupScratchEngine("nikahCanvas"); 
                    setupScratchEngine("walimahCanvas");
                    startClockEngineLoop();
                }, 100);
            }
        }, 2100);
    });
}

function setupScratchEngine(id) {
    const cvs = document.getElementById(id);
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
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
    const dVal = document.getElementById("d-val");
    const hVal = document.getElementById("h-val");
    const mVal = document.getElementById("m-val");
    const sVal = document.getElementById("s-val");
    
    if (!dVal || !hVal || !mVal || !sVal) return;

    setInterval(() => {
        const diff = target - new Date().getTime();
        dVal.innerText = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        hVal.innerText = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        mVal.innerText = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
        sVal.innerText = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));
    }, 1000);
}

function setSideDataBinder(side) {
    selectedSide = side;
    const optGroom = document.getElementById("opt-groom");
    const optBride = document.getElementById("opt-bride");
    if (optGroom) optGroom.classList.remove("selected-active");
    if (optBride) optBride.classList.remove("selected-active");
    if (side === 'Groom Side' && optGroom) optGroom.classList.add("selected-active");
    if (side === 'Bride Side' && optBride) optBride.classList.add("selected-active");
}

function setResponseBinder(resp) {
    selectedResponse = resp;
    const optAccept = document.getElementById("opt-accept");
    const optDecline = document.getElementById("opt-decline");
    if (optAccept) optAccept.classList.remove("selected-active");
    if (optDecline) optDecline.classList.remove("selected-active");
    if (resp === 'Joyfully Accept' && optAccept) optAccept.classList.add("selected-active");
    if (resp === 'Decline with Regret' && optDecline) optDecline.classList.add("selected-active");
}

function setPersonsBinder(num, elem) {
    totalPersonsCount = num;
    const manualInput = document.getElementById("ins-manual-persons");
    if (manualInput) manualInput.value = "";
    if (elem && elem.parentNode) {
        let row = elem.parentNode.querySelectorAll('.counter-number-node');
        row.forEach(n => n.classList.remove('active-num'));
        elem.classList.add('active-num');
    }
}

const rsvpFormNode = document.getElementById("rsvpFormNode");
if (rsvpFormNode) {
    rsvpFormNode.addEventListener("submit", function(e) {
        e.preventDefault();
        let eventsArr = [];
        const chkNikah = document.getElementById("chk-nikah");
        const chkWalimah = document.getElementById("chk-walimah");
        const insName = document.getElementById("ins-name");
        const insPhone = document.getElementById("ins-phone");
        const insManualPersons = document.getElementById("ins-manual-persons");
        const insMsg = document.getElementById("ins-msg");

        if (chkNikah && chkNikah.checked) eventsArr.push("Nikah Ceremony");
        if (chkWalimah && chkWalimah.checked) eventsArr.push("Walimah Ceremony");
        let finalEvents = eventsArr.length > 0 ? eventsArr.join(" & ") : "None";
        let finalPersons = (insManualPersons && insManualPersons.value) ? insManualPersons.value : totalPersonsCount;

        const pipelinePayload = {
            side: selectedSide,
            guestName: insName ? insName.value : "Not Provided",
            phoneNumber: insPhone ? insPhone.value : "Not Provided",
            rsvpResponse: selectedResponse,
            numberOfPersons: finalPersons,
            attendingFrom: selectedSide,
            attendingFor: finalEvents,
            message: insMsg ? insMsg.value : "No Message"
        };

        const webAppUrl = "https://script.google.com/macros/s/AKfycbxC63dy9puNAcUf-poYMUJgvcwpgCZRCnGXBICCAZQbNmvtRDT7iGZcrFqU1MGh0VIUTw/exec";

        fetch(webAppUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pipelinePayload)
        }).then(() => {
            openModal("JazakAllah Khair! ✨", `Wishes captured into the ${selectedSide} team database sheets!`);
            rsvpFormNode.reset();
        }).catch(err => alert("Pipeline endpoint connection error: " + err));
    });
}

function openModal(title, text) {
    const mHeading = document.getElementById("modal-heading");
    const mText = document.getElementById("modal-text");
    const cModal = document.getElementById("custom-modal");
    if (mHeading) mHeading.innerText = title;
    if (mText) mText.innerText = text;
    if (cModal) cModal.classList.add("active");
}
function closeModal() {
    const cModal = document.getElementById("custom-modal");
    if (cModal) cModal.classList.remove("active");
}

const scrollRevealElements = document.querySelectorAll('.scroll-reveal-node');
if (scrollRevealElements.length > 0) {
    const scrollObserverInstance = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('activated'); });
    }, { threshold: 0.1 });
    scrollRevealElements.forEach(el => scrollObserverInstance.observe(el));
}
