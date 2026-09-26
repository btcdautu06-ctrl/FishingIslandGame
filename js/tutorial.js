// Interactive Onboarding Tutorial & Angler Academy System
// Features: Interactive quest progression, on-screen dynamic HUD tracker,
// rich multi-tab visual guide modal, device-adaptive controls, and reward payout!

class TutorialSystem {
  constructor(game) {
    this.game = game;
    this.steps = [
      {
        id: 'move_jump',
        title: 'Move & Jump',
        icon: '🏃',
        descPC: 'Move around using WASD and press [Space] to leap!',
        descMobile: 'Move using the Virtual Joystick and tap [Jump]!',
        hint: 'Test your agility on the sandy shores and docks.'
      },
      {
        id: 'deadly_water',
        title: 'Stay Dry: Water is Lethal!',
        icon: '☠️',
        descPC: 'You ONLY die when touching water! Stay on land, docks, and bridges.',
        descMobile: 'You ONLY die when touching water! Stay safely on solid ground.',
        hint: 'Jumping over land is safe, but falling into the sea means instant drowning!'
      },
      {
        id: 'shake_tree',
        title: 'Forage Bait from Trees',
        icon: '🌲',
        descPC: 'Approach any tree and press [E] to shake for free bait & fruit!',
        descMobile: 'Approach any tree and tap the [Action 👋] button to shake it!',
        hint: 'Over 240 trees across the island drop earthworms, crickets, and apples.'
      },
      {
        id: 'cast_line',
        title: 'Cast Your Fishing Line',
        icon: '🎣',
        descPC: 'Stand near the water and hold [Space] / [Cast] to charge distance!',
        descMobile: 'Stand near water and hold the [🎣 Cast] thumb button to charge power!',
        hint: 'Release when the power gauge reaches the green or gold zone.'
      },
      {
        id: 'catch_fish',
        title: 'Hook & Catch a Fish',
        icon: '🐟',
        descPC: 'Tap [Space] on STRIKE!, then hold [Space] to keep green bar on fish!',
        descMobile: 'Tap [STRIKE!] to hook, then hold [REEL] to keep the green bar on fish!',
        hint: 'Fill the circular progress bar to 100% to reel in your catch!'
      }
    ];

    this.currentStepIndex = 0;
    this.hasMoved = false;
    this.hasJumped = false;
    this.isCompleted = false;
    this.rewardClaimed = false;
    this.isMinimized = false;

    this.loadState();
    this.initUI();
    this.bindEvents();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('fishing_island_tutorial');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentStepIndex = Math.min(data.stepIndex || 0, this.steps.length);
        this.rewardClaimed = !!data.rewardClaimed;
        this.isCompleted = !!data.isCompleted;
        this.isMinimized = !!data.isMinimized;
      }
    } catch (e) {
      console.warn('Tutorial loadState error:', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem('fishing_island_tutorial', JSON.stringify({
        stepIndex: this.currentStepIndex,
        rewardClaimed: this.rewardClaimed,
        isCompleted: this.isCompleted,
        isMinimized: this.isMinimized
      }));
    } catch (e) {
      console.warn('Tutorial saveState error:', e);
    }
  }

  initUI() {
    // 1. Create on-screen floating Tutorial Quest Widget
    let widget = document.getElementById('tutorial-hud-widget');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'tutorial-hud-widget';
      widget.className = 'tutorial-hud-card';
      document.body.appendChild(widget);
    }

    this.updateHUDWidget();

    // 2. Highlight Tutorial Button on HUD
    const guideBtn = document.getElementById('controls-help-btn');
    if (guideBtn) {
      guideBtn.innerHTML = '🎓 Tutorial & Guide';
      if (!this.isCompleted) {
        guideBtn.classList.add('has-tutorial-badge');
      }
    }
  }

  updateHUDWidget() {
    const widget = document.getElementById('tutorial-hud-widget');
    if (!widget) return;

    if (this.rewardClaimed) {
      widget.classList.add('hidden');
      return;
    }

    widget.classList.remove('hidden');

    if (this.isMinimized) {
      const stepNum = Math.min(this.currentStepIndex + 1, this.steps.length);
      widget.innerHTML = `
        <div class="tutorial-hud-mini" id="tutorial-mini-btn" title="Expand Tutorial Quest">
          <span class="tutorial-mini-badge">🎓</span>
          <span class="tutorial-mini-text">Quest ${stepNum}/${this.steps.length}</span>
          <button class="tutorial-mini-expand">&plus;</button>
        </div>
      `;
      const miniBtn = document.getElementById('tutorial-mini-btn');
      if (miniBtn) {
        miniBtn.onclick = () => {
          this.isMinimized = false;
          this.saveState();
          this.updateHUDWidget();
        };
      }
      return;
    }

    const isPC = (this.game.controlMode !== 'mobile');
    const isAllDone = (this.currentStepIndex >= this.steps.length);

    if (isAllDone) {
      widget.innerHTML = `
        <div class="tutorial-hud-header">
          <div class="tutorial-hud-title">
            <span class="tutorial-icon-pulse">🎉</span>
            <span>Angler Academy Complete!</span>
          </div>
          <button class="tutorial-hud-min-btn" id="tutorial-btn-min" title="Minimize">&minus;</button>
        </div>
        <div class="tutorial-hud-body">
          <p class="tutorial-hud-desc">You mastered movement, foraging, and fishing!</p>
          <button id="tutorial-claim-btn" class="btn btn-gold tutorial-claim-btn">
            🎁 Claim 100 Gold + 15 Bait!
          </button>
        </div>
      `;
      const claimBtn = document.getElementById('tutorial-claim-btn');
      if (claimBtn) claimBtn.onclick = () => this.claimReward();
      const minBtn = document.getElementById('tutorial-btn-min');
      if (minBtn) minBtn.onclick = () => {
        this.isMinimized = true;
        this.saveState();
        this.updateHUDWidget();
      };
      return;
    }

    const step = this.steps[this.currentStepIndex];
    const desc = isPC ? step.descPC : step.descMobile;
    const progressPercent = Math.round((this.currentStepIndex / this.steps.length) * 100);

    widget.innerHTML = `
      <div class="tutorial-hud-header">
        <div class="tutorial-hud-title">
          <span class="tutorial-step-tag">Step ${this.currentStepIndex + 1}/${this.steps.length}</span>
          <span>${step.title}</span>
        </div>
        <div class="tutorial-hud-actions">
          <button id="tutorial-open-guide-btn" class="tutorial-help-icon" title="View Full Illustrated Guide">📖</button>
          <button id="tutorial-btn-min" class="tutorial-hud-min-btn" title="Minimize">&minus;</button>
        </div>
      </div>
      <div class="tutorial-hud-body">
        <div class="tutorial-hud-desc-wrap">
          <span class="tutorial-hud-icon">${step.icon}</span>
          <span class="tutorial-hud-desc">${desc}</span>
        </div>
        <div class="tutorial-hud-progress-bar">
          <div class="tutorial-hud-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>
    `;

    const openGuide = document.getElementById('tutorial-open-guide-btn');
    if (openGuide) openGuide.onclick = () => this.openTutorialModal(this.currentStepIndex);

    const minBtn = document.getElementById('tutorial-btn-min');
    if (minBtn) minBtn.onclick = () => {
      this.isMinimized = true;
      this.saveState();
      this.updateHUDWidget();
    };
  }

  // Bind live gameplay triggers to auto-advance tutorial
  bindEvents() {
    // 1. Move & Jump detection for Step 0
    const checkMovement = () => {
      if (this.currentStepIndex !== 0) return;
      if (this.game && this.game.player) {
        if (this.game.player.isMoving) this.hasMoved = true;
        if (!this.game.player.isGrounded) this.hasJumped = true;
        if (this.hasMoved && this.hasJumped) {
          this.advanceStep('move_jump');
        }
      }
    };
    setInterval(checkMovement, 200);

    // 2. Open Guide button in HUD
    const guideBtn = document.getElementById('controls-help-btn');
    if (guideBtn) {
      guideBtn.onclick = (e) => {
        e.preventDefault();
        this.openTutorialModal();
      };
    }
  }

  onTreeShaken() {
    if (this.currentStepIndex === 2) {
      this.advanceStep('shake_tree');
    }
  }

  onCastStarted() {
    // If player reaches casting step
    if (this.currentStepIndex === 1) {
      // If at deadly water step, casting means they understood they can fish from land!
      this.advanceStep('deadly_water');
    }
    if (this.currentStepIndex === 3) {
      this.advanceStep('cast_line');
    }
  }

  onFishCaught(fish) {
    if (this.currentStepIndex === 4) {
      this.advanceStep('catch_fish');
    }
  }

  advanceStep(stepId) {
    if (this.currentStepIndex >= this.steps.length) return;
    const current = this.steps[this.currentStepIndex];
    if (current && current.id === stepId) {
      this.currentStepIndex++;
      this.saveState();

      if (window.soundSystem) {
        if (this.currentStepIndex >= this.steps.length) {
          window.soundSystem.playFanfare('rare');
        } else {
          window.soundSystem.playCoin();
        }
      }

      if (this.currentStepIndex >= this.steps.length) {
        this.isCompleted = true;
        this.saveState();
        this.game.showToast('🎉 Angler Academy Complete! Claim your Reward!', 'success');
      } else {
        const nextStep = this.steps[this.currentStepIndex];
        this.game.showToast(`✅ Step Complete! Next: ${nextStep.title}`, 'info');
      }

      this.updateHUDWidget();
    }
  }

  claimReward() {
    if (this.rewardClaimed) return;
    this.rewardClaimed = true;
    this.isCompleted = true;
    this.saveState();

    // Reward: +100 Gold Coins + 10 Earthworms + 5 Crickets
    window.GAME_DATA.player.gold += 100;
    const worm = window.GAME_DATA.baits.find(b => b.id === 'worm');
    if (worm) worm.count += 10;
    const cricket = window.GAME_DATA.baits.find(b => b.id === 'cricket');
    if (cricket) cricket.count += 5;

    this.game.updateHUD();

    if (window.soundSystem) {
      window.soundSystem.playFanfare('legendary');
    }

    this.game.showToast('🎁 Claimed: 100 Gold, 10 Earthworms & 5 Crickets!', 'success');
    this.updateHUDWidget();

    const guideBtn = document.getElementById('controls-help-btn');
    if (guideBtn) guideBtn.classList.remove('has-tutorial-badge');
  }

  openTutorialModal(initialTabIndex = 0) {
    let modal = document.getElementById('tutorial-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tutorial-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const isPC = (this.game.controlMode !== 'mobile');

    modal.innerHTML = `
      <div class="modal-card tutorial-modal-card">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 26px;">🎓</span>
            <div>
              <h2 style="margin: 0; font-size: 20px; color: #ffeaa7;">Angler Academy & Field Guide</h2>
              <span style="font-size: 12px; color: #a4b0be;">Master fishing, deadly water survival & island secrets</span>
            </div>
          </div>
          <button class="modal-close-btn" id="tutorial-close-btn">&times;</button>
        </div>

        <!-- Tab Navigation Buttons -->
        <div class="tutorial-tabs-bar">
          <button class="tutorial-tab-btn active" data-tab="controls">🎮 Controls</button>
          <button class="tutorial-tab-btn" data-tab="water">☠️ Deadly Water</button>
          <button class="tutorial-tab-btn" data-tab="fishing">🎣 How to Fish</button>
          <button class="tutorial-tab-btn" data-tab="foraging">🌲 Trees & Market</button>
          <button class="tutorial-tab-btn" data-tab="quest">🏆 Academy Quest</button>
        </div>

        <div class="modal-body tutorial-modal-body">
          <!-- TAB 1: CONTROLS -->
          <div class="tutorial-tab-pane active" id="tab-controls">
            <div class="tutorial-platform-banner">
              <span>Current Platform: <strong>${isPC ? '🖥️ Desktop PC' : '📱 Mobile / Touch'}</strong></span>
              <button id="tutorial-toggle-platform" class="btn btn-outline btn-xs" style="padding: 4px 10px; font-size: 11px;">
                Switch View (${isPC ? 'Show Mobile' : 'Show PC'})
              </button>
            </div>

            <div id="tutorial-controls-content">
              ${this.renderControlsContent(isPC)}
            </div>
          </div>

          <!-- TAB 2: DEADLY WATER SURVIVAL -->
          <div class="tutorial-tab-pane" id="tab-water">
            <div class="deadly-water-spotlight">
              <div class="deadly-water-icon">🌊☠️</div>
              <div class="deadly-water-text">
                <h3>THE GOLDEN RULE: YOU ONLY DIE WHEN TOUCHING WATER!</h3>
                <p>
                  All dry land is <strong>100% safe</strong>! You can walk, sprint, and jump freely across sandy beaches, grassy meadows, hill peaks, wooden piers, and suspension bridges.
                </p>
                <div class="deadly-water-rules-grid">
                  <div class="water-rule-card safe">
                    <span class="rule-badge">✅ SAFE</span>
                    <h4>Solid Land & Docks</h4>
                    <p>Beach sand, rock cliffs, grass, wooden docks, and suspension bridges are completely dry and safe to walk or jump on.</p>
                  </div>
                  <div class="water-rule-card safe">
                    <span class="rule-badge">✅ SAFE</span>
                    <h4>Airborne Jumping</h4>
                    <p>Jumping into the air will never kill you. You only drown if your feet physically submerge into water level!</p>
                  </div>
                  <div class="water-rule-card lethal">
                    <span class="rule-badge">❌ LETHAL</span>
                    <h4>Ocean & Deep Waters</h4>
                    <p>Stepping off the beach into deep ocean water or falling from a high bridge into the sea results in instant drowning!</p>
                  </div>
                  <div class="water-rule-card lethal">
                    <span class="rule-badge">❌ LETHAL</span>
                    <h4>Volcanic Sulfur Caldera</h4>
                    <p>Falling into the bubbling geothermal pool on the Volcanic Island is fatal. Fish safely from the rim!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: HOW TO FISH -->
          <div class="tutorial-tab-pane" id="tab-fishing">
            <div class="fishing-guide-steps">
              <div class="fishing-step-card">
                <div class="fishing-step-num">1</div>
                <div class="fishing-step-icon">🎣</div>
                <h4>Cast the Line</h4>
                <p>Stand safely near the water edge. Hold <strong>${isPC ? '[Space] or [Cast]' : '[🎣 Cast] button'}</strong> to build power, then release to launch your bobber into deep water or fish ripples!</p>
              </div>
              <div class="fishing-step-card">
                <div class="fishing-step-num">2</div>
                <div class="fishing-step-icon">💥</div>
                <h4>Watch & Strike</h4>
                <p>Watch your 3D bobber bob in the waves. When a fish strikes with a splash and <strong>💥 STRIKE!</strong> appears, tap immediately to hook the fish!</p>
              </div>
              <div class="fishing-step-card">
                <div class="fishing-step-num">3</div>
                <div class="fishing-step-icon">🔄</div>
                <h4>Reel Minigame</h4>
                <p>Hold <strong>${isPC ? '[Space] or Left Mouse' : '[REEL]'}</strong> to lift the green catch bar and keep it centered on the fish. Fill the circular progress to 100% to catch it!</p>
              </div>
            </div>
          </div>

          <!-- TAB 4: TREES & FORAGING & NPC -->
          <div class="tutorial-tab-pane" id="tab-foraging">
            <div class="feature-overview-grid">
              <div class="feature-item">
                <span class="feature-icon">🌲</span>
                <div>
                  <h4>240+ Interactive Trees</h4>
                  <p>Approach trees and press <strong>${isPC ? '[E]' : '[Action 👋]'}</strong> to shake them! Collect live earthworms, fat crickets, juicy apples, and fresh coconuts.</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⚓</span>
                <div>
                  <h4>Captain Barnaby & Tackle Shop</h4>
                  <p>Visit the shop on Haven Pier to sell fish for Gold Coins, buy premium baits, and upgrade your fishing rods from Twig to Fiberglass, Carbon, and Titan!</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🌉</span>
                <div>
                  <h4>4 Archipelago Islands</h4>
                  <p>Cross arched suspension bridges or charter Barnaby's ferry to explore Coral Atoll, Volcanic Pine Crags, and Titan Leviathan Atoll.</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">☀️</span>
                <div>
                  <h4>Day & Night Cycles</h4>
                  <p>Rest by the campfire or click the <strong>Time Pill</strong> on your HUD to switch between Dawn, Midday, Sunset, and Night to catch nocturnal apex predators!</p>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 5: ACADEMY QUEST CHECKLIST -->
          <div class="tutorial-tab-pane" id="tab-quest">
            <div class="quest-checklist-wrap">
              <h3>🎓 Angler Academy Progress</h3>
              <p>Complete these fundamental challenges to become an Archipelago Master:</p>
              <div class="checklist-items">
                ${this.steps.map((s, idx) => {
                  const done = idx < this.currentStepIndex;
                  return `
                    <div class="checklist-row ${done ? 'done' : ''}">
                      <span class="checklist-box">${done ? '✅' : '⚪'}</span>
                      <span class="checklist-icon">${s.icon}</span>
                      <div class="checklist-info">
                        <strong>${s.title}</strong>
                        <span>${isPC ? s.descPC : s.descMobile}</span>
                      </div>
                      <span class="checklist-badge">${done ? 'COMPLETED' : 'IN PROGRESS'}</span>
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="quest-claim-area">
                ${this.rewardClaimed ? `
                  <div class="reward-claimed-banner">
                    <span>🎉 Reward Claimed: 100 Gold & 15 Baits Added to Inventory!</span>
                  </div>
                ` : `
                  <button id="modal-claim-btn" class="btn btn-gold" ${this.currentStepIndex >= this.steps.length ? '' : 'disabled'} style="font-size: 15px; padding: 12px 24px;">
                    🎁 Claim Academy Reward (100 Gold + 10 Worms + 5 Crickets)
                  </button>
                  ${this.currentStepIndex < this.steps.length ? '<span style="font-size: 12px; color: #a4b0be; margin-top: 6px;">Finish remaining steps to unlock this reward!</span>' : ''}
                `}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1);">
          <span style="font-size: 12px; color: #a4b0be;">Press [Esc] or click close to return to the game</span>
          <button class="btn btn-primary" id="tutorial-gotit-btn">🎣 Got It! Let's Fish</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    // Bind Close buttons
    const closeBtn = document.getElementById('tutorial-close-btn');
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
    const gotItBtn = document.getElementById('tutorial-gotit-btn');
    if (gotItBtn) gotItBtn.onclick = () => modal.classList.add('hidden');

    // Tab buttons
    const tabBtns = modal.querySelectorAll('.tutorial-tab-btn');
    const tabPanes = modal.querySelectorAll('.tutorial-tab-pane');
    tabBtns.forEach(btn => {
      btn.onclick = () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = modal.querySelector(`#tab-${btn.dataset.tab}`);
        if (target) target.classList.add('active');
      };
    });

    // Toggle platform view preview
    let previewPC = isPC;
    const toggleBtn = document.getElementById('tutorial-toggle-platform');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        previewPC = !previewPC;
        toggleBtn.innerHTML = `Switch View (${previewPC ? 'Show Mobile' : 'Show PC'})`;
        const bannerStrong = modal.querySelector('.tutorial-platform-banner strong');
        if (bannerStrong) bannerStrong.innerText = previewPC ? '🖥️ Desktop PC' : '📱 Mobile / Touch';
        const contentWrap = document.getElementById('tutorial-controls-content');
        if (contentWrap) contentWrap.innerHTML = this.renderControlsContent(previewPC);
      };
    }

    const modalClaimBtn = document.getElementById('modal-claim-btn');
    if (modalClaimBtn && this.currentStepIndex >= this.steps.length) {
      modalClaimBtn.onclick = () => {
        this.claimReward();
        this.openTutorialModal(4);
      };
    }
  }

  renderControlsContent(isPC) {
    if (isPC) {
      return `
        <div class="controls-guide-grid">
          <div class="control-box">
            <span class="control-key">W A S D</span>
            <span class="control-label">Walk / Run Movement</span>
          </div>
          <div class="control-box">
            <span class="control-key">Space</span>
            <span class="control-label">Jump & Strike / Reel Fish</span>
          </div>
          <div class="control-box">
            <span class="control-key">Shift</span>
            <span class="control-label">Sprint Mode (Fast Run)</span>
          </div>
          <div class="control-box">
            <span class="control-key">E</span>
            <span class="control-label">Interact / Shake Tree / Talk</span>
          </div>
          <div class="control-box">
            <span class="control-key">C</span>
            <span class="control-label">Cast Fishing Rod</span>
          </div>
          <div class="control-box">
            <span class="control-key">Mouse Drag</span>
            <span class="control-label">Look & Rotate 3D Camera</span>
          </div>
          <div class="control-box">
            <span class="control-key">V</span>
            <span class="control-label">Toggle 1st / 3rd Person POV</span>
          </div>
          <div class="control-box">
            <span class="control-key">M</span>
            <span class="control-label">Open Archipelago World Map</span>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="controls-guide-grid">
          <div class="control-box">
            <span class="control-key">🕹️ Virtual Joystick</span>
            <span class="control-label">Touch & drag bottom-left to move</span>
          </div>
          <div class="control-box">
            <span class="control-key">👆 Screen Drag</span>
            <span class="control-label">Drag right half of screen to rotate camera</span>
          </div>
          <div class="control-box">
            <span class="control-key">🎣 Cast Button</span>
            <span class="control-label">Big green button: Hold to charge, release to cast</span>
          </div>
          <div class="control-box">
            <span class="control-key">💥 STRIKE! / 🔄 REEL</span>
            <span class="control-label">Tap to hook, hold to keep green bar on fish</span>
          </div>
          <div class="control-box">
            <span class="control-key">🦘 Jump Button</span>
            <span class="control-label">Tap to leap over terrain and rocks</span>
          </div>
          <div class="control-box">
            <span class="control-key">👋 Action Button</span>
            <span class="control-label">Shake trees, talk to NPCs, open shops</span>
          </div>
        </div>
      `;
    }
  }
}

window.TutorialSystem = TutorialSystem;
