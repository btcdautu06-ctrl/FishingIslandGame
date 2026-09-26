// Realistic Atmospheric Sky, Celestial Bodies, Twinkling Starfield, Shooting Stars, and Cloud Layers

class RealisticSky {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.time = 0;
    this.targetPreset = 'day';
    this.currentPreset = 'day';
    this.transitionProgress = 1.0;
    this.transitionSpeed = 0.8; // Duration ~1.2s smooth blend

    // Dynamic state values interpolated between presets
    this.state = {
      zenithColor: new THREE.Color(0x1e88e5),
      horizonColor: new THREE.Color(0xc7ecee),
      sunColor: new THREE.Color(0xffffff),
      moonColor: new THREE.Color(0xdff9fb),
      sunIntensity: 1.6,
      moonIntensity: 0.0,
      sunPos: new THREE.Vector3(120, 320, 80).normalize(),
      moonPos: new THREE.Vector3(-120, -320, -80).normalize(),
      sunLightColor: new THREE.Color(0xfff7e6),
      sunLightIntensity: 1.35,
      ambientColor: new THREE.Color(0xffffff),
      ambientIntensity: 0.78,
      fogColor: new THREE.Color(0x81ecec),
      cloudColor: new THREE.Color(0xffffff),
      cloudEmissive: new THREE.Color(0x111111),
      nightFactor: 0.0
    };

    this.fromState = {
      zenithColor: this.state.zenithColor.clone(),
      horizonColor: this.state.horizonColor.clone(),
      sunColor: this.state.sunColor.clone(),
      moonColor: this.state.moonColor.clone(),
      sunIntensity: this.state.sunIntensity,
      moonIntensity: this.state.moonIntensity,
      sunPos: this.state.sunPos.clone(),
      moonPos: this.state.moonPos.clone(),
      sunLightColor: this.state.sunLightColor.clone(),
      sunLightIntensity: this.state.sunLightIntensity,
      ambientColor: this.state.ambientColor.clone(),
      ambientIntensity: this.state.ambientIntensity,
      fogColor: this.state.fogColor.clone(),
      cloudColor: this.state.cloudColor.clone(),
      cloudEmissive: this.state.cloudEmissive.clone(),
      nightFactor: this.state.nightFactor
    };

    this.initPresets();
    this.buildSkyDome();
    this.buildSun();
    this.buildMoon();
    this.buildStarfield();
    this.buildShootingStars();
    this.buildHighCirrusLayer();
    this.buildCumulusClouds();
  }

  initPresets() {
    this.presets = {
      morning: {
        zenithColor: new THREE.Color(0x243348),    // Deep indigo zenith
        horizonColor: new THREE.Color(0xfdcb6e),   // Warm amber-peach horizon haze
        sunColor: new THREE.Color(0xffeaa7),       // Luminous golden dawn sun
        moonColor: new THREE.Color(0xa4b0be),
        sunIntensity: 1.25,
        moonIntensity: 0.15,
        sunPos: new THREE.Vector3(380, 110, 160).normalize(),
        moonPos: new THREE.Vector3(-380, -90, -160).normalize(),
        sunLightColor: new THREE.Color(0xffa502),
        sunLightIntensity: 1.15,
        ambientColor: new THREE.Color(0xffdcb0),
        ambientIntensity: 0.68,
        fogColor: new THREE.Color(0xf6b93b),
        cloudColor: new THREE.Color(0xffd3b6),
        cloudEmissive: new THREE.Color(0x552211),
        nightFactor: 0.05
      },
      day: {
        zenithColor: new THREE.Color(0x1565c0),    // Vibrant celestial blue
        horizonColor: new THREE.Color(0xdff9fb),   // Soft aquamarine-white horizon
        sunColor: new THREE.Color(0xffffff),       // Pure brilliant solar white
        moonColor: new THREE.Color(0xa4b0be),
        sunIntensity: 1.7,
        moonIntensity: 0.0,
        sunPos: new THREE.Vector3(110, 360, 90).normalize(),
        moonPos: new THREE.Vector3(-110, -360, -90).normalize(),
        sunLightColor: new THREE.Color(0xfff7e6),
        sunLightIntensity: 1.4,
        ambientColor: new THREE.Color(0xffffff),
        ambientIntensity: 0.82,
        fogColor: new THREE.Color(0x81ecec),
        cloudColor: new THREE.Color(0xffffff),
        cloudEmissive: new THREE.Color(0x1a1a1a),
        nightFactor: 0.0
      },
      sunset: {
        zenithColor: new THREE.Color(0x2c1654),    // Regal dusk violet
        horizonColor: new THREE.Color(0xe15f41),   // Fiery orange-red horizon haze
        sunColor: new THREE.Color(0xff4757),       // Burning crimson sunset orb
        moonColor: new THREE.Color(0xdfe6e9),
        sunIntensity: 1.45,
        moonIntensity: 0.35,
        sunPos: new THREE.Vector3(-380, 75, 120).normalize(),
        moonPos: new THREE.Vector3(380, 95, -120).normalize(),
        sunLightColor: new THREE.Color(0xff3838),
        sunLightIntensity: 1.25,
        ambientColor: new THREE.Color(0xffbe76),
        ambientIntensity: 0.58,
        fogColor: new THREE.Color(0xf0932b),
        cloudColor: new THREE.Color(0xff7675),
        cloudEmissive: new THREE.Color(0x4a1226),
        nightFactor: 0.35
      },
      night: {
        zenithColor: new THREE.Color(0x01040a),    // Inky deep cosmos navy
        horizonColor: new THREE.Color(0x0f2444),   // Luminous oceanic twilight horizon
        sunColor: new THREE.Color(0x111111),
        moonColor: new THREE.Color(0xdff9fb),      // Radiant pearl moonlight
        sunIntensity: 0.0,
        moonIntensity: 2.2,
        sunPos: new THREE.Vector3(-120, -360, -90).normalize(),
        moonPos: new THREE.Vector3(140, 320, -110).normalize(),
        sunLightColor: new THREE.Color(0x8cb4ff),
        sunLightIntensity: 0.72,
        ambientColor: new THREE.Color(0x485875),
        ambientIntensity: 0.58,
        fogColor: new THREE.Color(0x0a192f),
        cloudColor: new THREE.Color(0x2f3640),
        cloudEmissive: new THREE.Color(0x152238),
        nightFactor: 1.0
      }
    };
  }

  // 1. ATMOSPHERIC RAYLEIGH & MIE SCATTERING SKY DOME
  buildSkyDome() {
    const geo = new THREE.SphereGeometry(720, 48, 24);
    geo.scale(-1, 1, 1);

    const vertexShader = [
      'varying vec3 vWorldPosition;',
      'void main() {',
      '  vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
      '  vWorldPosition = worldPosition.xyz;',
      '  gl_Position = projectionMatrix * viewMatrix * worldPosition;',
      '}'
    ].join('\n');

    const fragmentShader = [
      'uniform vec3 uZenithColor;',
      'uniform vec3 uHorizonColor;',
      'uniform vec3 uSunColor;',
      'uniform vec3 uMoonColor;',
      'uniform vec3 uSunDirection;',
      'uniform vec3 uMoonDirection;',
      'uniform float uSunIntensity;',
      'uniform float uMoonIntensity;',
      'uniform float uNightFactor;',
      'varying vec3 vWorldPosition;',
      '',
      'void main() {',
      '  vec3 dir = normalize(vWorldPosition);',
      '  float h = max(0.0, dir.y);',
      '',
      '  // Atmospheric gradient falloff',
      '  float horizonBlend = exp(-h * 4.2);',
      '  vec3 sky = mix(uZenithColor, uHorizonColor, horizonBlend);',
      '',
      '  // Solar disc & Mie atmospheric scattering',
      '  float cosTheta = dot(dir, uSunDirection);',
      '  if (cosTheta > 0.0) {',
      '    float sunDisc = smoothstep(0.9994, 0.9998, cosTheta) * uSunIntensity;',
      '    float sunCorona = pow(cosTheta, 45.0) * 0.75 * uSunIntensity;',
      '    float sunGlow = pow(cosTheta, 6.0) * 0.28 * uSunIntensity;',
      '    sky += uSunColor * (sunDisc * 2.2 + sunCorona + sunGlow);',
      '  }',
      '',
      '  // Lunar disc & pearlescent halo',
      '  float cosMoon = dot(dir, uMoonDirection);',
      '  if (cosMoon > 0.0) {',
      '    float moonDisc = smoothstep(0.9991, 0.9997, cosMoon) * uMoonIntensity;',
      '    float moonCorona = pow(cosMoon, 32.0) * 0.45 * uMoonIntensity;',
      '    sky += uMoonColor * (moonDisc * 1.6 + moonCorona);',
      '  }',
      '',
      '  // Faint nocturnal Milky Way galactic dust',
      '  if (uNightFactor > 0.1) {',
      '    float galaxyBand = abs(dir.x * 0.7 + dir.z * 0.7 - dir.y * 0.3);',
      '    float galaxyGlow = smoothstep(0.4, 0.0, galaxyBand) * uNightFactor * 0.08;',
      '    sky += vec3(0.12, 0.16, 0.28) * galaxyGlow;',
      '  }',
      '',
      '  gl_FragColor = vec4(sky, 1.0);',
      '}'
    ].join('\n');

    this.skyUniforms = {
      uZenithColor: { value: this.state.zenithColor },
      uHorizonColor: { value: this.state.horizonColor },
      uSunColor: { value: this.state.sunColor },
      uMoonColor: { value: this.state.moonColor },
      uSunDirection: { value: this.state.sunPos },
      uMoonDirection: { value: this.state.moonPos },
      uSunIntensity: { value: this.state.sunIntensity },
      uMoonIntensity: { value: this.state.moonIntensity },
      uNightFactor: { value: this.state.nightFactor }
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.skyMesh);
  }

  // 2. PHYSICAL 3D LUMINOUS SUN WITH SOLAR CORONA FLARE
  buildSun() {
    this.sunGroup = new THREE.Group();

    // 1. Brilliant white solar disc core
    const sunGeo = new THREE.SphereGeometry(15, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(this.sunMesh);

    // 2. Outer luminous atmospheric corona sprite billboard
    const coronaTex = this.createSunCoronaTexture();
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTex,
      color: 0xfff0aa,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sunCoronaSprite = new THREE.Sprite(coronaMat);
    this.sunCoronaSprite.scale.set(130, 130, 1);
    this.sunGroup.add(this.sunCoronaSprite);

    this.scene.add(this.sunGroup);
  }

  createSunCoronaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 235, 160, 0.85)');
    grad.addColorStop(0.5, 'rgba(255, 175, 75, 0.35)');
    grad.addColorStop(0.85, 'rgba(255, 110, 30, 0.08)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  // 3. DETAILED 3D MOON WITH PROCEDURAL CRATERS AND LUNAR HALO
  buildMoon() {
    this.moonGroup = new THREE.Group();

    // 1. Moon sphere with craters texture
    const moonGeo = new THREE.SphereGeometry(18, 32, 24);
    const moonTex = this.createMoonCraterTexture();
    const moonMat = new THREE.MeshBasicMaterial({ map: moonTex });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup.add(this.moonMesh);

    // 2. Ethereal moonlit halo billboard
    const haloTex = this.createMoonHaloTexture();
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      color: 0xcee6fe,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.75
    });
    this.moonHaloSprite = new THREE.Sprite(haloMat);
    this.moonHaloSprite.scale.set(90, 90, 1);
    this.moonGroup.add(this.moonHaloSprite);

    this.scene.add(this.moonGroup);
  }

  createMoonCraterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Base pearl grey lunar regolith
    ctx.fillStyle = '#b8c5d1';
    ctx.fillRect(0, 0, 256, 128);

    // Lunar Maria
    ctx.fillStyle = '#7a889b';
    const maria = [
      { x: 75, y: 55, rx: 35, ry: 25 },
      { x: 125, y: 70, rx: 28, ry: 20 },
      { x: 175, y: 48, rx: 32, ry: 24 },
      { x: 95, y: 90, rx: 22, ry: 15 },
      { x: 45, y: 75, rx: 20, ry: 18 }
    ];
    maria.forEach(m => {
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, m.rx, m.ry, 0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Impact Craters with bright rims & dark shadows
    for (let i = 0; i < 45; i++) {
      const cx = Math.random() * 256;
      const cy = Math.random() * 128;
      const cr = 2.5 + Math.random() * 7;

      ctx.fillStyle = '#626e7e';
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e2ecf5';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx - 0.5, cy - 0.5, cr, 0, Math.PI * 2);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  createMoonHaloTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.0, 'rgba(215, 235, 255, 0.9)');
    grad.addColorStop(0.35, 'rgba(165, 205, 255, 0.45)');
    grad.addColorStop(0.7, 'rgba(120, 175, 255, 0.12)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  // 4. TWINKLING STARFIELD (2,800 STARS WITH SPECTRAL CLASSES)
  buildStarfield() {
    const starCount = 2800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    this.starPhases = new Float32Array(starCount);
    this.starSpeeds = new Float32Array(starCount);
    this.starBaseSizes = new Float32Array(starCount);

    const cBlue = new THREE.Color(0x99ccff);
    const cWhite = new THREE.Color(0xf5f6fa);
    const cYellow = new THREE.Color(0xffeaa7);
    const cOrange = new THREE.Color(0xffbe76);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 680 + Math.random() * 20;

      const y = Math.abs(Math.cos(phi)) * r + 15;
      const x = Math.sin(phi) * Math.cos(theta) * r;
      const z = Math.sin(phi) * Math.sin(theta) * r;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const starType = Math.random();
      let col = cWhite;
      if (starType < 0.25) col = cBlue;
      else if (starType < 0.45) col = cYellow;
      else if (starType < 0.6) col = cOrange;

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      const baseSz = 1.2 + Math.random() * 2.8;
      sizes[i] = baseSz;
      this.starBaseSizes[i] = baseSz;
      this.starPhases[i] = Math.random() * Math.PI * 2;
      this.starSpeeds[i] = 1.5 + Math.random() * 4.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starTex = this.createStarGlowTexture();
    this.starMaterial = new THREE.PointsMaterial({
      size: 3.5,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starPoints = new THREE.Points(geo, this.starMaterial);
    this.scene.add(this.starPoints);
  }

  createStarGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.7, 'rgba(200, 225, 255, 0.15)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
  }

  // 5. SHOOTING STARS (METEOR STREAKS ACROSS THE NIGHT SKY)
  buildShootingStars() {
    this.shootingStarTimer = 7.0;

    const trailGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(2 * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const trailMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });

    this.meteorLine = new THREE.Line(trailGeo, trailMat);
    this.scene.add(this.meteorLine);
    this.activeMeteor = null;
  }

  spawnShootingStar() {
    const startX = (Math.random() - 0.5) * 500;
    const startY = 320 + Math.random() * 120;
    const startZ = (Math.random() - 0.5) * 500;

    const angle = Math.random() * Math.PI * 2;
    const speed = 450 + Math.random() * 300;
    const length = 45 + Math.random() * 35;

    this.activeMeteor = {
      pos: new THREE.Vector3(startX, startY, startZ),
      velocity: new THREE.Vector3(Math.cos(angle) * speed, -speed * 0.45, Math.sin(angle) * speed),
      length: length,
      lifetime: 0.9,
      age: 0
    };
  }

  updateShootingStars(delta) {
    if (this.state.nightFactor < 0.6) {
      this.meteorLine.material.opacity = 0;
      return;
    }

    this.shootingStarTimer -= delta;
    if (this.shootingStarTimer <= 0 && !this.activeMeteor) {
      this.shootingStarTimer = 6.0 + Math.random() * 10.0;
      this.spawnShootingStar();
    }

    if (this.activeMeteor) {
      const m = this.activeMeteor;
      m.age += delta;
      m.pos.addScaledVector(m.velocity, delta);

      const progress = m.age / m.lifetime;
      if (progress >= 1.0) {
        this.activeMeteor = null;
        this.meteorLine.material.opacity = 0;
        return;
      }

      const opacity = Math.sin(progress * Math.PI) * 0.95;
      this.meteorLine.material.opacity = opacity;

      const tailPos = m.pos.clone().addScaledVector(m.velocity, -m.length / m.velocity.length());
      const posAttr = this.meteorLine.geometry.attributes.position;
      posAttr.setXYZ(0, m.pos.x, m.pos.y, m.pos.z);
      posAttr.setXYZ(1, tailPos.x, tailPos.y, tailPos.z);
      posAttr.needsUpdate = true;
    }
  }

  // 6. HIGH-ALTITUDE WISPY CIRRUS CLOUDS
  buildHighCirrusLayer() {
    const cirrusGeo = new THREE.PlaneGeometry(900, 900);
    cirrusGeo.rotateX(-Math.PI / 2);

    const cirrusTex = this.createCirrusTexture();
    cirrusTex.wrapS = THREE.RepeatWrapping;
    cirrusTex.wrapT = THREE.RepeatWrapping;
    cirrusTex.repeat.set(2, 2);

    this.cirrusMat = new THREE.MeshBasicMaterial({
      map: cirrusTex,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      color: 0xffffff
    });

    this.cirrusMesh = new THREE.Mesh(cirrusGeo, this.cirrusMat);
    this.cirrusMesh.position.y = 220;
    this.scene.add(this.cirrusMesh);
    this.cirrusTex = cirrusTex;
  }

  createCirrusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 180; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 60 + Math.random() * 140;
      const angle = 0.25 + (Math.random() - 0.5) * 0.2;

      const grad = ctx.createLinearGradient(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.16)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.12)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 14 + Math.random() * 32;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 7. DRIFTING 3D CUMULUS CLOUDS WITH DYNAMIC SUN/MOON SHADING
  buildCumulusClouds() {
    this.cumulusGroup = new THREE.Group();
    this.cloudMeshes = [];

    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92
    });

    const puffGeo = new THREE.SphereGeometry(8, 8, 8);

    for (let c = 0; c < 22; c++) {
      const cloud = new THREE.Group();
      const puffCount = 5 + Math.floor(Math.random() * 5);

      for (let p = 0; p < puffCount; p++) {
        const puff = new THREE.Mesh(puffGeo, this.cloudMat);
        const scaleX = 0.8 + Math.random() * 0.6;
        const scaleY = 0.6 + Math.random() * 0.4;
        const scaleZ = 0.8 + Math.random() * 0.6;
        puff.scale.set(scaleX, scaleY, scaleZ);

        puff.position.set(
          (p - puffCount / 2) * 7.5 + (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 8
        );
        cloud.add(puff);
      }

      cloud.position.set(
        (Math.random() - 0.5) * 520,
        55 + Math.random() * 35,
        (Math.random() - 0.5) * 520
      );
      cloud.userData = {
        speed: 2.0 + Math.random() * 2.2,
        baseY: cloud.position.y
      };

      this.cumulusGroup.add(cloud);
      this.cloudMeshes.push(cloud);
    }

    this.scene.add(this.cumulusGroup);
  }

  setTimeOfDay(time) {
    if (!this.presets[time]) return;
    this.targetPreset = time;
    this.transitionProgress = 0.0;

    this.fromState.zenithColor.copy(this.state.zenithColor);
    this.fromState.horizonColor.copy(this.state.horizonColor);
    this.fromState.sunColor.copy(this.state.sunColor);
    this.fromState.moonColor.copy(this.state.moonColor);
    this.fromState.sunIntensity = this.state.sunIntensity;
    this.fromState.moonIntensity = this.state.moonIntensity;
    this.fromState.sunPos.copy(this.state.sunPos);
    this.fromState.moonPos.copy(this.state.moonPos);
    this.fromState.sunLightColor.copy(this.state.sunLightColor);
    this.fromState.sunLightIntensity = this.state.sunLightIntensity;
    this.fromState.ambientColor.copy(this.state.ambientColor);
    this.fromState.ambientIntensity = this.state.ambientIntensity;
    this.fromState.fogColor.copy(this.state.fogColor);
    this.fromState.cloudColor.copy(this.state.cloudColor);
    this.fromState.cloudEmissive.copy(this.state.cloudEmissive);
    this.fromState.nightFactor = this.state.nightFactor;
  }

  update(delta, dirLight, ambLight, fog) {
    this.time += delta;

    // 1. Smooth interpolation between time presets
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + delta * this.transitionSpeed);
      const t = this.transitionProgress;
      const easeT = 0.5 - 0.5 * Math.cos(t * Math.PI);

      const target = this.presets[this.targetPreset];
      this.state.zenithColor.lerpColors(this.fromState.zenithColor, target.zenithColor, easeT);
      this.state.horizonColor.lerpColors(this.fromState.horizonColor, target.horizonColor, easeT);
      this.state.sunColor.lerpColors(this.fromState.sunColor, target.sunColor, easeT);
      this.state.moonColor.lerpColors(this.fromState.moonColor, target.moonColor, easeT);
      this.state.sunIntensity = THREE.MathUtils.lerp(this.fromState.sunIntensity, target.sunIntensity, easeT);
      this.state.moonIntensity = THREE.MathUtils.lerp(this.fromState.moonIntensity, target.moonIntensity, easeT);
      this.state.sunPos.lerpVectors(this.fromState.sunPos, target.sunPos, easeT).normalize();
      this.state.moonPos.lerpVectors(this.fromState.moonPos, target.moonPos, easeT).normalize();
      this.state.sunLightColor.lerpColors(this.fromState.sunLightColor, target.sunLightColor, easeT);
      this.state.sunLightIntensity = THREE.MathUtils.lerp(this.fromState.sunLightIntensity, target.sunLightIntensity, easeT);
      this.state.ambientColor.lerpColors(this.fromState.ambientColor, target.ambientColor, easeT);
      this.state.ambientIntensity = THREE.MathUtils.lerp(this.fromState.ambientIntensity, target.ambientIntensity, easeT);
      this.state.fogColor.lerpColors(this.fromState.fogColor, target.fogColor, easeT);
      this.state.cloudColor.lerpColors(this.fromState.cloudColor, target.cloudColor, easeT);
      this.state.cloudEmissive.lerpColors(this.fromState.cloudEmissive, target.cloudEmissive, easeT);
      this.state.nightFactor = THREE.MathUtils.lerp(this.fromState.nightFactor, target.nightFactor, easeT);

      if (t >= 1.0) {
        this.currentPreset = this.targetPreset;
      }
    }

    // 2. Synchronize Scene Lighting & Fog with the Atmospheric Sky
    if (dirLight) {
      dirLight.color.copy(this.state.sunLightColor);
      dirLight.intensity = this.state.sunLightIntensity;
      const activeSource = this.state.nightFactor > 0.5 ? this.state.moonPos : this.state.sunPos;
      dirLight.position.set(activeSource.x * 200, Math.max(30, activeSource.y * 200), activeSource.z * 200);
    }
    if (ambLight) {
      ambLight.color.copy(this.state.ambientColor);
      ambLight.intensity = this.state.ambientIntensity;
    }
    if (fog) {
      fog.color.copy(this.state.fogColor);
      this.scene.background = this.state.fogColor;
    }

    // 3. Update Sky Shader Uniforms
    this.skyUniforms.uZenithColor.value.copy(this.state.zenithColor);
    this.skyUniforms.uHorizonColor.value.copy(this.state.horizonColor);
    this.skyUniforms.uSunColor.value.copy(this.state.sunColor);
    this.skyUniforms.uMoonColor.value.copy(this.state.moonColor);
    this.skyUniforms.uSunDirection.value.copy(this.state.sunPos);
    this.skyUniforms.uMoonDirection.value.copy(this.state.moonPos);
    this.skyUniforms.uSunIntensity.value = this.state.sunIntensity;
    this.skyUniforms.uMoonIntensity.value = this.state.moonIntensity;
    this.skyUniforms.uNightFactor.value = this.state.nightFactor;

    // Anchor Sky Dome & Celestial bodies around player/camera
    if (this.camera) {
      this.skyMesh.position.copy(this.camera.position);

      const sunDist = 620;
      this.sunGroup.position.set(
        this.camera.position.x + this.state.sunPos.x * sunDist,
        this.camera.position.y + this.state.sunPos.y * sunDist,
        this.camera.position.z + this.state.sunPos.z * sunDist
      );
      this.sunGroup.visible = this.state.sunPos.y > -0.15;
      this.sunCoronaSprite.material.opacity = Math.max(0, Math.min(1, (this.state.sunPos.y + 0.1) * 3.0));

      const moonDist = 610;
      this.moonGroup.position.set(
        this.camera.position.x + this.state.moonPos.x * moonDist,
        this.camera.position.y + this.state.moonPos.y * moonDist,
        this.camera.position.z + this.state.moonPos.z * moonDist
      );
      this.moonGroup.visible = this.state.moonPos.y > -0.15;
      this.moonHaloSprite.material.opacity = this.state.nightFactor * 0.85;

      this.starPoints.position.copy(this.camera.position);
    }

    // 4. Twinkle Starfield Animation
    if (this.starMaterial) {
      this.starMaterial.opacity = Math.pow(this.state.nightFactor, 1.4);

      if (this.starMaterial.opacity > 0.02) {
        const sizeAttr = this.starPoints.geometry.attributes.size;
        for (let i = 0; i < this.starPhases.length; i += 4) {
          const twinkle = 0.75 + Math.sin(this.time * this.starSpeeds[i] + this.starPhases[i]) * 0.45;
          sizeAttr.setX(i, this.starBaseSizes[i] * twinkle);
        }
        sizeAttr.needsUpdate = true;
      }
    }

    // 5. Shooting Stars / Meteors Update
    this.updateShootingStars(delta);

    // 6. High Cirrus Cloud drift
    if (this.cirrusTex) {
      this.cirrusTex.offset.x += delta * 0.003;
      this.cirrusTex.offset.y += delta * 0.0015;
      this.cirrusMat.color.copy(this.state.cloudColor);
      this.cirrusMat.opacity = THREE.MathUtils.lerp(0.38, 0.15, this.state.nightFactor);
    }

    // 7. Drifting 3D Cumulus Clouds
    if (this.cloudMat) {
      this.cloudMat.color.copy(this.state.cloudColor);
      this.cloudMat.emissive.copy(this.state.cloudEmissive);
    }

    for (const cloud of this.cloudMeshes) {
      cloud.position.x += delta * cloud.userData.speed;
      if (cloud.position.x > 320) cloud.position.x = -320;
    }
  }
}

window.RealisticSky = RealisticSky;
