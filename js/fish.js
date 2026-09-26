// Realistic 3D Fish System: Biological Anatomy, Iridescent Scale Textures,
// Multi-Segment Skeletal Swimming Physics, Ambient Schools & Breaching Mechanics

class RealisticFish {
  constructor() {
    this.scaleCache = {};
    this.bodyTexCache = {};
  }

  // 1. PROCEDURAL FISH SCALE BUMP & IRIDESCENCE TEXTURE
  static getScaleTexture() {
    if (this._scaleTex) return this._scaleTex;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    // Overlapping cycloid scale pattern
    const rows = 16;
    const cols = 16;
    const dx = 256 / cols;
    const dy = 256 / rows;

    for (let r = 0; r <= rows; r++) {
      const offsetX = (r % 2 === 0) ? 0 : dx * 0.5;
      for (let c = -1; c <= cols + 1; c++) {
        const cx = c * dx + offsetX;
        const cy = r * dy;

        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, dx * 0.75);
        grad.addColorStop(0.0, '#ffffff');
        grad.addColorStop(0.5, '#999999');
        grad.addColorStop(0.9, '#444444');
        grad.addColorStop(1.0, '#222222');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, dx * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 4);
    this._scaleTex = tex;
    return tex;
  }

  // 2. PROCEDURAL COUNTERSHADED BODY TEXTURE (DORSAL CAMOUFLAGE & VENTRAL SILVERY BELLY)
  static createBodyTexture(fishData) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const colors = fishData.colors || {};
    const dorsalHex = colors.body ? ('#' + colors.body.toString(16).padStart(6, '0')) : '#2c3e50';
    const bellyHex = colors.belly ? ('#' + colors.belly.toString(16).padStart(6, '0')) : '#ecf0f1';

    // Vertical gradient: Dark Dorsal (top) -> Silvery Belly (bottom)
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, dorsalHex);
    grad.addColorStop(0.42, dorsalHex);
    grad.addColorStop(0.68, '#b2bec3');
    grad.addColorStop(1.0, bellyHex);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Lateral line sensory canal along flank
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(80, 138);
    ctx.bezierCurveTo(200, 142, 340, 132, 480, 140);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(80, 140);
    ctx.bezierCurveTo(200, 144, 340, 134, 480, 142);
    ctx.stroke();

    // Species specific patterns (stripes, spots, bands)
    if (colors.stripes || fishData.id === 'clownfish') {
      // Bold Clownfish or Damselfish bands
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 4;

      const bands = [160, 280, 410];
      bands.forEach(bx => {
        ctx.beginPath();
        ctx.ellipse(bx, 128, 22, 110, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    } else if (fishData.id === 'mackerel') {
      // Tiger Mackerel wavy dorsal ripples
      ctx.fillStyle = 'rgba(16, 44, 87, 0.85)';
      for (let x = 120; x < 440; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x + 10, 60);
        ctx.lineTo(x - 6, 100);
        ctx.lineTo(x + 4, 130);
        ctx.lineTo(x - 2, 130);
        ctx.lineTo(x - 12, 100);
        ctx.lineTo(x + 4, 60);
        ctx.lineTo(x - 6, 20);
        ctx.closePath();
        ctx.fill();
      }
    } else if (fishData.id === 'trout' || fishData.id === 'bass') {
      // Leopard / Parr trout specks
      ctx.fillStyle = 'rgba(44, 62, 80, 0.65)';
      for (let i = 0; i < 90; i++) {
        const sx = 100 + Math.random() * 320;
        const sy = 40 + Math.random() * 110;
        const sr = 2.0 + Math.random() * 3.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // 3. ANATOMICALLY DETAILED 3D ARTICULATED FISH BUILDER
  static createDetailedFish(fishData) {
    const root = new THREE.Group();
    root.name = 'RealisticFish_' + fishData.id;

    const colors = fishData.colors || { body: 0x3498db, fin: 0x2980b9, belly: 0xecf0f1 };
    const modelType = fishData.modelType || 'slender';

    const bodyTex = this.createBodyTexture(fishData);
    const scaleBumpTex = this.getScaleTexture();

    // Realistic wet fish slime coat material with iridescence
    const bodyMat = new THREE.MeshStandardMaterial({
      map: bodyTex,
      bumpMap: scaleBumpTex,
      bumpScale: 0.045,
      roughness: 0.24,
      metalness: 0.16,
      emissive: colors.glowing ? colors.body : 0x000000,
      emissiveIntensity: colors.glowing ? 0.65 : 0.0
    });

    // Translucent ray-finned membrane material
    const finColor = colors.fin || 0x2980b9;
    const finMat = new THREE.MeshStandardMaterial({
      color: finColor,
      roughness: 0.32,
      metalness: 0.08,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const irisMat = new THREE.MeshBasicMaterial({ color: colors.eyeIris || 0xd4af37 });
    const scleraMat = new THREE.MeshBasicMaterial({ color: 0xf5f6fa });

    // SKELETAL JOINT HIERARCHY FOR ORGANIC RETROGRADE WAVE SWIMMING:
    // root -> head -> midBody -> peduncle -> tailFin
    const head = new THREE.Group();
    head.name = 'joint_head';
    root.add(head);

    const midBody = new THREE.Group();
    midBody.name = 'joint_midBody';
    head.add(midBody);

    const peduncle = new THREE.Group();
    peduncle.name = 'joint_peduncle';
    midBody.add(peduncle);

    const tailFin = new THREE.Group();
    tailFin.name = 'joint_tailFin';
    peduncle.add(tailFin);

    root.userData = {
      head: head,
      midBody: midBody,
      peduncle: peduncle,
      tailFin: tailFin,
      pectoralL: null,
      pectoralR: null,
      isSerpentine: (modelType === 'serpent' || modelType === 'oarfish'),
      serpentJoints: [],
      isSquid: (modelType === 'squid'),
      tentacles: [],
      modelType: modelType,
      fishData: fishData
    };

    // SPECIES SPECIFIC ANATOMICAL SCULPTING
    if (modelType === 'squid') {
      this.buildSquidAnatomy(root, head, midBody, peduncle, tailFin, bodyMat, finMat, eyeMat);
    } else if (modelType === 'serpent' || modelType === 'oarfish') {
      this.buildSerpentineAnatomy(root, head, bodyMat, finMat, eyeMat, scleraMat, irisMat, colors);
    } else {
      this.buildVertebrateFishAnatomy(root, head, midBody, peduncle, tailFin, bodyMat, finMat, eyeMat, scleraMat, irisMat, modelType, colors);
    }

    return root;
  }

  // BUILD STANDARD RAY-FINNED OR PREDATORY VERTEBRATE FISH
  static buildVertebrateFishAnatomy(root, head, midBody, peduncle, tailFin, bodyMat, finMat, eyeMat, scleraMat, irisMat, modelType, colors) {
    // 1. HEAD & CRANIUM (Anatomically tapered snout, mouth, gill operculum)
    let headLength = 1.1;
    let headWidth = 0.45;
    let headHeight = 0.55;

    if (modelType === 'shark') {
      headLength = 1.45;
      headWidth = 0.52;
      headHeight = 0.48;
    } else if (modelType === 'panfish') {
      headLength = 0.85;
      headWidth = 0.32;
      headHeight = 0.72;
    } else if (modelType === 'slender' || modelType === 'barracuda' || modelType === 'gar') {
      headLength = 1.5;
      headWidth = 0.35;
      headHeight = 0.38;
    }

    const headGeo = new THREE.ConeGeometry(headWidth, headLength, 10);
    headGeo.rotateZ(-Math.PI / 2);
    headGeo.scale(1.0, headHeight / headWidth, 1.0);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.x = headLength * 0.5;
    head.add(headMesh);

    // Mouth / Lower Jaw definition
    const jawGeo = new THREE.BoxGeometry(headLength * 0.45, 0.08, headWidth * 0.55);
    const jawMesh = new THREE.Mesh(jawGeo, bodyMat);
    jawMesh.position.set(headLength * 0.65, -headHeight * 0.28, 0);
    head.add(jawMesh);

    // Operculum (Gill Cover plates)
    [-1, 1].forEach(side => {
      const gillGeo = new THREE.CylinderGeometry(headHeight * 0.38, headHeight * 0.38, 0.06, 8, 1, false, 0, Math.PI);
      gillGeo.rotateZ(Math.PI / 2);
      gillGeo.rotateX(side * Math.PI / 2);
      const gillMesh = new THREE.Mesh(gillGeo, finMat);
      gillMesh.position.set(0.1, 0, side * (headWidth * 0.52));
      head.add(gillMesh);
    });

    // 3D Glassy Layered Eyes
    const eyeR = (modelType === 'panfish' || modelType === 'slender') ? 0.12 : 0.09;
    [-1, 1].forEach(side => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(headLength * 0.45, headHeight * 0.16, side * (headWidth * 0.5 + 0.02));

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 8, 8), scleraMat);
      eyeGroup.add(sclera);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.82, 8, 8), irisMat);
      iris.position.z = side * 0.02;
      eyeGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.52, 8, 8), eyeMat);
      pupil.position.z = side * 0.04;
      eyeGroup.add(pupil);

      head.add(eyeGroup);
    });

    // Unique Rostrums / Whisker Barbels
    if (colors.sword || modelType === 'swordfish') {
      // Long tapered sword bill
      const swordGeo = new THREE.CylinderGeometry(0.015, 0.06, 2.2, 6);
      swordGeo.rotateZ(-Math.PI / 2);
      const sword = new THREE.Mesh(swordGeo, bodyMat);
      sword.position.set(headLength + 1.1, 0, 0);
      head.add(sword);
    } else if (colors.saw || modelType === 'sawfish') {
      // Toothed saw rostrum
      const sawGeo = new THREE.BoxGeometry(1.8, 0.1, 0.22);
      const saw = new THREE.Mesh(sawGeo, bodyMat);
      saw.position.set(headLength + 0.9, 0, 0);
      head.add(saw);
    } else if (colors.glowingLure || modelType === 'angler') {
      // Illuminated Anglerfish esca lure
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), bodyMat);
      stalk.position.set(headLength * 0.6, headHeight + 0.35, 0);
      stalk.rotation.z = -0.55;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
      orb.position.set(headLength * 0.9, headHeight + 0.7, 0);
      head.add(stalk);
      head.add(orb);
    } else if (modelType === 'catfish' || modelType === 'carp') {
      // Whiskers / Barbels
      [-0.14, 0.14].forEach(z => {
        const barbel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.03, 0.75, 4), finMat);
        barbel.position.set(headLength * 0.8, -headHeight * 0.3, z);
        barbel.rotation.z = -0.7;
        barbel.rotation.y = Math.sign(z) * 0.4;
        head.add(barbel);
      });
    }

    // 2. MID-BODY JOINT (Fusiform muscular torso)
    let bodyLen = 1.6;
    let bodyWidth = headWidth * 1.05;
    let bodyHeight = headHeight * 1.15;

    if (modelType === 'panfish') {
      bodyHeight = 1.35;
      bodyWidth = 0.32;
    } else if (modelType === 'torpedo' || modelType === 'tuna') {
      bodyWidth = 0.65;
      bodyHeight = 0.85;
    }

    midBody.position.set(-0.2, 0, 0);

    const bodyGeo = new THREE.CylinderGeometry(bodyHeight * 0.45, headHeight * 0.5, bodyLen, 12);
    bodyGeo.rotateZ(Math.PI / 2);
    bodyGeo.scale(1.0, 1.0, bodyWidth / bodyHeight);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(-bodyLen * 0.5, 0, 0);
    midBody.add(bodyMesh);

    // Dorsal Fin with Spiny / Soft Rays
    let dorsalH = (modelType === 'panfish' || modelType === 'swordfish') ? 1.1 : 0.65;
    const dorsalGeo = new THREE.ConeGeometry(0.45, dorsalH, 4);
    dorsalGeo.scale(1.0, 1.0, 0.08);
    const dorsalMesh = new THREE.Mesh(dorsalGeo, finMat);
    dorsalMesh.position.set(-bodyLen * 0.4, bodyHeight * 0.65, 0);
    dorsalMesh.rotation.z = -0.35;
    midBody.add(dorsalMesh);

    // Paired Translucent Pectoral Fins (Fluttering & Banking)
    [-1, 1].forEach(side => {
      const pecJoint = new THREE.Group();
      pecJoint.position.set(-0.15, -bodyHeight * 0.2, side * (bodyWidth * 0.5));
      midBody.add(pecJoint);

      const pecGeo = new THREE.ConeGeometry(0.28, 0.85, 3);
      pecGeo.scale(1.0, 1.0, 0.06);
      const pecMesh = new THREE.Mesh(pecGeo, finMat);
      pecMesh.position.set(-0.35, -0.15, side * 0.1);
      pecMesh.rotation.z = -1.1;
      pecMesh.rotation.x = side * 0.6;
      pecJoint.add(pecMesh);

      if (side === -1) root.userData.pectoralL = pecJoint;
      else root.userData.pectoralR = pecJoint;
    });

    // Paired Pelvic / Ventral Fins
    [-1, 1].forEach(side => {
      const pelvicGeo = new THREE.ConeGeometry(0.18, 0.55, 3);
      pelvicGeo.scale(1.0, 1.0, 0.06);
      const pelvic = new THREE.Mesh(pelvicGeo, finMat);
      pelvic.position.set(-bodyLen * 0.65, -bodyHeight * 0.45, side * (bodyWidth * 0.25));
      pelvic.rotation.z = -1.2;
      pelvic.rotation.x = side * 0.3;
      midBody.add(pelvic);
    });

    // 3. CAUDAL PEDUNCLE JOINT (Tapering tail wrist)
    const peduncleLen = 1.1;
    peduncle.position.set(-bodyLen, 0, 0);

    const pedGeo = new THREE.ConeGeometry(bodyHeight * 0.42, peduncleLen, 10);
    pedGeo.rotateZ(Math.PI / 2);
    pedGeo.scale(1.0, 1.0, bodyWidth / bodyHeight);
    const pedMesh = new THREE.Mesh(pedGeo, bodyMat);
    pedMesh.position.set(-peduncleLen * 0.5, 0, 0);
    peduncle.add(pedMesh);

    // Anal Fin
    const analGeo = new THREE.ConeGeometry(0.3, 0.5, 3);
    analGeo.scale(1.0, 1.0, 0.08);
    const analMesh = new THREE.Mesh(analGeo, finMat);
    analMesh.position.set(-peduncleLen * 0.4, -bodyHeight * 0.38, 0);
    analMesh.rotation.z = -0.55;
    peduncle.add(analMesh);

    // Lateral Keel finlets (Tuna, Mackerel, Swordfish)
    if (modelType === 'tuna' || modelType === 'torpedo' || modelType === 'swordfish') {
      const keelGeo = new THREE.BoxGeometry(0.4, 0.04, bodyWidth * 0.85);
      const keel = new THREE.Mesh(keelGeo, finMat);
      keel.position.set(-peduncleLen * 0.7, 0, 0);
      peduncle.add(keel);
    }

    // 4. CAUDAL FIN (Species Tail: Forked, Lunate, Heterocercal, Rounded)
    tailFin.position.set(-peduncleLen, 0, 0);

    let tailMesh;
    if (modelType === 'shark') {
      // Heterocercal Shark Tail (Tall upper lobe, small lower lobe)
      const sharkTailGroup = new THREE.Group();
      const upperLobe = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.3, 3), finMat);
      upperLobe.position.set(-0.55, 0.55, 0);
      upperLobe.rotation.z = 0.75;
      upperLobe.scale.set(1.0, 1.0, 0.08);

      const lowerLobe = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 3), finMat);
      lowerLobe.position.set(-0.35, -0.28, 0);
      lowerLobe.rotation.z = -0.7;
      lowerLobe.scale.set(1.0, 1.0, 0.08);

      sharkTailGroup.add(upperLobe);
      sharkTailGroup.add(lowerLobe);
      tailMesh = sharkTailGroup;
    } else if (modelType === 'tuna' || modelType === 'swordfish' || modelType === 'torpedo') {
      // Rigid Lunate Sickle Tail
      const lunateGroup = new THREE.Group();
      const topFork = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.15, 3), finMat);
      topFork.position.set(-0.5, 0.5, 0);
      topFork.rotation.z = 0.65;
      topFork.scale.set(1.0, 1.0, 0.08);

      const botFork = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.15, 3), finMat);
      botFork.position.set(-0.5, -0.5, 0);
      botFork.rotation.z = -0.65;
      botFork.scale.set(1.0, 1.0, 0.08);

      lunateGroup.add(topFork);
      lunateGroup.add(botFork);
      tailMesh = lunateGroup;
    } else {
      // Broad Rayed Fan / Forked Caudal Fin
      const fanGeo = new THREE.ConeGeometry(0.75, 1.25, 4);
      fanGeo.rotateZ(Math.PI / 2);
      fanGeo.scale(1.0, 0.08, 1.0);
      tailMesh = new THREE.Mesh(fanGeo, finMat);
      tailMesh.position.set(-0.65, 0, 0);
    }

    tailFin.add(tailMesh);
  }

  // BUILD ELONGATED SERPENTINE / OARFISH SKELETON (8 articulated vertebrae!)
  static buildSerpentineAnatomy(root, head, bodyMat, finMat, eyeMat, scleraMat, irisMat, colors) {
    const headGeo = new THREE.ConeGeometry(0.35, 0.9, 8);
    headGeo.rotateZ(-Math.PI / 2);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.x = 0.45;
    head.add(headMesh);

    // Glowing scarlet dorsal crest on head
    const crestGeo = new THREE.BoxGeometry(0.4, 1.3, 0.06);
    const crest = new THREE.Mesh(crestGeo, finMat);
    crest.position.set(0.3, 0.9, 0);
    head.add(crest);

    // Eyes
    [-0.22, 0.22].forEach(z => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
      eye.position.set(0.35, 0.1, z);
      head.add(eye);
    });

    // Articulated 8-segment serpentine spine
    let prevJoint = head;
    root.userData.serpentJoints = [];

    for (let s = 0; s < 8; s++) {
      const joint = new THREE.Group();
      joint.position.set(-0.6, 0, 0);
      prevJoint.add(joint);

      const segmentGeo = new THREE.CylinderGeometry(0.24 - s * 0.02, 0.26 - s * 0.02, 0.65, 8);
      segmentGeo.rotateZ(Math.PI / 2);
      segmentGeo.scale(1.0, 1.4, 0.55); // laterally compressed ribbon
      const segment = new THREE.Mesh(segmentGeo, bodyMat);
      segment.position.set(-0.32, 0, 0);
      joint.add(segment);

      // Continuous undulating dorsal fin ribbon
      const finRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45 - s * 0.03, 0.04), finMat);
      finRibbon.position.set(-0.32, 0.38, 0);
      joint.add(finRibbon);

      root.userData.serpentJoints.push(joint);
      prevJoint = joint;
    }
  }

  // BUILD CEPHALOPOD SQUID (Pulsing mantle & undulating tentacles)
  static buildSquidAnatomy(root, head, midBody, peduncle, tailFin, bodyMat, finMat, eyeMat) {
    // Torpedo Mantle
    const mantleGeo = new THREE.ConeGeometry(0.65, 3.2, 10);
    mantleGeo.rotateZ(Math.PI / 2);
    const mantle = new THREE.Mesh(mantleGeo, bodyMat);
    mantle.position.set(-1.6, 0, 0);
    midBody.add(mantle);

    // Lateral Stabilizing Fin Wings
    const finWingGeo = new THREE.BoxGeometry(1.6, 0.05, 1.8);
    const finWing = new THREE.Mesh(finWingGeo, finMat);
    finWing.position.set(-2.2, 0, 0);
    midBody.add(finWing);

    // Large glassy Cephalopod Eyes
    [-0.38, 0.38].forEach(z => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), eyeMat);
      eye.position.set(0.1, 0, z);
      head.add(eye);
    });

    // 8 Arms + 2 Feeding Tentacles
    root.userData.tentacles = [];
    for (let a = 0; a < 8; a++) {
      const armJoint = new THREE.Group();
      armJoint.position.set(0.4, Math.sin(a * 0.78) * 0.25, Math.cos(a * 0.78) * 0.25);
      head.add(armJoint);

      const armGeo = new THREE.CylinderGeometry(0.03, 0.08, 1.8, 5);
      armGeo.rotateZ(-Math.PI / 2);
      const arm = new THREE.Mesh(armGeo, finMat);
      arm.position.set(0.9, 0, 0);
      armJoint.add(arm);

      root.userData.tentacles.push(armJoint);
    }
  }

  // 4. MULTI-VERTEBRAL SINUSOIDAL SWIMMING ENGINE
  static animateSwimming(fishRoot, time, speedMult = 1.0, intensity = 1.0) {
    if (!fishRoot || !fishRoot.userData) return;
    const ud = fishRoot.userData;
    const t = time * 6.5 * speedMult;

    if (ud.isSerpentine && ud.serpentJoints.length > 0) {
      // Serpentine traveling wave: theta(x, t) = A * sin(omega * t - k * x)
      ud.head.rotation.y = Math.sin(t) * 0.12 * intensity;
      for (let i = 0; i < ud.serpentJoints.length; i++) {
        const joint = ud.serpentJoints[i];
        const phase = (i + 1) * 0.65;
        const amp = (0.2 + (i / ud.serpentJoints.length) * 0.35) * intensity;
        joint.rotation.y = Math.sin(t - phase) * amp;
      }
      return;
    }

    if (ud.isSquid && ud.tentacles.length > 0) {
      // Squid jet propulsion pulse: mantle contracts, tentacles trail & open
      const pulse = Math.sin(t * 0.6);
      ud.midBody.scale.set(1.0 + pulse * 0.08, 1.0 - pulse * 0.06, 1.0 - pulse * 0.06);
      for (let i = 0; i < ud.tentacles.length; i++) {
        const tent = ud.tentacles[i];
        tent.rotation.z = Math.sin(t + i * 0.5) * 0.2 * intensity;
        tent.rotation.y = Math.cos(t * 0.7 + i) * 0.15 * intensity;
      }
      return;
    }

    // Standard Vertebrate Traveling Wave
    if (ud.head) {
      ud.head.rotation.y = Math.sin(t) * 0.07 * intensity;
    }
    if (ud.midBody) {
      ud.midBody.rotation.y = Math.sin(t - 0.75) * 0.22 * intensity;
    }
    if (ud.peduncle) {
      ud.peduncle.rotation.y = Math.sin(t - 1.55) * 0.40 * intensity;
    }
    if (ud.tailFin) {
      ud.tailFin.rotation.y = Math.sin(t - 2.35) * 0.58 * intensity;
    }

    // Pectoral Fin Fluttering
    if (ud.pectoralL) {
      ud.pectoralL.rotation.z = Math.sin(t * 1.4) * 0.28 * intensity;
    }
    if (ud.pectoralR) {
      ud.pectoralR.rotation.z = -Math.sin(t * 1.4) * 0.28 * intensity;
    }
  }
}

// 5. AMBIENT UNDERWATER SCHOOLS (LAGOON, POND, & OCEAN SHORE)
class AmbientAquarium {
  constructor(scene, island) {
    this.scene = scene;
    this.island = island;
    this.schoolFish = [];
    this.time = 0;

    this.spawnSchools();
  }

  spawnSchools() {
    const allFishData = window.GAME_DATA.fish;

    // 1. Freshwater Haven Pond School (Bluegill & Mirror Carp)
    const pondFishTypes = allFishData.filter(f => f.habitat === 'freshwater_pond');
    for (let i = 0; i < 6; i++) {
      const data = pondFishTypes[i % pondFishTypes.length];
      const model = RealisticFish.createDetailedFish(data);
      const s = 0.45 + Math.random() * 0.35;
      model.scale.set(s, s, s);

      const fObj = {
        mesh: model,
        type: 'pond',
        center: this.island.pondCenter,
        radius: 4.5 + Math.random() * 6.5,
        angle: (i / 6) * Math.PI * 2,
        speed: 0.7 + Math.random() * 0.4,
        swimPhase: Math.random() * 10,
        baseY: this.island.pondWaterLevel - 0.55
      };

      model.position.set(
        fObj.center.x + Math.cos(fObj.angle) * fObj.radius,
        fObj.baseY,
        fObj.center.y + Math.sin(fObj.angle) * fObj.radius
      );

      this.scene.add(model);
      this.schoolFish.push(fObj);
    }

    // 2. Coral Atoll Tropical Reef School (Clownfish, Snapper, Butterflyfish)
    const coralFishTypes = allFishData.filter(f => f.habitat === 'coral_lagoon' || f.id === 'clownfish');
    for (let i = 0; i < 9; i++) {
      const data = coralFishTypes[i % coralFishTypes.length] || allFishData[3];
      const model = RealisticFish.createDetailedFish(data);
      const s = 0.35 + Math.random() * 0.3;
      model.scale.set(s, s, s);

      const fObj = {
        mesh: model,
        type: 'coral',
        center: this.island.coralCenter,
        radius: 3.5 + Math.random() * 7.0,
        angle: (i / 9) * Math.PI * 2,
        speed: 1.1 + Math.random() * 0.5,
        swimPhase: Math.random() * 10,
        baseY: this.island.coralLagoonWaterLevel - 0.65
      };

      model.position.set(
        fObj.center.x + Math.cos(fObj.angle) * fObj.radius,
        fObj.baseY,
        fObj.center.y + Math.sin(fObj.angle) * fObj.radius
      );

      this.scene.add(model);
      this.schoolFish.push(fObj);
    }

    // 3. Haven Pier Ocean Pelagic School (Sardines & Mackerel)
    const oceanFishTypes = allFishData.filter(f => f.habitat === 'ocean_shore' || f.habitat === 'ocean_deep');
    for (let i = 0; i < 8; i++) {
      const data = oceanFishTypes[i % oceanFishTypes.length] || allFishData[0];
      const model = RealisticFish.createDetailedFish(data);
      const s = 0.4 + Math.random() * 0.35;
      model.scale.set(s, s, s);

      const fObj = {
        mesh: model,
        type: 'ocean',
        center: { x: 0, y: 110 }, // off the Main Haven fishing pier
        radius: 8.0 + Math.random() * 12.0,
        angle: (i / 8) * Math.PI * 2,
        speed: 1.25 + Math.random() * 0.45,
        swimPhase: Math.random() * 10,
        baseY: this.island.oceanWaterLevel - 0.75
      };

      model.position.set(
        fObj.center.x + Math.cos(fObj.angle) * fObj.radius,
        fObj.baseY,
        fObj.center.y + Math.sin(fObj.angle) * fObj.radius
      );

      this.scene.add(model);
      this.schoolFish.push(fObj);
    }
  }

  update(delta) {
    this.time += delta;

    for (const f of this.schoolFish) {
      // Natural circular & Lissajous pathing around habitat center
      f.angle += delta * f.speed * 0.25;
      const wobbleR = f.radius + Math.sin(this.time * 0.8 + f.swimPhase) * 1.5;
      const nx = f.center.x + Math.cos(f.angle) * wobbleR;
      const nz = f.center.y + Math.sin(f.angle) * wobbleR;
      const ny = f.baseY + Math.sin(this.time * 1.5 + f.swimPhase) * 0.12;

      // Compute heading angle for smooth forward swimming
      const targetAngle = f.angle + Math.PI / 2;
      f.mesh.position.set(nx, ny, nz);
      f.mesh.rotation.y = -targetAngle;

      // Banking into turns
      f.mesh.rotation.z = Math.sin(this.time * 1.2 + f.swimPhase) * 0.18;

      // Sinusoidal vertebral swimming undulation
      RealisticFish.animateSwimming(f.mesh, this.time + f.swimPhase, f.speed, 0.9);
    }
  }
}

// 6. INTERACTIVE 3D HOOKED FISH & BREACHING SYSTEM
class InteractiveFishController {
  constructor(scene, island, audio) {
    this.scene = scene;
    this.island = island;
    this.audio = audio;

    this.activeFishMesh = null;
    this.currentFishData = null;
    this.time = 0;

    this.isBreaching = false;
    this.breachTimer = 0;
    this.breachDuration = 1.1;
    this.breachApex = 1.8;
    this.breachStartPos = new THREE.Vector3();
    this.breachEndPos = new THREE.Vector3();

    // Spray particles on breach splash
    this.buildSplashParticles();
  }

  buildSplashParticles() {
    this.splashGroup = new THREE.Group();
    this.splashParticles = [];

    const dropGeo = new THREE.DodecahedronGeometry(0.08, 0);
    const dropMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });

    for (let i = 0; i < 30; i++) {
      const drop = new THREE.Mesh(dropGeo, dropMat);
      drop.visible = false;
      drop.userData = { vel: new THREE.Vector3(), life: 0, maxLife: 0.6 };
      this.splashGroup.add(drop);
      this.splashParticles.push(drop);
    }

    this.scene.add(this.splashGroup);
  }

  triggerSplash(pos, isHeavy = false) {
    if (this.audio) this.audio.playSplash(isHeavy);

    for (let i = 0; i < (isHeavy ? 30 : 16); i++) {
      const drop = this.splashParticles[i];
      drop.visible = true;
      drop.position.copy(pos);
      drop.userData.life = 0;
      drop.userData.maxLife = 0.5 + Math.random() * 0.4;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.5;
      drop.userData.vel.set(
        Math.cos(angle) * speed,
        3.5 + Math.random() * 4.5,
        Math.sin(angle) * speed
      );
    }
  }

  setTargetFish(fishData) {
    if (this.activeFishMesh) {
      this.scene.remove(this.activeFishMesh);
      this.activeFishMesh = null;
    }

    if (!fishData) return;
    this.currentFishData = fishData;
    this.activeFishMesh = RealisticFish.createDetailedFish(fishData);

    // Scale proportional to species size category
    let s = 0.55;
    if (fishData.sizeCategory === 'Small') s = 0.4;
    else if (fishData.sizeCategory === 'Medium') s = 0.65;
    else if (fishData.sizeCategory === 'Large') s = 0.95;
    else if (fishData.sizeCategory === 'Monster') s = 1.6;
    else if (fishData.sizeCategory === 'Colossal' || fishData.sizeCategory === 'Titan') s = 2.4;

    this.activeFishMesh.scale.set(s, s, s);
    this.activeFishMesh.visible = false;
    this.scene.add(this.activeFishMesh);
  }

  // Stalking behavior under bobber
  updateStalking(bobberPos, delta, isNibbling = false) {
    if (!this.activeFishMesh) return;
    this.time += delta;
    this.activeFishMesh.visible = true;

    const stalkR = isNibbling ? 0.35 : 1.4;
    const speed = isNibbling ? 4.5 : 1.8;
    const angle = this.time * speed;

    const targetX = bobberPos.x + Math.cos(angle) * stalkR;
    const targetZ = bobberPos.z + Math.sin(angle) * stalkR;
    const targetY = this.island.oceanWaterLevel - (isNibbling ? 0.25 : 0.65);

    this.activeFishMesh.position.set(targetX, targetY, targetZ);
    this.activeFishMesh.rotation.y = -angle - Math.PI / 2;

    RealisticFish.animateSwimming(this.activeFishMesh, this.time, isNibbling ? 2.2 : 1.2, isNibbling ? 1.4 : 0.8);
  }

  // Fighting & Thrashing on the line during reeling minigame
  updateReeling(bobberPos, delta, tension, progress) {
    if (!this.activeFishMesh) return;
    this.time += delta;
    this.activeFishMesh.visible = true;

    // Trigger dynamic Breaching Leap when tension is high or periodically
    if (!this.isBreaching && Math.random() < 0.015 && tension > 40) {
      this.startBreach(bobberPos);
    }

    if (this.isBreaching) {
      this.breachTimer += delta;
      const p = this.breachTimer / this.breachDuration;

      if (p >= 1.0) {
        this.isBreaching = false;
        this.triggerSplash(this.activeFishMesh.position, true);
      } else {
        // Parabolic Leap Arc
        const currentPos = new THREE.Vector3().lerpVectors(this.breachStartPos, this.breachEndPos, p);
        const arcY = Math.sin(p * Math.PI) * this.breachApex;
        currentPos.y += arcY;

        this.activeFishMesh.position.copy(currentPos);
        // Tilt along flight trajectory
        this.activeFishMesh.rotation.z = Math.sin((p - 0.5) * Math.PI) * 1.1;

        RealisticFish.animateSwimming(this.activeFishMesh, this.time, 3.2, 1.8);
      }
    } else {
      // Submerged thrash under bobber
      const thrashX = bobberPos.x + Math.sin(this.time * 8.0) * 0.8;
      const thrashZ = bobberPos.z + Math.cos(this.time * 6.5) * 0.8;
      const thrashY = this.island.oceanWaterLevel - 0.4 + Math.sin(this.time * 12.0) * 0.15;

      this.activeFishMesh.position.set(thrashX, thrashY, thrashZ);
      this.activeFishMesh.rotation.y = Math.sin(this.time * 5.0) * 1.2;

      RealisticFish.animateSwimming(this.activeFishMesh, this.time, 2.8, 1.6);
    }
  }

  startBreach(bobberPos) {
    this.isBreaching = true;
    this.breachTimer = 0;
    this.breachStartPos.copy(bobberPos).add(new THREE.Vector3((Math.random() - 0.5) * 2, -0.2, (Math.random() - 0.5) * 2));
    this.breachEndPos.copy(bobberPos).add(new THREE.Vector3((Math.random() - 0.5) * 4, -0.2, (Math.random() - 0.5) * 4));

    this.triggerSplash(this.breachStartPos, false);
  }

  hide() {
    if (this.activeFishMesh) {
      this.activeFishMesh.visible = false;
    }
    this.isBreaching = false;
  }

  updateSplash(delta) {
    for (const drop of this.splashParticles) {
      if (!drop.visible) continue;
      drop.userData.life += delta;
      if (drop.userData.life >= drop.userData.maxLife) {
        drop.visible = false;
        continue;
      }

      drop.userData.vel.y -= 18.0 * delta;
      drop.position.addScaledVector(drop.userData.vel, delta);
    }
  }
}

window.RealisticFish = RealisticFish;
window.AmbientAquarium = AmbientAquarium;
window.InteractiveFishController = InteractiveFishController;
