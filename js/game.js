// Game Master Loop, UI Controllers, Day/Night Atmosphere, Shop, and Tree Shaking

class Game {
  constructor() {
    this.gold = parseInt(localStorage.getItem('fishing_island_gold') || '50', 10);
    this.inventory = JSON.parse(localStorage.getItem('fishing_island_inv') || '[]');
    this.timeOfDay = 'day'; // 'morning', 'day', 'sunset', 'night'
    this.timeCycleSeconds = 300; // 5 min full cycle or manual via campfire

    // Load unlocked islands
    const savedUnlocked = JSON.parse(localStorage.getItem('fishing_island_unlocked_islands') || '[]');
    window.GAME_DATA.islands.forEach(isl => {
      if (savedUnlocked.includes(isl.id)) {
        isl.unlocked = true;
      }
    });

    // Load saved bait inventory
    const savedBaits = JSON.parse(localStorage.getItem('fishing_island_baits') || '{}');
    window.GAME_DATA.baits.forEach(b => {
      if (savedBaits[b.id] !== undefined) {
        b.count = savedBaits[b.id];
      }
    });

    // Session Stats for Expedition & Death Screen
    this.sessionStartTime = Date.now();
    this.sessionFishCaught = 0;
    this.sessionTreesShaken = 0;
    this.deathParticlesActive = false;

    this.initThree();
    this.initSystems();
    this.initCatch3DViewer();
    this.setupUI();
    this.updateHUD();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    // 1. Scene (Crystal-clear visibility with soft distant horizon fog)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x81ecec);
    this.scene.fog = new THREE.Fog(0x81ecec, 160, 750);

    // 2. Camera (far plane 1000 for realistic sky dome & celestial bodies)
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 3. Renderer (Optimized for smooth, cool, and battery-friendly performance)
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'default' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);

    // 4. Lighting & Day/Night
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7e6, 1.25);
    this.dirLight.position.set(65, 95, 55);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 512;
    this.dirLight.shadow.mapSize.height = 512;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 380;
    this.dirLight.shadow.camera.left = -160;
    this.dirLight.shadow.camera.right = 160;
    this.dirLight.shadow.camera.top = 160;
    this.dirLight.shadow.camera.bottom = -160;
    this.scene.add(this.dirLight);

    // Campfire & Lantern point lights
    this.campLight = new THREE.PointLight(0xff793f, 1.5, 20);
    this.campLight.position.set(4, 3.2, 28);
    this.scene.add(this.campLight);

    // 5. Initialize Realistic Atmospheric Sky
    this.sky = new window.RealisticSky(this.scene, this.camera);
    this.setTimeOfDay('day');

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.fishViewerRenderer) {
        const previewContainer = document.getElementById('catch-3d-preview');
        if (previewContainer && previewContainer.clientWidth > 0) {
          this.fishViewerCamera.aspect = previewContainer.clientWidth / previewContainer.clientHeight;
          this.fishViewerCamera.updateProjectionMatrix();
          this.fishViewerRenderer.setSize(previewContainer.clientWidth, previewContainer.clientHeight);
        }
      }
    });
  }

  setTimeOfDay(time) {
    this.timeOfDay = time;
    const timeLabels = {
      morning: '🌅 Dawn (Morning)',
      day: '☀️ Bright Day',
      sunset: '🌇 Golden Sunset',
      night: '🌙 Starry Night'
    };
    document.getElementById('time-display').innerText = timeLabels[time] || time;

    if (this.sky) {
      this.sky.setTimeOfDay(time);
    }
  }

  advanceTimeOfDay() {
    const cycle = ['morning', 'day', 'sunset', 'night'];
    const nextIdx = (cycle.indexOf(this.timeOfDay) + 1) % cycle.length;
    this.setTimeOfDay(cycle[nextIdx]);
    this.showToast(`Time rested! It is now ${cycle[nextIdx].toUpperCase()}.`, 'success');
  }

  initSystems() {
    this.island = new window.Island(this.scene);
    this.player = new window.Player(this.scene, this.camera, this.island);
    this.fishing = new window.FishingSystem(this.scene, this.player, this.island, window.soundSystem);

    // Interactive Archipelago Sea Chart & NPC Waypoint Tracker
    if (window.ArchipelagoMap) {
      this.map = new window.ArchipelagoMap(this);
    }

    // Load saved owned rods
    const savedRods = JSON.parse(localStorage.getItem('fishing_island_owned_rods') || '["rod_willow"]');
    window.GAME_DATA.rods.forEach(r => {
      r.owned = savedRods.includes(r.id);
    });
    const savedActiveRod = localStorage.getItem('fishing_island_active_rod') || 'rod_willow';
    this.player.equipRod(savedActiveRod);
  }

  // --- 3D INTERACTIVE FISH SHOWCASE VIEWER ---
  initCatch3DViewer() {
    const container = document.getElementById('catch-3d-preview');
    if (!container) return;

    this.fishViewerScene = new THREE.Scene();
    this.fishViewerCamera = new THREE.PerspectiveCamera(45, 1.8, 0.1, 100);
    this.fishViewerCamera.position.set(0, 0, 5.5);

    this.fishViewerRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.fishViewerRenderer.setSize(container.clientWidth || 380, container.clientHeight || 200);
    this.fishViewerRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.fishViewerRenderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.fishViewerScene.add(ambLight);

    const fDir = new THREE.DirectionalLight(0xffffff, 1.2);
    fDir.position.set(5, 8, 7);
    this.fishViewerScene.add(fDir);

    this.currentFishModel = null;
    this.fishTime = 0;
  }

  build3DFishModel(fishData) {
    if (window.RealisticFish) {
      return window.RealisticFish.createDetailedFish(fishData);
    }

    const group = new THREE.Group();
    const colors = fishData.colors;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colors.body,
      roughness: 0.35,
      metalness: 0.15,
      emissive: colors.glowing ? colors.body : 0x000000,
      emissiveIntensity: colors.glowing ? 0.4 : 0
    });

    const bodyGeo = new THREE.SphereGeometry(1.0, 14, 10);
    bodyGeo.scale(2.2, 0.85, 0.45);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    return group;
  }

  setupUI() {
    // 1. Home Screen Control Mode Selection (PC vs Mobile)
    this.controlMode = 'pc';
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 1024;
    const cardPc = document.getElementById('card-mode-pc');
    const cardMobile = document.getElementById('card-mode-mobile');
    const btnStart = document.getElementById('btn-start-game');
    const homeScreen = document.getElementById('home-screen');
    const hudModeToggle = document.getElementById('hud-mode-toggle-btn');

    // Auto-detect recommended default mode
    if (isTouchDevice) {
      this.controlMode = 'mobile';
      if (cardMobile) cardMobile.classList.add('active');
      if (cardPc) cardPc.classList.remove('active');
    } else {
      this.controlMode = 'pc';
      if (cardPc) cardPc.classList.add('active');
      if (cardMobile) cardMobile.classList.remove('active');
    }

    if (cardPc) {
      cardPc.addEventListener('click', () => {
        this.controlMode = 'pc';
        cardPc.classList.add('active');
        if (cardMobile) cardMobile.classList.remove('active');
      });
    }

    if (cardMobile) {
      cardMobile.addEventListener('click', () => {
        this.controlMode = 'mobile';
        cardMobile.classList.add('active');
        if (cardPc) cardPc.classList.remove('active');
      });
    }

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (homeScreen) homeScreen.classList.add('hidden');
        if (window.soundSystem) window.soundSystem.resume();
        this.applyControlMode(this.controlMode);
      });
    }

    if (hudModeToggle) {
      hudModeToggle.addEventListener('click', () => {
        const nextMode = (this.controlMode === 'pc') ? 'mobile' : 'pc';
        this.applyControlMode(nextMode);
        this.showToast(`Switched to ${nextMode.toUpperCase()} Mode!`, 'success');
      });
    }

    // 2. Cast button hold / release
    const castBtn = document.getElementById('btn-cast');
    const chargeBarFill = document.getElementById('cast-bar-fill');

    const handleCastStart = (e) => {
      if (e) e.preventDefault();
      window.soundSystem.resume();
      if (this.fishing.state === 'idle') {
        this.fishing.startChargingCast();
      }
    };

    const handleCastEnd = (e) => {
      if (e) e.preventDefault();
      if (this.fishing.state === 'charging') {
        this.fishing.releaseCast();
      }
    };

    castBtn.addEventListener('mousedown', handleCastStart);
    castBtn.addEventListener('touchstart', handleCastStart, { passive: false });
    window.addEventListener('mouseup', handleCastEnd);
    window.addEventListener('touchend', handleCastEnd);

    // 3. Keyboard Input: Space (Jump & Strike/Reel), KeyC (Cast), KeyE (Interact)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // If dead, pressing Space, Enter, or E immediately respawns!
      if (this.player && this.player.isDead) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
          e.preventDefault();
          this.respawnPlayer();
          return;
        }
      }

      if (e.code === 'Space') {
        window.soundSystem.resume();
        if (this.fishing.state === 'idle') {
          // Space triggers jump when exploring dry land!
          if (this.player) this.player.jump();
        } else if (this.fishing.state === 'hook_alert') {
          this.fishing.attemptHook();
        } else if (this.fishing.state === 'reeling') {
          this.fishing.setReelHolding(true);
        }
      } else if (e.code === 'KeyC') {
        window.soundSystem.resume();
        if (this.fishing.state === 'idle') {
          this.fishing.startChargingCast();
        } else if (this.fishing.state === 'hook_alert') {
          this.fishing.attemptHook();
        } else if (this.fishing.state === 'reeling') {
          this.fishing.setReelHolding(true);
        }
      } else if (e.code === 'KeyE') {
        // Interact key (Talk to Barnaby, Shake tree, Rest at campfire)
        this.handleInteractKey();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'KeyC') {
        if (this.fishing.state === 'charging') {
          this.fishing.releaseCast();
        } else if (this.fishing.state === 'reeling') {
          this.fishing.setReelHolding(false);
        }
      }
    });

    // Strike button
    const strikeBtn = document.getElementById('strike-prompt');
    strikeBtn.addEventListener('click', () => {
      this.fishing.attemptHook();
    });

    // Reel track interaction (hold mouse / touch to reel)
    const reelTrack = document.getElementById('reel-track');
    const onReelStart = (e) => {
      e.preventDefault();
      this.fishing.setReelHolding(true);
    };
    const onReelEnd = (e) => {
      e.preventDefault();
      this.fishing.setReelHolding(false);
    };
    reelTrack.addEventListener('mousedown', onReelStart);
    reelTrack.addEventListener('touchstart', onReelStart, { passive: false });
    window.addEventListener('mouseup', onReelEnd);
    window.addEventListener('touchend', onReelEnd);

    // Quick Bait Selector
    document.getElementById('bait-select-btn').addEventListener('click', () => {
      this.openBaitSelectorModal();
    });

    // Shop Button
    document.getElementById('nav-shop-btn').addEventListener('click', () => {
      this.openShopModal('rods');
    });

    // Compendium Button
    document.getElementById('nav-compendium-btn').addEventListener('click', () => {
      this.openCompendiumModal();
    });

    // Audio Mute Button
    const muteBtn = document.getElementById('audio-toggle-btn');
    muteBtn.addEventListener('click', () => {
      window.soundSystem.resume();
      const isMuted = window.soundSystem.toggleMute();
      muteBtn.innerText = isMuted ? '🔇 Muted' : '🔊 Sound On';
    });

    // Camera View Toggle Button (3rd Person -> 1st Person POV -> Front Face View)
    const viewBtn = document.getElementById('camera-view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        if (this.player) this.player.cycleCameraView();
      });
    }

    // Angler Headlamp / Flashlight Button
    const lightBtn = document.getElementById('flashlight-toggle-btn');
    if (lightBtn) {
      lightBtn.addEventListener('click', () => {
        if (this.player) this.player.toggleFlashlight();
      });
    }

    // iPad / Mobile QR Code Button
    const mobileQrBtn = document.getElementById('mobile-qr-btn');
    if (mobileQrBtn) {
      mobileQrBtn.addEventListener('click', () => {
        const modal = document.getElementById('mobile-modal');
        if (modal) modal.classList.remove('hidden');
      });
    }

    // Close modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      });
    });

    // Campfire quick rest button on HUD
    document.getElementById('time-display').addEventListener('click', () => {
      this.advanceTimeOfDay();
    });

    // Respawn buttons on death screen
    const respawnBtn = document.getElementById('btn-respawn');
    if (respawnBtn) {
      respawnBtn.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.respawnPlayer('trail');
      });
    }

    const respawnCampfireBtn = document.getElementById('btn-respawn-campfire');
    if (respawnCampfireBtn) {
      respawnCampfireBtn.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.respawnPlayer('campfire');
      });
    }
  }

  applyControlMode(mode) {
    this.controlMode = mode;
    const touchControls = document.getElementById('touch-controls');
    const hudModeToggle = document.getElementById('hud-mode-toggle-btn');

    if (mode === 'mobile') {
      if (touchControls) touchControls.classList.remove('hidden');
      if (hudModeToggle) hudModeToggle.innerHTML = '🎮 Mode: Mobile';
    } else {
      if (touchControls) touchControls.classList.add('hidden');
      if (hudModeToggle) hudModeToggle.innerHTML = '🎮 Mode: PC';
    }
  }

  // --- CINEMATIC AAA DEATH & RESPAWN HANDLERS ---
  onPlayerDied(reason) {
    // 1. Cancel any active fishing line
    if (this.fishing) {
      this.fishing.cancelFishing();
    }

    // 2. Query death overlay elements
    const overlay = document.getElementById('death-overlay');
    const desc = document.getElementById('death-desc');
    const reasonIcon = document.getElementById('death-reason-icon');
    const emblemIcon = document.getElementById('death-emblem-icon');
    const timerSub = document.getElementById('respawn-timer-sub');
    const progressBar = document.getElementById('death-progress-bar');

    // Contextual death reason, icons, and styling
    const cleanReason = reason || 'You were consumed by the ocean waters!';
    const lower = cleanReason.toLowerCase();

    if (lower.includes('volcano') || lower.includes('sulfur')) {
      if (reasonIcon) reasonIcon.innerText = '🌋';
      if (emblemIcon) emblemIcon.innerText = '🔥';
    } else if (lower.includes('coral') || lower.includes('lagoon')) {
      if (reasonIcon) reasonIcon.innerText = '🪸';
      if (emblemIcon) emblemIcon.innerText = '🦈';
    } else {
      if (reasonIcon) reasonIcon.innerText = '🌊';
      if (emblemIcon) emblemIcon.innerText = '☠️';
    }

    if (desc) desc.innerText = cleanReason;

    // 3. Populate Expedition Run Stats
    const elapsedSec = Math.floor((Date.now() - (this.sessionStartTime || Date.now())) / 1000);
    const m = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
    const s = (elapsedSec % 60).toString().padStart(2, '0');

    const statTime = document.getElementById('death-stat-time');
    const statFish = document.getElementById('death-stat-fish');
    const statGold = document.getElementById('death-stat-gold');
    const statTrees = document.getElementById('death-stat-trees');

    if (statTime) statTime.innerText = `${m}:${s}`;
    if (statFish) statFish.innerText = `${this.sessionFishCaught || 0} Caught`;
    if (statGold) statGold.innerText = `${this.gold} G`;
    if (statTrees) statTrees.innerText = `${this.sessionTreesShaken || 0} Trees`;

    // 4. Rotating Angler Wisdom / Survival Advice
    const tips = [
      "The ocean waters are lethal! Always cast your line safely elevated on docks or bridges.",
      "Watch your footing near the steep ocean cliffs and slippery coral trenches.",
      "Rare apex predators pull harder—upgrade your rod tension cap at Captain Barnaby's!",
      "Resting at the Haven Campfire lets you cycle through Dawn, Day, Sunset, and Night.",
      "Shake trees across the islands to forage fruit, grubs, and hidden gold coins!",
      "Bait selection matters! Firefly Shrimp and Squid attract deep-sea monsters at night.",
      "Use the Archipelago Map [M] to track Captain Barnaby and travel between islands!"
    ];
    const tipElem = document.getElementById('death-tip-text');
    if (tipElem) {
      tipElem.innerText = tips[Math.floor(Math.random() * tips.length)];
    }

    // 5. Show cinematic overlay
    if (overlay) overlay.classList.remove('hidden');

    // 6. Start floating ember particles on canvas
    this.startDeathParticles();

    // 7. Auto-respawn countdown (4s) with animated progress bar
    const totalTimeMs = 4500;
    let elapsedMs = 0;
    const stepMs = 50;

    if (progressBar) progressBar.style.width = '100%';
    if (timerSub) timerSub.innerText = '(4s)';

    if (this.deathInterval) {
      clearInterval(this.deathInterval);
      this.deathInterval = null;
    }

    this.deathInterval = setInterval(() => {
      elapsedMs += stepMs;
      const progressRatio = Math.max(0, 1 - (elapsedMs / totalTimeMs));
      if (progressBar) progressBar.style.width = `${progressRatio * 100}%`;

      const remainingSec = Math.ceil((totalTimeMs - elapsedMs) / 1000);
      if (timerSub) timerSub.innerText = `(${remainingSec}s)`;

      if (elapsedMs >= totalTimeMs) {
        if (this.deathInterval) {
          clearInterval(this.deathInterval);
          this.deathInterval = null;
        }
        if (this.player && this.player.isDead) {
          this.respawnPlayer('trail');
        }
      }
    }, stepMs);
  }

  startDeathParticles() {
    const canvas = document.getElementById('death-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.deathParticlesActive = true;
    const particles = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1.2 + Math.random() * 2.8,
        speedY: 0.35 + Math.random() * 0.9,
        speedX: (Math.random() - 0.5) * 0.6,
        alpha: 0.2 + Math.random() * 0.65,
        hue: Math.random() < 0.65 ? 0 : 38 // Crimson or Amber
      });
    }

    const render = () => {
      if (!this.deathParticlesActive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${p.alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(render);
    };
    render();
  }

  stopDeathParticles() {
    this.deathParticlesActive = false;
  }

  respawnPlayer(spawnType = 'trail') {
    if (this.deathInterval) {
      clearInterval(this.deathInterval);
      this.deathInterval = null;
    }
    this.stopDeathParticles();

    const overlay = document.getElementById('death-overlay');
    if (overlay) overlay.classList.add('hidden');

    if (this.player) {
      this.player.respawn(spawnType);
    }
  }

  onPlayerRespawn(spawnType = 'trail') {
    if (this.deathInterval) {
      clearInterval(this.deathInterval);
      this.deathInterval = null;
    }
    this.stopDeathParticles();

    const overlay = document.getElementById('death-overlay');
    if (overlay) overlay.classList.add('hidden');

    if (spawnType === 'campfire') {
      this.showToast('🔥 Awoke safely by the warm Haven Campfire!', 'success');
    } else {
      this.showToast('🌿 Respawned safely on the coastal trail!', 'success');
    }
  }

  handleInteractKey() {
    const px = this.player.position.x;
    const pz = this.player.position.z;

    // 1. Check talking NPC / shop / campfire interactables
    for (const inter of this.island.interactables) {
      const dist = Math.hypot(inter.x - px, inter.z - pz);
      if (dist <= inter.radius) {
        if (inter.type === 'npc') {
          if (window.npcSystem) {
            window.npcSystem.startDialogue(inter.npcId);
          }
          return;
        } else if (inter.type === 'shop') {
          this.openShopModal('rods');
          return;
        } else if (inter.type === 'ferry_charter') {
          this.openShopModal('islands');
          return;
        } else if (inter.type === 'campfire') {
          this.advanceTimeOfDay();
          return;
        }
      }
    }

    // 2. Check nearest tree for shaking!
    const nearestTree = this.island.getNearestTree(px, pz, 4.0);
    if (nearestTree) {
      this.shakeTree(nearestTree);
    }
  }

  // --- TREE SHAKING & FORAGING ---
  shakeTree(tree) {
    const now = Date.now();
    if (now - tree.lastShaken < 6000) {
      this.showToast('This tree has already been shaken recently! Try another.', 'info');
      return;
    }
    tree.lastShaken = now;
    this.sessionTreesShaken = (this.sessionTreesShaken || 0) + 1;

    // Visual tree shake oscillation
    window.soundSystem.playTreeShake();

    const startTime = performance.now();
    const duration = 650;

    const animateShake = (time) => {
      const elapsed = time - startTime;
      if (elapsed < duration) {
        const decay = 1 - (elapsed / duration);
        tree.mesh.rotation.z = Math.sin(elapsed * 0.045) * 0.14 * decay;
        requestAnimationFrame(animateShake);
      } else {
        tree.mesh.rotation.z = 0;
      }
    };
    requestAnimationFrame(animateShake);

    // Roll tree loot drops!
    const treeTypeData = window.GAME_DATA.trees[tree.type];
    const drops = treeTypeData.drops;
    let droppedSomething = false;

    drops.forEach(drop => {
      if (Math.random() <= drop.chance) {
        droppedSomething = true;
        if (drop.type === 'bait') {
          const bait = window.GAME_DATA.baits.find(b => b.id === drop.id);
          if (bait) {
            bait.count += drop.count;
            this.showToast(`🌿 Shook tree: Found ${drop.count}x ${bait.name}!`, 'success');
          }
        } else if (drop.type === 'gold') {
          this.addGold(drop.amount);
          this.showToast(`💰 Shook tree: Found ${drop.amount} Gold Coins hidden in the leaves!`, 'success');
        } else if (drop.type === 'item') {
          this.inventory.push({ id: drop.id, name: drop.name, value: drop.value, desc: drop.desc });
          this.saveInventory();
          this.showToast(`🍎 Shook tree: Dropped ${drop.name}!`, 'success');
        }
      }
    });

    if (!droppedSomething) {
      this.showToast('🍃 Rustle... Only leaves fell to the ground.', 'info');
    }

    this.updateHUD();
  }

  addGold(amt) {
    this.gold += amt;
    localStorage.setItem('fishing_island_gold', this.gold.toString());
    window.soundSystem.playCoin();
    this.updateHUD();
  }

  saveInventory() {
    localStorage.setItem('fishing_island_inv', JSON.stringify(this.inventory));
  }

  saveBaits() {
    const counts = {};
    window.GAME_DATA.baits.forEach(b => {
      counts[b.id] = b.count;
    });
    localStorage.setItem('fishing_island_baits', JSON.stringify(counts));
  }

  saveUnlockedIslands() {
    const unlocked = window.GAME_DATA.islands.filter(i => i.unlocked).map(i => i.id);
    localStorage.setItem('fishing_island_unlocked_islands', JSON.stringify(unlocked));
  }

  fastTravelTo(pos, islandName) {
    const fade = document.getElementById('screen-fade');
    // Close any open modals
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));

    if (fade) {
      fade.classList.remove('hidden');
      fade.style.opacity = '0';
      requestAnimationFrame(() => {
        fade.style.opacity = '1';
      });
    }

    if (window.soundSystem) window.soundSystem.playSplash(true);

    setTimeout(() => {
      this.player.position.set(pos.x, pos.y, pos.z);
      this.player.mesh.position.copy(this.player.position);
      this.player.rotation = 0;
      this.player.updateCamera();

      this.showToast(`⛵ Arrived safely at ${islandName}!`, 'success');

      setTimeout(() => {
        if (fade) {
          fade.style.opacity = '0';
          setTimeout(() => fade.classList.add('hidden'), 500);
        }
      }, 350);
    }, 600);
  }

  // --- MODALS & MENUS ---

  openBaitSelectorModal() {
    const modal = document.getElementById('bait-modal');
    const list = document.getElementById('bait-list');
    list.innerHTML = '';

    window.GAME_DATA.baits.forEach(bait => {
      const card = document.createElement('div');
      card.className = `item-card ${bait.id === this.fishing.activeBaitId ? 'active-item' : ''}`;
      const countLabel = bait.isReusable ? '⭐ Permanent Lure' : (bait.id === 'none' ? 'Unlimited' : `x${bait.count}`);

      card.innerHTML = `
        <div class="item-header">
          <strong>${bait.name}</strong>
          <span class="badge ${bait.count > 0 || bait.isReusable ? 'badge-green' : 'badge-red'}">${countLabel}</span>
        </div>
        <p class="item-desc">${bait.desc}</p>
        <div class="item-meta">
          <span>Speed: +${Math.round((bait.biteSpeed - 1) * 100)}%</span>
          <span>Luck: ${bait.luckBonus}x</span>
        </div>
        <button class="btn btn-primary" ${(!bait.isReusable && bait.count <= 0 && bait.id !== 'none') ? 'disabled' : ''}>
          ${bait.id === this.fishing.activeBaitId ? 'Currently Active' : 'Equip Bait'}
        </button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        this.fishing.activeBaitId = bait.id;
        this.showToast(`Equipped ${bait.name}!`, 'success');
        this.updateHUD();
        modal.classList.add('hidden');
      });

      list.appendChild(card);
    });

    modal.classList.remove('hidden');
  }

  openShopModal(defaultTab = 'rods') {
    const modal = document.getElementById('shop-modal');
    modal.classList.remove('hidden');
    this.renderShopTab(defaultTab);

    // Setup shop tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderShopTab(btn.dataset.tab);
      };
    });
  }

  renderShopTab(tab) {
    const content = document.getElementById('shop-content');
    content.innerHTML = '';

    if (tab === 'rods') {
      window.GAME_DATA.rods.forEach(rod => {
        const card = document.createElement('div');
        const isEquipped = this.player.activeRodId === rod.id;
        card.className = `shop-item-card ${isEquipped ? 'equipped-card' : ''}`;

        card.innerHTML = `
          <div class="item-header">
            <strong>${rod.name}</strong>
            <span class="badge badge-purple">Tier ${rod.tier}</span>
          </div>
          <p class="item-desc">${rod.desc}</p>
          <div class="stats-grid">
            <div>Cast Range: <strong>${rod.maxDistance}m</strong></div>
            <div>Reel Speed: <strong>${rod.reelSpeed}x</strong></div>
            <div>Tension Cap: <strong>${rod.tensionCap}</strong></div>
            <div>Luck Boost: <strong>${rod.luckBonus}x</strong></div>
          </div>
          <div class="shop-action">
            <span class="price-tag">🪙 ${rod.owned ? 'OWNED' : rod.price + ' Gold'}</span>
            <button class="btn btn-primary shop-btn">
              ${isEquipped ? 'Equipped' : (rod.owned ? 'Equip' : 'Purchase')}
            </button>
          </div>
        `;

        const btn = card.querySelector('.shop-btn');
        btn.addEventListener('click', () => {
          if (rod.owned) {
            this.player.equipRod(rod.id);
            localStorage.setItem('fishing_island_active_rod', rod.id);
            this.showToast(`Equipped ${rod.name}!`, 'success');
            this.updateHUD();
            this.renderShopTab('rods');
          } else {
            if (this.gold >= rod.price) {
              this.gold -= rod.price;
              rod.owned = true;
              const ownedIds = window.GAME_DATA.rods.filter(r => r.owned).map(r => r.id);
              localStorage.setItem('fishing_island_owned_rods', JSON.stringify(ownedIds));
              localStorage.setItem('fishing_island_gold', this.gold.toString());
              this.player.equipRod(rod.id);
              localStorage.setItem('fishing_island_active_rod', rod.id);
              window.soundSystem.playCoin();
              this.showToast(`Purchased & Equipped ${rod.name}!`, 'success');
              this.updateHUD();
              this.renderShopTab('rods');
            } else {
              this.showToast('Not enough gold coins!', 'warning');
            }
          }
        });

        content.appendChild(card);
      });
    } else if (tab === 'baits') {
      window.GAME_DATA.baits.filter(b => b.id !== 'none').forEach(bait => {
        const card = document.createElement('div');
        card.className = 'shop-item-card bait-shop-card';

        // Find target fish names
        let targetsHtml = '';
        if (bait.preferredFor && bait.preferredFor.length > 0) {
          const fishNames = bait.preferredFor
            .map(fid => {
              const f = window.GAME_DATA.fish.find(fish => fish.id === fid);
              return f ? f.name : fid;
            })
            .slice(0, 3);
          targetsHtml = `<div class="target-fish-preview">🎯 Attracts: <span>${fishNames.join(', ')}</span></div>`;
        }

        const isOwnedLure = bait.isReusable && bait.count > 0;

        // Pricing for bulk
        const p1 = bait.price;
        const p5 = Math.round(bait.price * 5 * 0.9); // 10% off
        const p20 = Math.round(bait.price * 20 * 0.8); // 20% off

        card.innerHTML = `
          <div class="item-header">
            <strong>${bait.name}</strong>
            <span class="badge ${isOwnedLure ? 'badge-purple' : 'badge-green'}">
              ${bait.isReusable ? (isOwnedLure ? '⭐ Permanent Owned' : 'Permanent Lure') : `In Creel: x${bait.count}`}
            </span>
          </div>
          <p class="item-desc">${bait.desc}</p>
          ${targetsHtml}
          <div class="stats-grid">
            <div>Bite Rate: <strong>+${Math.round((bait.biteSpeed - 1) * 100)}%</strong></div>
            <div>Luck Boost: <strong>${bait.luckBonus}x</strong></div>
          </div>
          <div class="shop-action bait-action-area">
            ${bait.isReusable ? `
              <span class="price-tag">🪙 ${isOwnedLure ? 'OWNED' : `${p1} Gold`}</span>
              <button class="btn btn-primary buy-lure-btn" ${isOwnedLure ? 'disabled' : ''}>
                ${isOwnedLure ? 'Owned' : 'Buy Lure'}
              </button>
            ` : `
              <div class="bulk-buy-row">
                <button class="btn btn-primary bulk-btn" data-count="1" data-price="${p1}">
                  +1 <small>(🪙${p1}g)</small>
                </button>
                <button class="btn btn-primary bulk-btn" data-count="5" data-price="${p5}">
                  +5 <small>(🪙${p5}g)</small>
                </button>
                <button class="btn btn-gold bulk-btn bulk-btn-best" data-count="20" data-price="${p20}">
                  +20 <small>(🪙${p20}g)</small>
                </button>
              </div>
            `}
          </div>
        `;

        if (bait.isReusable) {
          const btn = card.querySelector('.buy-lure-btn');
          if (btn && !isOwnedLure) {
            btn.addEventListener('click', () => {
              if (this.gold >= p1) {
                this.gold -= p1;
                bait.count = 1;
                this.saveBaits();
                localStorage.setItem('fishing_island_gold', this.gold.toString());
                window.soundSystem.playCoin();
                this.showToast(`Purchased ${bait.name}! It never runs out!`, 'success');
                this.updateHUD();
                this.renderShopTab('baits');
              } else {
                this.showToast('Not enough gold coins!', 'warning');
              }
            });
          }
        } else {
          card.querySelectorAll('.bulk-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const count = parseInt(btn.dataset.count, 10);
              const cost = parseInt(btn.dataset.price, 10);
              if (this.gold >= cost) {
                this.gold -= cost;
                bait.count += count;
                this.saveBaits();
                localStorage.setItem('fishing_island_gold', this.gold.toString());
                window.soundSystem.playCoin();
                this.showToast(`Bought ${count}x ${bait.name} for 🪙 ${cost} Gold!`, 'success');
                this.updateHUD();
                this.renderShopTab('baits');
              } else {
                this.showToast(`Need 🪙 ${cost} Gold for ${count}x bait!`, 'warning');
              }
            });
          });
        }

        content.appendChild(card);
      });
    } else if (tab === 'islands') {
      // SEA CHARTERS & ISLAND DEEDS TAB
      const topBar = document.createElement('div');
      topBar.className = 'island-hub-banner';
      topBar.innerHTML = `
        <div class="hub-info">
          <strong>⛵ Archipelago Ferry Charters</strong>
          <span>Purchase deeds to expand your sea charts, unlock fast ferry travel, or walk the suspension bridges!</span>
        </div>
        <button class="btn btn-gold btn-hub-return">⚓ Return to Main Haven</button>
      `;
      content.appendChild(topBar);

      topBar.querySelector('.btn-hub-return').addEventListener('click', () => {
        this.fastTravelTo({ x: 0, y: 1.4, z: 82 }, 'Main Haven Pier');
      });

      window.GAME_DATA.islands.forEach(island => {
        const card = document.createElement('div');
        card.className = `shop-item-card island-card ${island.unlocked ? 'island-unlocked' : 'island-locked'}`;

        card.innerHTML = `
          <div class="item-header">
            <strong>${island.name}</strong>
            <span class="badge ${island.unlocked ? 'badge-green' : 'badge-purple'}">
              ${island.unlocked ? '✅ CHARTER UNLOCKED' : island.badge}
            </span>
          </div>
          <p class="item-desc">${island.desc}</p>
          <div class="island-features-box">
            <div>Bridge: <strong>Walkway Active</strong></div>
            <div>Status: <strong>${island.unlocked ? 'Charter Ferry Open' : 'Deed Required for Ferry'}</strong></div>
          </div>
          <div class="shop-action island-action-area">
            ${island.unlocked ? `
              <span class="unlocked-label">🧭 Unlocked & Charted</span>
              <button class="btn btn-gold travel-btn">⛵ Charter Ferry (Travel Now)</button>
            ` : `
              <span class="price-tag">🪙 ${island.price} Gold</span>
              <button class="btn btn-primary buy-island-btn">📜 Purchase Island Deed</button>
            `}
          </div>
        `;

        if (island.unlocked) {
          card.querySelector('.travel-btn').addEventListener('click', () => {
            this.fastTravelTo(island.fastTravelPos, island.name);
          });
        } else {
          card.querySelector('.buy-island-btn').addEventListener('click', () => {
            if (this.gold >= island.price) {
              this.gold -= island.price;
              island.unlocked = true;
              this.saveUnlockedIslands();
              localStorage.setItem('fishing_island_gold', this.gold.toString());
              window.soundSystem.playCoin();
              this.showToast(`⚓ Purchased Sea Deed for ${island.name}! Ferry service unlocked!`, 'success');
              this.updateHUD();
              this.renderShopTab('islands');
            } else {
              this.showToast(`Need 🪙 ${island.price} Gold to charter this island!`, 'warning');
            }
          });
        }

        content.appendChild(card);
      });
    } else if (tab === 'sell') {
      // Selling caught fish and foraged tree items
      const caughtFish = JSON.parse(localStorage.getItem('fishing_island_creel') || '[]');
      const totalItems = caughtFish.length + this.inventory.length;

      let totalWorth = 0;
      caughtFish.forEach(f => totalWorth += f.gold);
      this.inventory.forEach(i => totalWorth += i.value);

      const headerDiv = document.createElement('div');
      headerDiv.className = 'sell-header-box';
      headerDiv.innerHTML = `
        <div>Items in Bag: <strong>${totalItems}</strong> | Total Value: <strong>🪙 ${totalWorth} Gold</strong></div>
        <button id="btn-sell-all" class="btn btn-gold" ${totalItems === 0 ? 'disabled' : ''}>Sell All Items (+${totalWorth}g)</button>
      `;
      content.appendChild(headerDiv);

      headerDiv.querySelector('#btn-sell-all').addEventListener('click', () => {
        if (totalItems > 0) {
          this.addGold(totalWorth);
          localStorage.setItem('fishing_island_creel', '[]');
          this.inventory = [];
          this.saveInventory();
          this.showToast(`Sold all items to Barnaby for +${totalWorth} Gold!`, 'success');
          this.renderShopTab('sell');
        }
      });

      if (totalItems === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-msg';
        emptyDiv.innerHTML = '🎣 Your creel and basket are empty! Go fish in the ocean/pond or shake trees to gather items!';
        content.appendChild(emptyDiv);
      } else {
        // List caught fish
        caughtFish.forEach(f => {
          const itemRow = document.createElement('div');
          itemRow.className = 'sell-row';
          itemRow.innerHTML = `
            <div>
              <strong>${f.name}</strong> (${f.sizeCm}cm, ${f.weightKg}kg)
              <span class="badge rarity-${f.rarity}">${f.rarity.toUpperCase()}</span>
            </div>
            <div class="sell-action">
              <span>🪙 ${f.gold}g</span>
            </div>
          `;
          content.appendChild(itemRow);
        });

        // List foraged tree items
        this.inventory.forEach(item => {
          const itemRow = document.createElement('div');
          itemRow.className = 'sell-row';
          itemRow.innerHTML = `
            <div>
              <strong>${item.name}</strong> - <em>Foraged from Island Trees</em>
            </div>
            <div class="sell-action">
              <span>🪙 ${item.value}g</span>
            </div>
          `;
          content.appendChild(itemRow);
        });
      }
    }
  }

  openCompendiumModal() {
    const modal = document.getElementById('compendium-modal');
    const grid = document.getElementById('compendium-grid');
    grid.innerHTML = '';

    const compendium = JSON.parse(localStorage.getItem('fishing_island_compendium') || '{}');
    const records = JSON.parse(localStorage.getItem('fishing_island_records') || '{}');

    let caughtCount = 0;
    const allFish = window.GAME_DATA.fish;

    allFish.forEach(f => {
      const caughtTimes = compendium[f.id] || 0;
      if (caughtTimes > 0) caughtCount++;

      const card = document.createElement('div');
      card.className = `fish-compendium-card ${caughtTimes > 0 ? 'caught' : 'locked'}`;

      if (caughtTimes > 0) {
        card.innerHTML = `
          <div class="fish-header">
            <strong>${f.name}</strong>
            <span class="badge rarity-${f.rarity}">${f.rarity.toUpperCase()}</span>
          </div>
          <div class="scientific-name"><em>${f.scientific}</em></div>
          <p class="fish-desc">${f.desc}</p>
          <div class="fish-stats-box">
            <div>Record Catch: <strong>${records[f.id] || f.minSize} cm</strong></div>
            <div>Times Caught: <strong>${caughtTimes}</strong></div>
            <div>Habitat: <strong>${f.habitat.replace('_', ' ').toUpperCase()}</strong></div>
            <div>Base Value: <strong>🪙 ${f.basePrice}g</strong></div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="fish-header">
            <strong>??? (Undiscovered)</strong>
            <span class="badge rarity-${f.rarity}">${f.rarity.toUpperCase()}</span>
          </div>
          <p class="fish-desc">Unknown species. Explore the island's waters to hook this fish!</p>
          <div class="fish-stats-box">
            <div>Habitat: <strong>${f.habitat.replace('_', ' ').toUpperCase()}</strong></div>
            <div>Best Time: <strong>${f.timeOfDay.toUpperCase()}</strong></div>
          </div>
        `;
      }
      grid.appendChild(card);
    });

    document.getElementById('compendium-progress-text').innerText = `${caughtCount} / ${allFish.length} Species Discovered (${Math.round((caughtCount / allFish.length) * 100)}%)`;
    modal.classList.remove('hidden');
  }

  showCatchModal(data) {
    const modal = document.getElementById('catch-modal');
    const f = data.fish;
    this.sessionFishCaught = (this.sessionFishCaught || 0) + 1;

    document.getElementById('catch-name').innerText = f.name;
    document.getElementById('catch-scientific').innerText = f.scientific;
    const rarityBadge = document.getElementById('catch-rarity-badge');
    rarityBadge.innerText = `${f.rarity.toUpperCase()} - ${f.sizeCategory.toUpperCase()} CLASS`;
    rarityBadge.className = `badge rarity-${f.rarity}`;

    let humanScaleNote = '';
    if (data.sizeCm >= 500) humanScaleNote = ` (⚡ ${Math.round(data.sizeCm / 175)}x TALLER THAN PLAYER!)`;
    else if (data.sizeCm >= 200) humanScaleNote = ' (TALLER THAN PLAYER!)';

    document.getElementById('catch-size').innerText = `${data.sizeCm} cm${humanScaleNote}`;
    document.getElementById('catch-weight').innerText = `${data.weightKg} kg`;
    document.getElementById('catch-gold').innerText = `+${data.gold} Gold`;
    document.getElementById('catch-desc').innerText = f.desc;

    const recordBanner = document.getElementById('catch-record-badge');
    if (data.isRecord) {
      recordBanner.classList.remove('hidden');
    } else {
      recordBanner.classList.add('hidden');
    }

    // Build and display real 3D animated fish model in the Catch Modal
    if (this.fishViewerScene) {
      if (this.currentFishModel) {
        this.fishViewerScene.remove(this.currentFishModel);
      }
      this.currentFishModel = this.build3DFishModel(f);
      this.fishViewerScene.add(this.currentFishModel);
    }

    // Keep & Creel Button
    document.getElementById('btn-keep-fish').onclick = () => {
      const creel = JSON.parse(localStorage.getItem('fishing_island_creel') || '[]');
      creel.push({
        id: f.id,
        name: f.name,
        rarity: f.rarity,
        sizeCm: data.sizeCm,
        weightKg: data.weightKg,
        gold: data.gold
      });
      localStorage.setItem('fishing_island_creel', JSON.stringify(creel));
      this.showToast(`Added ${f.name} to creel!`, 'success');
      modal.classList.add('hidden');
      this.fishing.state = 'idle';
      this.updateHUD();
    };

    // Quick Sell Button
    document.getElementById('btn-sell-fish').onclick = () => {
      this.addGold(data.gold);
      this.showToast(`Sold ${f.name} for +${data.gold} Gold!`, 'success');
      modal.classList.add('hidden');
      this.fishing.state = 'idle';
      this.updateHUD();
    };

    modal.classList.remove('hidden');
  }

  updateHUD() {
    document.getElementById('hud-gold-amount').innerText = this.gold;

    const activeBait = window.GAME_DATA.baits.find(b => b.id === this.fishing.activeBaitId) || window.GAME_DATA.baits[0];
    const baitCountStr = activeBait.isReusable ? '⭐ Lure' : (activeBait.id === 'none' ? 'None' : `x${activeBait.count}`);
    document.getElementById('hud-active-bait-name').innerText = `${activeBait.name} (${baitCountStr})`;

    const activeRod = window.GAME_DATA.rods.find(r => r.id === this.player.activeRodId) || window.GAME_DATA.rods[0];
    document.getElementById('hud-active-rod-name').innerText = `${activeRod.name} (T${activeRod.tier})`;
  }

  showToast(text, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = text;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  animate(timestamp) {
    requestAnimationFrame(this.animate);

    // Auto-pause rendering when tab is hidden or minimized (cools laptop while coding/alt-tabbing)
    if (document.hidden) {
      return;
    }

    // Smooth FPS cap at ~45 FPS to prevent 100% CPU/GPU saturation
    if (!this.lastFrameTime) this.lastFrameTime = timestamp || performance.now();
    const elapsed = (timestamp || performance.now()) - this.lastFrameTime;
    if (elapsed < 21) {
      return;
    }
    this.lastFrameTime = (timestamp || performance.now()) - (elapsed % 21);

    const delta = Math.min(this.clock.getDelta(), 0.08);

    // Charge cast power animation
    if (this.fishing.state === 'charging') {
      this.fishing.castPower += this.fishing.castDirection * delta * 75;
      if (this.fishing.castPower >= 100) {
        this.fishing.castPower = 100;
        this.fishing.castDirection = -1;
      } else if (this.fishing.castPower <= 10) {
        this.fishing.castPower = 10;
        this.fishing.castDirection = 1;
      }
      document.getElementById('cast-bar-fill').style.height = `${this.fishing.castPower}%`;
    }

    // Update realistic atmospheric sky, celestial sun/moon, twinkling stars, shooting meteors & clouds
    if (this.sky) {
      this.sky.update(delta, this.dirLight, this.ambientLight, this.scene.fog);
    }

    // Update island & environment (realistic ocean waves, caustics, sun glitter, sand & foliage)
    this.island.update(delta, this.sky);

    // Update realistic human player with dynamic rod bending & tension
    const isFishingActive = (this.fishing.state === 'reeling');
    this.player.update(delta, isFishingActive, this.fishing.state, this.fishing.reelState.tension);

    // Update fishing mechanics
    this.fishing.updateFishing(delta);

    // Check prompt for nearest tree or shop
    this.updateContextPrompts();

    // Update archipelago map real-time pin & HUD navigation waypoint tracker
    if (this.map) {
      this.map.update(delta);
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);

    // Render 3D Fish Showcase in Catch Modal if modal is open!
    if (this.fishViewerRenderer && !document.getElementById('catch-modal').classList.contains('hidden') && this.currentFishModel) {
      this.fishTime += delta;
      this.currentFishModel.rotation.y += delta * 0.75;
      if (window.RealisticFish) {
        window.RealisticFish.animateSwimming(this.currentFishModel, this.fishTime, 1.0, 1.0);
      } else if (this.fishTailJoint) {
        this.fishTailJoint.rotation.y = Math.sin(this.fishTime * 6.5) * 0.45;
      }
      this.fishViewerRenderer.render(this.fishViewerScene, this.fishViewerCamera);
    }
  }

  updateContextPrompts() {
    const px = this.player.position.x;
    const pz = this.player.position.z;
    const promptElem = document.getElementById('interaction-prompt');

    // 1. Check shop / campfire
    for (const inter of this.island.interactables) {
      const dist = Math.hypot(inter.x - px, inter.z - pz);
      if (dist <= inter.radius) {
        promptElem.innerText = inter.prompt;
        promptElem.classList.remove('hidden');
        return;
      }
    }

    // 2. Check nearest tree
    const nearestTree = this.island.getNearestTree(px, pz, 4.0);
    if (nearestTree) {
      const treeName = window.GAME_DATA.trees[nearestTree.type].name;
      promptElem.innerText = `[E] Shake ${treeName} (Forage Bait & Fruit)`;
      promptElem.classList.remove('hidden');
      return;
    }

    promptElem.classList.add('hidden');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
