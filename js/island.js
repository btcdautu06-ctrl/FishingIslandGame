// Realistic Archipelago, Multi-Island World, Suspension Bridges, Dynamic Wind, and Ocean Atmosphere

class Island {
  constructor(scene) {
    this.scene = scene;
    this.trees = []; // { mesh, type, x, z, shaken, shakeTime, baseRotation }
    this.colliders = [];
    this.interactables = [];
    this.waterTime = 0;
    this.windTime = 0;
    this.seagullTimer = 5.0;

    // Island Centers & Metadata
    this.pondCenter = new THREE.Vector2(14, -14);
    this.pondRadius = 18;
    this.pondWaterLevel = 1.6;
    this.oceanWaterLevel = 0.2;

    this.coralCenter = new THREE.Vector2(155, -20);
    this.coralRadius = 48;
    this.coralLagoonWaterLevel = 0.45;

    this.volcanoCenter = new THREE.Vector2(-145, -60);
    this.volcanoRadius = 52;
    this.volcanoWaterLevel = 2.2;

    this.titanCenter = new THREE.Vector2(0, 215);
    this.titanRadius = 46;

    // Suspension Wooden Bridges connecting islands across the deadly water
    this.bridges = [
      {
        id: 'coral_bridge',
        name: 'Coral Atoll Suspension Bridge',
        x1: 72, z1: -20,
        x2: 118, z2: -20,
        width: 4.2,
        baseY: 2.2,
        archHeight: 2.6
      },
      {
        id: 'volcanic_bridge',
        name: 'Volcanic Crags Rope Bridge',
        x1: -64, z1: -40,
        x2: -106, z2: -54,
        width: 4.2,
        baseY: 2.4,
        archHeight: 2.8
      },
      {
        id: 'titan_causeway',
        name: 'Titan Leviathan Ocean Causeway',
        x1: 0, z1: 121,
        x2: 0, z2: 175,
        width: 4.4,
        baseY: 1.8,
        archHeight: 2.6
      }
    ];

    this.build();
    if (window.CrabManager) {
      this.crabManager = new CrabManager(this.scene, this);
    }
  }

  // Check if coordinates (px, pz) are safely on any elevated bridge
  getBridgeAt(px, pz) {
    for (const b of this.bridges) {
      const dx = b.x2 - b.x1;
      const dz = b.z2 - b.z1;
      const lenSq = dx * dx + dz * dz;
      const t = ((px - b.x1) * dx + (pz - b.z1) * dz) / lenSq;
      if (t >= -0.04 && t <= 1.04) {
        const clampedT = Math.max(0, Math.min(1, t));
        const projX = b.x1 + clampedT * dx;
        const projZ = b.z1 + clampedT * dz;
        const dist = Math.hypot(px - projX, pz - projZ);
        if (dist <= b.width / 2) {
          const height = b.baseY + Math.sin(clampedT * Math.PI) * b.archHeight;
          return { onBridge: true, height: height, surface: 'wood', bridge: b };
        }
      }
    }
    return null;
  }

  isBridgeSafe(px, pz) {
    return this.getBridgeAt(px, pz) !== null;
  }

  // Unified Multi-Island Archipelago Heightmap
  getHeight(x, z) {
    let maxHeight = -16.0;

    // 1. MAIN HAVEN ISLAND (Center: 0, 0)
    const rMain = Math.hypot(x, z);
    const angleMain = Math.atan2(z, x);
    const borderNoiseMain = Math.sin(angleMain * 5) * 8 + Math.cos(angleMain * 3) * 6 + Math.sin(x * 0.08) * 3;
    const rMainLimit = 88 + borderNoiseMain;

    if (rMain <= rMainLimit) {
      const norm = rMain / rMainLimit;
      let h = (1 - norm) * 7.5;
      if (norm > 0.68) {
        const beachBlend = (norm - 0.68) / 0.32;
        h = THREE.MathUtils.lerp(3.2, 0.65, beachBlend);
      }
      const mDist = Math.hypot(x + 35, z - 28);
      if (mDist < 35) {
        h += Math.cos((mDist / 35) * Math.PI * 0.5) * 8.5;
      }
      const sDist = Math.hypot(x - 38, z - 22);
      if (sDist < 24) {
        h += Math.cos((sDist / 24) * Math.PI * 0.5) * 5.0;
      }
      // Freshwater Pond carving
      const pDist = Math.hypot(x - this.pondCenter.x, z - this.pondCenter.y);
      if (pDist < this.pondRadius + 7) {
        if (pDist <= this.pondRadius) {
          const depthFactor = (1 - (pDist / this.pondRadius));
          h = Math.min(h, this.pondWaterLevel - 1.8 * depthFactor);
        } else {
          const slopeBlend = (pDist - this.pondRadius) / 7.0;
          h = THREE.MathUtils.lerp(this.pondWaterLevel + 0.35, h, slopeBlend);
        }
      }
      maxHeight = Math.max(maxHeight, h);
    } else {
      const distPast = rMain - rMainLimit;
      const slope = 0.65 - distPast * 0.9;
      maxHeight = Math.max(maxHeight, Math.max(-14, slope));
    }

    // 2. TROPICAL CORAL ATOLL (East: 155, -20)
    const dxC = x - this.coralCenter.x;
    const dzC = z - this.coralCenter.y;
    const rCoral = Math.hypot(dxC, dzC);
    const angleC = Math.atan2(dzC, dxC);
    const borderNoiseC = Math.sin(angleC * 6) * 5 + Math.cos(angleC * 4) * 4;
    const rCoralLimit = this.coralRadius + borderNoiseC;

    if (rCoral <= rCoralLimit) {
      const norm = rCoral / rCoralLimit;
      let h = (1 - norm) * 4.2 + 0.65;
      // Shallow Inner Coral Lagoon depression
      if (rCoral < 12) {
        const lagDepth = 1 - (rCoral / 12);
        h = Math.min(h, this.coralLagoonWaterLevel - 1.2 * lagDepth);
      }
      maxHeight = Math.max(maxHeight, h);
    } else {
      const distPast = rCoral - rCoralLimit;
      const slope = 0.65 - distPast * 0.9;
      maxHeight = Math.max(maxHeight, Math.max(-14, slope));
    }

    // 3. VOLCANIC PINE CRAGS (Northwest: -145, -60)
    const dxV = x - this.volcanoCenter.x;
    const dzV = z - this.volcanoCenter.y;
    const rVolc = Math.hypot(dxV, dzV);
    const angleV = Math.atan2(dzV, dxV);
    const borderNoiseV = Math.sin(angleV * 7) * 6 + Math.cos(angleV * 3) * 5;
    const rVolcLimit = this.volcanoRadius + borderNoiseV;

    if (rVolc <= rVolcLimit) {
      const norm = rVolc / rVolcLimit;
      let h = Math.pow(1 - norm, 0.8) * 13.5 + 0.65;
      // Volcanic Hot Spring / Caldera Pool carving
      if (rVolc < 14) {
        if (rVolc <= 11) {
          const calDepth = 1 - (rVolc / 11);
          h = Math.min(h, this.volcanoWaterLevel - 1.5 * calDepth);
        } else {
          const rimBlend = (rVolc - 11) / 3.0;
          h = THREE.MathUtils.lerp(this.volcanoWaterLevel + 0.45, h, rimBlend);
        }
      }
      maxHeight = Math.max(maxHeight, h);
    } else {
      const distPast = rVolc - rVolcLimit;
      const slope = 0.65 - distPast * 0.9;
      maxHeight = Math.max(maxHeight, Math.max(-14, slope));
    }

    // 4. TITAN LEVIATHAN ATOLL (South: 0, 215)
    const dxT = x - this.titanCenter.x;
    const dzT = z - this.titanCenter.y;
    const rTitan = Math.hypot(dxT, dzT);
    const angleT = Math.atan2(dzT, dxT);
    const borderNoiseT = Math.sin(angleT * 8) * 5 + Math.cos(angleT * 5) * 4;
    const rTitanLimit = this.titanRadius + borderNoiseT;

    if (rTitan <= rTitanLimit) {
      const norm = rTitan / rTitanLimit;
      let h = (1 - norm) * 7.8 + 0.70;
      // Rugged sea crags
      h += Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.8;
      maxHeight = Math.max(maxHeight, h);
    } else {
      const distPast = rTitan - rTitanLimit;
      const slope = 0.70 - distPast * 0.9;
      maxHeight = Math.max(maxHeight, Math.max(-14, slope));
    }

    // Gentle micro-elevation noise (dampened on beaches so dry land stays strictly above water level)
    if (maxHeight > 0.25) {
      const noise = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.20;
      maxHeight = Math.max(0.42, maxHeight + noise);
    } else {
      maxHeight += Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.12;
    }
    return maxHeight;
  }

  // Detect which water body bobber / cast landed in
  getWaterTypeAt(x, z) {
    // 1. Main Island Freshwater Pond
    const pDist = Math.hypot(x - this.pondCenter.x, z - this.pondCenter.y);
    if (pDist < this.pondRadius - 0.5) {
      return { type: 'freshwater_pond', waterY: this.pondWaterLevel, name: 'Main Island Freshwater Pond' };
    }

    // 2. Volcanic Hot Spring Geothermal Pool
    const vDist = Math.hypot(x - this.volcanoCenter.x, z - this.volcanoCenter.y);
    if (vDist < 10.5) {
      return { type: 'freshwater_pond', waterY: this.volcanoWaterLevel, name: 'Volcanic Mineral Caldera' };
    }

    // 3. Coral Atoll Shallow Lagoon
    const cDist = Math.hypot(x - this.coralCenter.x, z - this.coralCenter.y);
    if (cDist < 11.5) {
      return { type: 'ocean_shore', waterY: this.coralLagoonWaterLevel, name: 'Coral Atoll Turquoise Lagoon' };
    }

    // 4. Check if near any island shore or in abyssal ocean deeps
    const rMain = Math.hypot(x, z);
    const rCoral = Math.hypot(x - this.coralCenter.x, z - this.coralCenter.y);
    const rVolc = Math.hypot(x - this.volcanoCenter.x, z - this.volcanoCenter.y);
    const rTitan = Math.hypot(x - this.titanCenter.x, z - this.titanCenter.y);

    const onAnyIsland = (rMain < 82) || (rCoral < 44) || (rVolc < 48) || (rTitan < 42);
    if (onAnyIsland) {
      return null; // On solid dry land!
    }

    // Titan Atoll waters are always deep oceanic trench
    if (rTitan < 85 || z > 155) {
      return { type: 'ocean_deep', waterY: this.oceanWaterLevel, name: 'Titan Leviathan Ocean Trench' };
    }

    const nearShore = (rMain < 102) || (rCoral < 56) || (rVolc < 62);
    if (nearShore) {
      return { type: 'ocean_shore', waterY: this.oceanWaterLevel, name: 'Coastal Reef Shallows' };
    }

    // Open deep ocean
    return { type: 'ocean_deep', waterY: this.oceanWaterLevel, name: 'Open Abyssal Ocean' };
  }

  build() {
    this.createAtmosphereClouds();
    this.createTerrain();
    this.createOceanWater();
    this.createPondWater();
    this.createVolcanoHotSpring();
    this.createCoralLagoonWater();
    this.createDocks();
    this.createBridges();
    this.createTackleShop();
    this.createCampfire();
    this.createFoliageAndTrees();
    this.createDecorations();

    // Dynamic Sand Movement & Footstep Deformation Physics
    if (window.SandDeformationSystem) {
      this.sandPhysics = new window.SandDeformationSystem(this.scene, this);
    }

    // Ambient 3D Swimming Fish Schools in Waters
    if (window.AmbientAquarium) {
      this.ambientAquarium = new window.AmbientAquarium(this.scene, this);
    }

    // Talking NPCs & Archipelago Characters
    if (window.NPCSystem) {
      this.npcSystem = new window.NPCSystem(this.scene, this);
      this.npcSystem.buildArchipelagoNPCs();
      window.npcSystem = this.npcSystem;
    }

    // Realistic 3D Instanced Grass & Wildflowers System
    if (window.RealisticGrass) {
      this.grass = new window.RealisticGrass(this.scene, this);
    }
  }

  createAtmosphereClouds() {
    // Atmosphere clouds and cirrus layer are handled with dynamic lighting by RealisticSky
  }

  createTerrain() {
    const size = 620;
    const segments = 220;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    // Shift geometry slightly south to cover Titan Atoll at z = 215
    geo.translate(0, 0, 45);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // Color Palettes
    const cSandWet = new THREE.Color(0xdac082);
    const cSand = new THREE.Color(0xf6d79a);
    const cGrassLight = new THREE.Color(0x7ec850);
    const cGrassLush = new THREE.Color(0x27ae60);
    const cGrassDeep = new THREE.Color(0x1e824c);
    const cRock = new THREE.Color(0x576574);
    const cRockPeak = new THREE.Color(0x8395a7);
    const cPondBed = new THREE.Color(0x3b5323);

    // Biome specific colors
    const cCoralSand = new THREE.Color(0xfffae6);
    const cCoralReef = new THREE.Color(0x81ecec);
    const cVolcRock = new THREE.Color(0x2d3436);
    const cVolcPeak = new THREE.Color(0x1e272e);
    const cVolcSulfur = new THREE.Color(0xe67e22);
    const cTitanSlate = new THREE.Color(0x353b48);
    const cTitanGranite = new THREE.Color(0x57606f);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeight(x, z);
      pos.setY(i, y);

      let col = new THREE.Color();
      const distCoral = Math.hypot(x - this.coralCenter.x, z - this.coralCenter.y);
      const distVolc = Math.hypot(x - this.volcanoCenter.x, z - this.volcanoCenter.y);
      const distTitan = Math.hypot(x - this.titanCenter.x, z - this.titanCenter.y);
      const pDist = Math.hypot(x - this.pondCenter.x, z - this.pondCenter.y);

      if (distVolc < this.volcanoRadius) {
        // Volcanic Island Biome
        if (distVolc < 11) {
          col.copy(cVolcSulfur);
        } else if (y > 7.0) {
          col.copy(cVolcPeak);
        } else {
          col.copy(cVolcRock);
        }
      } else if (distCoral < this.coralRadius) {
        // Coral Atoll Biome
        if (distCoral < 10) {
          col.copy(cCoralReef);
        } else {
          col.copy(cCoralSand);
        }
      } else if (distTitan < this.titanRadius) {
        // Titan Abyssal Atoll Biome
        if (y > 5.0) {
          col.copy(cTitanGranite);
        } else {
          col.copy(cTitanSlate);
        }
      } else {
        // Main Haven Island Biome
        if (pDist < this.pondRadius) {
          col.copy(cPondBed);
        } else if (y < 1.6) {
          col.copy(cSandWet);
        } else if (y < 3.2) {
          const blend = (y - 1.6) / 1.6;
          col.lerpColors(cSand, cGrassLight, blend * 0.5);
        } else if (y < 7.5) {
          const blend = (y - 3.2) / 4.3;
          col.lerpColors(cGrassLight, cGrassLush, blend);
          // Organic meadow variation (clover patches and dark soil undertones)
          const grassNoise = Math.sin(x * 0.3) * Math.cos(z * 0.3);
          if (grassNoise > 0.25) {
            col.lerp(cGrassDeep, (grassNoise - 0.25) * 0.55);
          } else if (grassNoise < -0.25) {
            col.lerp(cGrassLight, (-grassNoise - 0.25) * 0.45);
          }
        } else {
          const blend = Math.min(1.0, (y - 7.5) / 5.0);
          col.lerpColors(cGrassDeep, cRockPeak, blend);
        }
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const sandTex = window.RealisticSand ? window.RealisticSand.createSandTexture() : null;
    const sandBumpTex = window.RealisticSand ? window.RealisticSand.createSandBumpTexture() : null;

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      map: sandTex || undefined,
      bumpMap: sandBumpTex || undefined,
      bumpScale: 0.07,
      roughness: 0.82,
      metalness: 0.04
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  createOceanWater() {
    if (window.RealisticOcean) {
      this.realisticOcean = new window.RealisticOcean(this.scene, this);
      this.oceanMesh = this.realisticOcean.oceanMesh;
    } else {
      const geo = new THREE.PlaneGeometry(950, 950, 100, 100);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, 0, 45);

      const mat = new THREE.MeshStandardMaterial({
        color: 0x0984e3,
        roughness: 0.12,
        metalness: 0.35,
        transparent: true,
        opacity: 0.88
      });

      this.oceanMesh = new THREE.Mesh(geo, mat);
      this.oceanMesh.position.y = this.oceanWaterLevel;
      this.scene.add(this.oceanMesh);
      this.oceanGeo = geo;
    }
  }

  createPondWater() {
    const geo = new THREE.CircleGeometry(this.pondRadius - 0.2, 40);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x00cec9,
      roughness: 0.08,
      metalness: 0.25,
      transparent: true,
      opacity: 0.85
    });

    this.pondMesh = new THREE.Mesh(geo, mat);
    this.pondMesh.position.set(this.pondCenter.x, this.pondWaterLevel, this.pondCenter.y);
    this.scene.add(this.pondMesh);
  }

  createVolcanoHotSpring() {
    const geo = new THREE.CircleGeometry(11 - 0.2, 36);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xd35400,
      roughness: 0.15,
      metalness: 0.2,
      emissive: 0xe67e22,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.88
    });

    this.volcanoPoolMesh = new THREE.Mesh(geo, mat);
    this.volcanoPoolMesh.position.set(this.volcanoCenter.x, this.volcanoWaterLevel, this.volcanoCenter.y);
    this.scene.add(this.volcanoPoolMesh);
  }

  createCoralLagoonWater() {
    const geo = new THREE.CircleGeometry(10 - 0.2, 36);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x00cec9,
      roughness: 0.05,
      metalness: 0.15,
      transparent: true,
      opacity: 0.82
    });

    this.coralLagoonMesh = new THREE.Mesh(geo, mat);
    this.coralLagoonMesh.position.set(this.coralCenter.x, this.coralLagoonWaterLevel, this.coralCenter.y);
    this.scene.add(this.coralLagoonMesh);
  }

  // --- 3D SUSPENSION BRIDGES OVER DEADLY WATERS ---
  createBridges() {
    const bridgesGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.7 });

    this.bridges.forEach(b => {
      const dx = b.x2 - b.x1;
      const dz = b.z2 - b.z1;
      const spanLength = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);

      const bridgeMeshGroup = new THREE.Group();
      bridgeMeshGroup.position.set(b.x1, 0, b.z1);
      bridgeMeshGroup.rotation.y = -angle;

      const numSteps = Math.max(12, Math.floor(spanLength / 1.4));
      const stepDist = spanLength / numSteps;

      for (let s = 0; s <= numSteps; s++) {
        const t = s / numSteps;
        const curX = s * stepDist;
        const curY = b.baseY + Math.sin(t * Math.PI) * b.archHeight;

        // Wooden Deck Plank
        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.28, b.width), woodMat);
        plank.position.set(curX, curY, 0);
        plank.castShadow = true;
        plank.receiveShadow = true;
        bridgeMeshGroup.add(plank);

        // Vertical safety posts every 2.8m on both sides
        if (s % 2 === 0) {
          [-b.width / 2 + 0.15, b.width / 2 - 0.15].forEach(sideZ => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.35, 6), darkWoodMat);
            post.position.set(curX, curY + 0.65, sideZ);
            post.castShadow = true;
            bridgeMeshGroup.add(post);

            // Nautical glowing lanterns on selected bridge posts
            if (s % 6 === 0) {
              const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), new THREE.MeshBasicMaterial({ color: 0xffeaa7 }));
              lantern.position.set(curX, curY + 1.4, sideZ);
              bridgeMeshGroup.add(lantern);
            }
          });

          // Submerged piling driven into ocean bed every 4 steps
          if (s % 4 === 0 && s > 1 && s < numSteps - 1) {
            [-b.width / 2 + 0.35, b.width / 2 - 0.35].forEach(sideZ => {
              const pilingH = curY + 5.0;
              const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, pilingH, 7), darkWoodMat);
              piling.position.set(curX, curY - pilingH / 2, sideZ);
              bridgeMeshGroup.add(piling);
            });
          }
        }
      }

      // Continuous rope handrail running the entire bridge length
      [-b.width / 2 + 0.15, b.width / 2 - 0.15].forEach(sideZ => {
        const ropeCurvePoints = [];
        for (let s = 0; s <= numSteps; s++) {
          const t = s / numSteps;
          const rx = s * stepDist;
          const ry = b.baseY + Math.sin(t * Math.PI) * b.archHeight + 1.15;
          ropeCurvePoints.push(new THREE.Vector3(rx, ry, sideZ));
        }
        const ropeCurve = new THREE.CatmullRomCurve3(ropeCurvePoints);
        const ropeGeo = new THREE.TubeGeometry(ropeCurve, numSteps * 2, 0.05, 5, false);
        const ropeMesh = new THREE.Mesh(ropeGeo, ropeMat);
        bridgeMeshGroup.add(ropeMesh);
      });

      bridgesGroup.add(bridgeMeshGroup);
    });

    this.scene.add(bridgesGroup);
  }

  createDocks() {
    // 1. Long Ocean Pier (South: x: 0, z: 75 to 116)
    const pierGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.75 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });

    // Main walkway
    const deckGeo = new THREE.BoxGeometry(4.8, 0.45, 42);
    const deck = new THREE.Mesh(deckGeo, woodMat);
    deck.position.set(0, 1.4, 96);
    deck.castShadow = true;
    deck.receiveShadow = true;
    pierGroup.add(deck);

    // End platform for ocean casting
    const headGeo = new THREE.BoxGeometry(16, 0.45, 8);
    const head = new THREE.Mesh(headGeo, woodMat);
    head.position.set(0, 1.4, 117);
    head.castShadow = true;
    head.receiveShadow = true;
    pierGroup.add(head);

    // Pilings with wet algae bases
    const postGeo = new THREE.CylinderGeometry(0.38, 0.42, 6, 8);
    for (let z = 78; z <= 118; z += 5) {
      [-2.1, 2.1].forEach(x => {
        const post = new THREE.Mesh(postGeo, darkWoodMat);
        post.position.set(x, -0.4, z);
        pierGroup.add(post);
      });
    }

    // Pier Lanterns
    this.addPierLantern(pierGroup, -2.1, 1.6, 117);
    this.addPierLantern(pierGroup, 2.1, 1.6, 117);
    this.addPierLantern(pierGroup, -2.1, 1.6, 95);

    // Mooring ropes & cleats
    const cleatGeo = new THREE.BoxGeometry(0.4, 0.12, 0.15);
    const cleatMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, metalness: 0.8 });
    [-7, 7].forEach(x => {
      const cleat = new THREE.Mesh(cleatGeo, cleatMat);
      cleat.position.set(x, 1.65, 117);
      pierGroup.add(cleat);
    });

    // Moored Ferry Boats (Captain Barnaby's Charter Skiffs)
    this.createFerryBoat(pierGroup, 9.2, 0.6, 117, 0);
    this.createFerryBoat(this.scene, 115, 0.5, -20, Math.PI / 2);
    this.createFerryBoat(this.scene, -106, 0.5, -55, -Math.PI / 4);
    this.createFerryBoat(this.scene, -6, 0.5, 175, 0);

    // Ferry Charter Signpost on Pier Head
    const signGroup = new THREE.Group();
    signGroup.position.set(6.2, 1.6, 117);
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 6), darkWoodMat);
    signPole.position.y = 1.2;
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 0.12), new THREE.MeshStandardMaterial({ color: 0xdfe6e9, roughness: 0.7 }));
    signBoard.position.y = 1.9;
    signGroup.add(signPole);
    signGroup.add(signBoard);
    pierGroup.add(signGroup);

    this.scene.add(pierGroup);

    this.interactables.push({
      x: 6.2,
      z: 117,
      radius: 4.8,
      type: 'ferry_charter',
      title: "Captain Barnaby's Island Sea Charters",
      prompt: '[E] Board Island Ferry (Travel to Unlocked Islands)'
    });

    // 2. Pond Dock (x: 14, z: -4)
    const pondDockGroup = new THREE.Group();
    const pDeckGeo = new THREE.BoxGeometry(4.2, 0.35, 11);
    const pDeck = new THREE.Mesh(pDeckGeo, woodMat);
    pDeck.position.set(14, this.pondWaterLevel + 0.15, -4);
    pDeck.castShadow = true;
    pondDockGroup.add(pDeck);

    [-1.9, 1.9].forEach(x => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.5, 8), darkWoodMat);
      post.position.set(14 + x, this.pondWaterLevel + 0.4, -9.5);
      pondDockGroup.add(post);
    });

    this.scene.add(pondDockGroup);
  }

  createFerryBoat(parentGroup, x, y, z, rotY) {
    const boat = new THREE.Group();
    boat.position.set(x, y, z);
    boat.rotation.y = rotY;

    const boatWood = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.7 });
    const seatWood = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });

    // Hull
    const hullGeo = new THREE.BoxGeometry(2.4, 0.9, 5.2);
    const hull = new THREE.Mesh(hullGeo, boatWood);
    hull.position.y = 0.2;
    boat.add(hull);

    // Bench seats
    [-1.2, 0, 1.2].forEach(bz => {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.6), seatWood);
      seat.position.set(0, 0.55, bz);
      boat.add(seat);
    });

    // Lantern on boat bow
    const bLantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xf1c40f }));
    bLantern.position.set(0, 0.85, 2.4);
    boat.add(bLantern);

    parentGroup.add(boat);
  }

  addPierLantern(group, x, y, z) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.9, 6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    post.position.set(x, y + 0.95, z);

    const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color: 0xffeaa7 }));
    lantern.position.set(x, y + 1.9, z);

    group.add(post);
    group.add(lantern);
  }

  createTackleShop() {
    const shopGroup = new THREE.Group();
    const y = this.getHeight(-14, 22);
    shopGroup.position.set(-14, y, 22);
    shopGroup.rotation.y = 0.3;

    // Materials
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.85 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.65 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.8 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57606f, roughness: 0.95 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.25, metalness: 0.85 });
    const windowGlassMat = new THREE.MeshStandardMaterial({ color: 0x81ecec, transparent: true, opacity: 0.5, roughness: 0.1 });
    const counterMat = new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.6 });

    // 1. HARDWOOD TIMBER FLOOR
    const floorGeo = new THREE.BoxGeometry(8.2, 0.26, 6.8);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.13, 0);
    floor.receiveShadow = true;
    shopGroup.add(floor);

    // Front Entrance Porch Deck
    const porchGeo = new THREE.BoxGeometry(4.2, 0.26, 1.8);
    const porch = new THREE.Mesh(porchGeo, floorMat);
    porch.position.set(0, 0.13, 4.3);
    porch.receiveShadow = true;
    shopGroup.add(porch);

    // Porch low entry steps leading smoothly up from ground
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 0.7), darkWoodMat);
    step1.position.set(0, 0.07, 5.35);
    shopGroup.add(step1);
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.6), darkWoodMat);
    step2.position.set(0, 0.04, 5.85);
    shopGroup.add(step2);

    // 2. WALLS WITH CENTRAL OPEN DOORWAY
    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.6, 0.32), woodMat);
    backWall.position.set(0, 1.8, -3.4);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    shopGroup.add(backWall);

    // Left Wall with ocean view window
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.6, 6.8), woodMat);
    leftWall.position.set(-4.1, 1.8, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    shopGroup.add(leftWall);

    // Right Wall with tackle rack display
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.6, 6.8), woodMat);
    rightWall.position.set(4.1, 1.8, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    shopGroup.add(rightWall);

    // Front Wall: Left section
    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.6, 0.32), woodMat);
    frontWallL.position.set(-2.7, 1.8, 3.4);
    frontWallL.castShadow = true;
    shopGroup.add(frontWallL);

    // Front Wall: Right section
    const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.6, 0.32), woodMat);
    frontWallR.position.set(2.7, 1.8, 3.4);
    frontWallR.castShadow = true;
    shopGroup.add(frontWallR);

    // Doorway Lintel Beam across top of door (leaves 3.0m clear walk-in height)
    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 0.36), darkWoodMat);
    doorLintel.position.set(0, 3.3, 3.4);
    shopGroup.add(doorLintel);

    // Welcoming Open Wooden Door (swung inward at 65 degrees)
    const openDoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.9, 0.08), darkWoodMat);
    openDoor.position.set(-1.15, 1.5, 3.0);
    openDoor.rotation.y = 1.15;
    shopGroup.add(openDoor);

    // Heavy Timber Corner Posts & Door Posts
    [-4.1, 4.1].forEach(x => {
      [-3.4, 3.4].forEach(z => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.8, 0.42), darkWoodMat);
        post.position.set(x, 1.9, z);
        shopGroup.add(post);
      });
    });

    [-1.3, 1.3].forEach(dx => {
      const doorPost = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.6, 0.38), darkWoodMat);
      doorPost.position.set(dx, 1.8, 3.4);
      shopGroup.add(doorPost);
    });

    // 3. GABLED TIMBER ROOF & RAFTERS
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 7.8), roofMat);
    roofL.position.set(-2.2, 4.35, 0);
    roofL.rotation.z = 0.45;
    roofL.castShadow = true;
    shopGroup.add(roofL);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 7.8), roofMat);
    roofR.position.set(2.2, 4.35, 0);
    roofR.rotation.z = -0.45;
    roofR.castShadow = true;
    shopGroup.add(roofR);

    // Front & Back Triangular Gable Peaks
    [-3.4, 3.4].forEach(gz => {
      const gableGeo = new THREE.ConeGeometry(4.3, 1.8, 4);
      gableGeo.rotateY(Math.PI / 4);
      const gable = new THREE.Mesh(gableGeo, woodMat);
      gable.scale.set(1.0, 1.0, 0.08);
      gable.position.set(0, 4.4, gz);
      shopGroup.add(gable);
    });

    // Interior Ceiling Crossbeams / Trusses
    [-1.8, 0, 1.8].forEach(tz => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.2, 0.2), darkWoodMat);
      beam.position.set(0, 3.5, tz);
      shopGroup.add(beam);
    });

    // 4. WINDOWS WITH WOODEN MULLION FRAMES
    [-4.1, 4.1].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.4, 1.6), windowGlassMat);
      win.position.set(wx, 2.0, 0);
      shopGroup.add(win);
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.5, 1.7), darkWoodMat);
      winFrame.position.set(wx, 2.0, 0);
      winFrame.scale.set(1.02, 0.95, 0.95);
      shopGroup.add(winFrame);
    });

    // 5. INTERIOR STONE FIREPLACE & CHIMNEY
    const fireplaceGroup = new THREE.Group();
    fireplaceGroup.position.set(0, 0, -3.0);

    const hearth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.9), stoneMat);
    hearth.position.set(0, 0.9, 0);
    fireplaceGroup.add(hearth);

    // Firebox opening
    const firebox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    firebox.position.set(0, 0.65, 0.2);
    fireplaceGroup.add(firebox);

    // Glowing logs & fire
    const fireLogs = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 0.35), new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 }));
    fireLogs.position.set(0, 0.2, 0.2);
    fireplaceGroup.add(fireLogs);

    const fireGlow = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 6), new THREE.MeshBasicMaterial({ color: 0xff6b4a }));
    fireGlow.position.set(0, 0.5, 0.2);
    fireplaceGroup.add(fireGlow);

    // Chimney extending through roof
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.2, 1.0), stoneMat);
    chimney.position.set(0, 3.8, -0.1);
    chimney.castShadow = true;
    fireplaceGroup.add(chimney);

    // Warm Fireplace Point Light casting ambient glow inside cabin
    const fireLight = new THREE.PointLight(0xffa040, 2.2, 10.0);
    fireLight.position.set(0, 1.2, 0.6);
    fireplaceGroup.add(fireLight);

    shopGroup.add(fireplaceGroup);

    // 6. OAK SHOP COUNTER & CAPTAIN BARNABY INSIDE
    const counterGroup = new THREE.Group();
    counterGroup.position.set(-2.2, 0, 0.8);

    const counterBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.85), counterMat);
    counterBase.position.y = 0.55;
    counterBase.castShadow = true;
    counterGroup.add(counterBase);

    // Counter top rim
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.0), darkWoodMat);
    counterTop.position.y = 1.12;
    counterGroup.add(counterTop);

    // Brass cash register / ledger
    const register = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.4), brassMat);
    register.position.set(0.6, 1.3, 0);
    counterGroup.add(register);

    const scale = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.3, 8), brassMat);
    scale.position.set(-0.6, 1.28, 0);
    counterGroup.add(scale);

    shopGroup.add(counterGroup);

    // Shopkeeper NPC "Captain Barnaby" standing behind counter inside cabin
    const npc = this.createRealisticCaptain();
    npc.position.set(-2.2, 0.14, -0.2);
    shopGroup.add(npc);
    this.captainMesh = npc;

    // 7. WALL-MOUNTED FISHING ROD DISPLAY RACK (Right Wall)
    const tackleRack = new THREE.Group();
    tackleRack.position.set(3.85, 1.8, 0);

    const rackBoard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.0, 2.8), darkWoodMat);
    tackleRack.add(rackBoard);

    // Display fishing rods on wall rack
    [-0.5, 0, 0.5].forEach(ry => {
      const rodDisplay = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.038, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0x825a2c, roughness: 0.6 }));
      rodDisplay.position.set(-0.1, ry, 0);
      rodDisplay.rotation.x = Math.PI / 2;
      tackleRack.add(rodDisplay);
    });

    shopGroup.add(tackleRack);

    // 8. TROPHIES & NAUTICAL DECOR
    // Mounted Bluefin Marlin Trophy above fireplace
    const trophyPlaque = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.12), darkWoodMat);
    trophyPlaque.position.set(0, 2.65, -3.2);
    shopGroup.add(trophyPlaque);

    const trophyFish = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.8, 6), new THREE.MeshStandardMaterial({ color: 0x0984e3, metalness: 0.5, roughness: 0.3 }));
    trophyFish.rotation.z = Math.PI / 2;
    trophyFish.position.set(0, 2.65, -3.1);
    shopGroup.add(trophyFish);

    // Vintage Brass Ship Steering Wheel on left wall
    const helm = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 16), brassMat);
    helm.position.set(-3.9, 2.2, -1.6);
    helm.rotation.y = Math.PI / 2;
    shopGroup.add(helm);

    // Woven Rug on cabin floor
    const rug = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.02, 2.8), new THREE.MeshStandardMaterial({ color: 0xb71540, roughness: 0.95 }));
    rug.position.set(0, 0.27, 0);
    shopGroup.add(rug);

    // Central Warm Hanging Ceiling Lantern
    const ceilingLantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color: 0xffeaa7 }));
    ceilingLantern.position.set(0, 3.1, 0);
    shopGroup.add(ceilingLantern);

    const cabinLight = new THREE.PointLight(0xffd166, 1.8, 11.0);
    cabinLight.position.set(0, 2.9, 0);
    shopGroup.add(cabinLight);

    // 9. EXTERIOR PORCH SIGN & LANTERN
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 0.15), new THREE.MeshStandardMaterial({ color: 0xfff8dc, roughness: 0.7 }));
    signBoard.position.set(0, 3.8, 4.4);
    shopGroup.add(signBoard);

    const porchLantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
    porchLantern.position.set(0, 3.2, 4.4);
    shopGroup.add(porchLantern);

    this.scene.add(shopGroup);

    // Store cabin world bounds for interior detection
    this.cabinPos = new THREE.Vector3(-14, y, 22);
    this.cabinRot = 0.3;

    // Interactable 1: Captain Barnaby (Inside the cabin)
    this.interactables.push({
      x: -14,
      z: 22,
      radius: 4.8,
      type: 'npc',
      npcId: 'barnaby',
      title: "Captain Barnaby",
      prompt: '[E] Talk to Captain Barnaby (Master Angler & Shop)'
    });
  }

  createRealisticCaptain() {
    const npc = new THREE.Group();

    // High fidelity captain materials
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x0c2461, roughness: 0.72 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x1e3799, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.25, metalness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.65, metalness: 0.02 });
    const skinShadeMat = new THREE.MeshStandardMaterial({ color: 0xcfa676, roughness: 0.7 });
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.9 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const capBrimMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.4 });
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.1 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.2 }); // Sea-blue eyes
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.05 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, roughness: 0.65 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0c2461, roughness: 0.75 });
    const bootsMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.5 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 });

    // 1. Legs & Deck Boots
    [-0.18, 0.18].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.7, 8), pantsMat);
      leg.position.set(x, 0.35, 0);
      npc.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.34), bootsMat);
      boot.position.set(x, 0.07, 0.04);
      npc.add(boot);
    });

    // 2. Torso (Spine & Chest with double-breasted officer coat)
    const chest = new THREE.Group();
    chest.position.y = 0.95;
    npc.add(chest);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.33, 0.85, 10), coatMat);
    body.position.y = 0.15;
    body.castShadow = true;
    chest.add(body);

    // Stiff white collar & navy tie
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.14, 8), shirtMat);
    collar.position.set(0, 0.55, 0.04);
    chest.add(collar);
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.03), tieMat);
    tie.position.set(0, 0.44, 0.26);
    chest.add(tie);

    // Double-breasted gold anchor buttons
    [-0.09, 0.09].forEach(bx => {
      for (let r = 0; r < 3; r++) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 8), goldMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(bx, 0.38 - r * 0.14, 0.32);
        chest.add(btn);
      }
    });

    // Gold shoulder epaulets with fringe
    [-0.42, 0.42].forEach(ex => {
      const epaulet = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.18), goldMat);
      epaulet.position.set(ex, 0.55, 0);
      chest.add(epaulet);
    });

    // 3. Sculpted Head & Articulated Jaw with Captain's Beard
    const head = new THREE.Group();
    head.position.y = 0.82;
    chest.add(head);

    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), skinMat);
    cranium.scale.set(0.92, 1.08, 1.0);
    cranium.position.set(0, 0.04, 0);
    head.add(cranium);

    // Defined Lower Jaw & Articulated Chin (moves during talking!)
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.04, 0.04);
    head.add(jaw);

    // Sculpted white captain beard attached to jaw
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), beardMat);
    beard.scale.set(0.95, 1.35, 0.85);
    beard.position.set(0, -0.16, 0.16);
    jaw.add(beard);

    // Curled captain mustache
    const mustacheL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.01, 0.18, 6), beardMat);
    mustacheL.rotation.z = Math.PI / 2.8;
    mustacheL.position.set(-0.08, -0.02, 0.26);
    jaw.add(mustacheL);

    const mustacheR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.01, 0.18, 6), beardMat);
    mustacheR.rotation.z = -Math.PI / 2.8;
    mustacheR.position.set(0.08, -0.02, 0.26);
    jaw.add(mustacheR);

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 6), skinMat);
    nose.rotation.x = -Math.PI / 2.3;
    nose.position.set(0, 0.04, 0.27);
    head.add(nose);

    // Blinking Eyes with Sclera, Iris, Pupil, Glint & Upper Eyelids
    const eyelids = [];
    [-0.09, 0.09].forEach(x => {
      const eyeOrbit = new THREE.Group();
      eyeOrbit.position.set(x, 0.07, 0.21);
      head.add(eyeOrbit);

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), scleraMat);
      eyeOrbit.add(sclera);

      const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8), irisMat);
      iris.rotation.x = Math.PI / 2;
      iris.position.z = 0.032;
      eyeOrbit.add(iris);

      const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.012, 8), pupilMat);
      pupil.rotation.x = Math.PI / 2;
      pupil.position.z = 0.034;
      eyeOrbit.add(pupil);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.004, 4, 4), glintMat);
      glint.position.set(0.007, 0.007, 0.037);
      eyeOrbit.add(glint);

      const upperLid = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        lidMat
      );
      upperLid.rotation.x = -Math.PI / 2.3;
      eyeOrbit.add(upperLid);
      eyelids.push(upperLid);
    });

    // Peaked Captain's Officer Cap with Gold Laurel Crest
    const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.2, 12), capMat);
    capCrown.position.set(0, 0.26, 0.02);
    capCrown.rotation.x = 0.08;
    head.add(capCrown);

    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.24), capBrimMat);
    capVisor.position.set(0, 0.17, 0.24);
    capVisor.rotation.x = 0.22;
    head.add(capVisor);

    // Gold braided band & anchor crest badge
    const goldBand = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.05, 12), goldMat);
    goldBand.position.set(0, 0.2, 0.02);
    head.add(goldBand);

    const anchorBadge = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 10), goldMat);
    anchorBadge.position.set(0, 0.24, 0.27);
    head.add(anchorBadge);

    // 4. Arms & Hands
    // Right Arm holding Brass Spyglass
    const armR = new THREE.Group();
    armR.position.set(0.44, 0.44, 0);
    chest.add(armR);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.38, 8), coatMat);
    rUpperArm.position.y = -0.19;
    armR.add(rUpperArm);

    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.34, 8), coatMat);
    rForearm.position.set(0, -0.45, 0.08);
    rForearm.rotation.x = -0.55;
    armR.add(rForearm);

    // Brass Spyglass
    const spyglass = new THREE.Group();
    spyglass.position.set(0, -0.6, 0.25);
    spyglass.rotation.x = -0.6;
    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.28, 8), brassMat);
    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.24, 8), brassMat);
    barrel2.position.y = 0.2;
    spyglass.add(barrel1);
    spyglass.add(barrel2);
    armR.add(spyglass);

    // Left Arm resting at waist belt
    const armL = new THREE.Group();
    armL.position.set(-0.44, 0.44, 0);
    chest.add(armL);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.38, 8), coatMat);
    lUpperArm.position.y = -0.19;
    armL.add(lUpperArm);

    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.34, 8), coatMat);
    lForearm.position.set(0.08, -0.42, 0.12);
    lForearm.rotation.set(-0.6, 0, -0.4);
    armL.add(lForearm);

    npc.userData = {
      head: head,
      jaw: jaw,
      eyelids: eyelids,
      chest: chest,
      armR: armR,
      armL: armL,
      spyglass: spyglass
    };

    return npc;
  }

  createCampfire() {
    const fireGroup = new THREE.Group();
    const y = this.getHeight(4, 28);
    fireGroup.position.set(4, y, 28);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32), stoneMat);
      st.position.set(Math.cos(a) * 1.2, 0.15, Math.sin(a) * 1.2);
      fireGroup.add(st);
    }

    const logMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 6), logMat);
    log1.rotation.z = 0.8;
    log1.position.y = 0.22;
    const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 6), logMat);
    log2.rotation.x = 0.8;
    log2.position.y = 0.22;
    fireGroup.add(log1);
    fireGroup.add(log2);

    // Glowing animated flame
    const flameGeo = new THREE.ConeGeometry(0.42, 1.0, 7);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6b6b });
    this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
    this.flameMesh.position.y = 0.6;
    fireGroup.add(this.flameMesh);

    // Campfire log benches
    const benchGeo = new THREE.CylinderGeometry(0.36, 0.36, 3.5, 8);
    benchGeo.rotateZ(Math.PI / 2);
    const bench = new THREE.Mesh(benchGeo, logMat);
    bench.position.set(0, 0.3, 2.7);
    fireGroup.add(bench);

    this.scene.add(fireGroup);

    this.interactables.push({
      x: 4,
      z: 28,
      radius: 4.5,
      type: 'campfire',
      title: 'Island Campfire',
      prompt: '[E] Rest at Campfire (Change Time of Day)'
    });
  }

  // --- 240+ TREES WITH DYNAMIC WIND SWAYING ACROSS ARCHIPELAGO ---
  createFoliageAndTrees() {
    this.treeMaterials = {
      palmWood: new THREE.MeshStandardMaterial({ color: 0x826955, roughness: 0.88 }),
      palmWoodDark: new THREE.MeshStandardMaterial({ color: 0x5a4537, roughness: 0.92 }),
      palmRing: new THREE.MeshStandardMaterial({ color: 0x4e3629, roughness: 0.95 }),
      palmLeaves: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.65, side: THREE.DoubleSide }),
      palmLeavesLight: new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6, side: THREE.DoubleSide }),
      palmLeavesDry: new THREE.MeshStandardMaterial({ color: 0x9e9d24, roughness: 0.8, side: THREE.DoubleSide }),
      palmStem: new THREE.MeshStandardMaterial({ color: 0x689f38, roughness: 0.7 }),
      coconut: new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 }),
      coconutGreen: new THREE.MeshStandardMaterial({ color: 0x558b2f, roughness: 0.85 }),
      oakWood: new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.88 }),
      oakWoodDark: new THREE.MeshStandardMaterial({ color: 0x37241e, roughness: 0.92 }),
      oakLeaves: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.75 }),
      oakLeavesLight: new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.7 }),
      oakLeavesDeep: new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.85 }),
      pineWood: new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 }),
      pineLeaves: new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.8 }),
      pineLeavesLight: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.75 }),
      pineLeavesFrost: new THREE.MeshStandardMaterial({ color: 0x33691e, roughness: 0.85 }),
      willowWood: new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 }),
      willowLeaves: new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.7, side: THREE.DoubleSide }),
      willowLeavesDark: new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.75, side: THREE.DoubleSide }),
      cherryWood: new THREE.MeshStandardMaterial({ color: 0x37241e, roughness: 0.9 }),
      cherryLeaves: new THREE.MeshStandardMaterial({ color: 0xf48fb1, roughness: 0.7 }),
      cherryLeavesDark: new THREE.MeshStandardMaterial({ color: 0xec407a, roughness: 0.75 }),
      cherryLeavesLight: new THREE.MeshStandardMaterial({ color: 0xfce4ec, roughness: 0.65 })
    };

    // 1. MAIN ISLAND: Palms on Beach Perimeter (~38 palms)
    for (let i = 0; i < 38; i++) {
      const angle = (i / 38) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const borderNoise = Math.sin(angle * 5) * 8 + Math.cos(angle * 3) * 6;
      const r = 74 + borderNoise + (Math.random() * 8 - 4);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = this.getHeight(x, z);

      if (y >= 0.4 && y <= 2.8) {
        this.spawnTree('palm', x, y, z);
      }
    }

    // 2. MAIN ISLAND: Meadow Oaks (~48 oaks)
    for (let i = 0; i < 52; i++) {
      const rx = (Math.random() - 0.5) * 110;
      const rz = (Math.random() - 0.5) * 110;
      const pDist = Math.hypot(rx - this.pondCenter.x, rz - this.pondCenter.y);
      const shopDist = Math.hypot(rx + 14, rz - 22);

      if (pDist > this.pondRadius + 6 && shopDist > 12) {
        const y = this.getHeight(rx, rz);
        if (y > 2.6 && y < 7.2) {
          this.spawnTree('oak', rx, y, rz);
        }
      }
    }

    // 3. MAIN ISLAND: Mountain Pines on NW ridge (~32 pines)
    for (let i = 0; i < 35; i++) {
      const rx = -35 + (Math.random() - 0.5) * 45;
      const rz = 28 + (Math.random() - 0.5) * 45;
      const y = this.getHeight(rx, rz);
      if (y > 6.5) {
        this.spawnTree('pine', rx, y, rz);
      }
    }

    // 4. MAIN ISLAND: Weeping Willows around Freshwater Pond (~14 willows)
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const r = this.pondRadius + 2.2 + Math.random() * 2.5;
      const x = this.pondCenter.x + Math.cos(angle) * r;
      const z = this.pondCenter.y + Math.sin(angle) * r;
      const y = this.getHeight(x, z);
      if (Math.hypot(x - 14, z - (-4)) > 5) {
        this.spawnTree('willow', x, y, z);
      }
    }

    // 5. MAIN ISLAND: Sacred Cherry Blossoms on Eastern Hill (~8 trees)
    for (let i = 0; i < 8; i++) {
      const rx = 38 + (Math.random() - 0.5) * 18;
      const rz = 22 + (Math.random() - 0.5) * 18;
      const y = this.getHeight(rx, rz);
      if (y > 4.5) {
        this.spawnTree('cherry', rx, y, rz);
      }
    }

    // 6. CORAL ATOLL: Tropical Palms (~36 palms)
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const r = 12 + Math.random() * 28;
      const x = this.coralCenter.x + Math.cos(angle) * r;
      const z = this.coralCenter.y + Math.sin(angle) * r;
      const y = this.getHeight(x, z);
      if (y > 0.4 && y < 4.0) {
        this.spawnTree('palm', x, y, z);
      }
    }

    // 7. VOLCANIC PINE CRAGS: Conifer Alpine Pines (~45 pines)
    for (let i = 0; i < 46; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 14 + Math.random() * 32;
      const x = this.volcanoCenter.x + Math.cos(angle) * r;
      const z = this.volcanoCenter.y + Math.sin(angle) * r;
      const y = this.getHeight(x, z);
      if (y > 2.5) {
        this.spawnTree('pine', x, y, z);
      }
    }

    // 8. VOLCANIC CALDERA: Willows around Hot Spring (~8 trees)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 12.5 + Math.random() * 3;
      const x = this.volcanoCenter.x + Math.cos(angle) * r;
      const z = this.volcanoCenter.y + Math.sin(angle) * r;
      const y = this.getHeight(x, z);
      this.spawnTree('willow', x, y, z);
    }

    // 9. TITAN LEVIATHAN ATOLL: Weathered Pines & Ancient Trees (~25 trees)
    for (let i = 0; i < 26; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 30;
      const x = this.titanCenter.x + Math.cos(angle) * r;
      const z = this.titanCenter.y + Math.sin(angle) * r;
      const y = this.getHeight(x, z);
      if (y > 1.2) {
        this.spawnTree(i % 2 === 0 ? 'pine' : 'oak', x, y, z);
      }
    }
  }

  spawnTree(type, x, y, z) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);
    const scale = 0.85 + Math.random() * 0.35;
    treeGroup.scale.set(scale, scale, scale);

    if (type === 'palm') this.buildPalmTree(treeGroup);
    else if (type === 'oak') this.buildOakTree(treeGroup);
    else if (type === 'pine') this.buildPineTree(treeGroup);
    else if (type === 'willow') this.buildWillowTree(treeGroup);
    else if (type === 'cherry') this.buildCherryTree(treeGroup);

    this.scene.add(treeGroup);

    this.trees.push({
      mesh: treeGroup,
      type: type,
      x: x,
      z: z,
      y: y,
      shaken: false,
      lastShaken: 0,
      baseRotation: Math.random() * Math.PI * 2,
      windPhase: Math.random() * Math.PI * 2
    });
  }

  buildPalmTree(group) {
    let currY = 0;
    const curveDir = Math.random() * Math.PI * 2;
    const trunkSegments = 6;
    let currX = 0, currZ = 0;

    // 1. Flared root base
    const baseFlare = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.72, 0.5, 8),
      this.treeMaterials.palmWoodDark
    );
    baseFlare.position.y = 0.25;
    group.add(baseFlare);
    currY += 0.45;

    // 2. Segmented organic curved trunk with bark ring ridges
    for (let i = 0; i < trunkSegments; i++) {
      const segH = 1.35;
      const radBot = 0.50 - i * 0.045;
      const radTop = 0.46 - i * 0.045;
      const segGeo = new THREE.CylinderGeometry(radTop, radBot, segH, 8);
      const seg = new THREE.Mesh(segGeo, i % 2 === 0 ? this.treeMaterials.palmWood : this.treeMaterials.palmWoodDark);
      seg.position.set(currX, currY + segH / 2, currZ);
      seg.rotation.z = Math.cos(curveDir) * 0.07 * (i + 1);
      seg.rotation.x = Math.sin(curveDir) * 0.07 * (i + 1);
      group.add(seg);

      // Bark ring collar
      const ringGeo = new THREE.CylinderGeometry(radTop * 1.08, radTop * 1.08, 0.09, 8);
      const ring = new THREE.Mesh(ringGeo, this.treeMaterials.palmRing);
      ring.position.set(currX + Math.cos(curveDir) * 0.08, currY + segH, currZ + Math.sin(curveDir) * 0.08);
      group.add(ring);

      currY += segH;
      currX += Math.cos(curveDir) * 0.22;
      currZ += Math.sin(curveDir) * 0.22;
    }

    // 3. Crown collar (leaf sheath junction)
    const crownCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.28, 0.6, 8),
      this.treeMaterials.palmStem
    );
    crownCollar.position.set(currX, currY + 0.3, currZ);
    group.add(crownCollar);
    currY += 0.5;

    // 4. Multi-tiered realistic arching palm fronds (11 total)
    const frondTiers = [
      { count: 4, elevation: 0.65, length: 3.2, width: 0.9, pitch: 0.85, mat: this.treeMaterials.palmLeavesLight },
      { count: 7, elevation: 0.2, length: 4.1, width: 1.15, pitch: 1.35, mat: this.treeMaterials.palmLeaves },
      { count: 2, elevation: -0.1, length: 3.5, width: 0.85, pitch: 1.65, mat: this.treeMaterials.palmLeavesDry }
    ];

    frondTiers.forEach(tier => {
      for (let f = 0; f < tier.count; f++) {
        const fAngle = (f / tier.count) * Math.PI * 2 + (tier.elevation * 0.8);
        const frondGroup = new THREE.Group();
        frondGroup.position.set(currX, currY + tier.elevation, currZ);
        frondGroup.rotation.y = fAngle;

        // Arching central stem
        const stemGeo = new THREE.CylinderGeometry(0.04, 0.08, tier.length, 5);
        const stem = new THREE.Mesh(stemGeo, this.treeMaterials.palmStem);
        stem.position.set(0, tier.length * 0.42, tier.length * 0.42);
        stem.rotation.x = tier.pitch;
        frondGroup.add(stem);

        // Segmented leaf blades along the stem
        const bladeGeo = new THREE.ConeGeometry(tier.width, tier.length * 0.85, 4);
        bladeGeo.scale(1.0, 1.0, 0.12);
        const blade = new THREE.Mesh(bladeGeo, tier.mat);
        blade.position.set(0, tier.length * 0.45, tier.length * 0.45);
        blade.rotation.x = tier.pitch;
        frondGroup.add(blade);

        group.add(frondGroup);
      }
    });

    // 5. Coconut clusters beneath crown
    const cocoGeo = new THREE.SphereGeometry(0.25, 7, 7);
    cocoGeo.scale(1.0, 1.25, 1.0);
    const cocoCount = 5;
    for (let c = 0; c < cocoCount; c++) {
      const cAngle = (c / cocoCount) * Math.PI * 2 + 0.3;
      const mat = c % 2 === 0 ? this.treeMaterials.coconut : this.treeMaterials.coconutGreen;
      const coco = new THREE.Mesh(cocoGeo, mat);
      coco.position.set(
        currX + Math.cos(cAngle) * 0.42,
        currY - 0.28,
        currZ + Math.sin(cAngle) * 0.42
      );
      coco.rotation.z = (Math.random() - 0.5) * 0.4;
      group.add(coco);
    }
  }

  buildOakTree(group) {
    // 1. Root buttresses spreading into the ground
    for (let r = 0; r < 4; r++) {
      const rAngle = (r / 4) * Math.PI * 2 + 0.25;
      const root = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.38, 1.2, 6),
        this.treeMaterials.oakWoodDark
      );
      root.position.set(Math.cos(rAngle) * 0.65, 0.4, Math.sin(rAngle) * 0.65);
      root.rotation.z = Math.cos(rAngle) * 0.55;
      root.rotation.x = Math.sin(rAngle) * 0.55;
      group.add(root);
    }

    // 2. Thick, gnarled main trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.85, 3.2, 9),
      this.treeMaterials.oakWood
    );
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    group.add(trunk);

    // 3. Thick branching boughs reaching outward into canopy
    const branches = [
      { x: 0.9, y: 3.2, z: 0.4, rx: 0.2, rz: -0.65, len: 2.2, rad: 0.32 },
      { x: -0.85, y: 3.4, z: -0.4, rx: -0.2, rz: 0.68, len: 2.1, rad: 0.3 },
      { x: 0.1, y: 3.6, z: 0.95, rx: -0.62, rz: 0.1, len: 2.0, rad: 0.28 }
    ];

    branches.forEach(b => {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(b.rad * 0.7, b.rad, b.len, 7),
        this.treeMaterials.oakWood
      );
      branch.position.set(b.x * 0.5, b.y, b.z * 0.5);
      branch.rotation.x = b.rx;
      branch.rotation.z = b.rz;
      group.add(branch);
    });

    // 4. Lush multi-toned canopy clouds
    const foliageCluster = [
      { x: 0, y: 4.8, z: 0, r: 2.4, mat: this.treeMaterials.oakLeaves },
      { x: 1.4, y: 4.2, z: 0.6, r: 1.9, mat: this.treeMaterials.oakLeavesLight },
      { x: -1.3, y: 4.3, z: -0.5, r: 1.85, mat: this.treeMaterials.oakLeaves },
      { x: 0.5, y: 5.4, z: -1.1, r: 1.7, mat: this.treeMaterials.oakLeavesLight },
      { x: -0.7, y: 5.2, z: 1.2, r: 1.75, mat: this.treeMaterials.oakLeavesDeep },
      { x: 1.1, y: 4.8, z: -0.9, r: 1.5, mat: this.treeMaterials.oakLeavesDeep },
      { x: -1.0, y: 3.8, z: 0.8, r: 1.6, mat: this.treeMaterials.oakLeavesLight },
      { x: 0.2, y: 6.0, z: 0.2, r: 1.5, mat: this.treeMaterials.oakLeavesLight }
    ];

    foliageCluster.forEach(c => {
      const leafGeo = new THREE.DodecahedronGeometry(c.r, 1);
      const leaf = new THREE.Mesh(leafGeo, c.mat);
      leaf.position.set(c.x, c.y, c.z);
      leaf.scale.set(1.0 + Math.random() * 0.15, 0.88 + Math.random() * 0.12, 1.0 + Math.random() * 0.15);
      leaf.castShadow = true;
      group.add(leaf);
    });
  }

  buildPineTree(group) {
    // 1. Tall tapering trunk with lower branch stubs
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.58, 4.4, 8),
      this.treeMaterials.pineWood
    );
    trunk.position.y = 2.2;
    group.add(trunk);

    // Dead branch stubs near base
    for (let s = 0; s < 3; s++) {
      const sAngle = (s / 3) * Math.PI * 2 + 0.4;
      const stub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.09, 0.55, 5),
        this.treeMaterials.pineWood
      );
      stub.position.set(Math.cos(sAngle) * 0.35, 1.2 + s * 0.35, Math.sin(sAngle) * 0.35);
      stub.rotation.z = Math.cos(sAngle) * 0.8;
      stub.rotation.x = Math.sin(sAngle) * 0.8;
      group.add(stub);
    }

    // 2. 5 tiered needle layers with drooping bough silhouette
    const tiers = [
      { y: 2.7, r: 2.8, h: 2.1, mat: this.treeMaterials.pineLeavesFrost },
      { y: 3.9, r: 2.3, h: 2.0, mat: this.treeMaterials.pineLeaves },
      { y: 5.0, r: 1.8, h: 1.9, mat: this.treeMaterials.pineLeavesLight },
      { y: 6.0, r: 1.35, h: 1.7, mat: this.treeMaterials.pineLeaves },
      { y: 6.9, r: 0.85, h: 1.5, mat: this.treeMaterials.pineLeavesLight }
    ];

    tiers.forEach(t => {
      // Main conical skirt
      const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 8), t.mat);
      cone.position.y = t.y;
      cone.castShadow = true;
      group.add(cone);

      // Drooping needle fringe clusters for organic texture
      for (let b = 0; b < 6; b++) {
        const bAngle = (b / 6) * Math.PI * 2;
        const bough = new THREE.Mesh(
          new THREE.ConeGeometry(t.r * 0.38, t.h * 0.75, 5),
          t.mat
        );
        bough.position.set(
          Math.cos(bAngle) * (t.r * 0.72),
          t.y - t.h * 0.32,
          Math.sin(bAngle) * (t.r * 0.72)
        );
        bough.rotation.x = 0.45;
        bough.rotation.y = bAngle;
        bough.scale.set(1.2, 0.7, 0.6);
        group.add(bough);
      }
    });

    // Spire needle tip
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.2, 6),
      this.treeMaterials.pineLeavesLight
    );
    spire.position.y = 7.8;
    group.add(spire);
  }

  buildWillowTree(group) {
    // 1. Twisted mossy trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.88, 3.2, 8),
      this.treeMaterials.willowWood
    );
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    group.add(trunk);

    // 2. Heavy horizontal arching limbs
    for (let l = 0; l < 4; l++) {
      const lAngle = (l / 4) * Math.PI * 2;
      const limb = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.38, 2.2, 6),
        this.treeMaterials.willowWood
      );
      limb.position.set(Math.cos(lAngle) * 0.9, 2.7, Math.sin(lAngle) * 0.9);
      limb.rotation.z = Math.cos(lAngle) * 0.75;
      limb.rotation.x = Math.sin(lAngle) * 0.75;
      group.add(limb);
    }

    // 3. Volumetric canopy crown
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 9, 7),
      this.treeMaterials.willowLeaves
    );
    dome.scale.set(1.4, 0.8, 1.4);
    dome.position.y = 3.8;
    dome.castShadow = true;
    group.add(dome);

    // 4. Cascading weeping tendrils hanging down
    const tendrilCount = 18;
    for (let i = 0; i < tendrilCount; i++) {
      const a = (i / tendrilCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const dist = 1.8 + Math.random() * 0.8;
      const tLen = 2.4 + Math.random() * 1.2;
      const tendrilGeo = new THREE.CylinderGeometry(0.06, 0.12, tLen, 5);
      const mat = i % 2 === 0 ? this.treeMaterials.willowLeaves : this.treeMaterials.willowLeavesDark;
      const tendril = new THREE.Mesh(tendrilGeo, mat);
      tendril.position.set(Math.cos(a) * dist, 3.8 - tLen * 0.5, Math.sin(a) * dist);
      tendril.rotation.z = (Math.random() - 0.5) * 0.18;
      tendril.rotation.x = (Math.random() - 0.5) * 0.18;
      group.add(tendril);
    }
  }

  buildCherryTree(group) {
    // 1. Elegant curved bonsai trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.72, 3.4, 8),
      this.treeMaterials.cherryWood
    );
    trunk.position.y = 1.7;
    trunk.rotation.z = 0.12;
    trunk.castShadow = true;
    group.add(trunk);

    // Sweeping branch limbs
    const branch1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.32, 2.0, 6),
      this.treeMaterials.cherryWood
    );
    branch1.position.set(0.7, 3.0, 0.3);
    branch1.rotation.z = -0.65;
    group.add(branch1);

    const branch2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.28, 1.8, 6),
      this.treeMaterials.cherryWood
    );
    branch2.position.set(-0.6, 3.2, -0.4);
    branch2.rotation.z = 0.6;
    group.add(branch2);

    // 2. Multi-tone cherry blossom clouds
    const clusters = [
      { x: 0, y: 4.4, z: 0, r: 2.2, mat: this.treeMaterials.cherryLeaves },
      { x: 1.4, y: 3.9, z: 0.5, r: 1.8, mat: this.treeMaterials.cherryLeavesLight },
      { x: -1.3, y: 4.1, z: -0.6, r: 1.7, mat: this.treeMaterials.cherryLeavesDark },
      { x: 0.4, y: 5.1, z: 0.8, r: 1.6, mat: this.treeMaterials.cherryLeavesLight },
      { x: -0.5, y: 4.9, z: -0.8, r: 1.5, mat: this.treeMaterials.cherryLeaves },
      { x: 1.0, y: 4.7, z: -0.7, r: 1.4, mat: this.treeMaterials.cherryLeavesDark },
      { x: -0.9, y: 3.6, z: 0.7, r: 1.45, mat: this.treeMaterials.cherryLeavesLight }
    ];

    clusters.forEach(c => {
      const blossomGeo = new THREE.DodecahedronGeometry(c.r, 1);
      const blossom = new THREE.Mesh(blossomGeo, c.mat);
      blossom.position.set(c.x, c.y, c.z);
      blossom.scale.set(1.1, 0.88, 1.1);
      blossom.castShadow = true;
      group.add(blossom);
    });

    // Fallen blossom petal scatter ring at the base
    const petalRingGeo = new THREE.RingGeometry(0.8, 2.4, 8);
    const petalRingMat = new THREE.MeshBasicMaterial({
      color: 0xf8bbd0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });
    const petalRing = new THREE.Mesh(petalRingGeo, petalRingMat);
    petalRing.rotation.x = -Math.PI / 2;
    petalRing.position.y = 0.05;
    group.add(petalRing);
  }

  createDecorations() {
    const rockGeo = new THREE.DodecahedronGeometry(0.9, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x636e72, roughness: 0.9 });

    for (let i = 0; i < 45; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 25 + Math.random() * 62;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = this.getHeight(x, z);

      if (y > 0.4) {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        const s = 0.5 + Math.random() * 1.3;
        rock.scale.set(s, s * 0.7, s);
        rock.position.set(x, y + 0.2, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
      }
    }

    // Populate realistic beach shells, starfish, driftwood logs & pebbles
    if (window.RealisticSand) {
      window.RealisticSand.populateBeachScatter(this.scene, this);
    }
  }

  // Update dynamic ocean waves, wind swaying trees, moving clouds, and coastal sounds
  update(delta, sky) {
    this.waterTime += delta * 1.6;
    this.windTime += delta * 1.8;

    // Realistic ocean multi-harmonic wave shader, caustics, and surf ribbons
    if (this.realisticOcean) {
      this.realisticOcean.update(delta, sky);
    } else if (this.oceanMesh) {
      this.oceanMesh.position.y = this.oceanWaterLevel + Math.sin(this.waterTime * 1.1) * 0.09;
    }

    if (this.pondMesh) {
      this.pondMesh.position.y = this.pondWaterLevel + Math.sin(this.waterTime * 0.8) * 0.03;
    }
    if (this.volcanoPoolMesh) {
      this.volcanoPoolMesh.position.y = this.volcanoWaterLevel + Math.sin(this.waterTime * 1.4) * 0.04;
    }
    if (this.coralLagoonMesh) {
      this.coralLagoonMesh.position.y = this.coralLagoonWaterLevel + Math.sin(this.waterTime * 0.9) * 0.03;
    }
    if (this.flameMesh) {
      this.flameMesh.scale.y = 0.9 + Math.sin(this.waterTime * 12) * 0.25;
    }

    // Dynamic wind swaying through all 240+ trees!
    for (const tree of this.trees) {
      if (Date.now() - tree.lastShaken > 700) {
        const sway = Math.sin(this.windTime + tree.windPhase) * 0.025;
        tree.mesh.rotation.z = sway;
      }
    }

    // Periodic coastal seagull cries during day / dawn
    this.seagullTimer -= delta;
    if (this.seagullTimer <= 0) {
      this.seagullTimer = 9.0 + Math.random() * 14.0;
      if (window.soundSystem && window.game && (window.game.timeOfDay === 'day' || window.game.timeOfDay === 'morning')) {
        window.soundSystem.playSeagull();
      }
    }

    // Dynamic Sand Movement: particle physics, dust settling, tide washing footprints
    if (this.sandPhysics) {
      this.sandPhysics.update(delta, this.waterTime);
    }

    // Ambient 3D Swimming Fish Schools undulation and pathing
    if (this.ambientAquarium) {
      this.ambientAquarium.update(delta);
    }

    // Talking NPCs head tracking, blinking, and gesture animations
    if (this.npcSystem && window.game && window.game.player) {
      this.npcSystem.update(delta, window.game.player.position);
    }

    // Realistic 3D Grass Wind Wave Swaying & Player Trampling
    if (this.grass) {
      const pPos = (window.game && window.game.player) ? window.game.player.position : null;
      this.grass.update(delta, pPos);
    }

    // Beach Sand Crabs Scuttling & AI
    if (this.crabManager) {
      const pPos = (window.game && window.game.player) ? window.game.player.position : null;
      this.crabManager.update(delta, pPos);
    }
  }

  getNearestTree(px, pz, maxDist = 4.0) {
    let nearest = null;
    let minDist = maxDist;

    for (const tree of this.trees) {
      const dist = Math.hypot(tree.x - px, tree.z - pz);
      if (dist < minDist) {
        minDist = dist;
        nearest = tree;
      }
    }
    return nearest;
  }
}

window.Island = Island;
