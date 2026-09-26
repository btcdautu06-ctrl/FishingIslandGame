// Realistic 3D Grass & Flora System for Fishing Island Archipelago
// Features: Multi-blade curved grass clumps, InstancedMesh performance,
// Dynamic wind swaying wave physics, natural color variation, wildflowers, and player trampling physics!

class RealisticGrass {
  constructor(scene, island) {
    this.scene = scene;
    this.island = island;
    this.windTime = 0;
    this.grassMesh = null;
    this.flowerMesh = null;
    this.clumpCount = 2200;
    this.flowerCount = 450;
    
    // Store original transforms for dynamic wind animation & player interaction
    this.clumpData = [];
    this.flowerData = [];

    this.init();
  }

  init() {
    this.createGrassGeometryAndMesh();
    this.createWildflowerMesh();
    this.populateGrassScatter();
  }

  // 1. Procedural 3D Tapered & Curved Grass Blade Clump Geometry
  createGrassClumpGeometry() {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // Clump consisting of 7 distinct curved blades fanning out at natural angles
    const bladeCount = 7;
    let vertexOffset = 0;

    for (let b = 0; b < bladeCount; b++) {
      const baseAngle = (b / bladeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const bladeHeight = 0.55 + Math.random() * 0.30;
      const bladeWidth = 0.055 + Math.random() * 0.025;
      const leanFactor = 0.22 + Math.random() * 0.28;
      const curlDirX = Math.cos(baseAngle);
      const curlDirZ = Math.sin(baseAngle);

      // 4 height segments per blade for smooth natural curvature
      const segments = 4;
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        // Non-linear curvature bend (drooping with gravity)
        const bend = Math.pow(t, 1.8) * leanFactor * bladeHeight;
        const curY = t * bladeHeight;
        const curX = curlDirX * bend;
        const curZ = curlDirZ * bend;

        // Blade tapers to a pointed tip at t = 1.0
        const curWidth = bladeWidth * (1.0 - t * 0.88);

        // Perpendicular vector for blade width
        const perpX = -curlDirZ * curWidth * 0.5;
        const perpZ = curlDirX * curWidth * 0.5;

        // Left vertex
        positions.push(curX - perpX, curY, curZ - perpZ);
        normals.push(0, 1, 0);
        uvs.push(0, t);

        // Right vertex
        positions.push(curX + perpX, curY, curZ + perpZ);
        normals.push(0, 1, 0);
        uvs.push(1, t);
      }

      // Generate quad triangles for this blade
      for (let s = 0; s < segments; s++) {
        const i0 = vertexOffset + s * 2;
        const i1 = vertexOffset + s * 2 + 1;
        const i2 = vertexOffset + (s + 1) * 2;
        const i3 = vertexOffset + (s + 1) * 2 + 1;

        indices.push(i0, i1, i2);
        indices.push(i1, i3, i2);
        // Double-sided faces so blades are visible from every camera angle
        indices.push(i2, i1, i0);
        indices.push(i2, i3, i1);
      }

      vertexOffset += (segments + 1) * 2;
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }

  // 2. Multi-blade Instanced Grass Mesh with Rich Standard Material
  createGrassGeometryAndMesh() {
    const clumpGeo = this.createGrassClumpGeometry();

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide
    });

    this.grassMesh = new THREE.InstancedMesh(clumpGeo, grassMat, this.clumpCount);
    this.grassMesh.receiveShadow = true;
    this.grassMesh.castShadow = true;
    this.grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.grassMesh);
  }

  // 3. Delicate Coastal Wildflowers (Daisies, Golden Buttercups, and Bluebells)
  createWildflowerMesh() {
    const flowerGroupGeo = new THREE.BufferGeometry();
    
    // Stem + Star Petal Cluster
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.45, 4);
    stemGeo.translate(0, 0.225, 0);

    const headGeo = new THREE.CircleGeometry(0.09, 6);
    headGeo.rotateX(-Math.PI / 2);
    headGeo.translate(0, 0.45, 0);

    const centerGeo = new THREE.SphereGeometry(0.035, 5, 5);
    centerGeo.translate(0, 0.46, 0);

    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      side: THREE.DoubleSide
    });

    this.flowerMesh = new THREE.InstancedMesh(headGeo, flowerMat, this.flowerCount);
    this.flowerMesh.receiveShadow = true;
    this.flowerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.flowerMesh);
  }

  // 4. Distribute Grass & Flowers across Archipelago based on Biome & Elevation
  populateGrassScatter() {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    // Natural Color Variations
    const palette = [
      new THREE.Color(0x27ae60), // Lush emerald green
      new THREE.Color(0x2ecc71), // Vibrant spring green
      new THREE.Color(0x7ec850), // Sunny meadow lime
      new THREE.Color(0x1e824c), // Deep forest clover
      new THREE.Color(0x1b5e20), // Dark shade grass
      new THREE.Color(0x99cc33), // Golden sunlit grass
      new THREE.Color(0xb8c068)  // Coastal sandy fescue
    ];

    const flowerPalette = [
      new THREE.Color(0xffffff), // White Daisy
      new THREE.Color(0xfffa65), // Golden Buttercup
      new THREE.Color(0xffcccc), // Coastal Wild Rose
      new THREE.Color(0x70a1ff), // Bluebell
      new THREE.Color(0xffa502)  // Dandelion Gold
    ];

    let placedClumps = 0;
    let attempts = 0;
    const maxAttempts = 12000;

    while (placedClumps < this.clumpCount && attempts < maxAttempts) {
      attempts++;

      // Pick random coordinates across archipelago
      let x = 0;
      let z = 0;
      const zone = Math.random();

      if (zone < 0.72) {
        // Main Haven Island
        const angle = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 68;
        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;
      } else if (zone < 0.88) {
        // Coral Atoll
        const angle = Math.random() * Math.PI * 2;
        const r = 12 + Math.random() * 26;
        x = this.island.coralCenter.x + Math.cos(angle) * r;
        z = this.island.coralCenter.y + Math.sin(angle) * r;
      } else {
        // Volcanic Island alpine meadows
        const angle = Math.random() * Math.PI * 2;
        const r = 12 + Math.random() * 26;
        x = this.island.volcanoCenter.x + Math.cos(angle) * r;
        z = this.island.volcanoCenter.y + Math.sin(angle) * r;
      }

      const y = this.island.getHeight(x, z);

      // Grass thrives in fertile elevations (above beach sand, below barren mountain peaks)
      if (y < 2.0 || y > 7.4) continue;

      // Avoid Freshwater Pond water
      const pDist = Math.hypot(x - this.island.pondCenter.x, z - this.island.pondCenter.y);
      if (pDist < this.island.pondRadius + 0.8) continue;

      // Avoid Main Pier & Village Shop
      if (Math.abs(x) < 4.0 && z > 68 && z < 125) continue;
      if (Math.hypot(x + 14, z - 22) < 9) continue;

      // Avoid Wooden Bridges
      if (this.island.isBridgeSafe(x, z)) continue;

      // Valid fertile location!
      const rotY = Math.random() * Math.PI * 2;
      const scaleBase = 0.75 + Math.random() * 0.55;
      const scaleX = scaleBase * (0.9 + Math.random() * 0.2);
      const scaleY = scaleBase * (0.85 + Math.random() * 0.35);
      const scaleZ = scaleBase * (0.9 + Math.random() * 0.2);

      dummy.position.set(x, y - 0.04, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(scaleX, scaleY, scaleZ);
      dummy.updateMatrix();

      this.grassMesh.setMatrixAt(placedClumps, dummy.matrix);

      // Biome-appropriate color tint
      const colIndex = Math.floor(Math.random() * palette.length);
      color.copy(palette[colIndex]);

      // Sunlit tip adjustment for coastal grass
      if (y < 3.0) {
        color.lerp(new THREE.Color(0xb8c068), 0.35); // Sandy coastal tone
      } else if (pDist < this.island.pondRadius + 4.5) {
        color.lerp(new THREE.Color(0x2ecc71), 0.45); // Lush pond watercress
      }

      this.grassMesh.setColorAt(placedClumps, color);

      this.clumpData.push({
        x, y: y - 0.04, z,
        rotY,
        scaleX, scaleY, scaleZ,
        phase: Math.random() * Math.PI * 2,
        swayFreq: 1.8 + Math.random() * 0.8
      });

      placedClumps++;
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;
    if (this.grassMesh.instanceColor) this.grassMesh.instanceColor.needsUpdate = true;

    // Distribute Wildflowers at select clump locations
    let placedFlowers = 0;
    for (let i = 0; i < this.clumpData.length && placedFlowers < this.flowerCount; i += 4) {
      const c = this.clumpData[i];
      dummy.position.set(c.x + (Math.random() - 0.5) * 0.4, c.y + 0.15, c.z + (Math.random() - 0.5) * 0.4);
      dummy.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.2);
      dummy.scale.setScalar(0.7 + Math.random() * 0.5);
      dummy.updateMatrix();

      this.flowerMesh.setMatrixAt(placedFlowers, dummy.matrix);

      const fCol = flowerPalette[Math.floor(Math.random() * flowerPalette.length)];
      this.flowerMesh.setColorAt(placedFlowers, fCol);

      this.flowerData.push({
        x: dummy.position.x,
        y: dummy.position.y,
        z: dummy.position.z,
        rotY: dummy.rotation.y,
        scale: dummy.scale.x,
        phase: c.phase
      });

      placedFlowers++;
    }

    this.flowerMesh.instanceMatrix.needsUpdate = true;
    if (this.flowerMesh.instanceColor) this.flowerMesh.instanceColor.needsUpdate = true;
  }

  // 5. Dynamic Wind Sway Physics & Player Interaction Loop
  update(delta, playerPos) {
    if (!this.grassMesh || this.clumpData.length === 0) return;

    this.windTime += delta;
    const dummy = new THREE.Object3D();

    const px = playerPos ? playerPos.x : 0;
    const pz = playerPos ? playerPos.z : 0;

    // Update grass clumps with dynamic traveling wind wave + player proximity bend
    // To maintain 60 FPS, update in alternating spatial batches or smooth wave sampling
    const count = this.clumpData.length;
    for (let i = 0; i < count; i++) {
      const c = this.clumpData[i];

      // Traveling multi-octave wind wave
      const waveX = Math.sin(this.windTime * 2.2 + c.x * 0.14 + c.z * 0.10 + c.phase) * 0.18;
      const waveZ = Math.cos(this.windTime * 1.9 + c.x * 0.10 + c.z * 0.14) * 0.12;
      const gust = Math.sin(this.windTime * 4.2 + c.x * 0.25) * 0.06;

      let bendX = waveX + gust;
      let bendZ = waveZ;

      // Player proximity trampling / parting
      if (playerPos) {
        const dx = c.x - px;
        const dz = c.z - pz;
        const dist = Math.hypot(dx, dz);
        if (dist < 1.35) {
          const push = (1.35 - dist) / 1.35;
          bendX += (dx / (dist + 0.001)) * push * 0.75;
          bendZ += (dz / (dist + 0.001)) * push * 0.75;
        }
      }

      dummy.position.set(c.x, c.y, c.z);
      dummy.rotation.set(bendZ, c.rotY, -bendX);
      dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
      dummy.updateMatrix();

      this.grassMesh.setMatrixAt(i, dummy.matrix);
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;

    // Sway wildflowers gently with the wind
    if (this.flowerMesh && this.flowerData.length > 0) {
      for (let i = 0; i < this.flowerData.length; i++) {
        const f = this.flowerData[i];
        const sway = Math.sin(this.windTime * 2.0 + f.x * 0.15 + f.phase) * 0.16;

        dummy.position.set(f.x, f.y, f.z);
        dummy.rotation.set(sway * 0.5, f.rotY, sway);
        dummy.scale.setScalar(f.scale);
        dummy.updateMatrix();

        this.flowerMesh.setMatrixAt(i, dummy.matrix);
      }
      this.flowerMesh.instanceMatrix.needsUpdate = true;
    }
  }
}

window.RealisticGrass = RealisticGrass;
