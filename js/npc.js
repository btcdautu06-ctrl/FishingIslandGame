// Talking NPCs System: Spoken Dialogue, Typewriter Text, Voice Synthesis,
// 3D Animated Character Rigs, and Dynamic Archipelago NPC Interaction
// Featuring 9 Full Talking NPCs distributed all around the islands!

class NPCSystem {
  constructor(scene, island) {
    this.scene = scene;
    this.island = island;
    this.npcs = {};
    this.activeDialogue = null;
    this.isTyping = false;
    this.typewriterInterval = null;
    this.speechUtterance = null;
    this.talkingNPC = null;
    this.talkAnimTimer = 0;

    this.initNPCData();
    this.initUI();
  }

  // 1. NPC DEFINITIONS & EXTENSIVE DIALOGUE TREES
  initNPCData() {
    this.npcData = {
      // --- HAVEN MAIN ISLAND NPCS ---
      barnaby: {
        id: 'barnaby',
        name: 'Captain Barnaby',
        title: 'Master Angler & Island Ferryman',
        avatar: '⚓',
        voice: 'barnaby',
        speechPitch: 0.78,
        speechRate: 0.95,
        locationName: 'Haven Island Tackle Shop',
        dialogue: {
          greeting: (game) => {
            const timeStr = game ? game.timeOfDay : 'day';
            const greetings = {
              morning: "Top o' the mornin' to ye, angler! The dawn mist is liftin' off the surf, and the fish are hungry. What can ol' Barnaby do for ye?",
              day: "Ahoy there, matey! Fine sunny weather for casting a line. Salt in the air, gold in your pocket—what brings ye to Barnaby's counter?",
              dusk: "Evening to ye, sailor. Sun's dippin' low into the crimson waves. Big predators wake up when dusk falls. Looking for bait, or just swapping sea tales?",
              night: "Aha, a midnight angler! The ocean's deep and full of terrors under the moon. Best keep your wits sharp and your line tighter!"
            };
            return greetings[timeStr] || greetings.day;
          },
          options: [
            {
              label: "🎣 Where are the fish biting right now?",
              response: (game) => {
                const time = game ? game.timeOfDay : 'day';
                if (time === 'morning') {
                  return "Mornings are golden off the Haven Pier! Silver Sardines and Tiger Mackerel are surface-feeding in schools. If you prefer calm water, the freshwater pond has frisky Bluegills near the willow trees. Earthworms and Dough are your best bet!";
                } else if (time === 'day') {
                  return "Bright midday sun drives fish into deeper water or under shade! Try casting between the floating lily pads in Haven Pond for heavy Bronze Mirror Carp, or head east over the suspension bridge to Coral Atoll for tropical Clownfish and Reef Snappers!";
                } else if (time === 'dusk') {
                  return "Dusk is the witching hour, angler! Predatory Peacock Bass and Giant Trevally patrol the outer sandbanks as the daylight fades. Throw Anchovy or Cricket bait—they strike hard and fast!";
                } else {
                  return "Night-time belongs to the deep abyssal hunters! Bioluminescent Lanternfish, Phantom Eels, and deep sharks rise toward the surface. If you dare cross to Titan Spire, you might even hook a prehistoric monster!";
                }
              }
            },
            {
              label: "🦈 Tell me about the Legendary Colossal Monsters!",
              response: () => {
                return "Aye... forty-two years on these waters, and I still get chills! Beyond the southern suspension bridge lies the Titan Abyssal Trench. Legends speak of the Great Titan Megalodon—longer than three fishing skiffs, with teeth like broadswords! In the boiling caldera of Volcanic Crags, they whisper of a Magma Leviathan that melts ordinary line. You'll need the Titan Carbon Rod and specialized Squid or Anchovy bait if you want to stand a chance!";
              }
            },
            {
              label: "🏪 Open Tackle Shop & Equipment Wares",
              action: (game) => {
                if (game) game.openShopModal('rods');
              }
            },
            {
              label: "⛵ Archipelago Ferry Charters (Travel Now)",
              action: (game) => {
                if (game) game.openShopModal('islands');
              }
            },
            {
              label: "🎁 Do you have any spare sailor supplies?",
              response: (game) => {
                const key = 'barnaby_daily_gift';
                const today = new Date().toDateString();
                const lastGift = localStorage.getItem(key);

                if (lastGift === today) {
                  return "I already tossed you some rations today, matey! Save some for the other sailors, har har! Check back tomorrow for more supplies.";
                } else {
                  localStorage.setItem(key, today);
                  if (game) {
                    game.addGold(40);
                    const wormBait = window.GAME_DATA.baits.find(b => b.id === 'worm');
                    if (wormBait) wormBait.count += 5;
                    game.updateHUD();
                    game.showToast("🎁 Barnaby gave you +40 Gold & 5x Earthworms!", "success");
                    if (window.soundSystem) window.soundSystem.playFanfare('rare');
                  }
                  return "Aye, a true fisherman never turns away an eager apprentice! Here's 40 shiny Gold coins and five fat garden earthworms I dug up behind the shack. Go hook yourself a record breaker!";
                }
              }
            },
            {
              label: "👋 Fair winds, Captain. See you on the water.",
              response: () => {
                return "May Neptune keep your line tight and your boots dry, lad! Remember: stay out of the water, that riptide will drag ye down in a heartbeat!";
              },
              isExit: true
            }
          ]
        }
      },

      pete: {
        id: 'pete',
        name: 'Old Salty Pete',
        title: 'Veteran Pier Watchman & Surf Caster',
        avatar: '🎣',
        voice: 'pete',
        speechPitch: 0.82,
        speechRate: 0.92,
        locationName: 'Main Haven Pier Head',
        dialogue: {
          greeting: () => {
            return "Arr... You're standin' on the best pier in the seven seas! Feel that cool ocean breeze? Look out into the swells—that's where the real fighters cruise.";
          },
          options: [
            {
              label: "🎣 Any tips for casting off the pier head?",
              response: () => {
                return "Hold your cast until that power meter peaks at the top! The farther your bobber flies into the deep blue, the bigger the pelagic cruisers you'll hook. Tiger Mackerel, Barracudas, and Dorado love the drop-off here!";
              }
            },
            {
              label: "🐟 Here's some extra bait I had in my pocket.",
              response: (game) => {
                const key = 'pete_gift';
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, 'claimed');
                  if (game) {
                    const anchovy = window.GAME_DATA.baits.find(b => b.id === 'anchovy');
                    if (anchovy) anchovy.count += 4;
                    game.updateHUD();
                    game.showToast("🐟 Pete gave you 4x Fresh Anchovy Baits!", "success");
                  }
                  return "Take these four plump anchovies, lad! Saltwater predators go crazy for oily fish. Drop one out beyond the pilings and get ready for a fight!";
                }
                return "Put those anchovies to work out past the pilings, kid! Reel steady and watch your rod tip flex.";
              }
            },
            {
              label: "👋 Keep watch on the horizon, Pete!",
              response: () => {
                return "Always do, angler! Watch your footing on the wet timber—plenty of greenhorns have taken an ocean bath they didn't walk away from!";
              },
              isExit: true
            }
          ]
        }
      },

      willow: {
        id: 'willow',
        name: 'Willow the Botanist',
        title: 'Pond Forager & Insect Specialist',
        avatar: '🌿',
        voice: 'willow',
        speechPitch: 1.35,
        speechRate: 1.05,
        locationName: 'Haven Freshwater Pond Dock',
        dialogue: {
          greeting: () => {
            return "Oh, hello! Isn't this lily pond peaceful? The fragrance of the pink lotus blossoms fills the whole valley. What are you looking to catch today?";
          },
          options: [
            {
              label: "🌸 What lives in this freshwater pond?",
              response: () => {
                return "Inland waters have a totally different ecosystem than the ocean! Underneath these broad lily pads swim Bronze Mirror Carp, Pond Bluegills, and large Largemouth Bass. They love sweet dough, worms, and fresh crickets!";
              }
            },
            {
              label: "🌳 Can you teach me about the island trees?",
              response: (game) => {
                return "Over 240 trees grow across our archipelago! Cherry blossoms, weeping willows, and coconut palms. If you press [E] near any tree trunk, you can shake it! Ripe apples, coconuts, crickets, and sometimes gold coins hidden by birds will tumble down!";
              }
            },
            {
              label: "🦗 Do you have any spare insect bait?",
              response: (game) => {
                const key = 'willow_gift';
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, 'claimed');
                  if (game) {
                    const cricket = window.GAME_DATA.baits.find(b => b.id === 'cricket');
                    if (cricket) cricket.count += 6;
                    const dough = window.GAME_DATA.baits.find(b => b.id === 'dough');
                    if (dough) dough.count += 6;
                    game.updateHUD();
                    game.showToast("🦗 Willow gave you 6x Crickets & 6x Dough Baits!", "success");
                  }
                  return "Here! Take 6 lively crickets and a batch of homemade honey-dough balls. The pond carp will gobble them right up!";
                }
                return "My cricket jars are restocking, but shake the weeping willows nearby—plenty of fresh insects fall from the branches!";
              }
            },
            {
              label: "👋 Enjoy the peaceful pond, Willow!",
              response: () => {
                return "Have fun fishing! Remember, the pond water is deep—mind your step along the wooden dock edges!";
              },
              isExit: true
            }
          ]
        }
      },

      rowan: {
        id: 'rowan',
        name: 'Rowan the Campfire Cook',
        title: 'Island Historian & Smoked Chef',
        avatar: '🔥',
        voice: 'rowan',
        speechPitch: 0.95,
        speechRate: 0.98,
        locationName: 'Haven Island Campfire',
        dialogue: {
          greeting: () => {
            return "Pull up a log and warm your hands by the fire, traveler! The flames keep the night chill away, and there's always a good story brewing in the embers.";
          },
          options: [
            {
              label: "🌙 How does the time of day affect fishing?",
              response: () => {
                return "Resting at this campfire lets you advance time across Dawn, Day, Sunset, and Starlight. Predatory fish have peak feeding hours! Dawn and Sunset bring aggressive shoreline strikes, while the dead of night coaxes glowing deep-sea oddities up from the abyss.";
              }
            },
            {
              label: "📜 What is the legend of these 4 archipelago islands?",
              response: () => {
                return "Centuries ago, the islands were one colossal landmass known as Haven Continent! A great tectonic tremor shattered it into four biomes: Haven's green hills, Coral's atoll reefs, the Volcanic pine crags, and the sacred Titan Spire to the south. The arched suspension bridges were built by old pioneers so we'd never be cut off from each other.";
              }
            },
            {
              label: "👋 Thanks for the warm fire, Rowan.",
              response: () => {
                return "Anytime, friend! Come rest by the fire whenever the sea tires your arms.";
              },
              isExit: true
            }
          ]
        }
      },

      finley: {
        id: 'finley',
        name: 'Finley the Beachcomber',
        title: 'Coastal Shell Collector & Sand Artisan',
        avatar: '🐚',
        voice: 'finley',
        speechPitch: 1.15,
        speechRate: 1.05,
        locationName: 'Haven Southwest Beach',
        dialogue: {
          greeting: () => {
            return "Hey there! Check out the beach today! The tide left behind conch shells, scallop fans, and starfish all along the sand! Did you notice how the sand yields and kicks when you walk?";
          },
          options: [
            {
              label: "🏖️ Why does the sand shift and move under our boots?",
              response: () => {
                return "It's natural coastal sand! Fine silica quartz mixed with crushed coral and mica flakes. When you run, your boots displace grains and leave tread impressions. But watch the shoreline surf ribbons—when the tide rolls in, it washes footprints smooth as glass!";
              }
            },
            {
              label: "🐚 What kind of shells can you find here?",
              response: () => {
                return "Spiral conchs, fluted pink scallops, and smooth wave-polished pebbles! On Coral Atoll the sand turns pure white, and over on Volcanic Crags it's pitch-black basalt sand. Every beach has its own personality!";
              }
            },
            {
              label: "👋 Happy beachcombing, Finley!",
              response: () => {
                return "Catch you later! Keep your eyes on the sand—you never know what the tide washes ashore!";
              },
              isExit: true
            }
          ]
        }
      },

      // --- CORAL ATOLL NPCS ---
      marina: {
        id: 'marina',
        name: 'Marina Corallina',
        title: 'Marine Biologist & Coral Specialist',
        avatar: '🪸',
        voice: 'marina',
        speechPitch: 1.28,
        speechRate: 1.02,
        locationName: 'Coral Atoll Research Station',
        dialogue: {
          greeting: () => {
            return "Greetings! Welcome to the Coral Atoll Marine Station. Isn't this turquoise lagoon mesmerizing? The biodiversity living inside this reef ecosystem is simply extraordinary!";
          },
          options: [
            {
              label: "🪸 What unique species live here in the Coral Atoll?",
              response: () => {
                return "The coral lagoon is sheltered and rich in dissolved minerals! You will find vibrant Anemone Clownfish, Coral Snappers, Butterflyfish, and elusive Blue Tangs. They thrive on small crustaceans, so Pacific Krill and Brine Shrimp are irresistible to them!";
              }
            },
            {
              label: "📖 Review my Fish Compendium discovery progress!",
              response: (game) => {
                const compendium = JSON.parse(localStorage.getItem('fishing_island_compendium') || '{}');
                const totalSpecies = window.GAME_DATA.fish.length;
                const discovered = Object.keys(compendium).length;

                let evalText = '';
                if (discovered >= 25) {
                  evalText = "Astounding! You have nearly completed the Grand Archipelago Encyclopedia! Legendary masterwork!";
                } else if (discovered >= 15) {
                  evalText = "Splendid progress! You've documented species across both freshwater and ocean biomes. Keep expanding your charts!";
                } else {
                  evalText = "You're off to a promising start! Try casting at different times of day—crepuscular and nocturnal fish have distinct migration cycles.";
                }

                return `According to our research records, you have documented ${discovered} out of ${totalSpecies} cataloged species (${Math.round((discovered / totalSpecies) * 100)}%). ${evalText}`;
              }
            },
            {
              label: "👋 Keep up the fantastic research, Marina!",
              response: () => {
                return "Thank you so much! Please treat our delicate coral gardens with care, and enjoy your time on the archipelago!";
              },
              isExit: true
            }
          ]
        }
      },

      coral_diver: {
        id: 'coral_diver',
        name: 'Tide-Caller Coral',
        title: 'Reef Free-Diver & Shell Swimmer',
        avatar: '🤿',
        voice: 'coral_diver',
        speechPitch: 1.12,
        speechRate: 1.04,
        locationName: 'Coral Atoll South Sandbar',
        dialogue: {
          greeting: () => {
            return "Splash! Ahhh, the water out here is crystal clear! I just dove down to the outer drop-off. You should see the schools of tropical fish weaving through the brain coral!";
          },
          options: [
            {
              label: "🤿 What did you see down in the reef drop-off?",
              response: () => {
                return "Massive staghorn coral towers glowing pink and azure! Schools of clownfish playing near the anemones, and further out, giant pelagic rays gliding through the deep blue current. Just remember—don't jump in without a boat, the undertow is deadly!";
              }
            },
            {
              label: "🦐 What's the secret to hooking tropical reef fish?",
              response: () => {
                return "Reef fish have small, nimble mouths! Use lightweight hooks and shrimp or dough bait. When the bobber dips, strike immediately before they dart back into their coral hiding spots!";
              }
            },
            {
              label: "👋 Enjoy the dive, Coral!",
              response: () => {
                return "Catch some beauties out there! See ya on the sandbar!";
              },
              isExit: true
            }
          ]
        }
      },

      // --- VOLCANIC CRAGS NPCS ---
      ignis: {
        id: 'ignis',
        name: 'Ignis the Ashen',
        title: 'Volcanic Hermit & Pyrosmith',
        avatar: '🌋',
        voice: 'ignis',
        speechPitch: 0.65,
        speechRate: 0.88,
        locationName: 'Volcanic Crags Geothermal Camp',
        dialogue: {
          greeting: () => {
            return "Hmph! Another sea-scamp braving the sulfur crags? Mind where ye step, stranger. The basalt under your boots is hot enough to bake bread, and the vents don't forgive fools.";
          },
          options: [
            {
              label: "🌋 Why is the ocean around these crags so treacherous?",
              response: () => {
                return "Superheated geothermal fissures, sulfuric acid upwellings, and jagged volcanic glass below! One slip into that boiling foam and you're cooked before ye can gasp. Stay on the rocks and the suspension bridge if you value your skin!";
              }
            },
            {
              label: "🔥 What kind of creatures survive in boiling water?",
              response: () => {
                return "Only the fiercest! Volcanic Fire Gobies, Obsidian Pike, and the ancient Magma Leviathan! They have armored scales that deflect heat and jaws that can crush volcanic rock. Standard bamboo rods will splinter into kindling against them—ye need reinforced carbon or titanium gear!";
              }
            },
            {
              label: "👋 I'll tread carefully, Ignis.",
              response: () => {
                return "Aye. Respect the island's fire, and the fire won't consume ye. Safe journey across the bridge, angler.";
              },
              isExit: true
            }
          ]
        }
      },

      // --- TITAN ABYSSAL ATOLL NPCS ---
      alistair: {
        id: 'alistair',
        name: 'Elder Alistair',
        title: 'The Titan Master & Leviathan Slayer',
        avatar: '⚔️',
        voice: 'alistair',
        speechPitch: 0.62,
        speechRate: 0.90,
        locationName: 'Titan Abyssal Spire Precipice',
        dialogue: {
          greeting: () => {
            return "You stand at the edge of the world, angler. Gaze down into that black abyss. Beneath those churning abyssal waves slumber leviathans that roamed the ocean before humanity ever raised a sail. Are you prepared to test your soul against the deep?";
          },
          options: [
            {
              label: "⚔️ How do I conquer the Colossal Titan Megalodon Rex?",
              response: () => {
                return "The Megalodon Rex fears nothing! When it strikes, it will pull with the force of an avalanche. You must feather your line tension like a master violinist. The moment tension turns crimson, let off the reel instantly or your line will snap like a spiderweb! Use Glowing Squid bait and don't panic when it breaches into the sky!";
              }
            },
            {
              label: "👑 What rewards await a true Leviathan Slayer?",
              response: (game) => {
                const records = JSON.parse(localStorage.getItem('fishing_island_records') || '{}');
                const hasColossal = window.GAME_DATA.fish.some(f => (f.sizeCategory === 'Colossal' || f.sizeCategory === 'Titan') && records[f.id]);

                if (hasColossal) {
                  return "By the ancient tides... you have already dragged a Titan from the abyss! You are a true Leviathan Slayer! Wear that title with honor, master angler.";
                } else {
                  return "Catch a Colossal Titan class beast and prove your lineage! Barnaby will pay a king's ransom in gold, and the sea itself will bow to your rod!";
                }
              }
            },
            {
              label: "👋 I will face the abyss, Elder Alistair.",
              response: () => {
                return "Stand firm on the slate, cast deep, and let the ocean know your strength. May the tides favor you, warrior.";
              },
              isExit: true
            }
          ]
        }
      }
    };
  }

  // 2. DIALOGUE MODAL UI
  initUI() {
    this.modal = document.getElementById('dialogue-modal');
    this.speakerName = document.getElementById('dialogue-speaker-name');
    this.speakerTitle = document.getElementById('dialogue-speaker-title');
    this.avatar = document.getElementById('dialogue-avatar');
    this.speechText = document.getElementById('dialogue-text');
    this.optionsContainer = document.getElementById('dialogue-options');
    this.closeBtn = document.getElementById('dialogue-close-btn');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeDialogue());
    }

    // Number keys (1, 2, 3, 4, 5) for quick option picking & Escape to close
    window.addEventListener('keydown', (e) => {
      if (!this.modal || this.modal.classList.contains('hidden')) return;

      if (e.code === 'Escape') {
        this.closeDialogue();
      } else if (e.code.startsWith('Digit') || e.code.startsWith('Numpad')) {
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1) {
          const buttons = this.optionsContainer.querySelectorAll('.dialogue-option-btn');
          if (buttons[num - 1]) {
            buttons[num - 1].click();
          }
        }
      }
    });
  }

  // 3. START CONVERSATION WITH AN NPC
  startDialogue(npcId) {
    const data = this.npcData[npcId];
    if (!data) return;

    this.activeNPCData = data;
    this.talkingNPC = this.npcs[npcId];

    this.speakerName.innerText = data.name;
    this.speakerTitle.innerText = data.title;
    this.avatar.innerText = data.avatar;

    const greeting = typeof data.dialogue.greeting === 'function'
      ? data.dialogue.greeting(window.game)
      : data.dialogue.greeting;

    this.modal.classList.remove('hidden');
    this.displaySpeech(greeting, data.dialogue.options);
  }

  // 4. TYPEWRITER SPEECH WITH SYNCHRONIZED VOICE BLIPS & WEB SPEECH SYNTHESIS
  displaySpeech(text, options = []) {
    if (this.typewriterInterval) clearInterval(this.typewriterInterval);
    this.speechText.innerText = '';
    this.optionsContainer.innerHTML = '';
    this.isTyping = true;

    // Spoken Speech via Web Speech API (Spoken English Voice)
    this.speakWithVoiceSynthesis(text, this.activeNPCData);

    let charIndex = 0;
    const speed = 20; // ms per char

    this.typewriterInterval = setInterval(() => {
      if (charIndex < text.length) {
        this.speechText.innerText += text[charIndex];

        // Synthesize phonetic voice blip on characters
        const ch = text[charIndex];
        if (ch !== ' ' && ch !== '.' && ch !== ',' && ch !== '!' && ch !== '?' && charIndex % 2 === 0) {
          if (window.soundSystem && this.activeNPCData) {
            window.soundSystem.playVoiceBlip(this.activeNPCData.voice);
          }
        }
        charIndex++;
      } else {
        clearInterval(this.typewriterInterval);
        this.typewriterInterval = null;
        this.isTyping = false;
        this.renderOptions(options);
      }
    }, speed);

    // Click anywhere on dialogue box to skip typing animation
    this.speechText.onclick = () => {
      if (this.isTyping) {
        clearInterval(this.typewriterInterval);
        this.typewriterInterval = null;
        this.speechText.innerText = text;
        this.isTyping = false;
        this.renderOptions(options);
      }
    };
  }

  // WEB SPEECH SYNTHESIS (REAL SPOKEN VOICE)
  speakWithVoiceSynthesis(text, npcConfig) {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // cancel previous utterance

      // Clean markdown/emoji characters for natural spoken English
      const cleanText = text.replace(/[🌀-🛿|[🤀-🧿|[☀-⛿]/gu, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.pitch = npcConfig.speechPitch || 1.0;
      utterance.rate = npcConfig.speechRate || 1.0;

      // Select an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang && v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;

      window.speechSynthesis.speak(utterance);
      this.speechUtterance = utterance;
    } catch (e) {
      // Audio voice blip acts as robust fallback
    }
  }

  // 5. RENDER INTERACTIVE DIALOGUE RESPONSE OPTIONS
  renderOptions(options) {
    this.optionsContainer.innerHTML = '';

    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-option-btn';
      btn.innerHTML = `<span class="opt-num">${idx + 1}</span> ${opt.label}`;

      btn.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playRodClick();

        if (opt.action) {
          this.closeDialogue();
          opt.action(window.game);
        } else if (opt.response) {
          const respText = typeof opt.response === 'function' ? opt.response(window.game) : opt.response;
          if (opt.isExit) {
            this.displaySpeech(respText, [
              { label: "Close Conversation", action: () => this.closeDialogue() }
            ]);
          } else {
            this.displaySpeech(respText, [
              { label: "⬅️ Ask something else", action: () => this.startDialogue(this.activeNPCData.id) },
              { label: "👋 Goodbye", isExit: true, response: () => "Safe travels, angler!" }
            ]);
          }
        }
      });

      this.optionsContainer.appendChild(btn);
    });
  }

  closeDialogue() {
    if (this.typewriterInterval) clearInterval(this.typewriterInterval);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    if (this.modal) this.modal.classList.add('hidden');
    this.activeDialogue = null;
    this.activeNPCData = null;
    this.talkingNPC = null;
  }

  // 6. BUILD 3D ANIMATED CHARACTER RIGS ALL AROUND THE ISLANDS
  buildArchipelagoNPCs() {
    // 1. Captain Barnaby (Haven Island Tackle Shop: x: -14, z: 24.5)
    const barnabyMesh = this.island.captainMesh;
    if (barnabyMesh) {
      this.npcs['barnaby'] = {
        id: 'barnaby',
        root: barnabyMesh,
        head: (barnabyMesh.userData && barnabyMesh.userData.head) ? barnabyMesh.userData.head : barnabyMesh.children[1],
        jaw: barnabyMesh.userData ? barnabyMesh.userData.jaw : null,
        eyelids: barnabyMesh.userData ? barnabyMesh.userData.eyelids : [],
        chest: barnabyMesh.userData ? barnabyMesh.userData.chest : null,
        armR: barnabyMesh.userData ? barnabyMesh.userData.armR : null,
        armL: barnabyMesh.userData ? barnabyMesh.userData.armL : null,
        pos: new THREE.Vector3(-14, 1.25, 24.5),
        baseY: 1.25,
        breathTimer: Math.random() * 5.0,
        blinkTimer: 2.0 + Math.random() * 3.0,
        blinkProgress: 0
      };
    }

    // 2. Old Salty Pete (Haven Island Pier Head: x: -3.5, z: 116.5)
    const peteGroup = this.buildPeteModel();
    peteGroup.position.set(-3.5, 1.4, 116.5);
    peteGroup.rotation.y = Math.PI / 1.1;
    this.scene.add(peteGroup);
    this.registerNPC('pete', peteGroup, {
      x: -3.5, z: 116.5, radius: 4.5,
      title: 'Old Salty Pete', prompt: '[E] Talk to Old Salty Pete (Pier Watchman)'
    });

    // 3. Willow the Pond Botanist (Freshwater Lily Pond: x: 14, z: -3.5)
    const willowGroup = this.buildWillowModel();
    const wy = this.island.pondWaterLevel + 0.15;
    willowGroup.position.set(14, wy, -3.5);
    willowGroup.rotation.y = -Math.PI / 2.5;
    this.scene.add(willowGroup);
    this.registerNPC('willow', willowGroup, {
      x: 14, z: -3.5, radius: 4.5,
      title: 'Willow the Botanist', prompt: '[E] Talk to Willow (Pond & Tree Foraging)'
    });

    // 4. Rowan the Campfire Bard (Haven Island Campfire: x: 3.5, z: 25.5)
    const rowanGroup = this.buildRowanModel();
    const ry = this.island.getHeight(3.5, 25.5);
    rowanGroup.position.set(3.5, ry, 25.5);
    rowanGroup.rotation.y = 0.5;
    this.scene.add(rowanGroup);
    this.registerNPC('rowan', rowanGroup, {
      x: 3.5, z: 25.5, radius: 4.5,
      title: 'Rowan the Campfire Cook', prompt: '[E] Talk to Rowan (Lore & Island History)'
    });

    // 5. Finley the Beachcomber (Haven Southwest Beach: x: -46, z: 65)
    const finleyGroup = this.buildFinleyModel();
    const fiy = this.island.getHeight(-46, 65);
    finleyGroup.position.set(-46, fiy, 65);
    finleyGroup.rotation.y = 1.2;
    this.scene.add(finleyGroup);
    this.registerNPC('finley', finleyGroup, {
      x: -46, z: 65, radius: 4.5,
      title: 'Finley the Beachcomber', prompt: '[E] Talk to Finley (Seashells & Moving Sand)'
    });

    // 6. Marina the Marine Biologist (Coral Atoll: x: 142, z: -16)
    const marinaGroup = this.buildMarinaModel();
    const my = this.island.getHeight(142, -16);
    marinaGroup.position.set(142, my, -16);
    marinaGroup.rotation.y = -Math.PI / 1.5;
    this.scene.add(marinaGroup);
    this.registerNPC('marina', marinaGroup, {
      x: 142, z: -16, radius: 4.5,
      title: 'Marina the Marine Biologist', prompt: '[E] Talk to Marina (Coral Lagoon & Compendium)'
    });

    // 7. Tide-Caller Coral (Coral Atoll South Reef: x: 168, z: -32)
    const diverGroup = this.buildDiverModel();
    const dy = this.island.getHeight(168, -32);
    diverGroup.position.set(168, dy, -32);
    diverGroup.rotation.y = -Math.PI / 2.2;
    this.scene.add(diverGroup);
    this.registerNPC('coral_diver', diverGroup, {
      x: 168, z: -32, radius: 4.5,
      title: 'Tide-Caller Coral', prompt: '[E] Talk to Coral (Reef Free-Diver)'
    });

    // 8. Ignis the Volcanic Hermit (Volcanic Crags: x: -138, z: -52)
    const ignisGroup = this.buildIgnisModel();
    const iy = this.island.getHeight(-138, -52);
    ignisGroup.position.set(-138, iy, -52);
    ignisGroup.rotation.y = 0.8;
    this.scene.add(ignisGroup);
    this.registerNPC('ignis', ignisGroup, {
      x: -138, z: -52, radius: 4.5,
      title: 'Ignis the Volcanic Hermit', prompt: '[E] Talk to Ignis (Volcano Secrets & Magma Fish)'
    });

    // 9. Elder Alistair (Titan Abyssal Spire: x: 0, z: 215)
    const alistairGroup = this.buildAlistairModel();
    const ay = this.island.getHeight(0, 215);
    alistairGroup.position.set(0, ay, 215);
    alistairGroup.rotation.y = Math.PI; // looks south into the deep abyssal trench!
    this.scene.add(alistairGroup);
    this.registerNPC('alistair', alistairGroup, {
      x: 0, z: 215, radius: 5.0,
      title: 'Elder Alistair', prompt: '[E] Talk to Elder Alistair (The Titan Master)'
    });
  }

  registerNPC(id, group, interactable) {
    const ud = group.userData || {};
    this.npcs[id] = {
      id: id,
      root: group,
      head: ud.head,
      jaw: ud.jaw,
      eyelids: ud.eyelids || [],
      chest: ud.chest,
      armR: ud.armR,
      armL: ud.armL,
      prop: ud.prop,
      pos: group.position,
      baseY: group.position.y,
      restArmRx: ud.armR ? ud.armR.rotation.x : 0,
      breathTimer: Math.random() * 5.0,
      blinkTimer: 2.0 + Math.random() * 3.0,
      blinkProgress: 0
    };

    if (interactable) {
      this.island.interactables.push({
        x: interactable.x,
        z: interactable.z,
        radius: interactable.radius || 4.5,
        type: 'npc',
        npcId: id,
        title: interactable.title,
        prompt: interactable.prompt
      });
    }
  }

  // --- REUSABLE ANATOMICAL HUMAN RIG HELPERS ---
  createAnatomicalHand(skinMat, isRight) {
    const handGroup = new THREE.Group();

    // Sculpted palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.08), skinMat);
    palm.position.y = -0.04;
    handGroup.add(palm);

    // Thumb
    const thumb = new THREE.Group();
    thumb.position.set(isRight ? -0.04 : 0.04, -0.03, 0.02);
    thumb.rotation.y = isRight ? 0.6 : -0.6;
    thumb.rotation.z = isRight ? 0.4 : -0.4;
    const thumbPhalanx = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.013, 0.045, 6), skinMat);
    thumbPhalanx.position.y = -0.022;
    thumb.add(thumbPhalanx);
    handGroup.add(thumb);

    // 4 Articulated fingers curled naturally
    const fingerSpacing = [-0.028, -0.009, 0.009, 0.028];
    const fingerLens = [0.05, 0.055, 0.05, 0.04];
    fingerSpacing.forEach((fx, i) => {
      const finger = new THREE.Group();
      finger.position.set(fx, -0.075, 0.015);
      finger.rotation.x = -0.6;

      const phalanx = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, fingerLens[i], 6), skinMat);
      phalanx.position.y = -fingerLens[i] / 2;
      finger.add(phalanx);

      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.011, 5, 5), skinMat);
      tip.position.y = -fingerLens[i];
      finger.add(tip);

      handGroup.add(finger);
    });

    return handGroup;
  }

  createRealisticHeadAndFace(skinMat, eyeColorHex, browMat, hairMat, extraOpts = {}) {
    const headGroup = new THREE.Group();
    const skinShadeMat = new THREE.MeshStandardMaterial({ color: 0xcfa676, roughness: 0.7 });
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.1 });
    const irisMat = new THREE.MeshStandardMaterial({ color: eyeColorHex, roughness: 0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.05 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, roughness: 0.65 });
    const lipMat = new THREE.MeshStandardMaterial({ color: 0xba796c, roughness: 0.7 });

    // Cranium
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skinMat);
    cranium.scale.set(0.92, 1.08, 1.0);
    cranium.position.set(0, 0.04, 0);
    headGroup.add(cranium);

    // Sculpted lower jaw & chin (Hinged for talking!)
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.04, 0.04);
    headGroup.add(jaw);

    const chin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.13, 0.2), skinMat);
    chin.position.set(0, -0.11, 0.11);
    chin.rotation.x = 0.2;
    jaw.add(chin);

    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.035), lipMat);
    lowerLip.position.set(0, -0.055, 0.22);
    jaw.add(lowerLip);

    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.035), lipMat);
    upperLip.position.set(0, -0.075, 0.23);
    headGroup.add(upperLip);

    // Nose
    const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.038, 0.13, 6), skinMat);
    noseBridge.rotation.x = -Math.PI / 3.4;
    noseBridge.position.set(0, 0.04, 0.25);
    headGroup.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 7), skinMat);
    noseTip.position.set(0, -0.015, 0.28);
    headGroup.add(noseTip);

    // Ears
    [-0.23, 0.23].forEach((ex, idx) => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.11, 6), skinMat);
      ear.scale.set(0.4, 1.0, 0.8);
      ear.position.set(ex, 0.02, -0.02);
      ear.rotation.y = idx === 0 ? -0.2 : 0.2;
      headGroup.add(ear);
    });

    // Blinking Eyes with Sclera, Iris, Pupil, Glint & Upper Eyelids
    const eyelids = [];
    [-0.088, 0.088].forEach((x, i) => {
      const eyeOrbit = new THREE.Group();
      eyeOrbit.position.set(x, 0.065, 0.2);
      headGroup.add(eyeOrbit);

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), scleraMat);
      eyeOrbit.add(sclera);

      const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8), irisMat);
      iris.rotation.x = Math.PI / 2;
      iris.position.z = 0.031;
      eyeOrbit.add(iris);

      const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.012, 8), pupilMat);
      pupil.rotation.x = Math.PI / 2;
      pupil.position.z = 0.033;
      eyeOrbit.add(pupil);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.004, 4, 4), glintMat);
      glint.position.set(0.007, 0.007, 0.036);
      eyeOrbit.add(glint);

      const upperLid = new THREE.Mesh(
        new THREE.SphereGeometry(0.039, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        lidMat
      );
      upperLid.rotation.x = -Math.PI / 2.3;
      eyeOrbit.add(upperLid);
      eyelids.push(upperLid);

      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.025), browMat);
      brow.position.set(x, 0.115, 0.215);
      brow.rotation.z = (i === 0 ? 0.08 : -0.08);
      headGroup.add(brow);
    });

    return { head: headGroup, jaw: jaw, eyelids: eyelids };
  }

  // --- 8 ARCHIPELAGO NPC HIGH-FIDELITY CHARACTER RIGS ---

  // 1. OLD SALTY PETE (Sou'wester hat, heavy yellow oilskins, pipe, split-cane bamboo rod)
  buildPeteModel() {
    const group = new THREE.Group();
    const yellowSlicker = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.42, metalness: 0.08 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.65, metalness: 0.02 });
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e9, roughness: 0.9 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xb2bec3, roughness: 0.85 });

    // Legs with heavy deck boots
    [-0.17, 0.17].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.72, 8), yellowSlicker);
      leg.position.set(x, 0.36, 0);
      group.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.36), bootMat);
      boot.position.set(x, 0.08, 0.05);
      group.add(boot);
    });

    // Heavy Torso (Chest + Ribcage with breathing)
    const chest = new THREE.Group();
    chest.position.y = 1.0;
    group.add(chest);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.9, 10), yellowSlicker);
    torso.position.y = 0.2;
    torso.castShadow = true;
    chest.add(torso);

    // Front bib pocket with storm flap
    const bibPocket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.06), yellowSlicker);
    bibPocket.position.set(0, 0.26, 0.35);
    chest.add(bibPocket);

    // Sculpted Head & Articulated Jaw with Blue Eyes
    const { head, jaw, eyelids } = this.createRealisticHeadAndFace(skinMat, 0x2980b9, beardMat, hairMat);
    head.position.y = 0.88;
    chest.add(head);

    // Sou'wester Fisherman Hat with rear rain-drip brim
    const hatDome = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.8), yellowSlicker);
    hatDome.position.set(0, 0.12, 0);
    head.add(hatDome);

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.04, 12), yellowSlicker);
    brim.position.set(0, 0.1, -0.06);
    brim.rotation.x = -0.18; // Long rear neck drip brim
    head.add(brim);

    // Weathered salt-and-pepper beard attached to jaw
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), beardMat);
    beard.scale.set(0.9, 1.25, 0.8);
    beard.position.set(0, -0.14, 0.16);
    jaw.add(beard);

    // Briarwood smoking pipe clenched in jaw
    const pipeGroup = new THREE.Group();
    pipeGroup.position.set(0.12, -0.06, 0.22);
    pipeGroup.rotation.set(0.3, 0.4, 0);
    const pipeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.2, 5), new THREE.MeshStandardMaterial({ color: 0x4a2e1b }));
    const pipeBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
    pipeBowl.position.set(0, 0.09, 0.04);
    pipeBowl.rotation.x = -0.3;
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 5), new THREE.MeshBasicMaterial({ color: 0xff793f }));
    ember.position.set(0, 0.12, 0.04);
    pipeGroup.add(pipeStem);
    pipeGroup.add(pipeBowl);
    pipeGroup.add(ember);
    jaw.add(pipeGroup);

    // Right Arm gripping Bamboo Surf Casting Rod
    const armR = new THREE.Group();
    armR.position.set(0.45, 0.48, 0);
    chest.add(armR);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.4, 8), yellowSlicker);
    rUpperArm.position.y = -0.2;
    armR.add(rUpperArm);

    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.36, 8), yellowSlicker);
    rForearm.position.set(0, -0.45, 0.08);
    rForearm.rotation.x = -0.55;
    armR.add(rForearm);

    const rHand = this.createAnatomicalHand(skinMat, true);
    rHand.position.set(0, -0.62, 0.18);
    armR.add(rHand);

    // Tall Bamboo Surf Casting Rod with brass rings
    const rodMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.55 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.85, roughness: 0.2 });
    const surfRod = new THREE.Group();
    surfRod.position.set(0, -0.55, 0.22);
    surfRod.rotation.x = 0.5;

    const rodBlank = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, 3.4, 6), rodMat);
    rodBlank.position.y = 1.2;
    surfRod.add(rodBlank);

    for (let g = 0; g < 4; g++) {
      const guide = new THREE.Mesh(new THREE.TorusGeometry(0.04 - g * 0.006, 0.007, 5, 10), brassMat);
      guide.position.set(0, 0.6 + g * 0.6, 0.04);
      guide.rotation.x = Math.PI / 2;
      surfRod.add(guide);
    }
    armR.add(surfRod);

    // Left Arm resting at side
    const armL = new THREE.Group();
    armL.position.set(-0.45, 0.48, 0);
    chest.add(armL);
    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.4, 8), yellowSlicker);
    lUpperArm.position.y = -0.2;
    armL.add(lUpperArm);
    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.36, 8), yellowSlicker);
    lForearm.position.y = -0.45;
    armL.add(lForearm);
    const lHand = this.createAnatomicalHand(skinMat, false);
    lHand.position.y = -0.65;
    armL.add(lHand);

    group.userData = { head, jaw, eyelids, chest, armR, armL, prop: surfRod };
    return group;
  }

  // 2. WILLOW THE POND BOTANIST (Sun hat, green apron overalls, wicker harvest basket)
  buildWillowModel() {
    const group = new THREE.Group();
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.75 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xfffcf5, roughness: 0.85 });
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xf6e58d, roughness: 0.92 });
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x16a085, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5cd79, roughness: 0.65, metalness: 0.02 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x8c531b, roughness: 0.85 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xff7675 });

    // Legs in denim-green overalls
    [-0.15, 0.15].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.7, 8), apronMat);
      leg.position.set(x, 0.35, 0);
      group.add(leg);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.3), new THREE.MeshStandardMaterial({ color: 0x6d4c41 }));
      shoe.position.set(x, 0.06, 0.04);
      group.add(shoe);
    });

    // Torso with overalls bib & cream blouse
    const chest = new THREE.Group();
    chest.position.y = 0.95;
    group.add(chest);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.82, 10), shirtMat);
    torso.position.y = 0.18;
    chest.add(torso);

    const bib = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.05), apronMat);
    bib.position.set(0, 0.18, 0.26);
    chest.add(bib);

    // Brass overall buckles
    [-0.1, 0.1].forEach(bx => {
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.03), new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.85 }));
      buckle.position.set(bx, 0.36, 0.28);
      chest.add(buckle);
    });

    // Sculpted Head & Articulated Jaw with Hazel Eyes
    const { head, jaw, eyelids } = this.createRealisticHeadAndFace(skinMat, 0x27ae60, hairMat, hairMat);
    head.position.y = 0.82;
    chest.add(head);

    // Wide Woven Straw Sun Hat with Green Silk Ribbon
    const hatDome = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.8), strawMat);
    hatDome.position.set(0, 0.12, 0);
    head.add(hatDome);

    const wideBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.03, 14), strawMat);
    wideBrim.position.set(0, 0.11, 0);
    head.add(wideBrim);

    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 12), ribbonMat);
    ribbon.position.set(0, 0.14, 0);
    head.add(ribbon);

    // Freshwater Water Lily tucked behind ear
    const lily = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), flowerMat);
    lily.position.set(0.24, 0.08, 0.06);
    head.add(lily);

    // Right Arm with Woven Wicker Harvest Basket
    const armR = new THREE.Group();
    armR.position.set(0.38, 0.42, 0);
    chest.add(armR);

    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.36, 8), shirtMat);
    rUpper.position.y = -0.18;
    armR.add(rUpper);

    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.32, 8), skinMat);
    rFore.position.set(0, -0.4, 0.08);
    rFore.rotation.x = -0.6;
    armR.add(rFore);

    const rHand = this.createAnatomicalHand(skinMat, true);
    rHand.position.set(0, -0.56, 0.18);
    armR.add(rHand);

    // Wicker basket with lily pads & bait jars
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.32, 8), strawMat);
    basket.position.set(0.12, -0.58, 0.2);
    armR.add(basket);

    // Left Arm resting gently
    const armL = new THREE.Group();
    armL.position.set(-0.38, 0.42, 0);
    chest.add(armL);
    const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.36, 8), shirtMat);
    lUpper.position.y = -0.18;
    armL.add(lUpper);
    const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.32, 8), skinMat);
    lFore.position.y = -0.4;
    armL.add(lFore);
    const lHand = this.createAnatomicalHand(skinMat, false);
    lHand.position.y = -0.58;
    armL.add(lHand);

    group.userData = { head, jaw, eyelids, chest, armR, armL, prop: basket };
    return group;
  }

  // 3. ROWAN THE CAMPFIRE BARD & COOK (Traveler cloak, sit on log, rotating fish skewer)
  buildRowanModel() {
    const group = new THREE.Group();
    const cloakMat = new THREE.MeshStandardMaterial({ color: 0x6c5ce7, roughness: 0.8 }); // Royal purple wool
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.75 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.65, metalness: 0.02 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.85 });

    // Weathered Driftwood Log Bench to sit on
    const logSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.95 }));
    logSeat.position.set(0, 0.28, 0);
    logSeat.rotation.z = Math.PI / 2;
    group.add(logSeat);

    // Seated Legs
    [-0.18, 0.18].forEach(x => {
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.5, 8), leatherMat);
      thigh.position.set(x, 0.35, 0.22);
      thigh.rotation.x = Math.PI / 2.2;
      group.add(thigh);
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.45, 8), leatherMat);
      calf.position.set(x, 0.18, 0.45);
      group.add(calf);
    });

    // Seated Torso (Chest + Ribcage)
    const chest = new THREE.Group();
    chest.position.y = 0.65;
    group.add(chest);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.78, 10), tunicMat);
    torso.position.y = 0.2;
    chest.add(torso);

    // Traveler's Cloak draped over shoulders and back
    const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.92, 0.24), cloakMat);
    cloak.position.set(0, 0.18, -0.16);
    chest.add(cloak);

    // Brass leaf clasp on cloak
    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.85 }));
    clasp.position.set(0, 0.48, 0.22);
    chest.add(clasp);

    // Sculpted Head & Articulated Jaw with Brown Eyes
    const { head, jaw, eyelids } = this.createRealisticHeadAndFace(skinMat, 0x795548, hairMat, hairMat);
    head.position.y = 0.75;
    chest.add(head);

    // Trimmed adventurer beard on jaw
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 6), hairMat);
    beard.position.set(0, -0.12, 0.14);
    beard.rotation.x = 0.4;
    jaw.add(beard);

    // Right Arm holding metal skewer with roasting fish!
    const armR = new THREE.Group();
    armR.position.set(0.38, 0.42, 0);
    chest.add(armR);

    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.36, 8), tunicMat);
    rUpper.position.y = -0.18;
    armR.add(rUpper);

    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 8), skinMat);
    rFore.position.set(0.08, -0.4, 0.12);
    rFore.rotation.set(-0.6, 0, -0.3);
    armR.add(rFore);

    const rHand = this.createAnatomicalHand(skinMat, true);
    rHand.position.set(0.12, -0.56, 0.22);
    armR.add(rHand);

    // Roasting Skewer with Freshly Caught Sizzling Fish
    const skewerGroup = new THREE.Group();
    skewerGroup.position.set(0.12, -0.54, 0.25);
    skewerGroup.rotation.x = 0.8;
    const spitRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 5), new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.85 }));
    skewerGroup.add(spitRod);

    // Roasting fish model on skewer
    const fishBody = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 6), new THREE.MeshStandardMaterial({ color: 0xb71540, roughness: 0.6 }));
    fishBody.position.y = 0.35;
    fishBody.rotation.x = Math.PI / 2;
    skewerGroup.add(fishBody);

    armR.add(skewerGroup);

    // Left Arm gesturing storytelling
    const armL = new THREE.Group();
    armL.position.set(-0.38, 0.42, 0);
    chest.add(armL);
    const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.36, 8), tunicMat);
    lUpper.position.y = -0.18;
    armL.add(lUpper);
    const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 8), skinMat);
    lFore.position.set(-0.06, -0.38, 0.1);
    lFore.rotation.set(-0.5, 0, 0.3);
    armL.add(lFore);
    const lHand = this.createAnatomicalHand(skinMat, false);
    lHand.position.set(-0.1, -0.52, 0.2);
    armL.add(lHand);

    group.userData = { head, jaw, eyelids, chest, armR, armL, prop: skewerGroup, skewer: skewerGroup };
    return group;
  }

  // 4. FINLEY THE BEACHCOMBER (Hawaiian floral shirt, sun visor, shell bucket)
  buildFinleyModel() {
    const group = new THREE.Group();
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xe84118, roughness: 0.72 }); // Vibrant hibiscus red
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x718093, roughness: 0.82 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x00a8ff, roughness: 0.4, transparent: true, opacity: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5cd79, roughness: 0.65, metalness: 0.02 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xf6e58d, roughness: 0.85 }); // Sun-bleached blonde

    // Legs in cargo boardshorts & sandals
    [-0.15, 0.15].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.7, 8), shortsMat);
      leg.position.set(x, 0.35, 0);
      group.add(leg);
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.3, 8), skinMat);
      calf.position.set(x, 0.15, 0);
      group.add(calf);
      const sandal = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.3), new THREE.MeshStandardMaterial({ color: 0x2d3436 }));
      sandal.position.set(x, 0.02, 0.04);
      group.add(sandal);
    });

    // Torso with floral Hawaiian shirt
    const chest = new THREE.Group();
    chest.position.y = 0.95;
    group.add(chest);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.84, 10), shirtMat);
    torso.position.y = 0.2;
    chest.add(torso);

    // Open collar exposing upper chest
    const chestV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.04), skinMat);
    chestV.position.set(0, 0.45, 0.28);
    chest.add(chestV);

    // Sculpted Head & Articulated Jaw with Brown Eyes
    const { head, jaw, eyelids } = this.createRealisticHeadAndFace(skinMat, 0x6c5ce7, hairMat, hairMat);
    head.position.y = 0.82;
    chest.add(head);

    // Translucent Blue Beach Sun Visor
    const visorHeadband = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    visorHeadband.position.set(0, 0.1, 0);
    head.add(visorHeadband);

    const visorBrim = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 0.26), visorMat);
    visorBrim.position.set(0, 0.08, 0.24);
    visorBrim.rotation.x = 0.15;
    head.add(visorBrim);

    // Right Arm holding Galvanized Shell Bucket
    const armR = new THREE.Group();
    armR.position.set(0.42, 0.44, 0);
    chest.add(armR);

    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.36, 8), shirtMat);
    rUpper.position.y = -0.18;
    armR.add(rUpper);

    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 8), skinMat);
    rFore.position.y = -0.42;
    armR.add(rFore);

    const rHand = this.createAnatomicalHand(skinMat, true);
    rHand.position.y = -0.62;
    armR.add(rHand);

    // Galvanized shell bucket with seashells
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.32, 8), new THREE.MeshStandardMaterial({ color: 0x4cd137, roughness: 0.6 }));
    bucket.position.set(0.08, -0.74, 0.08);
    armR.add(bucket);

    // Left Arm relaxed
    const armL = new THREE.Group();
    armL.position.set(-0.42, 0.44, 0);
    chest.add(armL);
    const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.36, 8), shirtMat);
    lUpper.position.y = -0.18;
    armL.add(lUpper);
    const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 8), skinMat);
    lFore.position.y = -0.42;
    armL.add(lFore);
    const lHand = this.createAnatomicalHand(skinMat, false);
    lHand.position.y = -0.62;
    armL.add(lHand);

    group.userData = { head, jaw, eyelids, chest, armR, armL, prop: bucket };
    return group;
  }

  // 5. MARINA THE MARINE BIOLOGIST (Turquoise lab coat, glasses, ponytail, clipboard)
  buildMarinaModel() {
    const group = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x00cec9, roughness: 0.65 }); // Turquoise marine lab coat
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.82 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5cd79, roughness: 0.65, metalness: 0.02 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.85 });
    const goldWireMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 });
    const clipMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.5 });
    const vialMat = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Glowing bioluminescent plankton

    // Legs
    [-0.15, 0.15].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.72, 8), pantsMat);
      leg.position.set(x, 0.36, 0);
      group.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.32), new THREE.MeshStandardMaterial({ color: 0x1e272e }));
      boot.position.set(x, 0.07, 0.04);
      group.add(boot);
    });

    // Torso with lab coat & buttoned front
    const chest = new THREE.Group();
    chest.position.y = 0.95;
    group.add(chest);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.27, 0.85, 10), coatMat);
    torso.position.y = 0.2;
    chest.add(torso);

    // Pen in coat breast pocket
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.03), coatMat);
    pocket.position.set(0.18, 0.32, 0.28);
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 5), goldWireMat);
    pen.position.set(0.18, 0.4, 0.29);
    chest.add(pocket);
    chest.add(pen);

    // Sculpted Head & Articulated Jaw with Dark Eyes
    const { head, jaw, eyelids } = this.createRealisticHeadAndFace(skinMat, 0x1e272e, hairMat, hairMat);
    head.position.y = 0.82;
    chest.add(head);

    // Round Gold Wire Glasses over eyes
    [-0.088, 0.088].forEach(gx => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 6, 12), goldWireMat);
      rim.position.set(gx, 0.065, 0.245);
      head.add(rim);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.008, 0.01), goldWireMat);
    bridge.position.set(0, 0.065, 0.25);
    head.add(bridge);

    // Hair & Sleek Ponytail that sways with head movement
    const hairDome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.7), hairMat);
    hairDome.position.set(0, 0.05, 0);
    head.add(hairDome);

    const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.6, 6), hairMat);
    ponytail.position.set(0, 0.04, -0.3);
    ponytail.rotation.x = -Math.PI / 2.7;
    head.add(ponytail);

    // Right Arm holding Field Research Clipboard
    const armR = new THREE.Group();
    armR.position.set(0.4, 0.44, 0);
    chest.add(armR);

    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.36, 8), coatMat);
    rUpper.position.y = -0.18;
    armR.add(rUpper);

    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 8), coatMat);
    rFore.position.set(0, -0.4, 0.08);
    rFore.rotation.x = -0.6;
    armR.add(rFore);

    const rHand = this.createAnatomicalHand(skinMat, true);
    rHand.position.set(0, -0.58, 0.18);
    armR.add(rHand);

    // Expedition Clipboard with graph notes
    const clipboard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.03), clipMat);
    clipboard.position.set(0.08, -0.58, 0.24);
    clipboard.rotation.set(0.7, 0, -0.2);
    armR.add(clipboard);

    // Left Arm holding Glowing Bioluminescent Specimen Vial!
    const armL = new THREE.Group();
    armL.position.set(-0.4, 0.44, 0);
    chest.add(armL);
    const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.36, 8), coatMat);
    lUpper.position.y = -0.18;
    armL.add(lUpper);
    const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 8), coatMat);
    lFore.position.set(0, -0.4, 0.08);
    lFore.rotation.x = -0.5;
    armL.add(lFore);
    const lHand = this.createAnatomicalHand(skinMat, false);
    lHand.position.set(0, -0.56, 0.16);
    armL.add(lHand);

    const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), vialMat);
    vial.position.set(0, -0.6, 0.22);
    armL.add(vial);

    group.userData = { head, jaw, eyelids, chest, armR, armL, prop: clipboard, vial };
    return group;
  }

  // 6. TIDE-CALLER CORAL (Two-tone neoprene wetsuit, snorkel mask, yellow swim fins)
  buildDiverModel() {
    const group = new THREE.Group();
    const wetsuitMat = new THREE.MeshStandardMaterial({ color: 0x0984e3, roughness: 0.35, metalness: 0.15 }); // Ocean blue
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5 }); // Neon yellow
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.65, metalness: 0.02 });
    const maskMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.4 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.85 });

    // Legs in wetsuit with split dive flippers
    [-0.15, 0.15].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.72, 8), wetsuitMat);
      leg.position.set(x, 0.36, 0);
      group.add(leg);
      // Yellow high-performance free-diving fins
      const flipper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.56), accentMat);
      flipper.position.set(x, 0.02, 0.16);
      group.add(flipper);
    });

    // Torso with wetsuit panels
    const chest = new THREE.Group();
    chest.position.y = 0.95;
    group.add(chest);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.26, 0.84, 10), wetsuitMat);
    torso.position.y = 0.2;
    chest.add(torso);

    // Neon yellow aerodynamic chest chevron
    const chevron = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.02), accentMat);
    chevron.position.set(0, 0.25, 0.28);
    chest.add(chevron);

    // Sculpted Head & Articulated Jaw with Sea-Green Eyes
    const { head, jaw, eyelids } = this.createRealisticHeadAndFace(skinMat, 0x16a085, hairMat, hairMat);
    head.position.y = 0.82;
    chest.add(head);

    // Professional Dive Mask pushed onto forehead
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.08), maskMat);
    mask.position.set(0, 0.13, 0.19);
    head.add(mask);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0x81ecec }));
    glass.position.set(0, 0.13, 0.24);
    head.add(glass);

    // Flexible silicone snorkel tube on left temple
    const snorkel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 6), accentMat);
    snorkel.position.set(-0.2, 0.2, 0.06);
    snorkel.rotation.z = -0.15;
    head.add(snorkel);

    // Right Arm with wrist dive computer
    const armR = new THREE.Group();
    armR.position.set(0.4, 0.44, 0);
    chest.add(armR);

    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.36, 8), wetsuitMat);
    rUpper.position.y = -0.18;
    armR.add(rUpper);

    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 8), wetsuitMat);
    rFore.position.y = -0.42;
    armR.add(rFore);

    // Wrist dive computer with glowing depth dial
    const diveWatch = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8), new THREE.MeshBasicMaterial({ color: 0x00d2d3 }));
    diveWatch.position.set(0, -0.46, 0.08);
    armR.add(diveWatch);

    const rHand = this.createAnatomicalHand(skinMat, true);
    rHand.position.y = -0.62;
    armR.add(rHand);

    // Left Arm
    const armL = new THREE.Group();
    armL.position.set(-0.4, 0.44, 0);
    chest.add(armL);
    const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.36, 8), wetsuitMat);
    lUpper.position.y = -0.18;
    armL.add(lUpper);
    const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 8), wetsuitMat);
    lFore.position.y = -0.42;
    armL.add(lFore);
    const lHand = this.createAnatomicalHand(skinMat, false);
    lHand.position.y = -0.62;
    armL.add(lHand);

    group.userData = { head, jaw, eyelids, chest, armR, armL, prop: diveWatch };
    return group;
  }

  // 7. IGNIS THE VOLCANIC HERMIT (Leather apron, red bandana, spit with roasting Magma Fish)
  buildIgnisModel() {
    const group = new THREE.Group();
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.88 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.75, metalness: 0.02 }); // Sunburnt soot-dusted skin
    const bandanaMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 });
    const beardMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95 });

    // Sturdy work legs & forge boots
    [-0.17, 0.17].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.72, 8), pantsMat);
      leg.position.set(x, 0.36, 0);
      group.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.36), new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.9 }));
      boot.position.set(x, 0.08, 0.05);
      group.add(boot);
    });

    // Muscular Torso with Leather Smith Apron
    const chest = new THREE.Group();
    chest.position.y = 0.95;
    group.add(chest);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.88, 10), skinMat);
    torso.position.y = 0.2;
    chest.add(torso);

    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.72, 0.05), apronMat);
    apron.position.set(0, 0.12, 0.28);
    chest.add(apron);

    // Sculpted Head & Articulated Jaw with Fiery Amber Eyes
    const { head, jaw, eyelids } = this.createRealisticHeadAndFace(skinMat, 0xe67e22, beardMat, beardMat);
    head.position.y = 0.84;
    chest.add(head);

    // Crimson Head Bandana with trailing knot
    const bandana = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 12), bandanaMat);
    bandana.position.set(0, 0.12, 0);
    head.add(bandana);

    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.06), bandanaMat);
    knot.position.set(0, 0.06, -0.28);
    knot.rotation.x = -0.3;
    head.add(knot);

    // Thick charcoal soot-dusted beard on jaw
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 7), beardMat);
    beard.position.set(0, -0.14, 0.16);
    beard.rotation.x = 0.3;
    jaw.add(beard);

    // Right Arm holding heavy iron roasting spit
    const armR = new THREE.Group();
    armR.position.set(0.44, 0.44, 0);
    chest.add(armR);

    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.38, 8), skinMat);
    rUpper.position.y = -0.19;
    armR.add(rUpper);

    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.34, 8), skinMat);
    rFore.position.set(0, -0.42, 0.1);
    rFore.rotation.x = -0.55;
    armR.add(rFore);

    const rHand = this.createAnatomicalHand(skinMat, true);
    rHand.position.set(0, -0.6, 0.22);
    armR.add(rHand);

    // Volcanic iron spit with roasting fiery Magma Fish
    const spitGroup = new THREE.Group();
    spitGroup.position.set(0.1, -0.58, 0.26);
    spitGroup.rotation.x = 0.8;

    const ironRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 5), new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.85 }));
    spitGroup.add(ironRod);

    const magmaFish = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3838 }));
    magmaFish.scale.set(0.7, 1.8, 0.8);
    magmaFish.position.y = 0.4;
    spitGroup.add(magmaFish);
    armR.add(spitGroup);

    // Left Arm resting at side
    const armL = new THREE.Group();
    armL.position.set(-0.44, 0.44, 0);
    chest.add(armL);
    const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.38, 8), skinMat);
    lUpper.position.y = -0.19;
    armL.add(lUpper);
    const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.34, 8), skinMat);
    lFore.position.y = -0.42;
    armL.add(lFore);
    const lHand = this.createAnatomicalHand(skinMat, false);
    lHand.position.y = -0.62;
    armL.add(lHand);

    group.userData = { head, jaw, eyelids, chest, armR, armL, prop: spitGroup, spit: spitGroup };
    return group;
  }

  // 8. ELDER ALISTAIR (The Titan Master: Weathered trenchcoat, silver hair, glowing talisman, titan rod)
  buildAlistairModel() {
    const group = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.85 }); // Midnight black wool
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xd2dae2, roughness: 0.9 }); // Flowing silver
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e9, roughness: 0.72, metalness: 0.02 });
    const talismanMat = new THREE.MeshBasicMaterial({ color: 0x00d2d3 }); // Glowing cyan runic light

    // Legs
    [-0.17, 0.17].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.74, 8), coatMat);
      leg.position.set(x, 0.37, 0);
      group.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.36), new THREE.MeshStandardMaterial({ color: 0x0f1115 }));
      boot.position.set(x, 0.08, 0.05);
      group.add(boot);
    });

    // Broad Torso with High-Collared Trenchcoat
    const chest = new THREE.Group();
    chest.position.y = 0.98;
    group.add(chest);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.33, 0.92, 10), coatMat);
    torso.position.y = 0.22;
    chest.add(torso);

    // Billowing Trenchcoat Tails behind legs
    const tails = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.15, 0.08), coatMat);
    tails.position.set(0, -0.4, -0.22);
    tails.rotation.x = -0.15;
    chest.add(tails);

    // Glowing Runic Talisman hanging at chest
    const talisman = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), talismanMat);
    talisman.position.set(0, 0.38, 0.34);
    chest.add(talisman);

    // Sculpted Head & Articulated Jaw with Grey Eyes
    const { head, jaw, eyelids } = this.createRealisticHeadAndFace(skinMat, 0x7f8c8d, hairMat, hairMat);
    head.position.y = 0.86;
    chest.add(head);

    // Flowing Silver Hair & Full Beard on Jaw
    const silverHair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.6), hairMat);
    silverHair.position.set(0, 0.06, 0);
    head.add(silverHair);

    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), hairMat);
    beard.scale.set(0.92, 1.45, 0.85);
    beard.position.set(0, -0.18, 0.16);
    jaw.add(beard);

    // Colossal Titan Carbon Rod strapped across back
    const titanRod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 4.0, 6), new THREE.MeshStandardMaterial({ color: 0x2f3640, metalness: 0.85, roughness: 0.2 }));
    titanRod.position.set(-0.16, 0.45, -0.32);
    titanRod.rotation.z = 0.58;
    chest.add(titanRod);

    // Right Arm resting on gnarled driftwood staff
    const armR = new THREE.Group();
    armR.position.set(0.44, 0.46, 0);
    chest.add(armR);

    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.38, 8), coatMat);
    rUpper.position.y = -0.19;
    armR.add(rUpper);

    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.34, 8), coatMat);
    rFore.position.set(0, -0.42, 0.1);
    rFore.rotation.x = -0.45;
    armR.add(rFore);

    const rHand = this.createAnatomicalHand(skinMat, true);
    rHand.position.set(0, -0.6, 0.2);
    armR.add(rHand);

    // Driftwood staff topped with Abyssal Pearl
    const staff = new THREE.Group();
    staff.position.set(0.08, -0.58, 0.22);
    const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.9, 6), new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 }));
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), talismanMat);
    pearl.position.y = 0.95;
    staff.add(staffShaft);
    staff.add(pearl);
    armR.add(staff);

    // Left Arm
    const armL = new THREE.Group();
    armL.position.set(-0.44, 0.46, 0);
    chest.add(armL);
    const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.38, 8), coatMat);
    lUpper.position.y = -0.19;
    armL.add(lUpper);
    const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.34, 8), coatMat);
    lFore.position.y = -0.42;
    armL.add(lFore);
    const lHand = this.createAnatomicalHand(skinMat, false);
    lHand.position.y = -0.62;
    armL.add(lHand);

    group.userData = { head, jaw, eyelids, chest, armR, armL, prop: staff, talisman };
    return group;
  }

  // 7. REALISTIC ANIMATION: IDLE BREATHING, BLINKING, 3D EYE-CONTACT HEAD TRACKING, TALKING JAW ARTICULATION & CONVERSATIONAL GESTURES
  update(delta, playerPos) {
    if (!playerPos) return;
    this.talkAnimTimer += delta * 7.5;

    // Temporary vector to avoid GC pressure
    if (!this._worldVec) this._worldVec = new THREE.Vector3();

    // Iterate through all 9 NPCs
    for (const id in this.npcs) {
      const npc = this.npcs[id];
      if (!npc || !npc.root) continue;

      // True world position for accurate head tracking & distance check
      npc.root.getWorldPosition(this._worldVec);
      const dx = playerPos.x - this._worldVec.x;
      const dz = playerPos.z - this._worldVec.z;
      const dist = Math.hypot(dx, dz);

      // 1. Natural Human Idle Breathing (Chest expansion & resting sway)
      npc.breathTimer += delta * 1.85;
      const breath = Math.sin(npc.breathTimer);
      if (npc.chest) {
        npc.chest.scale.set(1.0 + breath * 0.02, 1.0, 1.0 + breath * 0.025);
      }

      // 2. Realistic Dynamic Eye Blinking
      npc.blinkTimer -= delta;
      if (npc.blinkTimer <= 0) {
        npc.blinkProgress += delta * 20.0;
        const blinkRot = -Math.PI / 2.3 + Math.sin(Math.min(Math.PI, npc.blinkProgress)) * 1.35;
        if (npc.eyelids && npc.eyelids.length > 0) {
          npc.eyelids.forEach(lid => { lid.rotation.x = blinkRot; });
        }
        if (npc.blinkProgress >= Math.PI) {
          npc.blinkProgress = 0;
          npc.blinkTimer = 3.2 + Math.random() * 3.0;
          if (npc.eyelids && npc.eyelids.length > 0) {
            npc.eyelids.forEach(lid => { lid.rotation.x = -Math.PI / 2.3; });
          }
        }
      }

      // 3. Smooth 3D Head Tracking (Turns head and maintains eye contact with player)
      if (dist < 13.0 && npc.head) {
        // Calculate relative yaw based on root's world orientation
        let rootYaw = npc.root.rotation.y;
        if (npc.root.parent && npc.root.parent.rotation) {
          rootYaw += npc.root.parent.rotation.y;
        }

        const targetYaw = Math.atan2(dx, dz) - rootYaw;
        let diffYaw = targetYaw - npc.head.rotation.y;
        while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
        while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;

        npc.head.rotation.y += diffYaw * 0.14;

        // Target pitch to look directly at player's head (playerPos.y + 1.6)
        const targetPitch = Math.max(-0.35, Math.min(0.35, ((playerPos.y + 1.6) - (this._worldVec.y + 1.7)) * 0.18));
        npc.head.rotation.x = THREE.MathUtils.lerp(npc.head.rotation.x, targetPitch, delta * 6);
      } else if (npc.head) {
        npc.head.rotation.y *= 0.92;
        npc.head.rotation.x *= 0.92;
      }

      // 4. Expressive Talking Animation: Articulated Lower Jaw & Conversational Gestures
      const isCurrentlySpeaking = (this.talkingNPC && this.talkingNPC.id === id && this.isTyping);
      if (isCurrentlySpeaking) {
        // Multi-harmonic speech mouth articulation (simulates phonetic open/close syllables)
        const jawOpening = Math.max(0, Math.sin(this.talkAnimTimer * 8.5) * 0.22 + Math.sin(this.talkAnimTimer * 17.0) * 0.08);
        if (npc.jaw) npc.jaw.rotation.x = jawOpening;

        // Conversational head nods
        if (npc.head) {
          npc.head.rotation.x += Math.sin(this.talkAnimTimer * 3.2) * 0.04;
          npc.head.rotation.z = Math.sin(this.talkAnimTimer * 2.1) * 0.03;
        }

        // Expressive talking hand gestures
        if (npc.armR) {
          npc.armR.rotation.z = -0.12 + Math.sin(this.talkAnimTimer * 2.2) * 0.18;
          npc.armR.rotation.x = (npc.restArmRx || -0.4) + Math.cos(this.talkAnimTimer * 1.8) * 0.16;
        }
        if (npc.armL) {
          npc.armL.rotation.z = 0.12 - Math.sin(this.talkAnimTimer * 2.0) * 0.14;
          npc.armL.rotation.x = -0.25 + Math.sin(this.talkAnimTimer * 1.5) * 0.12;
        }
      } else {
        // Mouth closes smoothly when silent
        if (npc.jaw) npc.jaw.rotation.x *= 0.82;

        // Limbs settle back smoothly to resting postures
        if (npc.armR) {
          npc.armR.rotation.x = THREE.MathUtils.lerp(npc.armR.rotation.x, npc.restArmRx || 0, delta * 4);
          npc.armR.rotation.z = THREE.MathUtils.lerp(npc.armR.rotation.z, 0, delta * 4);
        }
        if (npc.armL) {
          npc.armL.rotation.x = THREE.MathUtils.lerp(npc.armL.rotation.x, 0, delta * 4);
          npc.armL.rotation.z = THREE.MathUtils.lerp(npc.armL.rotation.z, 0, delta * 4);
        }
      }

      // 5. Dynamic Character-Specific Prop Animations
      if (id === 'rowan' && npc.prop) {
        // Slowly rotate fish skewer over campfire
        npc.prop.rotation.y += delta * 1.2;
      }
      if (id === 'ignis' && npc.prop) {
        // Rotate volcanic spit
        npc.prop.rotation.z += delta * 0.9;
      }
      if (id === 'alistair' && npc.prop && npc.root.userData && npc.root.userData.talisman) {
        // Pulse cyan talisman light
        const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.45;
        npc.root.userData.talisman.material.color.setHSL(0.5, 1.0, pulse);
      }
    }
  }
}

window.NPCSystem = NPCSystem;
