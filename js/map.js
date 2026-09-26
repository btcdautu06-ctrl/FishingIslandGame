// Archipelago World Map & NPC Tracker: Nautical Sea Chart, Real-time Player Pin,
// Interactive NPC Location Markers, and 3D HUD Compass Waypoint Navigation

class ArchipelagoMap {
  constructor(game) {
    this.game = game;
    this.canvas = null;
    this.ctx = null;
    this.modal = null;
    this.isOpen = false;
    this.hoveredNPC = null;
    this.trackedNPC = null;
    this.time = 0;

    // Map Projection Settings
    this.mapWidth = 720;
    this.mapHeight = 620;
    this.originX = 360;
    this.originY = 245;
    this.scale = 1.18;

    this.initMapData();
    this.initUI();
  }

  // 1. NPC COORDINATES & MAP PROFILES
  initMapData() {
    this.npcLocations = [
      {
        id: 'barnaby',
        name: 'Captain Barnaby',
        title: 'Master Angler & Shopkeeper',
        island: 'Haven Island',
        avatar: '⚓',
        color: '#f1c40f',
        x: -14,
        z: 24.5,
        role: '🏪 Tackle & Bait Market, Island Ferries, Daily Gift (+40g)'
      },
      {
        id: 'pete',
        name: 'Old Salty Pete',
        title: 'Pier Watchman & Surf Caster',
        island: 'Haven Island',
        avatar: '🎣',
        color: '#f39c12',
        x: -3.5,
        z: 116.5,
        role: '🌊 Pier Surf Casting, Deep Ocean Tips, Free Anchovies'
      },
      {
        id: 'willow',
        name: 'Willow the Botanist',
        title: 'Lily Pond Forager & Botanist',
        island: 'Haven Island',
        avatar: '🌿',
        color: '#2ecc71',
        x: 14,
        z: -3.5,
        role: '🌸 Freshwater Lily Pond, Tree Foraging, Free Crickets & Dough'
      },
      {
        id: 'rowan',
        name: 'Rowan the Campfire Cook',
        title: 'Island Historian & Chef',
        island: 'Haven Island',
        avatar: '🔥',
        color: '#e67e22',
        x: 3.5,
        z: 25.5,
        role: '🌙 Time of Day Lore, Archipelago History, Campfire Rest'
      },
      {
        id: 'finley',
        name: 'Finley the Beachcomber',
        title: 'Seashell Collector & Artisan',
        island: 'Haven Island',
        avatar: '🐚',
        color: '#00cec9',
        x: -46,
        z: 65,
        role: '🏖️ Moving Sand Physics, Driftwood & Seashell Secrets'
      },
      {
        id: 'marina',
        name: 'Marina Corallina',
        title: 'Marine Biologist & Ecologist',
        island: 'Coral Atoll',
        avatar: '🪸',
        color: '#0984e3',
        x: 142,
        z: -16,
        role: '📖 Compendium Progress Evaluation, Reef Symbiosis'
      },
      {
        id: 'coral_diver',
        name: 'Tide-Caller Coral',
        title: 'Reef Free-Diver',
        island: 'Coral Atoll',
        avatar: '🤿',
        color: '#74b9ff',
        x: 168,
        z: -32,
        role: '🤿 Coral Drop-off Currents, Blue Tang & Snapper Hunting'
      },
      {
        id: 'ignis',
        name: 'Ignis the Ashen',
        title: 'Volcanic Hermit & Pyrosmith',
        island: 'Volcanic Crags',
        avatar: '🌋',
        color: '#d63031',
        x: -138,
        z: -52,
        role: '🌋 Geothermal Water Hazards, Smoked Fish, Magma Leviathan'
      },
      {
        id: 'alistair',
        name: 'Elder Alistair',
        title: 'The Titan Master & Slayer',
        island: 'Titan Abyssal Atoll',
        avatar: '⚔️',
        color: '#9b59b6',
        x: 0,
        z: 215,
        role: '👑 Colossal Megalodon & Kraken Mastery, Extreme Line Tension'
      }
    ];

    // Island Geometries for 2D Map Rendering
    this.islandsData = [
      {
        id: 'haven',
        name: 'Haven Main Island',
        x: 0,
        z: 0,
        radius: 76,
        colorSand: '#edd29a',
        colorLand: '#27ae60',
        features: [
          { type: 'pond', x: 14, z: -4, radius: 14, color: '#0984e3' },
          { type: 'pier', startX: 0, startZ: 75, endX: 0, endZ: 117, width: 5 }
        ]
      },
      {
        id: 'coral',
        name: 'Coral Atoll',
        x: 155,
        z: -20,
        radius: 46,
        colorSand: '#fff9e6',
        colorLand: '#2ecc71',
        features: [
          { type: 'lagoon', x: 155, z: -20, radius: 12, color: '#00cec9' }
        ]
      },
      {
        id: 'volcano',
        name: 'Volcanic Crags',
        x: -145,
        z: -60,
        radius: 48,
        colorSand: '#353b48',
        colorLand: '#2d3436',
        features: [
          { type: 'caldera', x: -145, z: -60, radius: 11, color: '#e67e22' }
        ]
      },
      {
        id: 'titan',
        name: 'Titan Abyssal Atoll',
        x: 0,
        z: 215,
        radius: 42,
        colorSand: '#57606f',
        colorLand: '#353b48',
        features: [
          { type: 'spire', x: 0, z: 215, radius: 8, color: '#1e272e' }
        ]
      }
    ];

    // Connecting Suspension Bridges
    this.bridgesData = [
      { from: { x: 74, z: 0 }, to: { x: 115, z: -15 }, label: 'Coral Suspension Bridge' },
      { from: { x: -68, z: -15 }, to: { x: -108, z: -45 }, label: 'Volcanic Suspension Bridge' },
      { from: { x: 0, z: 122 }, to: { x: 0, z: 175 }, label: 'Titan Abyssal Walkway' }
    ];
  }

  // 2. INITIALIZE MODAL & CANVAS UI
  initUI() {
    this.modal = document.getElementById('map-modal');
    this.canvas = document.getElementById('map-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    // Close button
    const closeBtn = document.getElementById('map-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggle(false));
    }

    // Top Bar HUD Button
    const navMapBtn = document.getElementById('nav-map-btn');
    if (navMapBtn) {
      navMapBtn.addEventListener('click', () => this.toggle());
    }

    // Keyboard shortcut [M]
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'KeyM') {
        this.toggle();
      }
    });

    // Canvas Mouse Interaction (Hover tooltips & Click-to-Track)
    if (this.canvas) {
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
      this.canvas.addEventListener('mouseleave', () => {
        this.hoveredNPC = null;
        this.renderMap();
      });
    }

    // Populate Sidebar NPC Directory
    this.renderNPCDirectory();
  }

  // Project World 3D (x, z) to 2D Canvas (px, py)
  toScreen(wx, wz) {
    return {
      x: this.originX + wx * this.scale,
      y: this.originY + wz * this.scale
    };
  }

  toWorld(sx, sy) {
    return {
      x: (sx - this.originX) / this.scale,
      z: (sy - this.originY) / this.scale
    };
  }

  toggle(forceState) {
    this.isOpen = (forceState !== undefined) ? forceState : !this.isOpen;
    if (!this.modal) return;

    if (this.isOpen) {
      this.modal.classList.remove('hidden');
      if (window.soundSystem) window.soundSystem.playRodClick();
      this.renderNPCDirectory();
      this.renderMap();
    } else {
      this.modal.classList.add('hidden');
    }
  }

  // 3. RENDER ARCHIPELAGO SEA CHART ON CANVAS
  renderMap() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.mapWidth, this.mapHeight);

    // 1. Parchment Antique Sea Chart Background
    const bgGrad = ctx.createRadialGradient(this.mapWidth / 2, this.mapHeight / 2, 40, this.mapWidth / 2, this.mapHeight / 2, 420);
    bgGrad.addColorStop(0.0, '#102a45'); // Tropical deep azure sea
    bgGrad.addColorStop(0.7, '#081729');
    bgGrad.addColorStop(1.0, '#040d18');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

    // Latitude & Longitude Navigational Grid
    ctx.strokeStyle = 'rgba(129, 236, 236, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.mapWidth; x += 55) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.mapHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.mapHeight; y += 55) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.mapWidth, y);
      ctx.stroke();
    }

    // 2. Bathymetric Depth Contour Waves
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    this.islandsData.forEach(isl => {
      const pos = this.toScreen(isl.x, isl.z);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (isl.radius + 18) * this.scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (isl.radius + 34) * this.scale, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // 3. Render Suspension Bridges
    this.bridgesData.forEach(br => {
      const p1 = this.toScreen(br.from.x, br.from.z);
      const p2 = this.toScreen(br.to.x, br.to.z);

      ctx.strokeStyle = '#c8ab74';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Planks dash overlay
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 4. Render Islands (Beach sand & Land mass)
    this.islandsData.forEach(isl => {
      const p = this.toScreen(isl.x, isl.z);
      const r = isl.radius * this.scale;

      // Outer Sandy Beach ring
      ctx.fillStyle = isl.colorSand;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inland grassy/rocky center
      ctx.fillStyle = isl.colorLand;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.78, 0, Math.PI * 2);
      ctx.fill();

      // Island Features (Pond, Pier, Lagoon, Caldera)
      isl.features.forEach(f => {
        if (f.type === 'pier') {
          const s = this.toScreen(f.startX, f.startZ);
          const e = this.toScreen(f.endX, f.endZ);
          ctx.strokeStyle = '#8d6e63';
          ctx.lineWidth = f.width * this.scale;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Pier head T-bar
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.moveTo(e.x - 16, e.y);
          ctx.lineTo(e.x + 16, e.y);
          ctx.stroke();
        } else {
          const fp = this.toScreen(f.x, f.z);
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(fp.x, fp.y, f.radius * this.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Island Name Banner
      ctx.fillStyle = 'rgba(15, 25, 40, 0.85)';
      ctx.font = 'bold 12px sans-serif';
      const textWidth = ctx.measureText(isl.name).width;
      ctx.fillRect(p.x - textWidth / 2 - 8, p.y - r - 22, textWidth + 16, 20);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - textWidth / 2 - 8, p.y - r - 22, textWidth + 16, 20);
      ctx.fillStyle = '#ffeaa7';
      ctx.fillText(isl.name, p.x - textWidth / 2, p.y - r - 8);
    });

    // 5. Waypoint Navigation Track Line (if tracking an NPC)
    if (this.trackedNPC && this.game && this.game.player) {
      const playerPos = this.game.player.position;
      const pScreen = this.toScreen(playerPos.x, playerPos.z);
      const npcScreen = this.toScreen(this.trackedNPC.x, this.trackedNPC.z);

      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(pScreen.x, pScreen.y);
      ctx.lineTo(npcScreen.x, npcScreen.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Render NPC Markers
    this.npcLocations.forEach(npc => {
      const p = this.toScreen(npc.x, npc.z);
      const isHovered = (this.hoveredNPC && this.hoveredNPC.id === npc.id);
      const isTracked = (this.trackedNPC && this.trackedNPC.id === npc.id);

      // Outer Glowing Ring
      ctx.fillStyle = isTracked ? 'rgba(241, 196, 15, 0.35)' : (isHovered ? 'rgba(0, 206, 201, 0.45)' : 'rgba(0, 0, 0, 0.4)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, isHovered ? 20 : 16, 0, Math.PI * 2);
      ctx.fill();

      // Pin Circle
      ctx.fillStyle = npc.color || '#f1c40f';
      ctx.beginPath();
      ctx.arc(p.x, p.y, isHovered ? 14 : 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isTracked ? '#ffffff' : '#1e272e';
      ctx.lineWidth = isTracked ? 3 : 2;
      ctx.stroke();

      // Emoji Avatar inside Pin
      ctx.font = isHovered ? '16px sans-serif' : '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(npc.avatar, p.x, p.y + 1);

      // Name label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, p.x, p.y + (isHovered ? 25 : 22));
    });

    // 7. Render Player Position Pin
    if (this.game && this.game.player) {
      const playerPos = this.game.player.position;
      const rot = this.game.player.rotation;
      const pp = this.toScreen(playerPos.x, playerPos.z);

      // Sight direction cone
      ctx.fillStyle = 'rgba(52, 152, 219, 0.28)';
      ctx.beginPath();
      ctx.moveTo(pp.x, pp.y);
      const sightDist = 32;
      ctx.arc(pp.x, pp.y, sightDist, -rot - Math.PI / 2 - 0.45, -rot - Math.PI / 2 + 0.45);
      ctx.closePath();
      ctx.fill();

      // Pulsating Player Dot
      ctx.fillStyle = '#0984e3';
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffeaa7';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📍 YOU', pp.x, pp.y - 12);
    }

    // 8. Compass Rose in Corner
    this.drawCompassRose(ctx, 60, this.mapHeight - 65);

    // 9. Floating Tooltip on Hover
    if (this.hoveredNPC) {
      this.drawNPCTooltip(ctx, this.hoveredNPC);
    }
  }

  // Draw Antique Compass Rose
  drawCompassRose(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = 'rgba(241, 196, 15, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.stroke();

    // North Needle
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(7, -8);
    ctx.lineTo(-7, -8);
    ctx.closePath();
    ctx.fill();

    // South Needle
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(7, 8);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -36);
    ctx.restore();
  }

  // Draw Detailed Floating Tooltip
  drawNPCTooltip(ctx, npc) {
    const p = this.toScreen(npc.x, npc.z);
    const boxW = 240;
    const boxH = 92;
    let bx = p.x + 18;
    let by = p.y - 45;

    if (bx + boxW > this.mapWidth) bx = p.x - boxW - 18;
    if (by + boxH > this.mapHeight) by = this.mapHeight - boxH - 10;
    if (by < 10) by = 10;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    // Header
    ctx.fillStyle = '#ffeaa7';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${npc.avatar} ${npc.name}`, bx + 12, by + 22);

    ctx.fillStyle = '#81ecec';
    ctx.font = '11px sans-serif';
    ctx.fillText(npc.title, bx + 12, by + 38);

    ctx.fillStyle = '#dfe6e9';
    ctx.font = '11px sans-serif';
    ctx.fillText(npc.role, bx + 12, by + 58, boxW - 24);

    // Distance calculation
    if (this.game && this.game.player) {
      const dist = Math.round(Math.hypot(npc.x - this.game.player.position.x, npc.z - this.game.player.position.z));
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`📍 ${dist}m away (Click to track waypoint)`, bx + 12, by + 78);
    }
  }

  // 4. MOUSE HOVER & CLICK HANDLING
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.mapWidth / rect.width);
    const my = (e.clientY - rect.top) * (this.mapHeight / rect.height);

    let found = null;
    for (const npc of this.npcLocations) {
      const p = this.toScreen(npc.x, npc.z);
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d <= 20) {
        found = npc;
        break;
      }
    }

    if (found !== this.hoveredNPC) {
      this.hoveredNPC = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
      this.renderMap();
    }
  }

  handleCanvasClick(e) {
    if (this.hoveredNPC) {
      this.setTrackedNPC(this.hoveredNPC);
    }
  }

  setTrackedNPC(npc) {
    if (this.trackedNPC && this.trackedNPC.id === npc.id) {
      this.trackedNPC = null; // Toggle off
      this.showToast('Cleared waypoint navigation.', 'info');
    } else {
      this.trackedNPC = npc;
      this.showToast(`🧭 Set navigation waypoint to ${npc.name} (${npc.island})!`, 'success');
    }
    this.renderMap();
    this.renderNPCDirectory();
  }

  // 5. SIDEBAR NPC DIRECTORY
  renderNPCDirectory() {
    const listContainer = document.getElementById('map-npc-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    // Group by Island
    const groups = {
      'Haven Island': [],
      'Coral Atoll': [],
      'Volcanic Crags': [],
      'Titan Abyssal Atoll': []
    };

    this.npcLocations.forEach(npc => {
      if (groups[npc.island]) groups[npc.island].push(npc);
    });

    for (const islandName in groups) {
      const groupHeader = document.createElement('div');
      groupHeader.className = 'map-group-header';
      groupHeader.innerText = `🏝️ ${islandName} (${groups[islandName].length})`;
      listContainer.appendChild(groupHeader);

      groups[islandName].forEach(npc => {
        let distStr = '';
        if (this.game && this.game.player) {
          const dist = Math.round(Math.hypot(npc.x - this.game.player.position.x, npc.z - this.game.player.position.z));
          distStr = `${dist}m`;
        }

        const isTracked = (this.trackedNPC && this.trackedNPC.id === npc.id);
        const card = document.createElement('div');
        card.className = `map-npc-item ${isTracked ? 'tracked' : ''}`;

        card.innerHTML = `
          <div class="map-npc-avatar">${npc.avatar}</div>
          <div class="map-npc-info">
            <strong>${npc.name}</strong>
            <span>${npc.title}</span>
            <small>${npc.role}</small>
          </div>
          <div class="map-npc-action">
            <span class="map-dist-tag">${distStr}</span>
            <button class="btn btn-sm ${isTracked ? 'btn-gold' : 'btn-outline'}">
              ${isTracked ? 'Tracking' : 'Track'}
            </button>
          </div>
        `;

        card.addEventListener('click', () => {
          this.setTrackedNPC(npc);
        });

        listContainer.appendChild(card);
      });
    }
  }

  // 6. REAL-TIME 3D HUD WAYPOINT COMPASS BAR
  update(delta) {
    this.time += delta;

    // Repaint map if open so player pin & track lines animate in real-time
    if (this.isOpen) {
      this.renderMap();
    }

    // Update on-screen HUD navigation banner
    const hudWaypoint = document.getElementById('hud-waypoint-bar');
    if (!hudWaypoint) return;

    if (!this.trackedNPC || !this.game || !this.game.player) {
      hudWaypoint.classList.add('hidden');
      return;
    }

    hudWaypoint.classList.remove('hidden');

    const px = this.game.player.position.x;
    const pz = this.game.player.position.z;
    const dist = Math.round(Math.hypot(this.trackedNPC.x - px, this.trackedNPC.z - pz));

    if (dist <= 4) {
      hudWaypoint.innerHTML = `
        <span class="waypoint-arrived">✅ Arrived at ${this.trackedNPC.name}! Press [E] to talk.</span>
      `;
      return;
    }

    // Compute relative compass angle to camera yaw
    const targetAngle = Math.atan2(this.trackedNPC.x - px, this.trackedNPC.z - pz);
    let angleDiff = targetAngle - this.game.player.camYaw;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    let arrow = '⬆️';
    if (angleDiff > 0.4) arrow = '➔';
    else if (angleDiff < -0.4) arrow = '⬅️';
    else if (Math.abs(angleDiff) > 2.2) arrow = '⬇️';

    hudWaypoint.innerHTML = `
      <div class="waypoint-content">
        <span class="waypoint-icon">${this.trackedNPC.avatar}</span>
        <strong>${this.trackedNPC.name}</strong>
        <span class="waypoint-dist">${dist}m</span>
        <span class="waypoint-arrow">${arrow}</span>
        <button id="btn-cancel-waypoint" class="btn-clear-waypoint">&times;</button>
      </div>
    `;

    const cancelBtn = hudWaypoint.querySelector('#btn-cancel-waypoint');
    if (cancelBtn) {
      cancelBtn.onclick = (e) => {
        e.stopPropagation();
        this.trackedNPC = null;
        this.renderMap();
      };
    }
  }

  showToast(text, type = 'info') {
    if (this.game) this.game.showToast(text, type);
  }
}

window.ArchipelagoMap = ArchipelagoMap;
