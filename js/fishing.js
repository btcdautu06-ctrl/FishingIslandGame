// Fishing Mechanics: Big Fish Physics, Dynamic Line Tension, Rod Bending, and Real 3D Fish Generation

class FishingSystem {
  constructor(scene, player, island, audio) {
    this.scene = scene;
    this.player = player;
    this.island = island;
    this.audio = audio;

    this.state = 'idle'; // 'idle', 'charging', 'cast_in_flight', 'waiting_bite', 'nibbling', 'hook_alert', 'reeling', 'caught'
    this.castPower = 0;
    this.castDirection = 1;
    this.bobberPos = new THREE.Vector3();
    this.targetBobberPos = new THREE.Vector3();
    this.fishShadowAngle = 0;
    this.fishThrashTimer = 0;

    // Reel minigame state
    this.reelState = {
      fishPos: 50,
      fishTarget: 50,
      fishVelocity: 0,
      barPos: 50,
      barSize: 24,
      barVelocity: 0,
      progress: 30,
      tension: 10,
      isHoldingReel: false
    };

    this.currentFish = null;
    this.activeBaitId = 'worm';
    this.biteTimer = 0;
    this.nibblesRemaining = 0;
    this.hookWindowTimer = 0;

    this.initVisuals();
  }

  initVisuals() {
    // 3D Bobber
    this.bobberGroup = new THREE.Group();
    const topGeo = new THREE.SphereGeometry(0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.3 });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    this.bobberGroup.add(topMesh);

    const botGeo = new THREE.SphereGeometry(0.2, 8, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const botMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const botMesh = new THREE.Mesh(botGeo, botMat);
    this.bobberGroup.add(botMesh);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), new THREE.MeshBasicMaterial({ color: 0xf1c40f }));
    antenna.position.y = 0.25;
    this.bobberGroup.add(antenna);

    this.bobberGroup.visible = false;
    this.scene.add(this.bobberGroup);

    // 3D Fishing Line
    const lineGeo = new THREE.BufferGeometry();
    const linePoints = new Float32Array(32 * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePoints, 3));
    this.lineMesh = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    this.lineMesh.visible = false;
    this.scene.add(this.lineMesh);

    // Underwater Fish Shadow (dynamic scale based on fish size category!)
    const shadowGeo = new THREE.RingGeometry(0.1, 0.8, 12);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x051b2c, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    this.fishShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.fishShadow.visible = false;
    this.scene.add(this.fishShadow);

    // Concentric Water Ripple
    this.rippleGeo = new THREE.RingGeometry(0.1, 0.25, 18);
    this.rippleGeo.rotateX(-Math.PI / 2);
    this.rippleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    this.ripple = new THREE.Mesh(this.rippleGeo, this.rippleMat);
    this.ripple.visible = false;
    this.scene.add(this.ripple);
    this.rippleScale = 1;

    // Interactive 3D Fish Controller (Underwater stalking, line struggle, and dynamic breaching)
    if (window.InteractiveFishController) {
      this.interactiveFish = new window.InteractiveFishController(this.scene, this.island, this.audio);
    }
  }

  startChargingCast() {
    if (this.state !== 'idle') return;
    this.state = 'charging';
    this.castPower = 10;
    this.castDirection = 1;
    document.getElementById('cast-bar-container').classList.remove('hidden');
  }

  releaseCast() {
    if (this.state !== 'charging') return;
    document.getElementById('cast-bar-container').classList.add('hidden');

    const rod = window.GAME_DATA.rods.find(r => r.id === this.player.activeRodId) || window.GAME_DATA.rods[0];
    const castDist = 8 + (this.castPower / 100) * rod.maxDistance;

    const angle = this.player.rotation;
    const targetX = this.player.position.x + Math.sin(angle) * castDist;
    const targetZ = this.player.position.z + Math.cos(angle) * castDist;

    const waterInfo = this.island.getWaterTypeAt(targetX, targetZ);
    if (!waterInfo) {
      this.state = 'idle';
      this.showToast('Cast landed on land! Aim toward the ocean or freshwater pond.', 'warning');
      return;
    }

    this.waterLocation = waterInfo;
    this.targetBobberPos.set(targetX, waterInfo.waterY, targetZ);

    this.bobberPos.copy(this.player.getRodTipWorldPos());
    this.bobberGroup.position.copy(this.bobberPos);
    this.bobberGroup.visible = true;
    this.lineMesh.visible = true;

    this.castFlightProgress = 0;
    this.castStartPos = this.bobberPos.clone();
    this.state = 'cast_in_flight';

    this.audio.playCast();
  }

  updateCastFlight(delta) {
    this.castFlightProgress += delta * 2.2;
    if (this.castFlightProgress >= 1.0) {
      this.castFlightProgress = 1.0;
      this.bobberPos.copy(this.targetBobberPos);
      this.bobberGroup.position.copy(this.bobberPos);

      this.triggerSplash(this.bobberPos);
      this.audio.playSplash(false);

      this.prepareBiteCycle();
      this.state = 'waiting_bite';
      return;
    }

    const p = this.castFlightProgress;
    this.bobberPos.x = THREE.MathUtils.lerp(this.castStartPos.x, this.targetBobberPos.x, p);
    this.bobberPos.z = THREE.MathUtils.lerp(this.castStartPos.z, this.targetBobberPos.z, p);
    const baseY = THREE.MathUtils.lerp(this.castStartPos.y, this.targetBobberPos.y, p);
    const arcHeight = 4.8 * Math.sin(p * Math.PI);
    this.bobberPos.y = baseY + arcHeight;

    this.bobberGroup.position.copy(this.bobberPos);
  }

  triggerSplash(pos, isHeavy = false) {
    this.ripple.position.set(pos.x, pos.y + 0.05, pos.z);
    this.ripple.scale.set(isHeavy ? 2.2 : 1, isHeavy ? 2.2 : 1, 1);
    this.ripple.visible = true;
    this.rippleScale = isHeavy ? 1.5 : 1;
    this.rippleMat.opacity = 0.85;
  }

  prepareBiteCycle() {
    this.currentFish = this.rollFish();
    if (this.interactiveFish) {
      this.interactiveFish.setTargetFish(this.currentFish);
    }
    const bait = window.GAME_DATA.baits.find(b => b.id === this.activeBaitId) || window.GAME_DATA.baits[0];

    const baseWait = 3.2 + Math.random() * 4.2;
    this.biteTimer = baseWait / bait.biteSpeed;
    this.nibblesRemaining = 1 + Math.floor(Math.random() * 3);

    // Scale shadow based on fish size category!
    let shadowScale = 1.0;
    if (this.currentFish.sizeCategory === 'Large') shadowScale = 1.6;
    else if (this.currentFish.sizeCategory === 'Monster') shadowScale = 2.4;
    else if (this.currentFish.sizeCategory === 'Colossal' || this.currentFish.sizeCategory === 'Titan') shadowScale = 3.6;

    this.fishShadow.scale.set(shadowScale, shadowScale * 1.5, 1);

    this.fishShadowAngle = Math.random() * Math.PI * 2;
    this.fishShadowDist = 5.5;
    this.fishShadow.position.set(
      this.bobberPos.x + Math.cos(this.fishShadowAngle) * this.fishShadowDist,
      this.waterLocation.waterY - 0.2,
      this.bobberPos.z + Math.sin(this.fishShadowAngle) * this.fishShadowDist
    );
    this.fishShadow.visible = true;
  }

  rollFish() {
    const habitat = this.waterLocation.type;
    const currentTime = window.game ? window.game.timeOfDay : 'day';
    const rod = window.GAME_DATA.rods.find(r => r.id === this.player.activeRodId) || window.GAME_DATA.rods[0];
    const bait = window.GAME_DATA.baits.find(b => b.id === this.activeBaitId) || window.GAME_DATA.baits[0];

    const luck = rod.luckBonus * bait.luckBonus;

    const candidates = window.GAME_DATA.fish.filter(f => {
      const habitatMatch = f.habitat === 'any_water' || f.habitat === habitat ||
        (habitat === 'ocean_deep' && f.habitat === 'ocean_shore');
      if (!habitatMatch) return false;
      if (f.timeOfDay !== 'all' && f.timeOfDay !== currentTime) return false;
      return true;
    });

    if (candidates.length === 0) return window.GAME_DATA.fish[0];

    const weighted = [];
    for (const f of candidates) {
      let weight = 100;
      if (f.rarity === 'common') weight = 100;
      else if (f.rarity === 'uncommon') weight = 55 * Math.sqrt(luck);
      else if (f.rarity === 'rare') weight = 24 * luck;
      else if (f.rarity === 'epic') weight = 10 * (luck * 1.5);
      else if (f.rarity === 'legendary') weight = 3.5 * (luck * 2.2);
      else if (f.rarity === 'colossal') weight = 1.8 * (luck * 2.8);

      if (f.preferredBait.includes(this.activeBaitId)) {
        weight *= 2.5;
      }

      weighted.push({ fish: f, weight: Math.max(1, weight) });
    }

    const totalWeight = weighted.reduce((acc, w) => acc + w.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of weighted) {
      rand -= item.weight;
      if (rand <= 0) return item.fish;
    }

    return candidates[0];
  }

  updateFishing(delta) {
    if (this.interactiveFish) {
      this.interactiveFish.updateSplash(delta);
    }

    if (this.ripple.visible) {
      this.rippleScale += delta * 3.8;
      this.ripple.scale.set(this.rippleScale, this.rippleScale, 1);
      this.rippleMat.opacity = Math.max(0, 1 - (this.rippleScale / 5.0));
      if (this.rippleMat.opacity <= 0.05) this.ripple.visible = false;
    }

    if (this.bobberGroup.visible && this.state !== 'cast_in_flight') {
      const bobbingWave = Math.sin(Date.now() * 0.005) * 0.06;
      this.bobberGroup.position.y = this.waterLocation.waterY + bobbingWave;
    }

    // Line curve update
    if (this.lineMesh.visible && this.bobberGroup.visible) {
      const rodTip = this.player.getRodTipWorldPos();
      const bPos = this.bobberGroup.position;
      const posAttr = this.lineMesh.geometry.attributes.position;
      const count = 32;

      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const lx = THREE.MathUtils.lerp(rodTip.x, bPos.x, t);
        const lz = THREE.MathUtils.lerp(rodTip.z, bPos.z, t);
        const lyBase = THREE.MathUtils.lerp(rodTip.y, bPos.y, t);
        const sag = Math.sin(t * Math.PI) * (this.state === 'reeling' ? 0.15 : 1.1);
        posAttr.setXYZ(i, lx, lyBase - sag, lz);
      }
      posAttr.needsUpdate = true;
    }

    if (this.state === 'cast_in_flight') {
      this.updateCastFlight(delta);
    } else if (this.state === 'waiting_bite') {
      this.biteTimer -= delta;

      // Realistic 3D fish stalking underwater beneath bobber
      if (this.interactiveFish) {
        this.interactiveFish.updateStalking(this.bobberPos, delta, false);
      }

      if (this.fishShadow.visible) {
        this.fishShadowDist = Math.max(0.6, this.fishShadowDist - delta * 0.75);
        this.fishShadowAngle += delta * 1.5;
        this.fishShadow.position.set(
          this.bobberPos.x + Math.cos(this.fishShadowAngle) * this.fishShadowDist,
          this.waterLocation.waterY - 0.15,
          this.bobberPos.z + Math.sin(this.fishShadowAngle) * this.fishShadowDist
        );
      }

      if (this.biteTimer <= 0) {
        if (this.nibblesRemaining > 0) {
          this.nibblesRemaining--;
          this.bobberGroup.position.y -= 0.18;
          this.triggerSplash(this.bobberPos);
          this.audio.playNibble();
          if (this.interactiveFish) {
            this.interactiveFish.updateStalking(this.bobberPos, delta, true);
          }
          this.biteTimer = 0.8 + Math.random() * 1.2;
        } else {
          // BITE STRIKE ALERT!
          this.state = 'hook_alert';
          this.hookWindowTimer = 1.9;
          this.bobberGroup.position.y -= 0.45;
          this.triggerSplash(this.bobberPos, true);
          this.audio.playBiteAlert();
          if (this.interactiveFish) {
            this.interactiveFish.updateStalking(this.bobberPos, delta, true);
          }

          document.getElementById('strike-prompt').classList.remove('hidden');
        }
      }
    } else if (this.state === 'hook_alert') {
      this.hookWindowTimer -= delta;
      if (this.interactiveFish) {
        this.interactiveFish.updateStalking(this.bobberPos, delta, true);
      }
      if (this.hookWindowTimer <= 0) {
        this.cancelFishing('The fish got away!');
        this.consumeBait();
      }
    } else if (this.state === 'reeling') {
      // 3D Fighting Fish: physical line struggle and airborne breaching jumps!
      if (this.interactiveFish) {
        this.interactiveFish.updateReeling(this.bobberPos, delta, this.reelState.tension, this.reelState.progress);
      }
      this.updateReelMinigame(delta);
    }
  }

  attemptHook() {
    if (this.state === 'hook_alert') {
      document.getElementById('strike-prompt').classList.add('hidden');
      this.consumeBait();
      this.startReelMinigame();
    } else if (this.state === 'waiting_bite' || this.state === 'charging') {
      this.cancelFishing('Reeled too early! The fish was spooked.');
    }
  }

  consumeBait() {
    const bait = window.GAME_DATA.baits.find(b => b.id === this.activeBaitId);
    if (bait && !bait.isReusable && bait.count > 0 && bait.id !== 'none') {
      bait.count--;
      if (bait.count <= 0) this.activeBaitId = 'none';
      if (window.game) window.game.updateHUD();
    }
  }

  startReelMinigame() {
    this.state = 'reeling';
    this.fishShadow.visible = false;

    const rod = window.GAME_DATA.rods.find(r => r.id === this.player.activeRodId) || window.GAME_DATA.rods[0];
    const baseBarSize = 22 * rod.barSizeMultiplier;
    this.reelState.barSize = Math.min(50, baseBarSize);

    this.reelState.fishPos = 40;
    this.reelState.fishTarget = 50;
    this.reelState.fishVelocity = 0;
    this.reelState.barPos = 30;
    this.reelState.barVelocity = 0;
    this.reelState.progress = 35;
    this.reelState.tension = 20;

    document.getElementById('reel-container').classList.remove('hidden');
    document.getElementById('reel-catch-bar').style.height = `${this.reelState.barSize}%`;

    // Splash on hook
    this.audio.playSplash(true);
    this.triggerSplash(this.bobberPos, true);
  }

  setReelHolding(holding) {
    this.reelState.isHoldingReel = holding;
  }

  updateReelMinigame(delta) {
    const fight = this.currentFish.fight;
    const rod = window.GAME_DATA.rods.find(r => r.id === this.player.activeRodId) || window.GAME_DATA.rods[0];

    // Fish AI Movement
    if (Math.random() < fight.erraticness * 0.14) {
      if (fight.type === 'sinker') {
        this.reelState.fishTarget = Math.random() * 45;
      } else if (fight.type === 'floater') {
        this.reelState.fishTarget = 55 + Math.random() * 45;
      } else {
        this.reelState.fishTarget = Math.random() * 95;
      }
    }

    const fishDiff = this.reelState.fishTarget - this.reelState.fishPos;
    this.reelState.fishVelocity += Math.sign(fishDiff) * fight.speed * 190 * delta;
    this.reelState.fishVelocity *= 0.88;
    this.reelState.fishPos += this.reelState.fishVelocity * delta;
    this.reelState.fishPos = Math.max(0, Math.min(95, this.reelState.fishPos));

    // Player Catch Bar Physics
    const gravity = -140;
    const reelLift = 265;

    if (this.reelState.isHoldingReel) {
      this.reelState.barVelocity += reelLift * delta;
      this.audio.playReelClick();
    } else {
      this.reelState.barVelocity += gravity * delta;
    }

    this.reelState.barVelocity *= 0.90;
    this.reelState.barPos += this.reelState.barVelocity * delta;

    if (this.reelState.barPos < 0) {
      this.reelState.barPos = 0;
      this.reelState.barVelocity = -this.reelState.barVelocity * 0.25;
    }
    const maxBarTop = 100 - this.reelState.barSize;
    if (this.reelState.barPos > maxBarTop) {
      this.reelState.barPos = maxBarTop;
      this.reelState.barVelocity = 0;
    }

    const barBottom = this.reelState.barPos;
    const barTop = this.reelState.barPos + this.reelState.barSize;
    const isFishInBar = (this.reelState.fishPos >= barBottom - 4 && this.reelState.fishPos <= barTop + 4);

    if (isFishInBar) {
      this.reelState.progress += delta * (22 * rod.reelSpeed);
      this.reelState.tension = Math.max(5, this.reelState.tension - delta * 18);
      document.getElementById('reel-catch-bar').classList.add('active');
    } else {
      this.reelState.progress -= delta * 15;
      if (this.reelState.isHoldingReel) {
        this.reelState.tension += delta * (32 - rod.tensionCap * 0.32);
        // Play line tension whine sound!
        this.audio.playTensionWhine(this.reelState.tension);
      }
      document.getElementById('reel-catch-bar').classList.remove('active');
    }

    // Occasional thrashing splash in water when reeling big fish
    this.fishThrashTimer -= delta;
    if (this.fishThrashTimer <= 0) {
      this.fishThrashTimer = 1.8 + Math.random() * 2.5;
      if (this.currentFish.sizeCategory === 'Monster' || this.currentFish.sizeCategory === 'Colossal' || this.currentFish.sizeCategory === 'Titan') {
        this.audio.playSplash(true);
        this.triggerSplash(this.bobberPos, true);
      }
    }

    document.getElementById('reel-catch-bar').style.bottom = `${this.reelState.barPos}%`;
    document.getElementById('reel-fish-icon').style.bottom = `${this.reelState.fishPos}%`;
    document.getElementById('reel-progress-fill').style.height = `${this.reelState.progress}%`;
    document.getElementById('reel-tension-fill').style.height = `${this.reelState.tension}%`;

    // Tension warning visual
    const tensionFill = document.getElementById('reel-tension-fill');
    if (this.reelState.tension > 75) {
      tensionFill.style.background = '#e74c3c';
    } else {
      tensionFill.style.background = 'linear-gradient(to top, #2ecc71, #e74c3c)';
    }

    // Line Snap Check
    if (this.reelState.tension >= 100) {
      this.audio.playLineSnap();
      this.cancelFishing('Snap! The line tension was too high and broke!');
      return;
    }

    // Escape Check
    if (this.reelState.progress <= 0) {
      this.cancelFishing('The fish struggled free and escaped into the deep!');
      return;
    }

    // Catch Success!
    if (this.reelState.progress >= 100) {
      this.finishCatchSuccess();
    }
  }

  finishCatchSuccess() {
    this.state = 'caught';
    document.getElementById('reel-container').classList.add('hidden');
    this.bobberGroup.visible = false;
    this.lineMesh.visible = false;
    if (this.interactiveFish) {
      this.interactiveFish.hide();
    }

    const f = this.currentFish;
    const sizeRange = f.maxSize - f.minSize;
    const sizeCm = +(f.minSize + Math.random() * sizeRange).toFixed(1);

    // Realistic weight curve: mass scales with cubic volume of fish!
    // E.g. a 350cm fish weighs hundreds of kg, a 600cm shark weighs over 1500kg!
    const weightKg = +(Math.pow(sizeCm / 100, 3.1) * 11.5).toFixed(1);

    const sizeBonus = Math.floor(((sizeCm - f.minSize) / sizeRange) * f.basePrice * 0.6);
    const totalGold = f.basePrice + sizeBonus;

    let isRecord = false;
    const records = JSON.parse(localStorage.getItem('fishing_island_records') || '{}');
    if (!records[f.id] || sizeCm > records[f.id]) {
      records[f.id] = sizeCm;
      localStorage.setItem('fishing_island_records', JSON.stringify(records));
      isRecord = true;
    }

    const compendium = JSON.parse(localStorage.getItem('fishing_island_compendium') || '{}');
    compendium[f.id] = (compendium[f.id] || 0) + 1;
    localStorage.setItem('fishing_island_compendium', JSON.stringify(compendium));

    this.audio.playFanfare(f.rarity);

    if (window.game) {
      window.game.showCatchModal({
        fish: f,
        sizeCm: sizeCm,
        weightKg: weightKg,
        gold: totalGold,
        isRecord: isRecord
      });
    }
  }

  cancelFishing(message) {
    this.state = 'idle';
    document.getElementById('strike-prompt').classList.add('hidden');
    document.getElementById('reel-container').classList.add('hidden');
    document.getElementById('cast-bar-container').classList.add('hidden');
    this.bobberGroup.visible = false;
    this.lineMesh.visible = false;
    this.fishShadow.visible = false;
    if (this.interactiveFish) {
      this.interactiveFish.hide();
    }

    if (message) this.showToast(message, 'warning');
  }

  showToast(text, type = 'info') {
    if (window.game) window.game.showToast(text, type);
  }
}

window.FishingSystem = FishingSystem;
