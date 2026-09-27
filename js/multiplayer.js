// ========================================================
// MULTIPLAYER NETWORKING & REMOTE PLAYERS MANAGER
// Supports: WebSocket (Node server) + WebRTC (PeerJS Cloud) + BroadcastChannel (Local Tabs)
// ========================================================

class RemotePlayer {
  constructor(id, data, scene) {
    this.id = id;
    this.name = data.name || 'Angler';
    this.skinId = data.skinId || 'skin_classic';
    this.rodId = data.rodId || 'rod_willow';
    this.scene = scene;

    this.position = new THREE.Vector3(data.x || 0, data.y || 1.4, data.z || 80);
    this.targetPosition = this.position.clone();
    this.rotationY = data.rotY || 0;
    this.targetRotationY = this.rotationY;

    this.isMoving = false;
    this.walkCycle = 0;
    this.fishingState = 'idle'; // 'idle', 'charging', 'cast', 'hooked', 'reeling'
    this.bobberPos = null;

    this.chatBubbleTimer = 0;
    this.chatText = '';

    this.createMesh();
    this.createNametag();
    this.createFishingLine();
  }

  createMesh() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    const skinDef = (window.GAME_DATA && window.GAME_DATA.skins)
      ? (window.GAME_DATA.skins.find(s => s.id === this.skinId) || window.GAME_DATA.skins[0])
      : { colors: { jacket: 0x1a365d, pants: 0x2d3748, cap: 0xc53030, skin: 0xdeb887, boots: 0x4a2e1b, vest: 0x2e5a36, shirt: 0xe2e8f0 } };

    const c = skinDef.colors;

    // Materials
    this.materials = {
      skin: new THREE.MeshStandardMaterial({ color: c.skin || 0xdeb887, roughness: 0.65 }),
      jacket: new THREE.MeshStandardMaterial({ color: c.jacket || 0x1a365d, roughness: 0.78 }),
      vest: new THREE.MeshStandardMaterial({ color: c.vest || 0x2e5a36, roughness: 0.82 }),
      pants: new THREE.MeshStandardMaterial({ color: c.pants || 0x2d3748, roughness: 0.85 }),
      boots: new THREE.MeshStandardMaterial({ color: c.boots || 0x4a2e1b, roughness: 0.55 }),
      cap: new THREE.MeshStandardMaterial({ color: c.cap || 0xc53030, roughness: 0.75 }),
      gold: new THREE.MeshStandardMaterial({ color: c.brass || 0xf1c40f, roughness: 0.3, metalness: 0.8 })
    };

    // Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.05;
    this.mesh.add(this.pelvis);

    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.33, 0.32, 10), this.materials.pants);
    this.pelvis.add(pelvisMesh);

    // Spine & Chest
    this.spine = new THREE.Group();
    this.spine.position.y = 0.16;
    this.pelvis.add(this.spine);

    this.chest = new THREE.Group();
    this.chest.position.y = 0.38;
    this.spine.add(this.chest);

    const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.35, 0.74, 10), this.materials.jacket);
    this.chest.add(chestMesh);

    const vestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.37, 0.66, 10), this.materials.vest);
    vestMesh.position.y = -0.02;
    this.chest.add(vestMesh);

    // Head & Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.22, 8), this.materials.skin);
    neck.position.y = 0.46;
    this.chest.add(neck);

    this.head = new THREE.Group();
    this.head.position.y = 0.65;
    this.chest.add(this.head);

    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), this.materials.skin);
    cranium.scale.set(0.92, 1.05, 0.98);
    this.head.add(cranium);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    [-0.08, 0.08].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), eyeMat);
      eye.position.set(x, 0.05, 0.22);
      this.head.add(eye);
    });

    // Hat / Headgear by Skin
    this.headgear = new THREE.Group();
    this.head.add(this.headgear);
    this.buildHeadgear(this.skinId);

    // Left Arm
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.48, 0.28, 0);
    this.chest.add(this.leftShoulder);
    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.38, 8), this.materials.jacket);
    lUpperArm.position.y = -0.19;
    this.leftShoulder.add(lUpperArm);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.y = -0.38;
    this.leftShoulder.add(this.leftElbow);
    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.36, 8), this.materials.skin);
    lForearm.position.y = -0.18;
    this.leftElbow.add(lForearm);

    // Right Arm (Holds Fishing Rod)
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.48, 0.28, 0);
    this.chest.add(this.rightShoulder);
    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.38, 8), this.materials.jacket);
    rUpperArm.position.y = -0.19;
    this.rightShoulder.add(rUpperArm);

    this.rightElbow = new THREE.Group();
    this.rightElbow.position.y = -0.38;
    this.rightShoulder.add(this.rightElbow);
    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.36, 8), this.materials.skin);
    rForearm.position.y = -0.18;
    this.rightElbow.add(rForearm);

    this.rightHand = new THREE.Group();
    this.rightHand.position.y = -0.36;
    this.rightElbow.add(this.rightHand);

    // Fishing Rod in hand
    this.rodMount = new THREE.Group();
    this.rightHand.add(this.rodMount);
    this.buildRod(this.rodId);

    // Left Leg
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.20, -0.16, 0);
    this.pelvis.add(this.leftHip);
    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.52, 8), this.materials.pants);
    lThigh.position.y = -0.26;
    this.leftHip.add(lThigh);

    this.leftKnee = new THREE.Group();
    this.leftKnee.position.set(0, -0.52, 0);
    this.leftHip.add(this.leftKnee);
    const lShin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.50, 8), this.materials.pants);
    lShin.position.y = -0.25;
    this.leftKnee.add(lShin);

    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.34), this.materials.boots);
    lBoot.position.set(0, -0.45, 0.06);
    this.leftKnee.add(lBoot);

    // Right Leg
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.20, -0.16, 0);
    this.pelvis.add(this.rightHip);
    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.52, 8), this.materials.pants);
    rThigh.position.y = -0.26;
    this.rightHip.add(rThigh);

    this.rightKnee = new THREE.Group();
    this.rightKnee.position.set(0, -0.52, 0);
    this.rightHip.add(this.rightKnee);
    const rShin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.50, 8), this.materials.pants);
    rShin.position.y = -0.25;
    this.rightKnee.add(rShin);

    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.34), this.materials.boots);
    rBoot.position.set(0, -0.45, 0.06);
    this.rightKnee.add(rBoot);

    this.scene.add(this.mesh);
  }

  buildHeadgear(skinId) {
    while (this.headgear.children.length > 0) {
      this.headgear.remove(this.headgear.children[0]);
    }

    if (skinId === 'skin_pirate') {
      const tricornMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.16, 10), tricornMat);
      crown.position.set(0, 0.18, 0);
      this.headgear.add(crown);

      const brimL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.44), tricornMat);
      brimL.position.set(-0.24, 0.22, 0);
      brimL.rotation.z = -0.32;
      this.headgear.add(brimL);

      const brimR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.44), tricornMat);
      brimR.position.set(0.24, 0.22, 0);
      brimR.rotation.z = 0.32;
      this.headgear.add(brimR);

      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), this.materials.gold);
      skull.position.set(0, 0.20, 0.24);
      this.headgear.add(skull);

      const patch = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.02), new THREE.MeshBasicMaterial({ color: 0x111827 }));
      patch.position.set(-0.088, 0.055, 0.235);
      this.headgear.add(patch);
    } else if (skinId === 'skin_diver') {
      const domeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.8 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.30, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.5), domeMat);
      dome.position.set(0, 0.10, 0);
      this.headgear.add(dome);

      const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.024, 6, 14), this.materials.gold);
      bezel.position.set(0, 0.06, 0.25);
      this.headgear.add(bezel);

      const visor = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), glassMat);
      visor.position.set(0, 0.06, 0.26);
      this.headgear.add(visor);
    } else if (skinId === 'skin_tropical') {
      const strawMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });
      const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.16, 14), strawMat);
      hatCrown.position.set(0, 0.18, 0);
      this.headgear.add(hatCrown);

      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.02, 16), strawMat);
      hatBrim.position.set(0, 0.10, 0);
      this.headgear.add(hatBrim);
    } else if (skinId === 'skin_ninja') {
      const cowlMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 });
      const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.6), cowlMat);
      cowl.position.set(0, 0.12, 0);
      this.headgear.add(cowl);

      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.055, 0.02), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 }));
      plate.position.set(0, 0.14, 0.245);
      this.headgear.add(plate);

      const veil = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.16, 10, 1, false, -Math.PI / 2, Math.PI), cowlMat);
      veil.position.set(0, -0.02, 0.12);
      this.headgear.add(veil);
    } else {
      // Classic Cap
      const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.7), this.materials.cap);
      capCrown.position.set(0, 0.15, -0.01);
      this.headgear.add(capCrown);

      const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.022, 0.22), this.materials.cap);
      capVisor.position.set(0, 0.14, 0.22);
      capVisor.rotation.x = -0.16;
      this.headgear.add(capVisor);
    }
  }

  buildRod(rodId) {
    while (this.rodMount.children.length > 0) {
      this.rodMount.remove(this.rodMount.children[0]);
    }
    const rodMat = new THREE.MeshStandardMaterial({ color: 0xb58900, roughness: 0.5 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.035, 3.2, 8), rodMat);
    pole.position.set(0, 1.4, 0.3);
    pole.rotation.x = 0.45;
    this.rodMount.add(pole);

    this.rodTip = new THREE.Group();
    this.rodTip.position.set(0, 2.8, 1.0);
    this.rodMount.add(this.rodTip);
  }

  createNametag() {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    this.nametagCanvas = canvas;
    this.nametagCtx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });

    this.nametagSprite = new THREE.Sprite(spriteMat);
    this.nametagSprite.position.set(0, 2.7, 0);
    this.nametagSprite.scale.set(2.4, 0.6, 1);
    this.mesh.add(this.nametagSprite);

    this.renderNametag();
  }

  renderNametag() {
    if (!this.nametagCtx) return;
    const ctx = this.nametagCtx;
    ctx.clearRect(0, 0, 384, 96);

    // Rounded background pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 12, 368, 72, 36);
    ctx.fill();
    ctx.stroke();

    // Name text
    const skinDef = (window.GAME_DATA && window.GAME_DATA.skins)
      ? (window.GAME_DATA.skins.find(s => s.id === this.skinId) || window.GAME_DATA.skins[0])
      : { icon: '🧢' };

    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${skinDef.icon || '🎣'} ${this.name}`, 192, 48);

    if (this.nametagSprite && this.nametagSprite.material.map) {
      this.nametagSprite.material.map.needsUpdate = true;
    }
  }

  createFishingLine() {
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    this.lineMesh = new THREE.Line(geo, lineMat);
    this.lineMesh.visible = false;
    this.scene.add(this.lineMesh);

    // Remote Bobber mesh
    const bobberGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const bobberMat = new THREE.MeshStandardMaterial({ color: 0xff3838, roughness: 0.3 });
    this.bobberMesh = new THREE.Mesh(bobberGeo, bobberMat);
    this.bobberMesh.visible = false;
    this.scene.add(this.bobberMesh);
  }

  updateData(data) {
    if (data.x !== undefined && data.y !== undefined && data.z !== undefined) {
      this.targetPosition.set(data.x, data.y, data.z);
    }
    if (data.rotY !== undefined) {
      this.targetRotationY = data.rotY;
    }
    if (data.isMoving !== undefined) {
      this.isMoving = data.isMoving;
    }
    if (data.walkCycle !== undefined) {
      this.walkCycle = data.walkCycle;
    }
    if (data.skinId && data.skinId !== this.skinId) {
      this.skinId = data.skinId;
      this.buildHeadgear(this.skinId);
      this.renderNametag();
    }
    if (data.name && data.name !== this.name) {
      this.name = data.name;
      this.renderNametag();
    }
    if (data.fishingState) {
      this.fishingState = data.fishingState;
    }
    if (data.bobberPos) {
      this.bobberPos = new THREE.Vector3(data.bobberPos.x, data.bobberPos.y, data.bobberPos.z);
    } else {
      this.bobberPos = null;
    }
  }

  showChat(text) {
    this.chatText = text;
    this.chatBubbleTimer = 4.5; // Display for 4.5 seconds

    // Render speech bubble onto nametag
    if (this.nametagCtx) {
      const ctx = this.nametagCtx;
      ctx.clearRect(0, 0, 384, 96);

      ctx.fillStyle = 'rgba(255, 234, 167, 0.95)';
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, 368, 80, 24);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#1e272e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`💬 "${text}"`, 192, 48);

      if (this.nametagSprite && this.nametagSprite.material.map) {
        this.nametagSprite.material.map.needsUpdate = true;
      }
    }
  }

  update(delta) {
    // Smooth Lerp Position & Slerp Rotation
    this.mesh.position.lerp(this.targetPosition, 0.25);

    // Smooth angle interpolation handling 2*PI wrap
    let diff = this.targetRotationY - this.mesh.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.mesh.rotation.y += diff * 0.28;

    // Walk Animation
    if (this.isMoving) {
      const swing = Math.sin(this.walkCycle);
      this.leftHip.rotation.x = swing * 0.55;
      this.rightHip.rotation.x = -swing * 0.55;
      this.leftKnee.rotation.x = Math.max(0, -swing * 0.7);
      this.rightKnee.rotation.x = Math.max(0, swing * 0.7);

      this.leftShoulder.rotation.x = -swing * 0.45;
      if (this.fishingState === 'idle') {
        this.rightShoulder.rotation.x = swing * 0.35;
      }
    } else {
      this.leftHip.rotation.x *= 0.85;
      this.rightHip.rotation.x *= 0.85;
      this.leftKnee.rotation.x *= 0.85;
      this.rightKnee.rotation.x *= 0.85;
      this.leftShoulder.rotation.x *= 0.85;
    }

    // Fishing Animation & Line Rendering
    if (this.fishingState !== 'idle' && this.bobberPos) {
      this.rightShoulder.rotation.x = -1.1; // Raise rod high
      this.rightShoulder.rotation.z = -0.2;

      this.bobberMesh.position.copy(this.bobberPos);
      this.bobberMesh.visible = true;

      const tipWorld = new THREE.Vector3();
      this.rodTip.getWorldPosition(tipWorld);

      const positions = this.lineMesh.geometry.attributes.position.array;
      positions[0] = tipWorld.x;
      positions[1] = tipWorld.y;
      positions[2] = tipWorld.z;
      positions[3] = this.bobberPos.x;
      positions[4] = this.bobberPos.y;
      positions[5] = this.bobberPos.z;
      this.lineMesh.geometry.attributes.position.needsUpdate = true;
      this.lineMesh.visible = true;
    } else {
      if (this.fishingState === 'idle') {
        this.rightShoulder.rotation.x *= 0.88;
        this.rightShoulder.rotation.z *= 0.88;
      }
      this.lineMesh.visible = false;
      this.bobberMesh.visible = false;
    }

    // Chat bubble countdown timer
    if (this.chatBubbleTimer > 0) {
      this.chatBubbleTimer -= delta;
      if (this.chatBubbleTimer <= 0) {
        this.chatText = '';
        this.renderNametag();
      }
    }
  }

  destroy() {
    if (this.mesh && this.mesh.parent) this.mesh.parent.remove(this.mesh);
    if (this.lineMesh && this.lineMesh.parent) this.lineMesh.parent.remove(this.lineMesh);
    if (this.bobberMesh && this.bobberMesh.parent) this.bobberMesh.parent.remove(this.bobberMesh);
  }
}

// ========================================================
// MULTIPLAYER MASTER CONTROLLER
// ========================================================
class MultiplayerManager {
  constructor(game) {
    this.game = game;
    this.mode = 'single'; // 'single' or 'multiplayer'
    this.localId = 'p_' + Math.random().toString(36).substr(2, 9);
    this.playerName = localStorage.getItem('fishing_island_player_name') || ('Angler_' + Math.floor(Math.random() * 900 + 100));
    this.activeSkinId = localStorage.getItem('fishing_island_selected_skin') || 'skin_classic';

    this.remotePlayers = new Map();
    this.broadcastTimer = 0;
    this.broadcastRate = 0.06; // 16 updates per second for smooth network replication

    this.ws = null;
    this.peer = null;
    this.peerConns = new Map();
    this.broadcastChannel = null;

    this.initBroadcastChannel();
  }

  initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('fishing_island_mp');
        this.broadcastChannel.onmessage = (event) => {
          if (this.mode !== 'multiplayer') return;
          this.handlePacket(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported');
    }
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'multiplayer') {
      this.connect();
    } else {
      this.disconnect();
    }
  }

  connect() {
    this.mode = 'multiplayer';

    // 1. Try local or hosted WebSocket server
    this.connectWebSocket();

    // 2. Also initialize WebRTC PeerJS for cross-device/GitHub Pages multiplayer
    this.connectPeerJS();

    this.updateHUDMultiplayer();
    if (this.game) {
      this.game.showToast(`🌐 Joined Multiplayer World as "${this.playerName}"!`, 'success');
    }
  }

  connectWebSocket() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
      const wsUrl = (window.location.protocol.startsWith('http'))
        ? `${protocol}//${window.location.host}/ws`
        : 'ws://localhost:3000/ws';

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Connected to WebSocket multiplayer server');
        this.broadcastLocalState();
        this.updateHUDMultiplayer();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlePacket(data);
        } catch (e) {}
      };

      this.ws.onerror = () => {
        console.log('ℹ️ WebSocket unavailable, using PeerJS & BroadcastChannel fallback.');
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected.');
      };
    } catch (err) {
      console.log('WebSocket connection error:', err);
    }
  }

  connectPeerJS() {
    if (typeof Peer === 'undefined') return;
    if (this.peer && !this.peer.destroyed) return;

    try {
      this.peer = new Peer(this.localId, {
        debug: 0
      });

      this.peer.on('open', (id) => {
        console.log('✅ PeerJS Ready with Peer ID:', id);
        // Connect to global discovery mesh lobby
        this.discoverPeers();
      });

      this.peer.on('connection', (conn) => {
        this.setupPeerConn(conn);
      });

      this.peer.on('error', (err) => {
        console.log('PeerJS note:', err.type);
      });
    } catch (e) {
      console.warn('PeerJS init failed:', e);
    }
  }

  discoverPeers() {
    // Connect to known common peer room host id
    const commonRoomId = 'island_angler_lobby_host';
    if (this.localId === commonRoomId || !this.peer) return;

    const hostConn = this.peer.connect(commonRoomId, { reliable: false });
    this.setupPeerConn(hostConn);
  }

  setupPeerConn(conn) {
    if (!conn) return;
    this.peerConns.set(conn.peer, conn);

    conn.on('data', (data) => {
      if (this.mode !== 'multiplayer') return;
      this.handlePacket(data);
    });

    conn.on('close', () => {
      this.peerConns.delete(conn.peer);
      this.removeRemotePlayer(conn.peer);
    });

    conn.on('open', () => {
      this.broadcastLocalState();
    });
  }

  disconnect() {
    this.broadcastPacket({
      type: 'leave',
      id: this.localId
    });

    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }

    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }

    this.peerConns.clear();

    // Clean up all remote player avatars
    for (const [id, remote] of this.remotePlayers.entries()) {
      remote.destroy();
    }
    this.remotePlayers.clear();

    this.updateHUDMultiplayer();
  }

  broadcastPacket(packet) {
    packet.senderId = this.localId;

    // 1. Send via WebSocket if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try { this.ws.send(JSON.stringify(packet)); } catch (e) {}
    }

    // 2. Send via WebRTC DataChannels to connected peers
    for (const conn of this.peerConns.values()) {
      if (conn.open) {
        try { conn.send(packet); } catch (e) {}
      }
    }

    // 3. Send via BroadcastChannel to other local browser tabs
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(packet); } catch (e) {}
    }
  }

  broadcastLocalState() {
    if (this.mode !== 'multiplayer' || !this.game || !this.game.player) return;

    const p = this.game.player;
    const fishing = this.game.fishing;

    let fishingState = 'idle';
    let bobberPos = null;

    if (fishing) {
      if (fishing.state === 'casting') fishingState = 'charging';
      else if (fishing.state === 'reeling') fishingState = 'reeling';
      else if (fishing.state === 'bite' || fishing.state === 'minigame') fishingState = 'hooked';
      else if (fishing.state === 'waiting') fishingState = 'cast';

      if (fishing.bobber && fishing.bobber.mesh && fishing.state !== 'idle') {
        bobberPos = {
          x: Math.round(fishing.bobber.mesh.position.x * 100) / 100,
          y: Math.round(fishing.bobber.mesh.position.y * 100) / 100,
          z: Math.round(fishing.bobber.mesh.position.z * 100) / 100
        };
      }
    }

    const statePacket = {
      type: 'state',
      id: this.localId,
      name: this.playerName,
      skinId: p.activeSkinId || this.activeSkinId,
      rodId: p.activeRodId || 'rod_willow',
      x: Math.round(p.position.x * 100) / 100,
      y: Math.round(p.position.y * 100) / 100,
      z: Math.round(p.position.z * 100) / 100,
      rotY: Math.round(p.rotation * 100) / 100,
      isMoving: p.isMoving,
      walkCycle: Math.round(p.walkCycle * 100) / 100,
      fishingState: fishingState,
      bobberPos: bobberPos
    };

    this.broadcastPacket(statePacket);
  }

  broadcastCatch(fishData) {
    if (this.mode !== 'multiplayer') return;
    this.broadcastPacket({
      type: 'catch',
      id: this.localId,
      name: this.playerName,
      fishName: fishData.name,
      sizeCm: fishData.sizeCm,
      gold: fishData.gold,
      rarity: fishData.rarity
    });
  }

  broadcastChat(message) {
    if (this.mode !== 'multiplayer') return;
    this.broadcastPacket({
      type: 'chat',
      id: this.localId,
      name: this.playerName,
      text: message
    });

    if (this.game && this.game.showToast) {
      this.game.showToast(`💬 You: "${message}"`, 'info');
    }
  }

  handlePacket(packet) {
    if (!packet || packet.id === this.localId) return;

    if (packet.type === 'state') {
      let remote = this.remotePlayers.get(packet.id);
      if (!remote) {
        remote = new RemotePlayer(packet.id, packet, this.game.scene);
        this.remotePlayers.set(packet.id, remote);
        this.updateHUDMultiplayer();
        if (this.game && this.game.showToast) {
          this.game.showToast(`👋 ${packet.name} arrived on the island!`, 'info');
        }
      }
      remote.updateData(packet);
    } else if (packet.type === 'leave') {
      this.removeRemotePlayer(packet.id);
    } else if (packet.type === 'catch') {
      if (this.game && this.game.showToast) {
        this.game.showToast(`🎣 ${packet.name} reeled in a ${packet.sizeCm}cm ${packet.fishName}! (+${packet.gold}g)`, 'gold');
      }
    } else if (packet.type === 'chat') {
      const remote = this.remotePlayers.get(packet.id);
      if (remote) {
        remote.showChat(packet.text);
      }
      if (this.game && this.game.showToast) {
        this.game.showToast(`💬 ${packet.name}: "${packet.text}"`, 'info');
      }
    } else if (packet.type === 'player_count') {
      this.updateHUDMultiplayer(packet.count);
    }
  }

  removeRemotePlayer(id) {
    const remote = this.remotePlayers.get(id);
    if (remote) {
      if (this.game && this.game.showToast) {
        this.game.showToast(`⛵ ${remote.name} sailed away.`, 'info');
      }
      remote.destroy();
      this.remotePlayers.delete(id);
      this.updateHUDMultiplayer();
    }
  }

  update(delta) {
    if (this.mode !== 'multiplayer') return;

    // Broadcast local state at high fidelity
    this.broadcastTimer += delta;
    if (this.broadcastTimer >= this.broadcastRate) {
      this.broadcastTimer = 0;
      this.broadcastLocalState();
    }

    // Update all remote player animations and interpolations
    for (const remote of this.remotePlayers.values()) {
      remote.update(delta);
    }
  }

  updateHUDMultiplayer(serverCount) {
    const badge = document.getElementById('hud-multiplayer-badge');
    const textElem = document.getElementById('hud-multiplayer-count');
    if (!badge || !textElem) return;

    if (this.mode === 'multiplayer') {
      const total = (serverCount !== undefined) ? serverCount : (this.remotePlayers.size + 1);
      badge.classList.remove('hidden');
      badge.className = 'hud-pill pill-multiplayer online';
      textElem.innerText = `🌐 Online: ${total} Angler${total > 1 ? 's' : ''}`;
    } else {
      badge.classList.remove('hidden');
      badge.className = 'hud-pill pill-multiplayer solo';
      textElem.innerText = `🏕️ Solo Mode`;
    }
  }
}
