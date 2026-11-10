(() => {
  const $ = (id) => document.getElementById(id);
  const titleScreen = $('titleScreen');
  const startBtn = $('startBtn');
  const continueBtn = $('continueBtn');
  const dialogue = $('dialogue');
  const textEl = $('dialogueText');
  const choicesEl = $('choices');
  const nextBtn = $('nextBtn');
  const affectionBar = $('affectionBar');
  const speakerEl = $('speaker');
  const locationEl = $('location');
  const chapterLabel = $('chapterLabel');
  const toast = $('toast');
  const STORAGE = 'last-train-save-v1';
  let state = { step: 0, connection: 0, choices: [] };
  let audio = null;

  const chapters = [
    ['CHAPTER 01', 'THE UNEXPECTED'],
    ['CHAPTER 02', 'CLOSING TIME'],
    ['CHAPTER 03', 'SMALL CONSTELLATIONS'],
    ['CHAPTER 04', 'THE LAST TRAIN']
  ];
  const scenes = [
    {
      speaker: 'MIKA', location: 'THE LITTLE COMET CAFÉ · 11:47 PM',
      text: 'You made it just before the rain got serious. I was about to close, but… you look like someone who could use a warm drink.',
      options: [
        { label: '“Only if you let me help you close up afterward.”', points: 2, flag: 'help' },
        { label: '“I could use a little kindness, actually. Thank you.”', points: 1, flag: 'honest' },
        { label: '“I heard this place has the best hot chocolate in the city.”', points: 1, flag: 'chocolate' }
      ]
    },
    {
      speaker: 'MIKA', location: 'THE LITTLE COMET CAFÉ · 11:58 PM',
      text: () => state.choices[0] === 'help'
        ? 'You really mean it? Most people make a polite offer and disappear before the cups are dry. I’m Mika, by the way. And you are?'
        : state.choices[0] === 'honest'
          ? 'Well, you came to the right place. I’m Mika. The tea is on the house tonight—consider it a small act of faith in humanity.'
          : 'Then I take my reputation seriously. I’m Mika, and I make the cocoa with actual melted chocolate. No shortcuts.' ,
      options: [
        { label: 'Tell her your name, and ask what keeps her here so late.', points: 2, flag: 'curious' },
        { label: 'Ask about the handwritten constellations on the menu.', points: 1, flag: 'stars' },
        { label: 'Offer a terrible joke to make her laugh.', points: 1, flag: 'joke' }
      ]
    },
    {
      speaker: 'MIKA', location: 'THE LITTLE COMET CAFÉ · 12:16 AM',
      text: () => state.choices[1] === 'stars'
        ? 'My dad taught me the constellations. I draw one on the menu every night so the café feels a little less like a place people pass through.'
        : state.choices[1] === 'joke'
          ? 'That was impressively bad. I’m laughing anyway, which is probably a sign I should go home. Or maybe that you’re good company.'
          : 'It started as my grandmother’s café. I took it over last year. Some nights it feels like a dream; other nights, like a promise I’m still figuring out how to keep.',
      options: [
        { label: '“What would you do if you could start anything at all?”', points: 2, flag: 'dreams' },
        { label: 'Share a small dream of your own, even if it feels unfinished.', points: 2, flag: 'share' },
        { label: '“You’ve made something lovely here. I hope you know that.”', points: 1, flag: 'kind' }
      ]
    },
    {
      speaker: 'MIKA', location: 'THE LITTLE COMET CAFÉ · 12:42 AM',
      text: () => state.choices[2] === 'dreams'
        ? 'A tiny bookshop in the back, maybe. Poetry readings on Thursdays. You ask questions like you actually want to hear the answers.'
        : state.choices[2] === 'share'
          ? 'I like that you told me. Maybe unfinished things are just beginnings that haven’t found their people yet.'
          : 'Thank you. I forget to see it that way sometimes. The rain is slowing down—and I think the last train leaves in ten minutes.',
      options: [
        { label: 'Ask Mika to take a walk with you to the station.', points: 2, flag: 'walk' },
        { label: 'Invite her to make that first poetry night a real thing together.', points: 2, flag: 'poetry' },
        { label: 'Leave your number on a napkin and let the night be enough.', points: 1, flag: 'number' }
      ]
    }
  ];

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (_) { /* storage is optional */ }
  }
  function updateConnection() {
    const ratio = Math.max(12, Math.min(100, 24 + state.connection * 12));
    affectionBar.style.width = `${ratio}%`;
  }
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 1700);
  }
  function begin(useSave = false) {
    if (!useSave) state = { step: 0, connection: 0, choices: [] };
    titleScreen.classList.add('dismissed');
    dialogue.classList.remove('hidden');
    $('topbar').classList.remove('hidden');
    $('affection').classList.remove('hidden');
    render();
  }
  function render() {
    if (state.step >= scenes.length) return finish();
    const scene = scenes[state.step];
    const chapter = chapters[state.step];
    chapterLabel.innerHTML = `${chapter[0]} <span>·</span> ${chapter[1]}`;
    speakerEl.textContent = scene.speaker;
    locationEl.textContent = scene.location;
    textEl.textContent = typeof scene.text === 'function' ? scene.text() : scene.text;
    choicesEl.innerHTML = '';
    nextBtn.classList.add('hidden');
    scene.options.forEach((option) => {
      const button = document.createElement('button');
      button.className = 'choice-btn';
      button.type = 'button';
      button.textContent = option.label;
      if (state.choices[state.step] === option.flag) {
        button.disabled = true;
        button.classList.add('selected');
        nextBtn.classList.remove('hidden');
      }
      button.addEventListener('click', () => {
        if (state.choices[state.step]) return;
        state.connection += option.points;
        state.choices[state.step] = option.flag;
        updateConnection();
        [...choicesEl.children].forEach((choice) => { choice.disabled = true; });
        button.classList.add('selected');
        save();
        nextBtn.classList.remove('hidden');
      });
      choicesEl.appendChild(button);
    });
    save();
  }
  function finish() {
    chapterLabel.innerHTML = 'EPILOGUE <span>·</span> A NIGHT TO REMEMBER';
    speakerEl.textContent = 'MIKA';
    locationEl.textContent = 'OUTSIDE THE LITTLE COMET · 12:51 AM';
    let title, description, line;
    if (state.connection >= 7) {
      title = 'A little more than a beginning';
      description = 'The rain gives way to a silver dawn. Mika walks beside you, already making plans for Thursday’s first poetry night.';
      line = '“I’m glad the last train was late,” she says, her shoulder brushing yours.';
    } else if (state.connection >= 5) {
      title = 'Under the same constellation';
      description = 'At the station, you trade stories until the platform lights blink awake. Neither of you is in a hurry to say goodbye.';
      line = '“Next time, I’ll show you my favorite part of the city,” Mika promises.';
    } else if (state.connection >= 3) {
      title = 'A note for another night';
      description = 'The café door clicks shut behind you. On the napkin in your pocket, Mika has drawn a tiny star beside her number.';
      line = 'Some stories don’t end. They wait for the next page.';
    } else {
      title = 'A warm cup, a soft landing';
      description = 'You catch the last train with the taste of cocoa still on your tongue and the feeling that the city is a little kinder than it seemed.';
      line = 'Through the café window, Mika lifts a hand in a small goodbye.';
    }
    textEl.innerHTML = `<span class="end-card"><strong>${title}</strong><span>${description}</span></span><em>${line}</em>`;
    choicesEl.innerHTML = '';
    const replay = document.createElement('button');
    replay.className = 'restart-end';
    replay.type = 'button';
    replay.textContent = 'Play again · try another path';
    replay.addEventListener('click', () => { state = { step: 0, connection: 0, choices: [] }; save(); begin(false); });
    choicesEl.appendChild(replay);
    nextBtn.classList.add('hidden');
    updateConnection();
    save();
  }

  nextBtn.addEventListener('click', () => { state.step += 1; render(); });
  startBtn.addEventListener('click', () => begin(false));
  continueBtn.addEventListener('click', () => begin(true));
  $('restartBtn').addEventListener('click', () => {
    if (window.confirm('Start the story over from the beginning?')) {
      state = { step: 0, connection: 0, choices: [] };
      save(); begin(false); showToast('A fresh start. The rain is waiting.');
    }
  });
  $('soundBtn').addEventListener('click', async () => {
    try {
      if (!audio) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('Audio unavailable');
        audio = new AudioContext();
        const master = audio.createGain();
        master.gain.value = 0.035;
        master.connect(audio.destination);
        [174.61, 220, 261.63].forEach((frequency, index) => {
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          oscillator.type = 'sine'; oscillator.frequency.value = frequency;
          gain.gain.value = index === 0 ? 0.32 : 0.16;
          oscillator.connect(gain); gain.connect(master); oscillator.start();
        });
        $('soundBtn').classList.add('active');
        $('soundNote').classList.add('show');
        $('soundBtn').setAttribute('aria-label', 'Turn ambient sound off');
        window.setTimeout(() => $('soundNote').classList.remove('show'), 2500);
      } else if (audio.state === 'running') {
        await audio.suspend(); $('soundBtn').classList.remove('active');
        $('soundBtn').setAttribute('aria-label', 'Turn ambient sound on');
        showToast('Ambient sound off');
      } else {
        await audio.resume(); $('soundBtn').classList.add('active');
        $('soundBtn').setAttribute('aria-label', 'Turn ambient sound off');
        showToast('Ambient sound on');
      }
    } catch (_) { showToast('Ambient sound is not available in this browser.'); }
  });

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    if (saved && Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= scenes.length && (saved.step > 0 || saved.choices?.some(Boolean))) {
      state = saved;
      continueBtn.classList.remove('hidden');
    }
  } catch (_) { /* ignore invalid save */ }
  $('topbar').classList.add('hidden');
  $('affection').classList.add('hidden');
  dialogue.classList.add('hidden');
  updateConnection();
})();