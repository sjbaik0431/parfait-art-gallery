'use strict';
// === PARFAIT CYBERPUNK MUSIC ENGINE ===

(function () {
  let ctx = null;
  let analyser = null;
  let compressor = null;
  let masterGain = null;
  let reverb = null;

  // Active node references for pause/cleanup
  let bassSources = [];
  let arpTimeout = null;
  let kickTimeout = null;
  let hatTimeout = null;
  let padOscillators = [];
  let arpIndex = 0;

  let _isPlaying = false;

  // ── AudioContext 초기화 ──────────────────────────────────────────
  function initContext() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();

    // Analyser
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;

    // Compressor
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // MasterGain
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;

    // Chain: analyser → compressor → masterGain → destination
    analyser.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Reverb
    reverb = makeReverb(ctx, 2, 2);
    reverb.connect(analyser);
  }

  // ── IR 리버브 생성 ───────────────────────────────────────────────
  function makeReverb(audioCtx, duration, decay) {
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioCtx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const channel = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }

    const convolver = audioCtx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  // ── 드라이/웨트 믹서 (reverb send) ──────────────────────────────
  function connectWithReverb(sourceNode, dryGainVal, wetGainVal) {
    const dryGain = ctx.createGain();
    dryGain.gain.value = dryGainVal;

    const wetGain = ctx.createGain();
    wetGain.gain.value = wetGainVal;

    sourceNode.connect(dryGain);
    dryGain.connect(analyser);

    sourceNode.connect(wetGain);
    wetGain.connect(reverb);

    return { dryGain, wetGain };
  }

  // ── Sub-bass pulse ───────────────────────────────────────────────
  function startSubBass() {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 40;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 80;

    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.3;

    // LFO → bassGain.gain
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.2;

    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);

    osc.connect(lpf);
    lpf.connect(bassGain);

    connectWithReverb(bassGain, 0.8, 0.2);

    osc.start();
    lfo.start();

    bassSources.push(osc, lfo);
  }

  function stopSubBass() {
    bassSources.forEach(function (s) {
      try { s.stop(); } catch (e) { /* already stopped */ }
    });
    bassSources = [];
  }

  // ── Synth Arp ────────────────────────────────────────────────────
  const ARP_NOTES = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13];
  const ARP_PATTERN = [0, 2, 4, 3, 1, 4, 2, 0];
  const SIXTEENTH = 60 / 120 / 4; // 0.125s

  function scheduleArp(startTime) {
    if (!_isPlaying) return;

    const freq = ARP_NOTES[ARP_PATTERN[arpIndex % ARP_PATTERN.length]];
    arpIndex++;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
    env.gain.setValueAtTime(0.18, startTime + 0.01 + 0.08);
    env.gain.linearRampToValueAtTime(0, startTime + 0.01 + 0.08 + 0.04);

    osc.connect(env);
    connectWithReverb(env, 0.6, 0.4);

    osc.start(startTime);
    osc.stop(startTime + 0.01 + 0.08 + 0.05);

    const now = ctx.currentTime;
    const nextTime = startTime + SIXTEENTH;
    const delay = Math.max(0, (nextTime - now - 0.05) * 1000);

    arpTimeout = setTimeout(function () {
      scheduleArp(nextTime);
    }, delay);
  }

  function startArp() {
    arpIndex = 0;
    scheduleArp(ctx.currentTime + 0.05);
  }

  function stopArp() {
    clearTimeout(arpTimeout);
    arpTimeout = null;
  }

  // ── Ambient Pad ──────────────────────────────────────────────────
  const PAD_FREQS = [65.41, 98.00, 155.56];

  function startAmbientPad() {
    PAD_FREQS.forEach(function (freq) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const padGain = ctx.createGain();
      padGain.gain.value = 0.04;

      // Detune LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 5;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);

      osc.connect(padGain);
      connectWithReverb(padGain, 0.3, 0.7);

      osc.start();
      lfo.start();

      padOscillators.push(osc, lfo);
    });
  }

  function stopAmbientPad() {
    padOscillators.forEach(function (s) {
      try { s.stop(); } catch (e) { /* already stopped */ }
    });
    padOscillators = [];
  }

  // ── Kick drum ────────────────────────────────────────────────────
  const KICK_INTERVAL = 60 / 120 / 2; // 0.25s

  function scheduleKick(time) {
    if (!_isPlaying) return;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.setTargetAtTime(20, time, 0.05);

    const kickGain = ctx.createGain();
    kickGain.gain.setValueAtTime(0.8, time);
    kickGain.gain.setTargetAtTime(0, time, 0.1);

    osc.connect(kickGain);
    kickGain.connect(analyser);

    osc.start(time);
    osc.stop(time + 0.4);

    const now = ctx.currentTime;
    const nextTime = time + KICK_INTERVAL;
    const delay = Math.max(0, (nextTime - now - 0.05) * 1000);

    kickTimeout = setTimeout(function () {
      scheduleKick(nextTime);
    }, delay);
  }

  function startKick() {
    scheduleKick(ctx.currentTime + 0.05);
  }

  function stopKick() {
    clearTimeout(kickTimeout);
    kickTimeout = null;
  }

  // ── Hi-hat ───────────────────────────────────────────────────────
  const HAT_INTERVAL = 60 / 120 / 4; // 0.125s

  function makeWhiteNoise(audioCtx, durationSec) {
    const bufferSize = audioCtx.sampleRate * durationSec;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  let noiseBuffer = null;

  function scheduleHihat(time) {
    if (!_isPlaying) return;

    if (!noiseBuffer) {
      noiseBuffer = makeWhiteNoise(ctx, 2);
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = false;

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 8000;

    const hatGain = ctx.createGain();
    hatGain.gain.setValueAtTime(0.1, time);
    hatGain.gain.setTargetAtTime(0, time, 0.04);

    source.connect(hpf);
    hpf.connect(hatGain);
    hatGain.connect(analyser);

    source.start(time);
    source.stop(time + 0.15);

    const now = ctx.currentTime;
    const nextTime = time + HAT_INTERVAL;
    const delay = Math.max(0, (nextTime - now - 0.05) * 1000);

    hatTimeout = setTimeout(function () {
      scheduleHihat(nextTime);
    }, delay);
  }

  function startHihat() {
    scheduleHihat(ctx.currentTime + 0.05);
  }

  function stopHihat() {
    clearTimeout(hatTimeout);
    hatTimeout = null;
  }

  // ── 공개 API ────────────────────────────────────────────────────
  // [FIX MED] ctx.resume() 보장 — suspended 상태 브라우저 autoplay 정책 대응
  function play() {
    initContext();

    ctx.resume().then(function () {
      if (_isPlaying) return;
      _isPlaying = true;

      startSubBass();
      startArp();
      startAmbientPad();
      startKick();
      startHihat();
    });
  }

  // [FIX MED] pause 시 padOscillators, arpTimeout, kickTimeout, hatTimeout 전량 명시적 정리
  function pause() {
    if (!_isPlaying) return;
    _isPlaying = false;

    stopArp();
    stopKick();
    stopHihat();
    stopSubBass();
    stopAmbientPad();
  }

  // [FIX MED] { once: true } 제거 — 재생/정지 반복 후 비주얼라이저 재연결 보장은
  // drawVisualizer 호출 시점을 toggle()에서 직접 관리하도록 app.js 쪽에서 처리.
  // toggle() 자체는 단순 play/pause 위임.
  function toggle() {
    if (_isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function setVolume(v) {
    if (!masterGain) {
      initContext();
    }
    masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  function getAnalyser() {
    if (!analyser) {
      initContext();
    }
    return analyser;
  }

  // ── 비주얼라이저 ─────────────────────────────────────────────────
  // [FIX MED] animId를 외부에서 관리할 수 있도록 반환값 제공.
  // app.js에서 { once: true } 없이 toggle 버튼 클릭마다 isPlaying 여부로
  // drawVisualizer 호출을 조건 분기하면 중첩 루프 없이 재사용 가능.
  function drawVisualizer(canvas) {
    const an = getAnalyser();
    const bufferLength = an.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx2d = canvas.getContext('2d');
    let animId = null;

    function draw() {
      animId = requestAnimationFrame(draw);

      an.getByteFrequencyData(dataArray);

      const W = canvas.width;
      const H = canvas.height;

      ctx2d.clearRect(0, 0, W, H);

      const barWidth = (W / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * H;

        const gradient = ctx2d.createLinearGradient(x, H - barHeight, x, H);
        gradient.addColorStop(0, '#00CED1');
        gradient.addColorStop(0.5, '#7B2FBE');
        gradient.addColorStop(1, '#FF006E');

        ctx2d.fillStyle = gradient;
        ctx2d.fillRect(x, H - barHeight, barWidth - 1, barHeight);

        x += barWidth;
        if (x > W) break;
      }
    }

    draw();

    // 외부에서 cancelAnimationFrame(animId) 호출 가능하도록 getter 반환
    return {
      stop: function () {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      }
    };
  }

  // ── 전역 노출 ────────────────────────────────────────────────────
  // [FIX LOW] window.parfaitMusic을 music.js 로드 완료 시점에 즉시 노출.
  // HTML에서 music.js를 app.js 앞에 배치할 것.
  window.parfaitMusic = {
    play: play,
    pause: pause,
    toggle: toggle,
    get isPlaying() { return _isPlaying; },
    setVolume: setVolume,
    getAnalyser: getAnalyser,
    drawVisualizer: drawVisualizer
  };

}());