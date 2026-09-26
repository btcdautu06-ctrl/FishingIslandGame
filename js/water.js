// Realistic Physical Ocean, Wave Displacement, Sun Glitter, Shoreline Surf Foam, and Sand Texturing

class RealisticOcean {
  constructor(scene, island) {
    this.scene = scene;
    this.island = island;
    this.time = 0;

    this.initTextures();
    this.buildOcean();
    this.buildShorelineSurf();
    this.buildPondDecor();
    this.buildCoralReefs();
    this.buildVolcanoSteam();
  }

  initTextures() {
    this.causticTex = this.createCausticTexture();
    this.causticTex.wrapS = THREE.RepeatWrapping;
    this.causticTex.wrapT = THREE.RepeatWrapping;

    this.foamTex = this.createFoamTexture();
    this.foamTex.wrapS = THREE.RepeatWrapping;
    this.foamTex.wrapT = THREE.RepeatWrapping;
  }

  // 1. PROCEDURAL CAUSTICS TEXTURE
  createCausticTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 256);

    // Multi-layered caustic cell rings
    for (let layer = 0; layer < 3; layer++) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 2.5 + layer;
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = 14 + Math.random() * 22;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    return new THREE.CanvasTexture(canvas);
  }

  // 2. PROCEDURAL SEA FOAM LACE TEXTURE
  createFoamTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, 256, 256);

    // Foam bubbles and lace web
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 0.8 + Math.random() * 2.8;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  // 3. PHYSICAL 3D WAVE DISPLACEMENT OCEAN WITH DEPTH ABSORPTION & SUN GLITTER
  buildOcean() {
    // 950x950 ocean plane with 140x140 resolution for smooth physical wave displacement
    const geo = new THREE.PlaneGeometry(950, 950, 140, 140);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, 45);

    const vertexShader = [
      'uniform float uTime;',
      'varying vec3 vWorldPos;',
      'varying vec3 vNormal;',
      'varying vec2 vUv;',
      'varying float vWaveHeight;',
      '',
      'void main() {',
      '  vUv = uv;',
      '  vec4 worldPos = modelMatrix * vec4(position, 1.0);',
      '  ',
      '  // 4 harmonic wave trains (swells, cross chop, ripples)',
      '  float w1 = sin(worldPos.x * 0.038 + uTime * 1.3) * cos(worldPos.z * 0.035 + uTime * 0.95) * 0.28;',
      '  float w2 = sin(worldPos.x * 0.08 - uTime * 1.8) * cos(worldPos.z * 0.065 + uTime * 1.4) * 0.14;',
      '  float w3 = sin((worldPos.x + worldPos.z) * 0.14 + uTime * 2.5) * 0.06;',
      '  float w4 = cos((worldPos.x * 0.25 - worldPos.z * 0.18) + uTime * 3.4) * 0.03;',
      '  ',
      '  float totalWave = w1 + w2 + w3 + w4;',
      '  worldPos.y += totalWave;',
      '  vWaveHeight = totalWave;',
      '',
      '  // Analytical surface normals',
      '  float dx = (cos(worldPos.x * 0.038 + uTime * 1.3) * 0.038 * cos(worldPos.z * 0.035 + uTime * 0.95) * 0.28) +',
      '             (cos(worldPos.x * 0.08 - uTime * 1.8) * 0.08 * cos(worldPos.z * 0.065 + uTime * 1.4) * 0.14);',
      '  float dz = (-sin(worldPos.x * 0.038 + uTime * 1.3) * sin(worldPos.z * 0.035 + uTime * 0.95) * 0.035 * 0.28) +',
      '             (-sin(worldPos.x * 0.08 - uTime * 1.8) * sin(worldPos.z * 0.065 + uTime * 1.4) * 0.065 * 0.14);',
      '',
      '  vNormal = normalize(vec3(-dx * 2.8, 1.0, -dz * 2.8));',
      '  vWorldPos = worldPos.xyz;',
      '',
      '  gl_Position = projectionMatrix * viewMatrix * worldPos;',
      '}'
    ].join('\n');

    const fragmentShader = [
      'uniform float uTime;',
      'uniform vec3 uSunDir;',
      'uniform vec3 uMoonDir;',
      'uniform vec3 uSunColor;',
      'uniform vec3 uMoonColor;',
      'uniform vec3 uSkyColor;',
      'uniform vec3 uHorizonColor;',
      'uniform float uNightFactor;',
      'uniform vec3 uDeepColor;',
      'uniform vec3 uShallowColor;',
      'uniform vec3 uReefColor;',
      'uniform vec3 uFoamColor;',
      'uniform sampler2D uCausticTex;',
      '',
      'varying vec3 vWorldPos;',
      'varying vec3 vNormal;',
      'varying vec2 vUv;',
      'varying float vWaveHeight;',
      '',
      'void main() {',
      '  vec3 viewDir = normalize(cameraPosition - vWorldPos);',
      '  vec3 normal = normalize(vNormal);',
      '',
      '  // Distance from archipelago islands for depth color absorption',
      '  float distMain = length(vWorldPos.xz);',
      '  float distCoral = length(vWorldPos.xz - vec2(155.0, -20.0));',
      '  float distVolc = length(vWorldPos.xz - vec2(-145.0, -60.0));',
      '  float distTitan = length(vWorldPos.xz - vec2(0.0, 215.0));',
      '',
      '  float minDist = min(min(distMain - 75.0, distCoral - 42.0), min(distVolc - 46.0, distTitan - 40.0));',
      '  float depthFactor = clamp(minDist / 55.0, 0.0, 1.0);',
      '',
      '  // Dual-tone Water Depth (Caribbean Turquoise to Deep Abyssal Azure)',
      '  vec3 waterColor = mix(uShallowColor, uDeepColor, depthFactor);',
      '  ',
      '  // Reef coloration near Tropical Coral Atoll',
      '  if (distCoral < 65.0) {',
      '    float reefBlend = 1.0 - clamp((distCoral - 40.0) / 25.0, 0.0, 1.0);',
      '    waterColor = mix(waterColor, uReefColor, reefBlend * 0.65);',
      '  }',
      '',
      '  // Animated caustics in shallow waters',
      '  if (depthFactor < 0.65) {',
      '    vec2 cUv1 = vWorldPos.xz * 0.08 + vec2(uTime * 0.04, uTime * 0.03);',
      '    vec2 cUv2 = vWorldPos.xz * 0.08 + vec2(-uTime * 0.03, uTime * 0.05);',
      '    float caustic = (texture2D(uCausticTex, cUv1).r + texture2D(uCausticTex, cUv2).r) * 0.5;',
      '    waterColor += vec3(0.18, 0.32, 0.28) * caustic * (1.0 - depthFactor / 0.65) * (1.0 - uNightFactor * 0.7);',
      '  }',
      '',
      '  // Physical Fresnel Sky Reflection',
      '  float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.8);',
      '  vec3 reflectedSky = mix(uHorizonColor, uSkyColor, fresnel * 0.85);',
      '  waterColor = mix(waterColor, reflectedSky, fresnel * 0.65);',
      '',
      '  // Specular Sun & Moon Path (Dazzling Sun Glitter across Waves)',
      '  vec3 lightDir = uNightFactor > 0.5 ? uMoonDir : uSunDir;',
      '  vec3 lightCol = uNightFactor > 0.5 ? uMoonColor : uSunColor;',
      '  vec3 halfVec = normalize(lightDir + viewDir);',
      '  float specAngle = max(0.0, dot(normal, halfVec));',
      '  float specular = pow(specAngle, 72.0) * (uNightFactor > 0.5 ? 1.6 : 2.5);',
      '  waterColor += lightCol * specular;',
      '',
      '  // Wave crest sea foam on tall wave peaks',
      '  float crestFoam = smoothstep(0.24, 0.36, vWaveHeight);',
      '  waterColor = mix(waterColor, uFoamColor, crestFoam * 0.75);',
      '  // Crystal-clear coastal & shallow water transparency (see swimming fish & seabed!)',
      '  float waterAlpha = mix(0.70, 0.92, depthFactor);',
      '  gl_FragColor = vec4(waterColor, waterAlpha);',
      '}'
    ].join('\n');

    this.waterUniforms = {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
      uMoonDir: { value: new THREE.Vector3(-0.4, 0.8, -0.3).normalize() },
      uSunColor: { value: new THREE.Color(0xfff7e6) },
      uMoonColor: { value: new THREE.Color(0xdff9fb) },
      uSkyColor: { value: new THREE.Color(0x1e88e5) },
      uHorizonColor: { value: new THREE.Color(0x81ecec) },
      uNightFactor: { value: 0.0 },
      uDeepColor: { value: new THREE.Color(0x021735) },    // Deep oceanic midnight navy
      uShallowColor: { value: new THREE.Color(0x00cec9) }, // Luminous Caribbean turquoise
      uReefColor: { value: new THREE.Color(0x10ac84) },    // Reef emerald
      uFoamColor: { value: new THREE.Color(0xffffff) },
      uCausticTex: { value: this.causticTex }
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.waterUniforms,
      transparent: true,
      side: THREE.DoubleSide
    });

    this.oceanMesh = new THREE.Mesh(geo, mat);
    this.oceanMesh.position.y = this.island.oceanWaterLevel;
    this.scene.add(this.oceanMesh);
  }

  // 4. ANIMATED SHORELINE SURF FOAM (LAPPING WAVES ON BEACHES)
  buildShorelineSurf() {
    this.surfGroup = new THREE.Group();
    const foamMat = new THREE.MeshBasicMaterial({
      map: this.foamTex,
      transparent: true,
      opacity: 0.78,
      color: 0xffffff,
      depthWrite: false
    });

    // Ring geometries along each island's beach perimeter
    // 1. Main Island Surf Ring
    const mainRingGeo = new THREE.RingGeometry(76, 88, 72);
    mainRingGeo.rotateX(-Math.PI / 2);
    this.mainSurfMesh = new THREE.Mesh(mainRingGeo, foamMat);
    this.mainSurfMesh.position.y = this.island.oceanWaterLevel + 0.08;
    this.surfGroup.add(this.mainSurfMesh);

    // 2. Coral Atoll Surf Ring
    const coralRingGeo = new THREE.RingGeometry(42, 50, 48);
    coralRingGeo.rotateX(-Math.PI / 2);
    this.coralSurfMesh = new THREE.Mesh(coralRingGeo, foamMat);
    this.coralSurfMesh.position.set(this.island.coralCenter.x, this.island.oceanWaterLevel + 0.08, this.island.coralCenter.y);
    this.surfGroup.add(this.coralSurfMesh);

    // 3. Volcanic Crags Surf Ring
    const volcRingGeo = new THREE.RingGeometry(46, 54, 48);
    volcRingGeo.rotateX(-Math.PI / 2);
    this.volcSurfMesh = new THREE.Mesh(volcRingGeo, foamMat);
    this.volcSurfMesh.position.set(this.island.volcanoCenter.x, this.island.oceanWaterLevel + 0.08, this.island.volcanoCenter.y);
    this.surfGroup.add(this.volcSurfMesh);

    this.scene.add(this.surfGroup);
  }

  // 5. FRESHWATER POND WATER LILIES WITH LOTUS BLOSSOMS
  buildPondDecor() {
    this.lilyGroup = new THREE.Group();
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5, side: THREE.DoubleSide });
    const flowerPinkMat = new THREE.MeshStandardMaterial({ color: 0xff7675, roughness: 0.4 });
    const flowerWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const flowerCenterMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });

    const padGeo = new THREE.CircleGeometry(0.7, 12, 0, Math.PI * 1.85);
    padGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
      const r = 5.0 + Math.random() * 8.5;
      const lx = this.island.pondCenter.x + Math.cos(a) * r;
      const lz = this.island.pondCenter.y + Math.sin(a) * r;

      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(lx, this.island.pondWaterLevel + 0.02, lz);
      pad.rotation.y = Math.random() * Math.PI * 2;
      const s = 0.75 + Math.random() * 0.5;
      pad.scale.set(s, 1, s);
      this.lilyGroup.add(pad);

      // Lotus Flower on selected lily pads
      if (i % 2 === 0) {
        const flower = new THREE.Group();
        flower.position.set(lx, this.island.pondWaterLevel + 0.06, lz);
        const petalMat = (i % 4 === 0) ? flowerWhiteMat : flowerPinkMat;

        for (let p = 0; p < 7; p++) {
          const pa = (p / 7) * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 4), petalMat);
          petal.position.set(Math.cos(pa) * 0.18, 0.15, Math.sin(pa) * 0.18);
          petal.rotation.y = pa;
          petal.rotation.x = 0.45;
          flower.add(petal);
        }
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), flowerCenterMat);
        center.position.y = 0.14;
        flower.add(center);
        this.lilyGroup.add(flower);
      }
    }

    this.scene.add(this.lilyGroup);
  }

  // 6. UNDERWATER CORAL REEFS VISIBLE IN CORAL ATOLL LAGOON
  buildCoralReefs() {
    this.coralGroup = new THREE.Group();
    const coralColors = [0xff7675, 0x00cec9, 0xa29bfe, 0xfd79a8, 0xf1c40f];

    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const r = 3.5 + Math.random() * 6.5;
      const cx = this.island.coralCenter.x + Math.cos(a) * r;
      const cz = this.island.coralCenter.y + Math.sin(a) * r;
      const cy = this.island.coralLagoonWaterLevel - 0.7;

      const col = coralColors[i % coralColors.length];
      const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, metalness: 0.1 });

      if (i % 2 === 0) {
        // Branching staghorn coral
        const branchGeo = new THREE.CylinderGeometry(0.1, 0.22, 1.2, 5);
        for (let b = 0; b < 4; b++) {
          const branch = new THREE.Mesh(branchGeo, mat);
          branch.position.set(cx + (b - 1.5) * 0.25, cy + 0.5, cz + (Math.random() - 0.5) * 0.4);
          branch.rotation.z = (Math.random() - 0.5) * 0.5;
          branch.rotation.x = (Math.random() - 0.5) * 0.5;
          this.coralGroup.add(branch);
        }
      } else {
        // Brain coral dome
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
        dome.position.set(cx, cy + 0.1, cz);
        this.coralGroup.add(dome);
      }
    }

    this.scene.add(this.coralGroup);
  }

  // 7. STEAM / VAPOR PUFFS RISING FROM VOLCANIC CALDERA
  buildVolcanoSteam() {
    this.steamParticles = [];
    this.steamGroup = new THREE.Group();

    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xecf0f1,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    const steamGeo = new THREE.SphereGeometry(0.6, 6, 6);

    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(steamGeo, steamMat);
      p.position.set(
        this.island.volcanoCenter.x + (Math.random() - 0.5) * 14,
        this.island.volcanoWaterLevel + 0.3 + Math.random() * 4,
        this.island.volcanoCenter.y + (Math.random() - 0.5) * 14
      );
      p.userData = {
        speedY: 1.2 + Math.random() * 1.5,
        driftX: (Math.random() - 0.5) * 0.6,
        baseY: this.island.volcanoWaterLevel + 0.3,
        maxLife: 3.5 + Math.random() * 2,
        life: Math.random() * 3
      };
      this.steamGroup.add(p);
      this.steamParticles.push(p);
    }

    this.scene.add(this.steamGroup);
  }

  // UPDATE TICK
  update(delta, sky) {
    this.time += delta;

    // 1. Update Ocean Shader Uniforms
    if (this.waterUniforms) {
      this.waterUniforms.uTime.value = this.time;

      if (sky && sky.state) {
        this.waterUniforms.uSunDir.value.copy(sky.state.sunPos);
        this.waterUniforms.uMoonDir.value.copy(sky.state.moonPos);
        this.waterUniforms.uSunColor.value.copy(sky.state.sunColor);
        this.waterUniforms.uMoonColor.value.copy(sky.state.moonColor);
        this.waterUniforms.uSkyColor.value.copy(sky.state.zenithColor);
        this.waterUniforms.uHorizonColor.value.copy(sky.state.horizonColor);
        this.waterUniforms.uNightFactor.value = sky.state.nightFactor;
      }
    }

    // 2. Animated Shoreline Surf Lapping
    const tidePhase = Math.sin(this.time * 1.6);
    const surfScale = 1.0 + tidePhase * 0.055;
    const surfOpacity = 0.55 + tidePhase * 0.25;

    if (this.mainSurfMesh) {
      this.mainSurfMesh.scale.set(surfScale, 1, surfScale);
      this.mainSurfMesh.material.opacity = surfOpacity;
    }
    if (this.coralSurfMesh) {
      this.coralSurfMesh.scale.set(surfScale, 1, surfScale);
      this.coralSurfMesh.material.opacity = surfOpacity;
    }
    if (this.volcSurfMesh) {
      this.volcSurfMesh.scale.set(surfScale, 1, surfScale);
      this.volcSurfMesh.material.opacity = surfOpacity;
    }

    // 3. Gentle Pond Water Lily Float Bob
    if (this.lilyGroup) {
      this.lilyGroup.position.y = Math.sin(this.time * 1.2) * 0.02;
    }

    // 4. Volcanic Geothermal Steam Rising
    for (const p of this.steamParticles) {
      p.userData.life += delta;
      p.position.y += delta * p.userData.speedY;
      p.position.x += delta * p.userData.driftX;

      const progress = p.userData.life / p.userData.maxLife;
      if (progress >= 1.0) {
        p.userData.life = 0;
        p.position.set(
          this.island.volcanoCenter.x + (Math.random() - 0.5) * 14,
          p.userData.baseY,
          this.island.volcanoCenter.y + (Math.random() - 0.5) * 14
        );
        p.scale.set(1, 1, 1);
      } else {
        const s = 1.0 + progress * 2.5;
        p.scale.set(s, s * 1.2, s);
      }
    }
  }
}

// REALISTIC PROCEDURAL SAND GENERATOR & BEACH DETAILS
class RealisticSand {
  static createSandTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base golden sand quartz
    ctx.fillStyle = '#edd29a';
    ctx.fillRect(0, 0, 512, 512);

    // Wind-swept sand dune ripples
    for (let y = 0; y < 512; y += 12) {
      const grad = ctx.createLinearGradient(0, y, 0, y + 12);
      grad.addColorStop(0.0, 'rgba(255, 245, 220, 0.45)');
      grad.addColorStop(0.5, 'rgba(215, 175, 115, 0.28)');
      grad.addColorStop(1.0, 'rgba(180, 140, 85, 0.40)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) {
        const offset = Math.sin(x * 0.04) * 4;
        ctx.lineTo(x, y + offset);
      }
      ctx.lineTo(512, y + 12);
      ctx.lineTo(0, y + 12);
      ctx.closePath();
      ctx.fill();
    }

    // Micro mineral grains (silica, shell fragments, mica flecks)
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 32;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.9));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.7));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(18, 18);
    return tex;
  }

  static createSandBumpTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 10) {
      const grad = ctx.createLinearGradient(0, y, 0, y + 10);
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.5, '#808080');
      grad.addColorStop(1.0, '#333333');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, 256, 10);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(18, 18);
    return tex;
  }

  // BUILD 3D REALISTIC BEACH SEASHELLS, STARFISH, DRIFTWOOD, AND PEBBLES
  static populateBeachScatter(scene, island) {
    const beachGroup = new THREE.Group();

    const conchMat = new THREE.MeshStandardMaterial({ color: 0xffeaa7, roughness: 0.45 });
    const scallopMat = new THREE.MeshStandardMaterial({ color: 0xffcccc, roughness: 0.5 });
    const starfishMat = new THREE.MeshStandardMaterial({ color: 0xe17055, roughness: 0.65 });
    const driftwoodMat = new THREE.MeshStandardMaterial({ color: 0xa4b0be, roughness: 0.9 });
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x747d8c, roughness: 0.55 });

    // 1. SEASHELLS along tidal beach rim (~40 shells)
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 74 + Math.random() * 12;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = island.getHeight(x, z);

      if (y >= 0.35 && y <= 2.2) {
        if (i % 2 === 0) {
          // Spiral Conch Shell
          const conch = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.48, 5), conchMat);
          conch.position.set(x, y + 0.1, z);
          conch.rotation.set(Math.PI / 2.2, Math.random() * Math.PI, 0);
          beachGroup.add(conch);
        } else {
          // Scallop Fan Shell
          const scallop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.05, 0.08, 6), scallopMat);
          scallop.position.set(x, y + 0.05, z);
          scallop.rotation.set(0.3, Math.random() * Math.PI, 0);
          beachGroup.add(scallop);
        }
      }
    }

    // 2. SEA STARS (STARFISH) resting on wet sands (~18 starfish)
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 73 + Math.random() * 8;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = island.getHeight(x, z);

      if (y >= 0.25 && y <= 1.5) {
        const star = new THREE.Group();
        star.position.set(x, y + 0.04, z);
        for (let arm = 0; arm < 5; arm++) {
          const armAngle = (arm / 5) * Math.PI * 2;
          const armMesh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 4), starfishMat);
          armMesh.position.set(Math.cos(armAngle) * 0.16, 0, Math.sin(armAngle) * 0.16);
          armMesh.rotation.x = Math.PI / 2;
          armMesh.rotation.z = -armAngle;
          star.add(armMesh);
        }
        star.rotation.y = Math.random() * Math.PI;
        beachGroup.add(star);
      }
    }

    // 3. WEATHERED DRIFTWOOD LOGS (~12 logs)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const r = 76 + Math.random() * 10;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = island.getHeight(x, z);

      if (y >= 0.4 && y <= 2.2) {
        const logLen = 2.2 + Math.random() * 2.8;
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, logLen, 6), driftwoodMat);
        log.position.set(x, y + 0.15, z);
        log.rotation.z = Math.PI / 2;
        log.rotation.y = Math.random() * Math.PI * 2;
        beachGroup.add(log);
      }
    }

    // 4. POLISHED COASTAL PEBBLES (~45 pebbles)
    const pebbleGeo = new THREE.DodecahedronGeometry(0.18, 1);
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 73 + Math.random() * 14;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = island.getHeight(x, z);

      if (y >= 0.3 && y <= 2.0) {
        const p = new THREE.Mesh(pebbleGeo, pebbleMat);
        p.position.set(x, y + 0.08, z);
        p.scale.set(1.2, 0.6, 1.0);
        p.rotation.set(Math.random(), Math.random(), Math.random());
        beachGroup.add(p);
      }
    }

    scene.add(beachGroup);
  }
}

window.RealisticOcean = RealisticOcean;
window.RealisticSand = RealisticSand;

// 8. DYNAMIC MOVING SAND PHYSICS & FOOTSTEP DEFORMATION
class SandDeformationSystem {
  constructor(scene, island) {
    this.scene = scene;
    this.island = island;
    this.time = 0;

    this.soleTex = this.createSoleTexture();
    this.initFootprints();
    this.initSandParticles();
  }

  // Procedural boot sole indentation decal texture with tread grooves & sand displacement lip
  createSoleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 128, 256);

    // Displaced sand rim / lip (lighter pushed sand border)
    ctx.fillStyle = 'rgba(235, 210, 160, 0.45)';
    ctx.beginPath();
    ctx.ellipse(64, 155, 46, 75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(64, 55, 36, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Depressed boot sole center (dark shadow indentation)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    // Heel
    ctx.beginPath();
    ctx.ellipse(64, 55, 30, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    // Arch notch
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(44, 90, 40, 20);
    // Forefoot sole
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.beginPath();
    ctx.ellipse(64, 155, 38, 65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boot tread traction ribs (grooves indented into the sand)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 3.5;
    for (let y = 120; y <= 195; y += 14) {
      ctx.beginPath();
      ctx.moveTo(34, y);
      ctx.lineTo(94, y);
      ctx.stroke();
    }
    // Heel grooves
    for (let y = 40; y <= 70; y += 14) {
      ctx.beginPath();
      ctx.moveTo(42, y);
      ctx.lineTo(86, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  initFootprints() {
    this.footprintGroup = new THREE.Group();
    this.footprints = [];
    this.maxFootprints = 70;
    this.footprintIndex = 0;

    const geo = new THREE.PlaneGeometry(0.38, 0.68);
    geo.rotateX(-Math.PI / 2);

    for (let i = 0; i < this.maxFootprints; i++) {
      const mat = new THREE.MeshStandardMaterial({
        map: this.soleTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        roughness: 0.95,
        color: 0x99794d
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.footprintGroup.add(mesh);

      this.footprints.push({
        mesh: mesh,
        mat: mat,
        life: 0,
        maxLife: 35,
        isWashing: false
      });
    }

    this.scene.add(this.footprintGroup);
  }

  initSandParticles() {
    this.particleGroup = new THREE.Group();
    this.sandGrains = [];
    this.maxGrains = 80;
    this.grainIndex = 0;

    const grainGeo = new THREE.DodecahedronGeometry(0.045, 0);
    const grainMat = new THREE.MeshStandardMaterial({ color: 0xedd29a, roughness: 0.9 });

    for (let i = 0; i < this.maxGrains; i++) {
      const mesh = new THREE.Mesh(grainGeo, grainMat);
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.sandGrains.push({
        mesh: mesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1.2,
        active: false
      });
    }

    // Sand dust puffs (soft translucent clouds kicked up by boots)
    this.dustPuffs = [];
    this.maxDust = 25;
    this.dustIndex = 0;

    const dustGeo = new THREE.SphereGeometry(0.24, 6, 6);
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0xedd29a,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    for (let i = 0; i < this.maxDust; i++) {
      const mesh = new THREE.Mesh(dustGeo, dustMat.clone());
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.dustPuffs.push({
        mesh: mesh,
        mat: mesh.material,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.85,
        active: false
      });
    }

    this.scene.add(this.particleGroup);
  }

  isSand(x, z, groundY) {
    // Bridges, docks & piers are wood
    const onPierWalk = (z >= 74.5 && z <= 113 && Math.abs(x) <= 2.5);
    const onPierHead = (z >= 113 && z <= 122 && Math.abs(x) <= 8.2);
    const onPondDock = (z >= -9.5 && z <= -1.8 && Math.abs(x - 14) <= 2.2);
    if (onPierWalk || onPierHead || onPondDock) return false;
    if (this.island.getBridgeAt && this.island.getBridgeAt(x, z)) return false;

    // Biome check based on position & height
    const distCoral = Math.hypot(x - this.island.coralCenter.x, z - this.island.coralCenter.y);
    const distVolc = Math.hypot(x - this.island.volcanoCenter.x, z - this.island.volcanoCenter.y);
    const distPond = Math.hypot(x - this.island.pondCenter.x, z - this.island.pondCenter.y);

    if (distPond < this.island.pondRadius + 2.0) return false; // grassy pond verge
    if (distCoral < this.island.coralRadius) return (groundY <= 2.6);
    if (distVolc < this.island.volcanoRadius) return (groundY <= 2.8);

    // Main Haven Island beach sand ring
    const r = Math.hypot(x, z);
    return (r >= 26 && groundY <= 3.2);
  }

  // PLAYER FOOTSTEP TRIGGER: Spawns indented sole footprint + kicks sand particles & dust
  onPlayerStep(pos, rotation, isRightFoot, isSprint = false) {
    const groundY = this.island.getHeight(pos.x, pos.z);
    if (!this.isSand(pos.x, pos.z, groundY)) return;

    // Lateral foot separation offset (+/- 0.16m)
    const lateralDist = isRightFoot ? 0.16 : -0.16;
    const fx = pos.x + Math.cos(rotation) * lateralDist;
    const fz = pos.z - Math.sin(rotation) * lateralDist;
    const fy = this.island.getHeight(fx, fz);

    // 1. PLACE EMBOSSED FOOTPRINT DECAL
    const fp = this.footprints[this.footprintIndex];
    this.footprintIndex = (this.footprintIndex + 1) % this.maxFootprints;

    fp.mesh.visible = true;
    fp.life = 0;
    fp.maxLife = 35.0; // Persists for 35 seconds before fading
    fp.isWashing = (fy <= this.island.oceanWaterLevel + 0.35); // washes quickly in tide

    // Align with terrain slope gradient
    const dhx = this.island.getHeight(fx + 0.25, fz) - this.island.getHeight(fx - 0.25, fz);
    const dhz = this.island.getHeight(fx, fz + 0.25) - this.island.getHeight(fx, fz - 0.25);
    const normal = new THREE.Vector3(-dhx, 0.5, -dhz).normalize();

    fp.mesh.position.set(fx, fy + 0.018, fz);
    fp.mesh.rotation.set(0, rotation, 0);
    // Tilt to hug sand slope
    fp.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    fp.mesh.rotateY(rotation);

    // Adjust color based on sand biome & wetness
    const distCoral = Math.hypot(fx - this.island.coralCenter.x, fz - this.island.coralCenter.y);
    const distVolc = Math.hypot(fx - this.island.volcanoCenter.x, fz - this.island.volcanoCenter.y);
    const isWet = (fy <= this.island.oceanWaterLevel + 0.45);

    if (distCoral < this.island.coralRadius) {
      fp.mat.color.setHex(isWet ? 0xdcd6c2 : 0xf7f3e8); // Coral white sand
    } else if (distVolc < this.island.volcanoRadius) {
      fp.mat.color.setHex(isWet ? 0x1e272e : 0x3d434a); // Volcanic dark basalt sand
    } else {
      fp.mat.color.setHex(isWet ? 0x99794d : 0xc4a36e); // Golden Haven sand
    }

    fp.mat.opacity = 0.88;

    // 2. KICK DYNAMIC PHYSICAL SAND PARTICLES (12 - 24 grains)
    const grainCount = isSprint ? 22 : 12;
    const kickSpeed = isSprint ? 3.8 : 2.2;

    for (let i = 0; i < grainCount; i++) {
      const g = this.sandGrains[this.grainIndex];
      this.grainIndex = (this.grainIndex + 1) % this.maxGrains;

      g.mesh.visible = true;
      g.active = true;
      g.life = 0;
      g.maxLife = 0.8 + Math.random() * 0.5;

      g.mesh.position.set(
        fx + (Math.random() - 0.5) * 0.15,
        fy + 0.06,
        fz + (Math.random() - 0.5) * 0.15
      );

      // Trajectory: kicked backwards opposite to player forward vector
      const scatterX = (Math.random() - 0.5) * 1.2;
      const scatterZ = (Math.random() - 0.5) * 1.2;
      const backX = -Math.sin(rotation) * kickSpeed + scatterX;
      const backZ = -Math.cos(rotation) * kickSpeed + scatterZ;
      const liftY = 1.6 + Math.random() * (isSprint ? 2.8 : 1.5);

      g.vel.set(backX, liftY, backZ);
      const s = 0.6 + Math.random() * 0.8;
      g.mesh.scale.set(s, s, s);
    }

    // 3. PUFF OF SOFT SAND DUST
    const dustCount = isSprint ? 3 : 1;
    for (let d = 0; d < dustCount; d++) {
      const p = this.dustPuffs[this.dustIndex];
      this.dustIndex = (this.dustIndex + 1) % this.maxDust;

      p.mesh.visible = true;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.75 + Math.random() * 0.35;
      p.mesh.position.set(fx, fy + 0.08, fz);
      p.mesh.scale.set(0.6, 0.4, 0.6);
      p.mat.opacity = 0.42;

      p.vel.set(
        -Math.sin(rotation) * 0.8 + (Math.random() - 0.5) * 0.6,
        0.5 + Math.random() * 0.6,
        -Math.cos(rotation) * 0.8 + (Math.random() - 0.5) * 0.6
      );
    }
  }

  // UPDATE TICK: Simulates ballistic physics, ground collision & tidal wave washing
  update(delta, oceanTime) {
    this.time += delta;

    // 1. Update Footprint Decals (Fading & Shoreline Tide Wash)
    const tideWash = Math.sin(oceanTime * 1.6); // matches ocean surf phase

    for (const fp of this.footprints) {
      if (!fp.mesh.visible) continue;
      fp.life += delta;

      // Washed away by lapping coastal tide
      if (fp.isWashing && tideWash > 0.4) {
        fp.life += delta * 7.0; // dissolves quickly under tidal foam
      }

      if (fp.life >= fp.maxLife) {
        fp.mesh.visible = false;
        continue;
      }

      const p = fp.life / fp.maxLife;
      fp.mat.opacity = Math.max(0, 0.88 * (1.0 - p));
    }

    // 2. Update Physical Sand Grains (Gravity & Ground Bounce)
    for (const g of this.sandGrains) {
      if (!g.active) continue;
      g.life += delta;
      if (g.life >= g.maxLife) {
        g.active = false;
        g.mesh.visible = false;
        continue;
      }

      // Ballistic gravity
      g.vel.y -= 13.5 * delta;
      g.mesh.position.addScaledVector(g.vel, delta);

      const groundY = this.island.getHeight(g.mesh.position.x, g.mesh.position.z);
      if (g.mesh.position.y <= groundY + 0.03) {
        g.mesh.position.y = groundY + 0.03;
        // Bounce with high friction
        g.vel.y *= -0.22;
        g.vel.x *= 0.45;
        g.vel.z *= 0.45;

        if (Math.abs(g.vel.y) < 0.2) {
          g.vel.set(0, 0, 0); // Settles into sand
        }
      }
    }

    // 3. Update Sand Dust Puffs (Expands & Dissolves into Air)
    for (const p of this.dustPuffs) {
      if (!p.active) continue;
      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.mesh.position.addScaledVector(p.vel, delta);
      const prog = p.life / p.maxLife;
      const s = 0.6 + prog * 1.8;
      p.mesh.scale.set(s, s * 0.7, s);
      p.mat.opacity = Math.max(0, 0.42 * (1.0 - prog));
    }
  }
}

window.SandDeformationSystem = SandDeformationSystem;

