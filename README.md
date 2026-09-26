# 🏝️ Island Angler - 3D Island Fishing Game

A feature-rich 3D island fishing simulation and adventure built with Three.js and Web Audio API. Explore an island covered in over 120 trees, discover 28 species of fish, upgrade through 8 fishing rods, try 8 types of bait, and become the master angler!

---

## 🎮 How to Play

### Option 1: Quick Launch (Easiest)
1. Double-click **`play.bat`** in this folder.
2. The game will automatically start the local server and open in your default browser at `http://localhost:3000`.

### Option 2: Node.js Terminal
```bash
node server.js
```
or
```bash
npm start
```

### Option 3: Direct Browser Play
Double-click `index.html` to open it directly in Google Chrome, Microsoft Edge, Firefox, or any modern web browser.

---

## 🕹️ Controls Guide

| Action | Control |
| :--- | :--- |
| **Walk / Run** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or Arrow Keys |
| **Sprint** | Hold <kbd>Shift</kbd> |
| **Camera Orbit** | Click & Drag with Left Mouse Button |
| **Camera Zoom** | Scroll Mouse Wheel |
| **Interact / Forage** | Press <kbd>E</kbd> near any tree, campfire, or Captain Barnaby |
| **Cast Line** | Hold & Release <kbd>Space</kbd> or the **CAST ROD** button |
| **Hook Strike** | Press <kbd>Space</kbd> or click the flashing **❗ BITE!** alert |
| **Reel Minigame** | Hold <kbd>Space</kbd> or hold Left-Click on the reel track to lift the green catch bar |

---

## 🌟 Key Features

### 1. 🌲 Over 120 Interactive Trees & Foraging
- **5 Tree Archetypes:**
  - **Coconut Palms:** Lining the tropical beaches. Shaking can drop fresh coconuts, palm beetles, and coins.
  - **Meadow Oaks:** Lush broadleaf trees across the central plains. Drops sweet apples, earthworms, and grubs.
  - **Mountain Pines:** Conifers on the high rocky cliffs. Drops crickets and rare amber resin.
  - **Weeping Willows:** Drooping around the serene freshwater pond. Drops worms, firefly shrimp, and enchanted lilies.
  - **Sacred Cherry Blossoms:** Pink blooming sakura trees on the eastern hill with rare gem drops!
- Walk up to any tree and press <kbd>E</kbd> to shake it!

### 2. 🐟 28 Unique Fish Species
- Divided across **Habitats:**
  - *Ocean Coast / Shallows*
  - *Deep Ocean Pier*
  - *Freshwater Inland Pond*
- Divided across **5 Rarity Tiers:**
  - **Common:** Silver Sardine, Pond Bluegill, Bronze Carp, Reef Clownfish, Atlantic Mackerel, Island Tilapia
  - **Uncommon:** Rainbow Trout, Scarlet Snapper, Largemouth Bass, Black Sea Bass, Starry Flounder, Whiskered Catfish
  - **Rare:** Golden Dorado (Mahi-Mahi), Ocean Swordfish, Imperial Golden Koi, Giant Trevally (GT), Thunderbolt Eel
  - **Epic:** Yellowfin Titan Tuna, Prehistoric Arapaima, Silver Razor Barracuda, Abyssal Anglerfish, Reef Hammerhead Shark
  - **Legendary:** Radiant Pink Axolotl, Ancient Living Fossil Coelacanth, Celestial Moonfish, Sky-Ascending Dragon Carp, Leviathan Prime (Megalodon)
- Tracks personal size records (cm) and weight (kg) with a full **Fish Compendium / Encyclopedia**!

### 3. 🎣 8 Fishing Rods
1. **Willow Twig Rod** (Starter flexible switch)
2. **Bamboo Stalker** (+Cast distance, reliable)
3. **Fiberglass Wave Angler** (Fast snappy reeling)
4. **Carbon Precision Pro** (Aerospace graphite tension resistance)
5. **Abyssal Deep-Sea Heavy** (High tension cap for ocean monsters)
6. **Midas Golden Rod** (Plated in gold, massive luck boost for rare fish)
7. **Starlight Biolume Caster** (Glows at night, widens reel catch bar)
8. **Neptune's Trident Rod** (Endgame sovereign rod of seven seas)

### 4. 🪱 8 Bait Types & Lures
- Garden Earthworm
- Sweet Bread Dough
- Island Tree Grub (Foraged from shaking trees)
- Field Cricket
- Fresh Saltwater Anchovy
- Deep-Sea Squid Tentacle
- Bioluminescent Firefly Shrimp
- Golden Dragonfly Lure (Reusable permanent lure!)

### 5. ⚓ Captain Barnaby's Tackle Shack
- Buy and upgrade rods
- Purchase baits and specialized lures
- Sell your creel of fish and foraged fruits/resins for gold!

### 6. 🌅 Dynamic Day & Night Cycle & Campfire
- Switch between **Dawn**, **Bright Day**, **Golden Sunset**, and **Starry Night** by clicking the Time pill or resting at the campfire.
- Night-exclusive fish (like the Abyssal Anglerfish, Starry Flounder, and Coelacanth) only appear under the moon!

### 7. 🔊 Procedural Web Audio Soundscape
- Synthesized ambient ocean surf, wind, cast swoosh, water splash, nibble ticks, bite chime, reel clicker, and victory fanfares without external audio dependencies.
