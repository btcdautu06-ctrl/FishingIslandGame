// Beach Sand Crabs Ecosystem: Animated 3D Crustaceans, Sideways Scuttling,
// Defensive Pincer Snapping, Sand Burrowing, and Interactive Catching for Gold & Bait!

class CrabManager {
  constructor(scene, island) {
    this.scene = scene;
    this.island = island;
    this.crabs = [];
    this.time = 0;

    this.materials = {
      shellRed: new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.5, metalness: 0.1 }),
      shellOrange: new THREE.MeshStandardMaterial({ color: 0xe17055, roughness: 0.55 }),
      shellGhost: new THREE.MeshStandardMaterial({ color: 0xfdcb6e, roughness: 0.6 }),
      clawTip: new THREE.MeshStandardMaterial({ color: 0xffeaa7, roughness: 0.4 }),
      clawRed: new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.45 }),
      legs: new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.6 }),
      eyeStalk: new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.6 }),
      eyePupil: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 }),
      eyeGlint: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      shadow: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 })
    };

    this.initCrabs();
  }

  // Build authentic 3D articulated crab model
  buildCrabModel(type = 'red_rock') {
    const crabGroup = new THREE.Group();
    const shellMat = (type === 'coral_ghost') ? this.materials.shellGhost : this.materials.shellRed;

    // 1. Carapace / Shell
    const shellGeo = new THREE.CylinderGeometry(0.30, 0.36, 0.12, 6);
    shellGeo.scale(1.25, 1.0, 0.85); // Wider than long (classic crab anatomy)
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.position.y = 0.18;
    shell.castShadow = true;
    crabGroup.add(shell);

    // Carapace ridge bumps
    const bumpGeo = new THREE.SphereGeometry(0.08, 6, 6);
    bumpGeo.scale(1.2, 0.5, 0.8);
    [-0.15, 0.15].forEach(bx => {
      const bump = new THREE.Mesh(bumpGeo, this.materials.shellOrange);
      bump.position.set(bx, 0.24, -0.02);
      crabGroup.add(bump);
    });

    // 2. Eye Stalks & Glossy Eyes
    const eyes = [];
    [-0.09, 0.09].forEach(ex => {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.15, 6), this.materials.eyeStalk);
      stalk.position.set(ex, 0.28, 0.2);
      stalk.rotation.x = 0.2;
      crabGroup.add(stalk);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), this.materials.eyePupil);
      pupil.position.set(ex, 0.36, 0.22);
      crabGroup.add(pupil);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), this.materials.eyeGlint);
      glint.position.set(ex + 0.015, 0.38, 0.25);
      crabGroup.add(glint);

      eyes.push(stalk);
    });

    // 3. Articulated Front Pincers / Claws (Chelae)
    const claws = {};
    [-1, 1].forEach(side => {
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 0.32, 0.18, 0.18);

      // Upper arm (merus)
      const merus = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 6), this.materials.legs);
      merus.position.set(side * 0.12, 0.06, 0.1);
      merus.rotation.z = -side * 0.7;
      merus.rotation.y = side * 0.3;
      armGroup.add(merus);

      // Claw palm (manus)
      const clawPalmGroup = new THREE.Group();
      clawPalmGroup.position.set(side * 0.25, 0.12, 0.18);

      const palmGeo = new THREE.BoxGeometry(0.14, 0.12, 0.22);
      const palm = new THREE.Mesh(palmGeo, this.materials.clawRed);
      palm.position.set(0, 0, 0.08);
      clawPalmGroup.add(palm);

      // Lower fixed pincer jaw
      const lowerJaw = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 5), this.materials.clawTip);
      lowerJaw.rotation.x = Math.PI / 2;
      lowerJaw.position.set(-side * 0.02, -0.02, 0.26);
      clawPalmGroup.add(lowerJaw);

      // Upper movable pincer jaw (dactylus)
      const upperJaw = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 5), this.materials.clawTip);
      upperJaw.rotation.x = Math.PI / 2 - 0.3;
      upperJaw.position.set(-side * 0.02, 0.05, 0.24);
      clawPalmGroup.add(upperJaw);

      armGroup.add(clawPalmGroup);
      crabGroup.add(armGroup);

      claws[side === -1 ? 'left' : 'right'] = {
        armGroup: armGroup,
        clawPalm: clawPalmGroup,
        upperJaw: upperJaw
      };
    });

    // 4. Six Jointed Walking Legs (3 on left, 3 on right)
    const legs = [];
    [-1, 1].forEach(side => {
      [-0.14, 0.0, 0.14].forEach((lz, idx) => {
        const legJoint = new THREE.Group();
        legJoint.position.set(side * 0.30, 0.14, lz);

        // Upper leg (femur) extending out
        const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.32, 6), this.materials.legs);
        femur.position.set(side * 0.15, 0.06, 0);
        femur.rotation.z = -side * 0.65;
        legJoint.add(femur);

        // Lower leg (tibia) pointing down to sand
        const tibia = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.32, 5), this.materials.legs);
        tibia.position.set(side * 0.28, -0.09, 0);
        tibia.rotation.z = side * 0.55;
        legJoint.add(tibia);

        crabGroup.add(legJoint);
        legs.push({ joint: legJoint, side: side, index: idx });
      });
    });

    // 5. Soft Ground Shadow
    const shadowGeo = new THREE.CircleGeometry(0.42, 8);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadow = new THREE.Mesh(shadowGeo, this.materials.shadow);
    shadow.position.y = 0.02;
    crabGroup.add(shadow);

    const scale = 0.85 + Math.random() * 0.35;
    crabGroup.scale.set(scale, scale, scale);

    return {
      root: crabGroup,
      claws: claws,
      legs: legs
    };
  }

  // Populate beach shores across the Archipelago
  initCrabs() {
    // 1. Haven Main Island Beaches (14 crabs)
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const r = 70 + Math.random() * 11;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = this.island.getHeight(x, z);

      if (y > 0.35 && y < 1.9) {
        this.spawnCrab(x, y, z, 'red_rock');
      }
    }

    // 2. Coral Atoll Shallows Beaches (8 ghost crabs)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const r = 38 + Math.random() * 9;
      const x = this.island.coralCenter.x + Math.cos(angle) * r;
      const z = this.island.coralCenter.y + Math.sin(angle) * r;
      const y = this.island.getHeight(x, z);

      if (y > 0.35 && y < 2.2) {
        this.spawnCrab(x, y, z, 'coral_ghost');
      }
    }
  }

  spawnCrab(x, y, z, type) {
    const model = this.buildCrabModel(type);
    model.root.position.set(x, y, z);
    this.scene.add(model.root);

    this.crabs.push({
      model: model,
      type: type,
      x: x,
      y: y,
      z: z,
      vx: (Math.random() - 0.5) * 0.6,
      vz: (Math.random() - 0.5) * 0.6,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 2.0 + Math.random() * 4.0,
      state: 'wander', // 'wander', 'alert', 'flee', 'burrow'
      alive: true,
      respawnTimer: 0,
      scuttleCycle: Math.random() * Math.PI * 2,
      pincerTimer: Math.random() * 2
    });
  }

  // Live animation, sideways scuttling AI, and player avoidance
  update(delta, playerPos) {
    this.time += delta;

    for (const crab of this.crabs) {
      if (!crab.alive) {
        crab.respawnTimer -= delta;
        if (crab.respawnTimer <= 0) {
          this.respawnCrab(crab);
        }
        continue;
      }

      // Check distance to player
      let distToPlayer = 999;
      let pDx = 0, pDz = 0;
      if (playerPos) {
        pDx = crab.x - playerPos.x;
        pDz = crab.z - playerPos.z;
        distToPlayer = Math.hypot(pDx, pDz);
      }

      // AI States: Alert (threat stance) -> Flee -> Wander
      if (distToPlayer < 2.0) {
        crab.state = 'flee';
      } else if (distToPlayer < 4.2) {
        crab.state = 'alert';
      } else {
        crab.state = 'wander';
      }

      if (crab.state === 'flee') {
        // Scuttle fast sideways AWAY from player
        const fleeAngle = Math.atan2(pDz, pDx);
        const speed = 2.2 * delta;
        crab.vx = Math.cos(fleeAngle) * speed;
        crab.vz = Math.sin(fleeAngle) * speed;
        crab.scuttleCycle += delta * 18;

        // Turn perpendicular (sideways crab walk!)
        crab.model.root.rotation.y = fleeAngle + Math.PI / 2;

        // Threat claws high
        crab.model.claws.left.armGroup.rotation.x = 0.8 + Math.sin(this.time * 8) * 0.3;
        crab.model.claws.right.armGroup.rotation.x = 0.8 + Math.cos(this.time * 8) * 0.3;
        crab.model.claws.left.upperJaw.rotation.x = Math.PI / 2 - 0.4 - Math.sin(this.time * 12) * 0.2;
        crab.model.claws.right.upperJaw.rotation.x = Math.PI / 2 - 0.4 - Math.cos(this.time * 12) * 0.2;

      } else if (crab.state === 'alert') {
        // Stop and raise pincers in defensive threat posture facing the player
        crab.vx = 0;
        crab.vz = 0;
        const faceAngle = Math.atan2(-pDz, -pDx);
        crab.model.root.rotation.y = THREE.MathUtils.lerp(crab.model.root.rotation.y, faceAngle, 0.15);

        // Raise pincers high and snap jaws
        const alertLift = 0.9 + Math.sin(this.time * 6) * 0.25;
        crab.model.claws.left.armGroup.rotation.x = alertLift;
        crab.model.claws.right.armGroup.rotation.x = alertLift;
        crab.model.claws.left.upperJaw.rotation.x = Math.PI / 2 - 0.5 + Math.sin(this.time * 9) * 0.25;
        crab.model.claws.right.upperJaw.rotation.x = Math.PI / 2 - 0.5 + Math.cos(this.time * 9) * 0.25;

      } else {
        // Normal peaceful wander
        crab.wanderTimer -= delta;
        if (crab.wanderTimer <= 0) {
          crab.wanderTimer = 2.5 + Math.random() * 4.5;
          crab.wanderAngle = Math.random() * Math.PI * 2;
        }

        const moveSpeed = 0.65 * delta;
        crab.vx = Math.cos(crab.wanderAngle) * moveSpeed;
        crab.vz = Math.sin(crab.wanderAngle) * moveSpeed;
        crab.scuttleCycle += delta * 7;

        // Face 90 degrees offset from movement vector (crabs walk sideways!)
        crab.model.root.rotation.y = crab.wanderAngle + Math.PI / 2;

        // Relaxed resting claws
        crab.model.claws.left.armGroup.rotation.x = 0.1 + Math.sin(this.time * 2) * 0.08;
        crab.model.claws.right.armGroup.rotation.x = 0.1 + Math.cos(this.time * 2) * 0.08;
        crab.model.claws.left.upperJaw.rotation.x = Math.PI / 2 - 0.2;
        crab.model.claws.right.upperJaw.rotation.x = Math.PI / 2 - 0.2;
      }

      // Apply movement
      crab.x += crab.vx;
      crab.z += crab.vz;

      // Keep crab safely on sandy land above lethal water
      const groundY = this.island.getHeight(crab.x, crab.z);
      if (groundY <= 0.38) {
        // Back off from deep water!
        crab.x -= crab.vx * 2;
        crab.z -= crab.vz * 2;
        crab.wanderAngle += Math.PI;
      } else {
        crab.y = groundY;
      }

      crab.model.root.position.set(crab.x, crab.y, crab.z);

      // 6-Leg alternating tripod scuttle gait animation
      const legCycle = crab.scuttleCycle;
      crab.model.legs.forEach(leg => {
        const phase = (leg.side === 1 ? 0 : Math.PI) + (leg.index % 2 === 0 ? 0 : Math.PI);
        const wave = Math.sin(legCycle + phase);
        leg.joint.rotation.z = leg.side * wave * 0.25;
        leg.joint.rotation.y = wave * 0.15;
      });
    }
  }

  // Find nearest crab to player for foraging / spearing interaction
  getNearestCrab(px, pz, maxDist = 2.4) {
    let nearest = null;
    let minDist = maxDist;

    for (const crab of this.crabs) {
      if (!crab.alive) continue;
      const d = Math.hypot(crab.x - px, crab.z - pz);
      if (d < minDist) {
        minDist = d;
        nearest = crab;
      }
    }
    return nearest;
  }

  // Catch / forage a crab
  catchCrab(crab, game) {
    if (!crab || !crab.alive) return;
    crab.alive = false;
    crab.respawnTimer = 16.0 + Math.random() * 8.0;

    // Disappear into creel with puff
    crab.model.root.position.y = -20;

    // Play snapping sound & coin
    if (window.soundSystem) {
      window.soundSystem.playCrabSnap();
      window.soundSystem.playCoin();
    }

    // Award +20 Gold Coins & Shore Crab Bait
    const goldEarned = 18 + Math.floor(Math.random() * 12);
    if (game) {
      game.addGold(goldEarned);

      // Add crab bait to inventory
      const crabBait = window.GAME_DATA.baits.find(b => b.id === 'crab_meat');
      if (crabBait) {
        crabBait.count = (crabBait.count || 0) + 1;
        game.saveBaits();
      }

      game.updateHUD();
      game.showToast(`🦀 Caught a Shore Crab! +${goldEarned}g & +1x Fresh Crab Meat Bait!`, 'success');
    }
  }

  respawnCrab(crab) {
    let newX = crab.x + (Math.random() - 0.5) * 12;
    let newZ = crab.z + (Math.random() - 0.5) * 12;
    let newY = this.island.getHeight(newX, newZ);

    if (newY > 0.4 && newY < 2.0) {
      crab.x = newX;
      crab.y = newY;
      crab.z = newZ;
      crab.alive = true;
      crab.model.root.position.set(crab.x, crab.y, crab.z);
    } else {
      crab.respawnTimer = 2.0; // Retry
    }
  }
}

window.CrabManager = CrabManager;
