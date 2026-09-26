// Realistic 3D Human Character, Anatomical Rigs, Dynamic Rod Bending, and Controls

class Player {
  constructor(scene, camera, island) {
    this.scene = scene;
    this.camera = camera;
    this.island = island;

    this.position = new THREE.Vector3(0, 1.4, 82); // Start on the coastal path near the ocean pier
    this.rotation = Math.PI; // Face forward along the island path
    this.speed = 9.2;
    this.sprintMult = 1.6;
    this.walkCycle = 0;
    this.isMoving = false;
    this.footstepTimer = 0;
    this.idleTimer = 0;
    this.breathTimer = 0;
    this.blinkTimer = 3.0;
    this.blinkProgress = 0;

    // Camera control
    this.camDistance = 12;
    this.camPitch = 0.38;
    this.camYaw = 0;

    // Keys state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };

    // Virtual Joystick for iPad / Mobile touch devices
    this.joystick = { x: 0, z: 0, active: false };
    this.touchSprintToggled = false;

    this.activeRodId = 'rod_willow';
    this.rodBendAmount = 0; // Dynamic tension curve!
    this.reelingCycle = 0;

    // Death state when touching water
    this.isDead = false;
    this.deathTimer = 0;
    this.deathReason = '';

    // Multi-angle Camera System: 'third_back' (3rd person follow), 'first_person' (1st person POV eyes), 'third_front' (Front face/selfie portrait view)
    this.camDistance = 9.0;
    this.camPitch = 0.30;
    this.camYaw = 0;
    this.viewMode = 'third_back';

    // Jumping & Gravity Physics
    this.velocityY = 0;
    this.isGrounded = true;
    this.jumpForce = 9.8;
    this.gravity = -26.0;
    this.jumpCooldown = 0;
    this.playerRadius = 0.45;

    // High-Beam Angler Headlamp / Flashlight
    this.flashlightActive = false;

    this.createRealisticHuman();
    this.initFlashlight();
    this.setupInputs();
    this.equipRod(this.activeRodId);
  }

  createRealisticHuman() {
    this.mesh = new THREE.Group();

    // High quality stylized realistic materials with physiological skin, matte canvas, leather & brass
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887, // Natural sun-kissed skin
      roughness: 0.65,
      metalness: 0.02
    });

    const skinShadeMat = new THREE.MeshStandardMaterial({
      color: 0xcfa676,
      roughness: 0.7
    });

    // Anatomical Eye Materials
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.1 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x16a085, roughness: 0.2 }); // Coastal sea-green hazel
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.05 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Glossy corneal glint
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, roughness: 0.65 });
    const browMat = new THREE.MeshStandardMaterial({ color: 0x2c1d11, roughness: 0.85 });
    const lipMat = new THREE.MeshStandardMaterial({ color: 0xb87364, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x2c1d11, roughness: 0.85 });

    // Weatherproof maritime utility jacket & henley undershirt
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x1a365d, // Deep oceanic navy blue
      roughness: 0.78,
      metalness: 0.08
    });

    const jacketTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0f2444,
      roughness: 0.8
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Ribbed henley thermal collar
      roughness: 0.85
    });

    // Professional tactical multi-pocket tackle vest
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0x2e5a36, // Olive drab tackle canvas
      roughness: 0.82
    });

    const pocketMat = new THREE.MeshStandardMaterial({
      color: 0x23472a,
      roughness: 0.82
    });

    const flyPatchMat = new THREE.MeshStandardMaterial({
      color: 0xedf2f7, // Fleece fly drying patch
      roughness: 0.95
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      roughness: 0.25,
      metalness: 0.85
    });

    // Rugged cargo pants
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x2d3748, // Weathered slate charcoal
      roughness: 0.85
    });

    const kneePatchMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.88
    });

    // Sturdy leather deck boots with thick lug tread soles
    const bootsMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e1b, // Oiled weatherproof full-grain leather
      roughness: 0.52
    });

    const bootSoleMat = new THREE.MeshStandardMaterial({
      color: 0x171923, // Vulcanized tread lug rubber
      roughness: 0.92
    });

    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.45
    });

    const capMat = new THREE.MeshStandardMaterial({
      color: 0xc53030, // Classic maritime red angler cap
      roughness: 0.75
    });

    const capVisorMat = new THREE.MeshStandardMaterial({
      color: 0x9b2c2c,
      roughness: 0.75
    });

    const capTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.8
    });

    // 1. PELVIS & UTILITY BELT
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.05;
    this.mesh.add(this.pelvis);

    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.33, 0.32, 12), pantsMat);
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    // Full-grain leather belt & brass buckle
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 12), beltMat);
    belt.position.y = 0.11;
    this.pelvis.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.04), brassMat);
    buckle.position.set(0, 0.11, 0.385);
    this.pelvis.add(buckle);

    // Angler's utility knife / pliers sheath at right hip
    const sheath = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.06), beltMat);
    sheath.position.set(0.38, -0.04, 0.08);
    sheath.rotation.z = -0.15;
    const knifeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.12, 6), bootsMat);
    knifeHandle.position.set(0.38, 0.14, 0.08);
    this.pelvis.add(sheath);
    this.pelvis.add(knifeHandle);

    // 2. SPINE & CHEST (BREATHING RIBCAGE + TACKLE VEST)
    this.spine = new THREE.Group();
    this.spine.position.y = 0.16;
    this.pelvis.add(this.spine);

    this.chest = new THREE.Group();
    this.chest.position.y = 0.38;
    this.spine.add(this.chest);

    // Sculpted anatomical upper chest (broad shoulders tapering down to waist)
    const chestGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.76, 12);
    const chestMesh = new THREE.Mesh(chestGeo, jacketMat);
    chestMesh.castShadow = true;
    this.chest.add(chestMesh);

    // Henley thermal shirt collar peeking through jacket
    const henleyCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.15, 10), shirtMat);
    henleyCollar.position.set(0, 0.36, 0.04);
    this.chest.add(henleyCollar);

    // Tactical Multi-Pocket Angler Vest Overlay
    const vestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.37, 0.68, 12), vestMat);
    vestMesh.position.y = -0.02;
    this.chest.add(vestMesh);

    // Center brass zipper track
    const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.65, 0.02), brassMat);
    zipper.position.set(0, -0.02, 0.445);
    this.chest.add(zipper);

    // Upper zippered chest tackle pockets
    [-0.18, 0.18].forEach(x => {
      const topPocket = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.06), pocketMat);
      topPocket.position.set(x, 0.15, 0.435);
      const zipPull = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.02), brassMat);
      zipPull.position.set(x, 0.2, 0.468);
      this.chest.add(topPocket);
      this.chest.add(zipPull);
    });

    // Lower expandable cargo flap pockets with snap buttons
    [-0.2, 0.2].forEach(x => {
      const flapPocket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.08), pocketMat);
      flapPocket.position.set(x, -0.12, 0.41);
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.09), vestMat);
      flap.position.set(x, -0.03, 0.415);
      const snap = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), brassMat);
      snap.position.set(x, -0.04, 0.465);
      this.chest.add(flapPocket);
      this.chest.add(flap);
      this.chest.add(snap);
    });

    // Fleece fly patch on left chest
    const flyPatch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), flyPatchMat);
    flyPatch.position.set(-0.24, 0.26, 0.38);
    flyPatch.rotation.y = -0.2;
    this.chest.add(flyPatch);

    // Brass D-Rings at waist for gear attachment
    [-0.32, 0.32].forEach(x => {
      const dRing = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), brassMat);
      dRing.position.set(x, -0.28, 0.28);
      this.chest.add(dRing);
    });

    // 3. ANATOMICAL NECK & SCULPTED HEAD
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.24, 10), skinMat);
    neck.position.y = 0.46;
    this.chest.add(neck);

    this.head = new THREE.Group();
    this.head.position.y = 0.65;
    this.chest.add(this.head);

    // Anatomical Cranium with natural facial proportions
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), skinMat);
    cranium.scale.set(0.92, 1.05, 0.98);
    cranium.position.set(0, 0.04, 0);
    this.head.add(cranium);

    // Defined Lower Jaw & Chin Group (Hinged for talking & expressions)
    this.jaw = new THREE.Group();
    this.jaw.position.set(0, -0.04, 0.04);
    this.head.add(this.jaw);

    const chin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8), skinMat);
    chin.position.set(0, -0.1, 0.15);
    chin.rotation.x = 0.3;
    this.jaw.add(chin);

    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.03), lipMat);
    lowerLip.position.set(0, -0.05, 0.22);
    this.jaw.add(lowerLip);

    // Upper Lip & Philtrum
    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.03), lipMat);
    upperLip.position.set(0, -0.068, 0.23);
    this.head.add(upperLip);

    // Sculpted Nose
    const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.032, 0.12, 6), skinMat);
    noseBridge.rotation.x = -Math.PI / 3.6;
    noseBridge.position.set(0, 0.03, 0.24);
    this.head.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), skinMat);
    noseTip.position.set(0, -0.015, 0.27);
    this.head.add(noseTip);

    // Left and Right Ears
    [-0.23, 0.23].forEach((x, idx) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(x, 0.02, -0.02);
      earGroup.rotation.y = (idx === 0 ? -0.2 : 0.2);

      const earLobe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.1, 8), skinMat);
      earLobe.scale.set(0.4, 1.0, 0.8);
      earGroup.add(earLobe);

      const helix = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 10, Math.PI * 1.3), skinShadeMat);
      helix.rotation.x = Math.PI / 2;
      earGroup.add(helix);

      this.head.add(earGroup);
    });

    // Anatomical Blinking Eyes (Positioned clearly below the visor!)
    this.eyelids = [];
    [-0.088, 0.088].forEach((x, i) => {
      const eyeOrbit = new THREE.Group();
      eyeOrbit.position.set(x, 0.055, 0.20);
      this.head.add(eyeOrbit);

      // Sclera (White of eye)
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), scleraMat);
      eyeOrbit.add(sclera);

      // Colored Iris (Sea-green hazel)
      const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 10), irisMat);
      iris.rotation.x = Math.PI / 2;
      iris.position.z = 0.031;
      eyeOrbit.add(iris);

      // Pupil
      const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.012, 10), pupilMat);
      pupil.rotation.x = Math.PI / 2;
      pupil.position.z = 0.033;
      eyeOrbit.add(pupil);

      // Specular Glint (Glossy reflection highlight)
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), glintMat);
      glint.position.set(0.007, 0.007, 0.036);
      eyeOrbit.add(glint);

      // Blinking Upper Eyelid
      const upperLid = new THREE.Mesh(
        new THREE.SphereGeometry(0.039, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        lidMat
      );
      upperLid.rotation.x = -Math.PI / 2.3;
      eyeOrbit.add(upperLid);
      this.eyelids.push(upperLid);

      // Distinct Eyebrows
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.025), browMat);
      brow.position.set(x, 0.105, 0.21);
      brow.rotation.z = (i === 0 ? 0.08 : -0.08);
      this.head.add(brow);
    });

    // Hair tufts peeking out from under cap
    [-0.22, 0.22].forEach(x => {
      const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.07), hairMat);
      sideburn.position.set(x, -0.03, 0.02);
      this.head.add(sideburn);
    });
    const hairNape = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.1, 8), hairMat);
    hairNape.position.set(0, -0.02, -0.08);
    this.head.add(hairNape);

    // Realistic Angler Cap positioned naturally on crown of head
    const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), capMat);
    capCrown.position.set(0, 0.15, -0.01);
    this.head.add(capCrown);

    const capButton = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), brassMat);
    capButton.position.set(0, 0.41, -0.01);
    this.head.add(capButton);

    // Curved Brim / Visor (Mounted above eyebrows on forehead, tilted upward so eyes are 100% visible!)
    const visorGroup = new THREE.Group();
    visorGroup.position.set(0, 0.155, 0.18);
    visorGroup.rotation.x = -0.16; // Tilted upward away from eyes
    this.head.add(visorGroup);

    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.022, 0.22), capVisorMat);
    capVisor.position.z = 0.1;
    visorGroup.add(capVisor);

    const visorTrim = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.012, 0.02), capTrimMat);
    visorTrim.position.set(0, 0, 0.21);
    visorGroup.add(visorTrim);

    // 4. ARTICULATED ARMS & ANATOMICAL HANDS
    const buildAnatomicalHand = (isRight) => {
      const handGroup = new THREE.Group();

      // Sculpted Palm
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.09), skinMat);
      palm.position.y = -0.04;
      handGroup.add(palm);

      // Opposable Thumb with articulated joint
      const thumb = new THREE.Group();
      thumb.position.set((isRight ? -0.045 : 0.045), -0.03, 0.02);
      thumb.rotation.y = (isRight ? 0.6 : -0.6);
      thumb.rotation.z = (isRight ? 0.4 : -0.4);
      const thumbPhalanx = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.05, 6), skinMat);
      thumbPhalanx.position.y = -0.025;
      thumb.add(thumbPhalanx);
      handGroup.add(thumb);

      // 4 Articulated Fingers (Index, Middle, Ring, Pinky) curved in natural grip
      const fingerSpacing = [-0.03, -0.01, 0.01, 0.03];
      const fingerLengths = [0.055, 0.06, 0.055, 0.045];

      fingerSpacing.forEach((fx, idx) => {
        const finger = new THREE.Group();
        finger.position.set(fx, -0.08, 0.02);
        finger.rotation.x = -0.65; // Natural relaxed curl

        const phalanx = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, fingerLengths[idx], 6), skinMat);
        phalanx.position.y = -fingerLengths[idx] / 2;
        finger.add(phalanx);

        // Distal fingertip
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), skinMat);
        tip.position.y = -fingerLengths[idx];
        finger.add(tip);

        handGroup.add(finger);
      });

      return handGroup;
    };

    // RIGHT ARM (Casting, rod holding & fighting)
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.48, 0.26, 0);
    this.chest.add(this.rightShoulder);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.42, 10), jacketMat);
    rUpperArm.position.y = -0.21;
    this.rightShoulder.add(rUpperArm);

    // Elbow joint with reinforcement patch
    const rElbowPad = new THREE.Mesh(new THREE.SphereGeometry(0.115, 8, 8), jacketTrimMat);
    rElbowPad.position.set(0, -0.42, -0.02);
    this.rightShoulder.add(rElbowPad);

    this.rightElbow = new THREE.Group();
    this.rightElbow.position.set(0, -0.42, 0);
    this.rightShoulder.add(this.rightElbow);

    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.38, 10), jacketMat);
    rForearm.position.y = -0.19;
    this.rightElbow.add(rForearm);

    // Rolled jacket cuff
    const rCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.06, 10), jacketTrimMat);
    rCuff.position.y = -0.34;
    this.rightElbow.add(rCuff);

    this.rightHand = buildAnatomicalHand(true);
    this.rightHand.position.set(0, -0.38, 0);
    this.rightElbow.add(this.rightHand);

    // Mount for fishing rod attached securely into right hand palm
    this.rodMount = new THREE.Group();
    this.rodMount.position.set(0, -0.04, 0.04);
    this.rightHand.add(this.rodMount);

    // LEFT ARM (Crank handle reeling, balance & expressive movement)
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.48, 0.26, 0);
    this.chest.add(this.leftShoulder);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.42, 10), jacketMat);
    lUpperArm.position.y = -0.21;
    this.leftShoulder.add(lUpperArm);

    const lElbowPad = new THREE.Mesh(new THREE.SphereGeometry(0.115, 8, 8), jacketTrimMat);
    lElbowPad.position.set(0, -0.42, -0.02);
    this.leftShoulder.add(lElbowPad);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.set(0, -0.42, 0);
    this.leftShoulder.add(this.leftElbow);

    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.38, 10), jacketMat);
    lForearm.position.y = -0.19;
    this.leftElbow.add(lForearm);

    const lCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.06, 10), jacketTrimMat);
    lCuff.position.y = -0.34;
    this.leftElbow.add(lCuff);

    this.leftHand = buildAnatomicalHand(false);
    this.leftHand.position.set(0, -0.38, 0);
    this.leftElbow.add(this.leftHand);

    // 5. ARTICULATED LEGS & WEATHERPROOF DECK BOOTS
    const thighGeo = new THREE.CylinderGeometry(0.155, 0.125, 0.52, 10);
    const calfGeo = new THREE.CylinderGeometry(0.125, 0.105, 0.5, 10);

    const buildRealisticBoot = () => {
      const bootGroup = new THREE.Group();

      // Upper boot vamp and shaft
      const bootUpper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.36), bootsMat);
      bootUpper.position.set(0, 0.02, 0.04);
      bootGroup.add(bootUpper);

      // Padded leather ankle collar
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 10), beltMat);
      collar.position.set(0, 0.14, 0);
      bootGroup.add(collar);

      // Stitched toe box
      const toeBox = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), bootsMat);
      toeBox.scale.set(1.0, 0.6, 1.2);
      toeBox.position.set(0, -0.04, 0.18);
      bootGroup.add(toeBox);

      // Heavy vulcanized lug rubber sole with deep tread grooves
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.44), bootSoleMat);
      sole.position.set(0, -0.11, 0.06);
      bootGroup.add(sole);

      // Lug tread cleats underneath sole
      [-0.1, 0.0, 0.1].forEach(tz => {
        const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.04), bootSoleMat);
        cleat.position.set(0, -0.15, tz);
        bootGroup.add(cleat);
      });

      // Crossing bootlaces
      for (let l = 0; l < 3; l++) {
        const lace = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.02), brassMat);
        lace.position.set(0, 0.02 + l * 0.04, 0.18 - l * 0.02);
        bootGroup.add(lace);
      }

      return bootGroup;
    };

    // RIGHT LEG
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.21, -0.16, 0);
    this.pelvis.add(this.rightHip);

    const rThigh = new THREE.Mesh(thighGeo, pantsMat);
    rThigh.position.y = -0.26;
    this.rightHip.add(rThigh);

    // Thigh cargo pocket
    const rCargo = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.14), kneePatchMat);
    rCargo.position.set(0.15, -0.26, 0);
    this.rightHip.add(rCargo);

    this.rightKnee = new THREE.Group();
    this.rightKnee.position.set(0, -0.52, 0);
    this.rightHip.add(this.rightKnee);

    const rKneePatch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.04), kneePatchMat);
    rKneePatch.position.set(0, 0.02, 0.12);
    this.rightKnee.add(rKneePatch);

    const rCalf = new THREE.Mesh(calfGeo, pantsMat);
    rCalf.position.y = -0.25;
    this.rightKnee.add(rCalf);

    this.rightBoot = buildRealisticBoot();
    this.rightBoot.position.set(0, -0.45, 0);
    this.rightKnee.add(this.rightBoot);

    // LEFT LEG
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.21, -0.16, 0);
    this.pelvis.add(this.leftHip);

    const lThigh = new THREE.Mesh(thighGeo, pantsMat);
    lThigh.position.y = -0.26;
    this.leftHip.add(lThigh);

    const lCargo = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.14), kneePatchMat);
    lCargo.position.set(-0.15, -0.26, 0);
    this.leftHip.add(lCargo);

    this.leftKnee = new THREE.Group();
    this.leftKnee.position.set(0, -0.52, 0);
    this.leftHip.add(this.leftKnee);

    const lKneePatch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.04), kneePatchMat);
    lKneePatch.position.set(0, 0.02, 0.12);
    this.leftKnee.add(lKneePatch);

    const lCalf = new THREE.Mesh(calfGeo, pantsMat);
    lCalf.position.y = -0.25;
    this.leftKnee.add(lCalf);

    this.leftBoot = buildRealisticBoot();
    this.leftBoot.position.set(0, -0.45, 0);
    this.leftKnee.add(this.leftBoot);

    this.scene.add(this.mesh);
  }
  equipRod(rodId) {
    this.activeRodId = rodId;
    const rodData = window.GAME_DATA.rods.find(r => r.id === rodId) || window.GAME_DATA.rods[0];

    // Clear old rod
    while (this.rodMount.children.length > 0) {
      this.rodMount.remove(this.rodMount.children[0]);
    }

    // Build articulated 3D Fishing Rod with segmented flex joints for realistic bending!
    this.rodSegments = [];
    const rodGroup = new THREE.Group();

    const rodMat = new THREE.MeshStandardMaterial({
      color: rodData.color,
      roughness: 0.35,
      metalness: rodData.tier >= 4 ? 0.7 : 0.15,
      emissive: rodData.glow ? rodData.glow : 0x000000,
      emissiveIntensity: rodData.glow ? 0.6 : 0
    });

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.9 });
    const guideMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e9, metalness: 0.85, roughness: 0.2 });

    // Handle Grip & Reel Seat
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.7, 8), handleMat);
    grip.position.set(0, 0.3, 0);
    grip.rotation.x = -Math.PI / 3.8;
    rodGroup.add(grip);

    // Reel Spool with spinning crank handle
    this.reelSpool = new THREE.Group();
    this.reelSpool.position.set(0, 0.22, 0.12);
    grip.add(this.reelSpool);

    const spoolMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10), handleMat);
    spoolMesh.rotation.z = Math.PI / 2;
    this.reelSpool.add(spoolMesh);

    // Reel crank handle
    this.crank = new THREE.Group();
    this.crank.position.set(-0.09, 0, 0);
    const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.03), guideMat);
    crankArm.position.y = 0.06;
    const crankKnob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), handleMat);
    crankKnob.position.set(-0.03, 0.12, 0);
    this.crank.add(crankArm);
    this.crank.add(crankKnob);
    this.reelSpool.add(this.crank);

    // 4 Articulated Flexible Blank Segments that bend dynamically under tension!
    let parentJoint = grip;
    const segCount = 4;
    const segLength = 0.85;

    for (let i = 0; i < segCount; i++) {
      const joint = new THREE.Group();
      joint.position.set(0, (i === 0 ? 0.35 : segLength), 0);
      parentJoint.add(joint);

      const rTop = 0.035 - (i * 0.007);
      const rBot = 0.04 - (i * 0.007);
      const blank = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, segLength, 8), rodMat);
      blank.position.y = segLength / 2;
      joint.add(blank);

      // Line guide ring
      const guide = new THREE.Mesh(new THREE.TorusGeometry(rTop * 1.8, 0.008, 6, 12), guideMat);
      guide.position.set(0, segLength * 0.85, rTop * 1.5);
      guide.rotation.x = Math.PI / 2;
      joint.add(guide);

      this.rodSegments.push(joint);
      parentJoint = joint;
    }

    // Tip anchor for fishing line
    this.rodTip = new THREE.Group();
    this.rodTip.position.set(0, segLength, 0);
    parentJoint.add(this.rodTip);

    this.rodMount.add(rodGroup);
  }

  getRodTipWorldPos() {
    if (!this.rodTip) return this.position.clone().add(new THREE.Vector3(0, 2.2, 0));
    const worldPos = new THREE.Vector3();
    this.rodTip.getWorldPosition(worldPos);
    return worldPos;
  }

  initFlashlight() {
    // High-Beam Angler LED Headlamp (Mounted on cap visor, illuminates up to 60 meters)
    this.flashlight = new THREE.SpotLight(0xfff7e6, 3.2, 60, Math.PI / 4.2, 0.35, 1.2);
    this.flashlight.visible = false;
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;

    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);

    // Warm ambient fill lantern around player
    this.flashlightFill = new THREE.PointLight(0xfff5e0, 0.85, 14);
    this.flashlightFill.visible = false;
    this.scene.add(this.flashlightFill);
  }

  toggleFlashlight() {
    this.flashlightActive = !this.flashlightActive;
    if (this.flashlight) this.flashlight.visible = this.flashlightActive;
    if (this.flashlightFill) this.flashlightFill.visible = this.flashlightActive;

    const btn = document.getElementById('flashlight-toggle-btn');
    if (btn) {
      btn.classList.toggle('active', this.flashlightActive);
      btn.innerHTML = this.flashlightActive ? '💡 Light: ON [F]' : '🔦 Light [F]';
    }

    if (window.soundSystem) window.soundSystem.playClick();
    if (window.game) {
      window.game.showToast(this.flashlightActive ? '🔦 Angler Headlamp turned ON' : '🔦 Angler Headlamp turned OFF', 'info');
    }
  }

  cycleCameraView() {
    const modes = ['third_back', 'first_person', 'third_front'];
    const nextIdx = (modes.indexOf(this.viewMode) + 1) % modes.length;
    this.setViewMode(modes[nextIdx]);
  }

  setViewMode(mode) {
    this.viewMode = mode;
    const modeNames = {
      third_back: 'Third-Person Chase View',
      first_person: 'First-Person POV Eyes View (Direct Vision)',
      third_front: 'Front Portrait View (Face & Outfit Inspection)'
    };

    if (this.viewMode === 'first_person') {
      this.camDistance = 0.5;
      if (this.head) this.head.visible = false;
    } else if (this.viewMode === 'third_front') {
      this.camDistance = 3.2;
      this.camPitch = 0.16;
      if (this.head) this.head.visible = true;
    } else {
      if (this.camDistance < 2.0) this.camDistance = 9.0;
      if (this.head) this.head.visible = true;
    }

    const btn = document.getElementById('camera-view-btn');
    if (btn) {
      const labels = {
        third_back: '👁️ 3rd Person [V]',
        first_person: '👀 1st Person [V]',
        third_front: '🤳 Face View [V]'
      };
      btn.innerHTML = labels[this.viewMode] || '👁️ View [V]';
    }

    if (window.soundSystem) window.soundSystem.playClick();
    if (window.game) {
      window.game.showToast(`Camera: ${modeNames[this.viewMode]}`, 'info');
    }
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sprint = true;
      if (code === 'Space') {
        this.keys.jump = true;
        if (!this.isDead && window.game && window.game.fishing && window.game.fishing.state === 'idle') {
          this.jump();
        }
      }

      // Camera view toggle: [V] (3rd Person -> 1st Person POV -> Front Face View)
      if (code === 'KeyV') {
        this.cycleCameraView();
      }

      // Angler Flashlight / Headlamp: [F]
      if (code === 'KeyF') {
        this.toggleFlashlight();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sprint = false;
      if (code === 'Space') this.keys.jump = false;
    });

    // Mouse drag for camera orbit & look around
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('#hud, .modal-overlay, .modal-card, .modal-box, .modal-body, .modal-close-btn, #reel-container, #cast-bar-container, #touch-controls, .touch-action-btn, .btn, .hud-pill, #interaction-prompt, .big-cast-button, #btn-restore-ui, .btn-restore-ui, #tutorial-hud-widget, .dialogue-card, .map-modal-card')) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      this.camYaw -= dx * 0.005;
      const minPitch = this.viewMode === 'first_person' ? -Math.PI / 2.5 : 0.04;
      const maxPitch = Math.PI / 2 - 0.08;
      this.camPitch = Math.max(minPitch, Math.min(maxPitch, this.camPitch + dy * 0.005));
    });

    // Touch Drag Camera Orbit & Pinch-Zoom for iPad / Mobile
    let touchCameraId = null;
    let prevTouchX = 0;
    let prevTouchY = 0;
    let initialPinchDist = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('#hud, .modal-overlay, .modal-card, .modal-box, .modal-body, .modal-close-btn, #reel-container, #cast-bar-container, #touch-controls, .touch-action-btn, .btn, .hud-pill, #interaction-prompt, .big-cast-button, #btn-restore-ui, .btn-restore-ui, #tutorial-hud-widget, .dialogue-card, .map-modal-card')) return;

      if (e.touches.length === 1 && touchCameraId === null) {
        touchCameraId = e.touches[0].identifier;
        prevTouchX = e.touches[0].clientX;
        prevTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        touchCameraId = null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialPinchDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const diff = initialPinchDist - dist;
        this.camDistance = Math.max(0.8, Math.min(28, this.camDistance + diff * 0.03));
        initialPinchDist = dist;
        return;
      }

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchCameraId) {
          const dx = touch.clientX - prevTouchX;
          const dy = touch.clientY - prevTouchY;
          prevTouchX = touch.clientX;
          prevTouchY = touch.clientY;

          this.camYaw -= dx * 0.006;
          const minPitch = this.viewMode === 'first_person' ? -Math.PI / 2.5 : 0.04;
          const maxPitch = Math.PI / 2 - 0.08;
          this.camPitch = Math.max(minPitch, Math.min(maxPitch, this.camPitch + dy * 0.006));
          break;
        }
      }
    }, { passive: true });

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchCameraId) {
          touchCameraId = null;
          break;
        }
      }
      if (e.touches.length < 2) {
        initialPinchDist = 0;
      }
    };
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    // Intuitive Smooth Mouse Wheel Zoom (0.6m to 32m with automatic First-Person transition)
    window.addEventListener('wheel', (e) => {
      this.camDistance = Math.max(0.6, Math.min(32, this.camDistance + e.deltaY * 0.015));

      // Auto-enter First-Person view when zoomed all the way in
      if (this.camDistance <= 1.1 && this.viewMode !== 'first_person') {
        this.setViewMode('first_person');
      } else if (this.camDistance > 1.1 && this.viewMode === 'first_person') {
        this.setViewMode('third_back');
      }
    });

    this.setupTouchControls();
  }

  setupTouchControls() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 1024;
    const touchControlsElem = document.getElementById('touch-controls');
    if (touchControlsElem && isTouch) {
      touchControlsElem.classList.remove('hidden');
    }

    const joyBase = document.getElementById('joystick-base');
    const joyThumb = document.getElementById('joystick-thumb');
    if (!joyBase || !joyThumb) return;

    let joyTouchId = null;
    let baseRect = null;
    const maxRadius = 45;

    const updateJoystickPosition = (clientX, clientY) => {
      if (!baseRect) baseRect = joyBase.getBoundingClientRect();
      const centerX = baseRect.left + baseRect.width / 2;
      const centerY = baseRect.top + baseRect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      joyThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

      // Normalized vector
      this.joystick.x = dx / maxRadius;
      this.joystick.z = dy / maxRadius;
      this.joystick.active = dist > 4;

      // Auto-sprint if pushed firmly
      if (dist > maxRadius * 0.85) {
        this.keys.sprint = true;
      } else if (!this.touchSprintToggled) {
        this.keys.sprint = false;
      }
    };

    joyBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.changedTouches[0];
      joyTouchId = touch.identifier;
      baseRect = joyBase.getBoundingClientRect();
      updateJoystickPosition(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (joyTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joyTouchId) {
          updateJoystickPosition(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    const handleJoyEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joyTouchId) {
          joyTouchId = null;
          baseRect = null;
          this.joystick.x = 0;
          this.joystick.z = 0;
          this.joystick.active = false;
          if (!this.touchSprintToggled) {
            this.keys.sprint = false;
          }
          joyThumb.style.transform = 'translate(-50%, -50%)';
          break;
        }
      }
    };
    window.addEventListener('touchend', handleJoyEnd);
    window.addEventListener('touchcancel', handleJoyEnd);

    // Touch Sprint Button
    const btnSprint = document.getElementById('btn-touch-sprint');
    if (btnSprint) {
      let sprintHandled = false;
      const handleSprint = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.touchSprintToggled = !this.touchSprintToggled;
        this.keys.sprint = this.touchSprintToggled;
        btnSprint.classList.toggle('active', this.touchSprintToggled);
      };
      btnSprint.addEventListener('touchstart', (e) => {
        sprintHandled = true;
        handleSprint(e);
      }, { passive: false });
      btnSprint.addEventListener('click', (e) => {
        if (sprintHandled) { sprintHandled = false; return; }
        handleSprint(e);
      });
    }

    // Touch Interact Button
    const btnInteract = document.getElementById('btn-touch-interact');
    if (btnInteract) {
      let interactHandled = false;
      const handleInteract = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (window.game) window.game.handleInteractKey();
      };
      btnInteract.addEventListener('touchstart', (e) => {
        interactHandled = true;
        handleInteract(e);
      }, { passive: false });
      btnInteract.addEventListener('click', (e) => {
        if (interactHandled) { interactHandled = false; return; }
        handleInteract(e);
      });
    }

    // Touch Jump Button (Mobile)
    const btnJump = document.getElementById('btn-touch-jump');
    if (btnJump) {
      let jumpHandled = false;
      const handleTouchJump = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.jump();
      };
      btnJump.addEventListener('touchstart', (e) => {
        jumpHandled = true;
        handleTouchJump(e);
      }, { passive: false });
      btnJump.addEventListener('click', (e) => {
        if (jumpHandled) { jumpHandled = false; return; }
        handleTouchJump(e);
      });
    }

    // Click on interaction prompt banner
    const promptElem = document.getElementById('interaction-prompt');
    if (promptElem) {
      promptElem.style.cursor = 'pointer';
      promptElem.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.game) window.game.handleInteractKey();
      }, { passive: false });
      promptElem.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.game) window.game.handleInteractKey();
      });
    }
  }

  jump() {
    if (!this.isGrounded || this.isDead || this.jumpCooldown > 0) return;
    this.velocityY = this.jumpForce;
    this.isGrounded = false;
    this.jumpCooldown = 0.22;
    if (window.soundSystem && window.soundSystem.playJumpSound) {
      window.soundSystem.playJumpSound();
    }
  }

  // Solid Collision Detection: Prevents passing through 240+ trees, Captain Barnaby's shack, campfire, and railings
  resolveObstacles(newX, newZ, playerRadius = 0.45) {
    let px = newX;
    let pz = newZ;

    // 1. Solid Tree Trunks across Archipelago (240+ trees)
    if (this.island && this.island.trees) {
      const trees = this.island.trees;
      for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        const dx = px - t.x;
        const dz = pz - t.z;
        if (Math.abs(dx) > 2.2 || Math.abs(dz) > 2.2) continue;

        let trunkR = 0.70;
        if (t.type === 'palm') trunkR = 0.60;
        else if (t.type === 'oak') trunkR = 0.85;
        else if (t.type === 'pine') trunkR = 0.68;
        else if (t.type === 'willow') trunkR = 0.75;
        else if (t.type === 'cherry') trunkR = 0.70;

        const minDist = trunkR + playerRadius;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.001) {
            const push = minDist - dist;
            px += (dx / dist) * push;
            pz += (dz / dist) * push;
          } else {
            px += minDist;
          }
        }
      }
    }

    // 2. Captain Barnaby's Tackle Shack & Front Counter
    // Shack center: (-14, 22), rotated by 0.3 rad
    const shopX = -14;
    const shopZ = 22;
    const shopRot = 0.3;
    const relX = px - shopX;
    const relZ = pz - shopZ;
    const cosR = Math.cos(-shopRot);
    const sinR = Math.sin(-shopRot);
    let locX = relX * cosR - relZ * sinR;
    let locZ = relX * sinR + relZ * cosR;

    // AABB 1: Shack main building (Width 7.5 -> half 3.75, Depth 6.0 -> half 3.0)
    const shackHalfW = 3.75 + playerRadius;
    const shackHalfD = 3.0 + playerRadius;
    if (Math.abs(locX) < shackHalfW && Math.abs(locZ) < shackHalfD) {
      const overlapX = shackHalfW - Math.abs(locX);
      const overlapZ = shackHalfD - Math.abs(locZ);
      if (overlapX < overlapZ) {
        locX = Math.sign(locX) * shackHalfW;
      } else {
        locZ = Math.sign(locZ) * shackHalfD;
      }
    }

    // AABB 2: Front Shop Counter (Width 4.6 -> half 2.3, Depth 1.5 -> half 0.75 at Z = 3.1)
    const countHalfW = 2.3 + playerRadius;
    const countZMin = (3.1 - 0.75) - playerRadius;
    const countZMax = (3.1 + 0.75) + playerRadius;
    if (Math.abs(locX) < countHalfW && locZ >= countZMin && locZ <= countZMax) {
      const overlapX = countHalfW - Math.abs(locX);
      const overlapZ = Math.min(Math.abs(locZ - countZMin), Math.abs(locZ - countZMax));
      if (overlapX < overlapZ) {
        locX = Math.sign(locX) * countHalfW;
      } else {
        locZ = (locZ < (countZMin + countZMax) / 2) ? countZMin : countZMax;
      }
    }

    // Transform local coordinates back to world space
    const cosInv = Math.cos(shopRot);
    const sinInv = Math.sin(shopRot);
    px = shopX + locX * cosInv - locZ * sinInv;
    pz = shopZ + locX * sinInv + locZ * cosInv;

    // 3. Haven Campfire Pit & Log Benches
    const fireDx = px - 4;
    const fireDz = pz - 28;
    const fireMinDist = 1.45 + playerRadius;
    const fireDistSq = fireDx * fireDx + fireDz * fireDz;
    if (fireDistSq < fireMinDist * fireMinDist) {
      const dist = Math.sqrt(fireDistSq);
      if (dist > 0.001) {
        const push = fireMinDist - dist;
        px += (fireDx / dist) * push;
        pz += (fireDz / dist) * push;
      }
    }

    // Campfire Log Bench at (4, 30.7)
    const benchDx = px - 4;
    const benchDz = pz - 30.7;
    const benchMinDist = 1.35 + playerRadius;
    const benchDistSq = benchDx * benchDx + benchDz * benchDz;
    if (benchDistSq < benchMinDist * benchMinDist) {
      const dist = Math.sqrt(benchDistSq);
      if (dist > 0.001) {
        const push = benchMinDist - dist;
        px += (benchDx / dist) * push;
        pz += (benchDz / dist) * push;
      }
    }

    // 4. Moored Ferry Boats (Ocean Pier)
    const boatDx = px - 9.2;
    const boatDz = pz - 117;
    const boatHalfW = 1.3 + playerRadius;
    const boatHalfD = 2.7 + playerRadius;
    if (Math.abs(boatDx) < boatHalfW && Math.abs(boatDz) < boatHalfD) {
      const ox = boatHalfW - Math.abs(boatDx);
      const oz = boatHalfD - Math.abs(boatDz);
      if (ox < oz) px = 9.2 + Math.sign(boatDx) * boatHalfW;
      else pz = 117 + Math.sign(boatDz) * boatHalfD;
    }

    // 5. Solid Bridge Rope Railings (Keep player from sliding off side of bridge)
    if (this.island && this.island.bridges) {
      for (const b of this.island.bridges) {
        const bdx = b.x2 - b.x1;
        const bdz = b.z2 - b.z1;
        const lenSq = bdx * bdx + bdz * bdz;
        const t = ((px - b.x1) * bdx + (pz - b.z1) * bdz) / lenSq;
        if (t >= 0.02 && t <= 0.98) {
          const projX = b.x1 + t * bdx;
          const projZ = b.z1 + t * bdz;
          const latDist = Math.hypot(px - projX, pz - projZ);
          const maxLateral = (b.width / 2) - playerRadius - 0.15;
          if (latDist > maxLateral && latDist <= (b.width / 2) + 0.6) {
            const nx = (px - projX) / latDist;
            const nz = (pz - projZ) / latDist;
            px = projX + nx * maxLateral;
            pz = projZ + nz * maxLateral;
          }
        }
      }
    }

    // 6. Solid Ocean Pier Walkway Railings / Posts
    if (pz >= 75.0 && pz <= 113.0) {
      const maxPierX = 2.2 - playerRadius;
      if (Math.abs(px) > maxPierX && Math.abs(px) <= 3.2) {
        px = Math.sign(px) * maxPierX;
      }
    }
    if (pz > 113.0 && pz <= 122.5) {
      const maxHeadX = 7.7 - playerRadius;
      if (Math.abs(px) > maxHeadX && Math.abs(px) <= 8.8) {
        px = Math.sign(px) * maxHeadX;
      }
      if (pz > 121.2 - playerRadius && pz <= 123.0) {
        pz = 121.2 - playerRadius;
      }
    }

    return { x: px, z: pz };
  }

  update(delta, isFishingActive, fishingState, tensionAmount = 0) {
    // 1. Natural Breathing Cycle (Ribcage Expansion & Shoulder Rise)
    this.breathTimer += delta * 1.85;
    const breath = Math.sin(this.breathTimer);
    if (this.chest) {
      this.chest.scale.set(1.0 + breath * 0.02, 1.0, 1.0 + breath * 0.025);
    }
    if (this.rightShoulder && this.leftShoulder) {
      this.rightShoulder.position.y = 0.26 + breath * 0.008;
      this.leftShoulder.position.y = 0.26 + breath * 0.008;
    }

    // 2. Realistic Eye Blinking Cycle (Blinks naturally every 3-5 seconds)
    this.blinkTimer -= delta;
    if (this.blinkTimer <= 0) {
      this.blinkProgress += delta * 20.0;
      const blinkRot = -Math.PI / 2.3 + Math.sin(Math.min(Math.PI, this.blinkProgress)) * 1.35;
      if (this.eyelids) {
        this.eyelids.forEach(lid => { lid.rotation.x = blinkRot; });
      }
      if (this.blinkProgress >= Math.PI) {
        this.blinkProgress = 0;
        this.blinkTimer = 3.2 + Math.random() * 2.8;
        if (this.eyelids) {
          this.eyelids.forEach(lid => { lid.rotation.x = -Math.PI / 2.3; });
        }
      }
    }

    // 3. Dynamic Rod Bending when fighting fish!
    const targetBend = (fishingState === 'reeling') ? (tensionAmount / 100) * 0.65 : 0;
    this.rodBendAmount = THREE.MathUtils.lerp(this.rodBendAmount, targetBend, delta * 8);

    // Flexible blank bending + dynamic inertia flex during movement
    const rodInertia = this.isMoving ? Math.sin(this.walkCycle * 2) * (this.keys.sprint ? 0.06 : 0.025) : 0;

    if (this.rodSegments) {
      this.rodSegments.forEach((seg, i) => {
        seg.rotation.x = (this.rodBendAmount + rodInertia) * (0.15 + i * 0.2);
      });
    }

    // 4. Reeling Crank Animation
    if (fishingState === 'reeling' && this.crank) {
      this.reelingCycle += delta * 24;
      this.crank.rotation.x = this.reelingCycle;
      // Left arm moves toward reel to crank
      this.leftShoulder.rotation.x = -0.55;
      this.leftElbow.rotation.x = -1.1 + Math.sin(this.reelingCycle) * 0.12;
      this.leftElbow.rotation.y = 0.45;
    } else if (!this.isMoving) {
      this.leftShoulder.rotation.set(0, 0, 0);
      this.leftElbow.rotation.set(0, 0, 0);
    }

    // 5. Casting Pose Animation
    if (fishingState === 'charging') {
      // Wind up rod behind back over right shoulder
      this.rightShoulder.rotation.x = 1.35;
      this.rightElbow.rotation.x = -0.85;
      this.spine.rotation.y = -0.25;
    } else if (fishingState === 'reeling') {
      // Fighting fish: lean back against line tension, raise rod high
      this.rightShoulder.rotation.x = -0.85;
      this.rightElbow.rotation.x = -0.55;
      this.spine.rotation.x = -0.22; // Lean back
    } else if (!this.isMoving) {
      // Normal ready pose
      this.rightShoulder.rotation.x = -0.45;
      this.rightElbow.rotation.x = -0.35;
      this.spine.rotation.set(0, 0, 0);
    }

    // 6. Death Sinking Animation when touching water!
    if (this.isDead) {
      this.deathTimer += delta;
      this.position.y -= delta * 2.2;
      this.mesh.rotation.x = Math.min(Math.PI / 2.2, this.mesh.rotation.x + delta * 2.8);
      this.mesh.position.copy(this.position);
      this.updateCamera();
      return;
    }

    // 7. Movement & Locomotion Update
    if (isFishingActive) {
      this.updateCamera();
      return;
    }

    let moveX = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    let moveZ = (this.keys.backward ? 1 : 0) - (this.keys.forward ? 1 : 0);

    if (this.joystick && this.joystick.active) {
      moveX = this.joystick.x;
      moveZ = this.joystick.z;
    }

    const inputMag = Math.hypot(moveX, moveZ);
    const hasInput = inputMag > 0.08;
    this.isMoving = hasInput;

    if (hasInput) {
      const inputAngle = Math.atan2(moveX, moveZ);
      // In first person, W moves forward in the exact direction the camera looks!
      const targetAngle = (this.viewMode === 'first_person' ? (this.camYaw + Math.PI) : this.camYaw) + inputAngle;

      let diff = targetAngle - this.rotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotation += diff * 0.18;

      const speedFactor = (this.joystick && this.joystick.active) ? Math.min(1.0, inputMag) : 1.0;
      const currentSpeed = this.speed * (this.keys.sprint ? this.sprintMult : 1.0) * speedFactor;
      const vx = Math.sin(targetAngle) * currentSpeed * delta;
      const vz = Math.cos(targetAngle) * currentSpeed * delta;

      const newX = this.position.x + vx;
      const newZ = this.position.z + vz;

      // Solid Collision Resolution (Trees, Shack, Campfire, Railings)
      const resolved = this.resolveObstacles(newX, newZ, this.playerRadius);
      this.position.x = resolved.x;
      this.position.z = resolved.z;

      // Realistic Human Bipedal Locomotion Cycle
      const sprint = this.keys.sprint;
      this.walkCycle += delta * (sprint ? 14.5 : 9.6);
      const legPhase = Math.sin(this.walkCycle);

      // Pelvis vertical double-bounce per stride & pelvic twist
      this.pelvis.position.y = 1.05 + Math.sin(this.walkCycle * 2) * (sprint ? 0.05 : 0.035);
      this.pelvis.rotation.y = legPhase * 0.12;
      this.pelvis.rotation.z = legPhase * 0.035;

      // Leg stride & knee shock absorption
      this.rightHip.rotation.x = legPhase * (sprint ? 0.85 : 0.64);
      this.leftHip.rotation.x = -legPhase * (sprint ? 0.85 : 0.64);

      this.rightKnee.rotation.x = legPhase < 0 ? -legPhase * (sprint ? 1.25 : 0.95) : 0;
      this.leftKnee.rotation.x = legPhase > 0 ? legPhase * (sprint ? 1.25 : 0.95) : 0;

      // Dynamic ankle roll & heel strike
      if (this.rightBoot && this.leftBoot) {
        this.rightBoot.rotation.x = legPhase * 0.28;
        this.leftBoot.rotation.x = -legPhase * 0.28;
      }

      // Torso Counter-Rotation (Upper body counterbalances hips for true human biomechanics)
      this.spine.rotation.y = -legPhase * 0.10;
      this.spine.rotation.x = (sprint ? 0.22 : 0.06);

      // Left Arm Natural Swing (Opposes right leg)
      this.leftShoulder.rotation.x = legPhase * (sprint ? 0.82 : 0.48);
      this.leftElbow.rotation.x = -0.32 - Math.max(0, legPhase) * 0.45;
      this.leftShoulder.rotation.z = 0.08 + (sprint ? 0.12 : 0.04);

      // Right Arm (Holding rod: balanced ready posture with subtle counter-sway)
      this.rightShoulder.rotation.x = -0.45 - legPhase * (sprint ? 0.25 : 0.12);
      this.rightElbow.rotation.x = -0.35;

      // Accurate pier & bridge bounds check
      const onPierWalk = (this.position.z >= 74.5 && this.position.z <= 113 && Math.abs(this.position.x) <= 2.5);
      const onPierHead = (this.position.z >= 113 && this.position.z <= 122 && Math.abs(this.position.x) <= 8.2);
      const onPondDock = (this.position.z >= -9.5 && this.position.z <= -1.8 && Math.abs(this.position.x - 14) <= 2.2);
      const bridgeInfo = this.island.getBridgeAt(this.position.x, this.position.z);
      const onBridge = bridgeInfo !== null;

      this.footstepTimer += delta * (sprint ? 14.5 : 9.6);
      if (this.footstepTimer >= Math.PI) {
        this.footstepTimer = 0;
        this.stepCount = (this.stepCount || 0) + 1;
        const isRightFoot = (this.stepCount % 2 === 0);

        const surface = (onPierWalk || onPierHead || onPondDock || onBridge) ? 'wood' : 'sand';
        if (this.isGrounded && window.soundSystem) window.soundSystem.playFootstep(surface);

        // Dynamic Sand Displacement & Particles: Footprint decals, sand grain spray & dust puffs
        if (this.isGrounded && surface === 'sand' && this.island.sandPhysics) {
          this.island.sandPhysics.onPlayerStep(this.position, this.rotation, isRightFoot, this.keys.sprint);
        }
      }
    } else {
      // Natural Idle Stance: Weight shifting & relaxed limb dampening
      this.idleTimer += delta;
      this.rightHip.rotation.x *= 0.85;
      this.leftHip.rotation.x *= 0.85;
      this.rightKnee.rotation.x *= 0.85;
      this.leftKnee.rotation.x *= 0.85;
      if (this.rightBoot && this.leftBoot) {
        this.rightBoot.rotation.x *= 0.85;
        this.leftBoot.rotation.x *= 0.85;
      }
      this.pelvis.rotation.y *= 0.85;
      this.spine.rotation.y *= 0.85;
      this.spine.rotation.x *= 0.85;

      // Subtle human weight shift between left & right leg
      this.pelvis.position.x = Math.sin(this.idleTimer * 0.85) * 0.02;
      this.pelvis.rotation.z = Math.sin(this.idleTimer * 0.85) * 0.018;
      this.pelvis.position.y = 1.05 + Math.sin(this.breathTimer) * 0.012;

      this.leftShoulder.rotation.x *= 0.85;
      this.leftElbow.rotation.x *= 0.85;
    }

    // Precise Pier, Dock & Bridge Elevation
    const onPierWalk = (this.position.z >= 74.5 && this.position.z <= 113 && Math.abs(this.position.x) <= 2.5);
    const onPierHead = (this.position.z >= 113 && this.position.z <= 122 && Math.abs(this.position.x) <= 8.2);
    const onPier = onPierWalk || onPierHead;
    const onPondDock = (this.position.z >= -9.5 && this.position.z <= -1.8 && Math.abs(this.position.x - 14) <= 2.2);
    const bridgeInfo = this.island.getBridgeAt(this.position.x, this.position.z);

    let groundTargetY = this.island.getHeight(this.position.x, this.position.z);
    if (bridgeInfo) {
      groundTargetY = bridgeInfo.height; // Elevated safely on wooden suspension bridge!
    } else if (onPier) {
      groundTargetY = 1.4; // Elevated safely above ocean water
    } else if (onPondDock) {
      groundTargetY = this.island.pondWaterLevel + 0.15; // Elevated safely above pond water
    } else if (this.isGrounded && this.isMoving && this.island.sandPhysics && this.island.sandPhysics.isSand(this.position.x, this.position.z, groundTargetY)) {
      // Natural soft sand compression under the boot step
      const sandSink = Math.abs(Math.sin(this.walkCycle)) * 0.038;
      groundTargetY -= sandSink;
    }

    if (this.jumpCooldown > 0) this.jumpCooldown -= delta;

    // Vertical Gravity & Airborne Jump Mechanics
    if (!this.isGrounded) {
      this.velocityY += this.gravity * delta;
      this.position.y += this.velocityY * delta;

      // Landing check
      if (this.position.y <= groundTargetY) {
        this.position.y = groundTargetY;
        this.velocityY = 0;
        this.isGrounded = true;

        const surface = (onPier || onPondDock || bridgeInfo) ? 'wood' : 'sand';
        if (window.soundSystem && window.soundSystem.playLandSound) {
          window.soundSystem.playLandSound(surface);
        }
        if (surface === 'sand' && this.island.sandPhysics) {
          this.island.sandPhysics.onPlayerStep(this.position, this.rotation, true, true);
        }
      } else {
        // Natural airborne jumping pose
        this.rightHip.rotation.x = -0.32;
        this.leftHip.rotation.x = -0.22;
        this.rightKnee.rotation.x = 0.50;
        this.leftKnee.rotation.x = 0.42;
        this.leftShoulder.rotation.z = 0.38;
        this.rightShoulder.rotation.z = -0.28;
      }
    } else {
      this.position.y = groundTargetY;
    }

    // Apply model transform
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;

    // Check if player touched water -> DIE!
    this.checkWaterContact(onPier, onPondDock, bridgeInfo);

    this.updateCamera();
  }

  checkWaterContact(onPier, onPondDock, bridgeInfo) {
    if (this.isDead) return;

    // If standing on the wooden pier, pond dock, or elevated bridge, player is strictly safe!
    if (onPier || onPondDock || (bridgeInfo && bridgeInfo.onBridge)) return;

    const px = this.position.x;
    const pz = this.position.z;
    const py = this.position.y;

    // 1. Freshwater Pond check (Main Island)
    const pDist = Math.hypot(px - this.island.pondCenter.x, pz - this.island.pondCenter.y);
    if (pDist <= this.island.pondRadius - 0.2) {
      if (py <= this.island.pondWaterLevel) {
        this.triggerWaterDeathEffect(px, this.island.pondWaterLevel, pz);
        this.die('You fell into the freshwater pond and drowned!');
        return;
      }
    }

    // 2. Volcanic Geothermal Caldera check (Volcanic Island)
    const vDist = Math.hypot(px - this.island.volcanoCenter.x, pz - this.island.volcanoCenter.y);
    if (vDist <= 10.5) {
      if (py <= this.island.volcanoWaterLevel) {
        this.triggerWaterDeathEffect(px, this.island.volcanoWaterLevel, pz);
        this.die('You fell into the boiling volcanic sulfur pool!');
        return;
      }
    }

    // 3. Coral Lagoon check (Coral Atoll)
    const cDist = Math.hypot(px - this.island.coralCenter.x, pz - this.island.coralCenter.y);
    if (cDist <= 10.5) {
      if (py <= this.island.coralLagoonWaterLevel) {
        this.triggerWaterDeathEffect(px, this.island.coralLagoonWaterLevel, pz);
        this.die('You fell into the deep coral lagoon and drowned!');
        return;
      }
    }

    // 4. Ocean water check (Lethal strictly when player's body actually touches the ocean)
    // If airborne during a jump, player is safe until feet actually touch the water surface!
    if (py <= this.island.oceanWaterLevel) {
      const groundY = this.island.getHeight(px, pz);
      if (groundY <= this.island.oceanWaterLevel + 0.05) {
        this.triggerWaterDeathEffect(px, this.island.oceanWaterLevel, pz);
        this.die('You touched the deadly ocean waters and drowned!');
        return;
      }
    }
  }

  triggerWaterDeathEffect(x, waterY, z) {
    if (window.soundSystem && window.soundSystem.playSplash) {
      window.soundSystem.playSplash(true);
    }
    if (window.game && window.game.fishing && window.game.fishing.triggerSplash) {
      window.game.fishing.triggerSplash(new THREE.Vector3(x, waterY, z), true);
    }
  }

  die(reason) {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 0;
    this.deathReason = reason;

    if (window.soundSystem) window.soundSystem.playDeathSound();
    if (window.game) window.game.onPlayerDied(reason);
  }

  respawn(spawnType = 'trail') {
    this.isDead = false;
    this.deathTimer = 0;
    this.deathReason = '';
    this.keys = { forward: false, backward: false, left: false, right: false, sprint: false, jump: false };
    this.velocityY = 0;
    this.isGrounded = true;
    if (this.joystick) {
      this.joystick.x = 0;
      this.joystick.z = 0;
      this.joystick.active = false;
    }
    this.isMoving = false;
    this.walkCycle = 0;

    let spawnX = 0;
    let spawnZ = 72;
    if (spawnType === 'campfire') {
      spawnX = 4;
      spawnZ = 33; // Near Haven Campfire (warm sanctuary)
    }

    const groundY = this.island ? this.island.getHeight(spawnX, spawnZ) : 2.5;
    this.position.set(spawnX, Math.max(groundY, 2.0), spawnZ);
    this.rotation = (spawnType === 'campfire') ? 0 : Math.PI;
    this.mesh.rotation.set(0, this.rotation, 0);
    this.mesh.position.copy(this.position);

    // Reset anatomical skeleton joints so model isn't stuck tilted or collapsed
    if (this.spine) this.spine.rotation.set(0, 0, 0);
    if (this.neck) this.neck.rotation.set(0, 0, 0);
    if (this.leftShoulder) this.leftShoulder.rotation.set(0, 0, 0);
    if (this.rightShoulder) this.rightShoulder.rotation.set(0, 0, 0);
    if (this.leftElbow) this.leftElbow.rotation.set(0, 0, 0);
    if (this.rightElbow) this.rightElbow.rotation.set(0, 0, 0);
    if (this.leftHip) this.leftHip.rotation.set(0, 0, 0);
    if (this.rightHip) this.rightHip.rotation.set(0, 0, 0);
    if (this.leftKnee) this.leftKnee.rotation.set(0, 0, 0);
    if (this.rightKnee) this.rightKnee.rotation.set(0, 0, 0);

    // Reset camera orientation
    this.camPitch = 0.30;
    this.camYaw = (spawnType === 'campfire') ? Math.PI : 0;
    this.updateCamera();

    if (window.soundSystem && window.soundSystem.playRespawnSound) {
      window.soundSystem.playRespawnSound();
    }
    if (window.game && window.game.onPlayerRespawn) {
      window.game.onPlayerRespawn(spawnType);
    }
  }

  updateCamera() {
    // 1. FIRST-PERSON POV VIEW (Direct Vision Through Player's Eyes)
    if (this.viewMode === 'first_person') {
      const eyeY = this.position.y + 1.68;
      // Position camera slightly forward of body center to clear all geometry
      const forwardOffset = 0.35;
      const eyeX = this.position.x - Math.sin(this.camYaw) * forwardOffset;
      const eyeZ = this.position.z - Math.cos(this.camYaw) * forwardOffset;
      this.camera.position.set(eyeX, eyeY, eyeZ);

      const lookDist = 30.0;
      const lx = eyeX - Math.sin(this.camYaw) * Math.cos(this.camPitch) * lookDist;
      const ly = eyeY - Math.sin(this.camPitch) * lookDist;
      const lz = eyeZ - Math.cos(this.camYaw) * Math.cos(this.camPitch) * lookDist;
      this.camera.lookAt(lx, ly, lz);

      if (this.head) this.head.visible = false;
      if (this.chest) this.chest.visible = false;
      if (this.pelvis) this.pelvis.visible = false;
    }
    // 2. FRONT PORTRAIT VIEW (Selfie / Character & Face Inspection)
    else if (this.viewMode === 'third_front') {
      if (this.head) this.head.visible = true;
      if (this.chest) this.chest.visible = true;
      if (this.pelvis) this.pelvis.visible = true;

      const lookY = this.position.y + 1.45;
      const frontDist = Math.max(1.8, Math.min(5.5, this.camDistance));
      const frontYaw = this.rotation; // Directly facing front of character

      const cx = this.position.x + Math.sin(frontYaw) * Math.cos(this.camPitch) * frontDist;
      const cy = lookY + Math.sin(this.camPitch) * frontDist;
      const cz = this.position.z + Math.cos(frontYaw) * Math.cos(this.camPitch) * frontDist;

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(this.position.x, lookY, this.position.z);
    }
    // 3. STANDARD THIRD-PERSON CHASE VIEW
    else {
      if (this.head) this.head.visible = true;
      if (this.chest) this.chest.visible = true;
      if (this.pelvis) this.pelvis.visible = true;

      const lookY = this.position.y + 1.45;
      const cx = this.position.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;
      const cy = lookY + Math.sin(this.camPitch) * this.camDistance;
      const cz = this.position.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(this.position.x, lookY, this.position.z);
    }

    // High-Beam Flashlight Position & Beam Direction Tracking
    if (this.flashlight && this.flashlightActive) {
      const headY = this.position.y + 1.68;
      this.flashlight.position.set(this.position.x, headY, this.position.z);

      if (this.viewMode === 'first_person') {
        const lx = this.position.x - Math.sin(this.camYaw) * Math.cos(this.camPitch) * 35;
        const ly = headY - Math.sin(this.camPitch) * 35;
        const lz = this.position.z - Math.cos(this.camYaw) * Math.cos(this.camPitch) * 35;
        this.flashlightTarget.position.set(lx, ly, lz);
      } else {
        const lx = this.position.x + Math.sin(this.rotation) * 35;
        const lz = this.position.z + Math.cos(this.rotation) * 35;
        this.flashlightTarget.position.set(lx, this.position.y + 0.9, lz);
      }

      if (this.flashlightFill) {
        this.flashlightFill.position.set(this.position.x, headY, this.position.z);
      }
    }
  }
}

window.Player = Player;
