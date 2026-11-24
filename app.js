/* DBW WISCO store. Vanilla JS, no build step. Data: catalog.js. Settings: config.js. */
(function () {
  "use strict";
  var C = window.CATALOG, W = window.WISCO || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  /* Prices on the site are whole dollars. Cents only show where the math needs them (cost per foot). */
  var money = function (n) { n = Number(n); var w = Math.abs(n - Math.round(n)) < 0.005; return "$" + n.toLocaleString("en-US", { minimumFractionDigits: w ? 0 : 2, maximumFractionDigits: w ? 0 : 2 }); };
  var slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  var store = {
    get: function (k, d) {
      try {
        var v = localStorage.getItem("wisco." + k); if (!v) return d; v = JSON.parse(v);
        if (v == null) return d;
        if (d != null && typeof d === "object" && (typeof v !== "object" || Array.isArray(v) !== Array.isArray(d))) return d;
        return v;
      } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem("wisco." + k, JSON.stringify(v)); } catch (e) { } }
  };
  var FRANK = (W.managerName || "Frank").split(" ")[0];
  var RW = W.rewards || { review: "10% off your next order", referrer: "10% off their next order" };
  var BREAKS = W.breaks || [12, 24, 36, 50, 100, 150, 200, 500];
  var TIER = { supreme: "Supreme grade", premium: "Better · Premium grade", standard: "Good · Standard grade", economy: "Value · Economy grade", pro: "Pro Series" };
  /* "Best" belongs to the Dragons alone. The Superblade family and Swordfish sit one step under: High Performance. */
  var TOPTAG = { "dragon-supreme": "Best · Supreme grade", "dragon": "Best · Supreme grade", "superblade-extreme": "High Performance · Supreme grade", "super-g": "High Performance · Supreme grade", "superblade-g3": "High Performance · Supreme grade", "superblade-arrow": "High Performance · Supreme grade", "swordfish": "High Performance · Supreme grade" };
  function tierTag(f) { return /^Zenesis Green Kut/.test(f.n) ? "Top early-entry · Speed and life" : /^Arix Green Kut/.test(f.n) ? "Built for speed" : /^Green Kut/.test(f.n) ? "Built for long life" : TOPTAG[f.id] || TIER[f.tier]; }
  var TR = { supreme: 4, pro: 4, premium: 3, standard: 2, economy: 1, "": 0 };
  var SAWDIA = { grinder: [3, 9], cutoff: [12, 16], walk: [14, 99] };

  var MATS = [
    { k: "c", n: "Concrete", s: "Slabs, driveways, sidewalks, curb and gutter, parking lots, floors, foundations, walls, barrier wall, precast, concrete pipe", keys: ["c"] },
    { k: "r", n: "Hard & Reinforced", s: "Bridges and bridge decks, highway, airport, rebar, wire mesh, post-tension, river rock, hard aggregate", keys: ["r"] },
    { k: "g", n: "Green Concrete", s: "Early-entry joints, fresh pours, control joints, warehouse floors, next-day cuts", keys: ["g"] },
    { k: "a", n: "Asphalt", s: "Roads, parking lots, patching, utility trenching, overlays, loop cuts, asphalt over concrete", keys: ["a"] },
    { k: "bp", n: "Brick, Block & Pavers", s: "Hardscape, masonry, retaining wall, cinder block, CMU, fire brick, concrete pavers, clay pavers", keys: ["b", "p"] },
    { k: "s", n: "Stone & Granite", s: "Granite, marble, quartzite, engineered stone, limestone, sandstone, bluestone, flagstone, granite curb", keys: ["s"] },
    { k: "t", n: "Tile & Porcelain", s: "Ceramic, porcelain, large-format tile, marble, glass tile", keys: ["t"] },
    { k: "x", n: "Metal & Ductile", s: "Ductile iron pipe, cast iron, rebar, rail, steel, fire and rescue, demolition", keys: ["x"] },
    { k: "m", n: "Mortar Joints", s: "Tuckpointing, grout removal, crack chasing, joint cleanout", keys: ["m"] },
    { k: "sp", n: "Grinding & Coatings", s: "Level high spots, surface prep, strip epoxy, glue, thinset and paint", keys: ["sp"] }
  ];
  var SAWS = [
    { k: "grinder", n: "Angle Grinder", s: '4" to 9"', keys: ["grinder", "circ"] },
    { k: "cutoff", n: "Cut-Off Saw", s: 'Hand-held 12" to 16"', keys: ["cutoff"] },
    { k: "walk", n: "Walk-Behind Saw", s: "Push saws up to big flat saws", keys: ["walk"] },
    { k: "early", n: "Early-Entry Saw", s: "Soff-Cut style or Gorilla style", keys: ["early"] },
    { k: "table", n: "Tile / Masonry Saw", s: "Table and block saws", keys: ["table"], only: ["bp", "s", "t"] },
    { k: "wall", n: "Wall, Ring & Chain Saw", s: "Hydraulic, deep cut, diamond chain", keys: ["wall", "ring", "chain"] },
    { k: "core", n: "Core Drill or Core Rig", s: "Hand-held or rig mounted, any make or model", keys: ["core"] }
  ];
  var WANTS = [
    { k: "speed", n: "Fastest Cut", s: "Get me through it" },
    { k: "life", n: "Longest Life", s: "Most footage per blade" },
    { k: "price", n: "Lowest Price", s: "Keep the cost-in down" },
    { k: "frank", n: "Just Tell Me", s: FRANK + " picks, I cut" }
  ];
  /* The ladder our reps pitch on every call: Dragon first, then Extreme, T-Rex, Viper. */
  var LADDER = [
    { id: "dragon-supreme", label: "★ Unstoppable", rc: "" },
    { id: "dragon", label: "Exceptional Value", rc: "" },
    { id: "superblade-extreme", label: "High Performance", rc: "b" },
    { id: "super-g", label: "High Performance", rc: "b" },
    { id: "superblade-g3", label: "High Performance", rc: "b" },
    { id: "superblade-arrow", label: "High Performance", rc: "b" },
    { id: "swordfish", label: "High Performance", rc: "b" },
    { id: "t-rex", label: "Better Value", rc: "b" },
    { id: "viper-premium", label: "Good · Economical", rc: "g" },
    { id: "viper-general-purpose", label: "Good · Economical", rc: "g" }
  ];
  var LINES = [
    { k: "dragons", n: "The Dragons", s: "Our top multi-purpose blades. Red for long life. Purple when the job is everything at once.", ids: ["dragon-supreme", "dragon"], img: ["dragon-supreme", "dragon"] },
    { k: "superblades", n: "The Superblades", s: "Extreme, Super G, G3 and Arrow. Built to drop your cost per cut.", ids: ["superblade-extreme", "super-g", "superblade-g3", "superblade-arrow"], img: ["superblade-g3", "superblade-arrow"] },
    { k: "zenesis", n: "Green Kut Early-Entry", s: "Zenesis for speed and life. Arix for speed. Green Kut for life. Every one color-matched to your aggregate.", ids: ["zenesis-green-kut-purple", "zenesis-green-kut-orange", "zenesis-green-kut-green", "zenesis-green-kut-red", "zenesis-green-kut-yellow", "arix-green-kut-purple", "arix-green-kut-orange", "arix-green-kut-green", "arix-green-kut-red", "arix-green-kut-yellow", "green-kut-purple", "green-kut-orange", "green-kut-green", "green-kut-red", "green-kut-yellow", "green-kut-black", "green-kut-next-day"], img: ["zenesis-green-kut-purple"] },
    { k: "4-core", n: "4-Core Bits", s: "Punisher, Wolv and Sabertooth. Pro Series bits for heavy rebar and hard aggregate.", ids: ["punisher", "wolv", "sabertooth"], img: ["punisher", "wolv", "sabertooth"] }
  ];
  LINES.push(
    { k: "workhorses", n: "T-Rex & Viper", s: "The everyday workhorses. Fast, fair priced, on the truck every day.", ids: ["t-rex", "viper-premium", "viper-general-purpose", "viper-supreme-turbo", "viper-specialty"], img: ["t-rex", "viper-premium"] },
    { k: "wet", n: "Wet & Flat Saw Blades", s: "Bonded for your area and what you cut. Walk-behind, looping, wall saw and prestress.", cat: "wet", ids: [], img: ["3mlb-low-hp-concrete", "kmlb-low-hp-asphalt-green"] },
    { k: "asphalt", n: "Wolverine Asphalt", s: "Hard bonds and drop segments for asphalt and abrasive material.", ids: ["wolverine-supreme", "wolverine-premium-plus-drop-segment", "wolverine-premium"], img: ["wolverine-supreme", "wolverine-premium"] },
    { k: "metal", n: "Blacksmyth & Ductile", s: "Ductile pipe, rail, rebar and rescue. One blade instead of a box of abrasives.", cat: "metal", ids: [], img: ["blacksmyth-supreme", "americut-ductile-premium"] }
  );
  var DONTFORGET = [
    { cat: "core", n: "Core bits" }, { cat: "chain", n: "Diamond chain" }, { cat: "abrasive", n: "Abrasive wheels" },
    { cat: "small", n: "Small diameter blades" }, { cat: "cup", n: "Cup wheels" }, { cat: "wet", n: "Large wet blades" },
    { cat: "tuck", n: "Tuck point blades" }, { cat: "green", n: "Green concrete blades" }
  ];
  /* Typical max depth of cut. A saw's guard and flanges can move it by up to half an inch. */
  var DEPTH = [
    ["Angle grinder", [['4"', '1"'], ['4-1/2"', '1-1/4"'], ['5"', '1-1/2"'], ['7"', '2-1/4"'], ['9"', '3-1/4"']]],
    ["Hand-held cut-off saw", [['12"', '4"'], ['14"', '5"'], ['16"', '6"']]],
    ["Walk-behind / flat saw", [['14"', '4-5/8"'], ['16"', '5-5/8"'], ['18"', '6-5/8"'], ['20"', '7-5/8"'], ['24"', '9-5/8"'], ['26"', '10-5/8"'], ['30"', '11-3/4"'], ['36"', '14-3/4"']]],
    ["Early-entry saw", [['6"', '1-3/16"'], ['8"', '2"'], ['10"', '3"'], ['12"', '4"'], ['13-1/2"', '4-1/2"'], ['14"', '5"']]],
    ["Deep-cut tools", [["Ring saw, 14\"", '10"'], ["Cut-n-Break, 9\"", '16" in passes'], ["Diamond chain saw", "bar length: 10\" to 25\""], ["Core bit", "barrel length: 9\" to 24\""]]]
  ];
  /* Big Frank: the comment machine. Short, in his voice, never a made-up claim. */
  var QUIP = {
    home: ["We don’t build our blades down to a cost. We build them up to a standard.", "When you do good work, you get paid for it. So do I.", "Let the blades do the talking.", "A catalog is just paper. The blade is where the story gets told.", "Give me 1% of your confidence. I’ll do the work and earn the other 99%.", "I don’t miss twice.", "I make the most money when guys reorder. So I need that blade to work.", "If I can’t beat it, I’ll be the first to tell you.", "Cheaper is only a better deal if the blade performs.", "A bad blade mid-job is expensive. Your guys lose time, you replace it early, and the cut goes sideways.", "The diamonds do the cutting. You know that as well as I do.", "Is your blade cutting concrete like butter, or like FROZEN peanut butter?", "The wrong blade on a good saw is like regular fuel in a race car. It’ll run. It just won’t run right.", "Once your crew runs one, they’ll ask what took you so long to call me.", "Match the blade to the job.", "Two suppliers fighting for your business. That’s a good spot to be in.", "Cheaper per box isn’t cheaper per cut. Price per foot is the number that matters.", "You don’t want the cheapest blade. You want the lowest cost per foot. Those are two different blades.", "A blade that quits halfway through the job costs you more than the blade.", "If your crew is changing blades, they aren’t cutting. Blade life is labor.", "The right bond for the material beats a pricier blade with the wrong one. Every time.", "Blade spinning but not cutting? It’s glazed. Wrong bond for the material.", "Hard material needs a soft bond. Soft, abrasive material needs a hard bond. Most blade problems start right there.", "The more you buy, the better the price. Ask before you send it.", "When’s the last time your blade guy called you with a better deal?", "You should be able to reach a real person who knows your account. Here, you can.", "Renting your saws? Run the numbers on owning one.", "Buying a saw? Buy it with the blades. That’s where the deal is.", "One blade that cuts concrete, block and asphalt means one blade on the truck.", "Tell me the material and the saw and I’ll tell you the blade. That part isn’t complicated.", "If a blade doesn’t do what I said it would, I want to hear about it first.", "Your saw is only as good as what’s spinning on it.", "Fast cut or long life? Tell me which one pays you and I’ll point you at the blade.", "Rebar and river rock will tell you fast what a blade is made of.", "A dull blade doesn’t just cut slow. It’s hard on the saw and on the guy running it.", "Aggregate changes from one region to the next. Your wet blade should be bonded for yours. Ours are.", "Send me a picture of what you’re running now. I’ll tell you if there’s a better blade for it.", "I’d rather sell you the right blade once than the wrong one twice.", "In this business since 2002. I’m not always right, but I’m not wrong very often either.", "Not sure what to run on that job? Ask. That’s what I’m here for."],
    mat: ["Tell me what you’re cutting. The material picks the bond."],
    saw: ["What saw? I’ll only show sizes that fit it."],
    want: ["Speed, life or price. Pick the one that matters most on this job."],
    reorder: ["The part number is printed on the blade. Type that and you’re done."],
    shop: ["Everything has a price on it. Buying a stack? Ask for the break.", "Don’t see it? That doesn’t mean we can’t get it."],
    equipment: ["Make, model, how soon. Give me that and I’ll go find the deal.", "Renting your saws? Run the numbers on owning one."],
    depth: ["Rule of thumb: a 14 cuts 5 inches. Need deeper? Go 16, or ask about a ring saw."],
    fix: ["Most blade problems are the wrong bond for the material. Tell me the symptom."],
    cost: ["Put in your own numbers. The math doesn’t care who sold you the blade."],
    send: ["Fill it in once. Next time it’s two taps."],
    line: ["These are the ones we put our name on."]
  };
  function bigSaw(sw) { return !sw || ["cutoff", "walk"].indexOf(sw.k) >= 0; }
  var MATQUIP = {
    c: "Cured concrete: start with the Dragon. Tight budget, the T-Rex holds up.",
    r: "Rebar and river rock glaze a hard blade fast. You want a bond that stays open.",
    g: "Green concrete is a timing job. Get the joints in clean and get out.",
    a: "Asphalt is abrasive. A soft blade dies early on it. Run a hard bond.",
    bp: "Pavers and block: clean edges, fewer wasted pieces.",
    s: "Granite glazes a blade over. You want one that keeps exposing diamond.",
    t: "Porcelain chips easy. Thin rim, light pressure, let the blade work.",
    x: "Still burning abrasive wheels on ductile? A Blacksmyth holds its depth, first cut to last.",
    m: "Tuck pointing: you want a blade that holds its width down the joint.",
    sp: "Double row for a flat floor. T-Seg for stripping coatings."
  };
  var TIERQUIP = { supreme: "More per blade, less per cut. That’s the whole point of this one.", pro: "Pro Series. Built for the hard jobs.", premium: "Good everyday blade. Crews stock these by the box.", standard: "Does the job at a fair price. Step up when the material gets hard.", economy: "Budget blade. Fine for the short job." };
  function says(text, big) { return '<div class="bfs' + (big ? " big" : "") + '"><img alt="" src="' + askImg(big) + '"><div><b>' + esc(SAYER()) + " says</b><p>" + esc(text) + "</p></div></div>"; }

  /* Blade trouble guide. Causes and fixes follow the DBW troubleshooting page. */
  var FIX = [
    { k: "glazed", n: "It spins but won’t cut", s: "Blade stopped cutting. Feels like pushing, not cutting.", why: "The blade is glazed. The bond is too hard for what you’re cutting, so it isn’t wearing away fast enough to expose fresh diamond.", now: "Make a few cuts in something soft and abrasive (asphalt, a concrete block, sandstone) to open the blade back up.", fix: "Run a softer bond made for hard material.", ids: ["dragon-supreme", "superblade-arrow", "swordfish"] },
    { k: "fast", n: "Blades wear out too fast", s: "Short life. You’re burning through them.", why: "The bond is too soft for the material. Abrasive material like asphalt, block and green concrete strips diamond out of a soft blade early.", now: "Check that the blade is rated for the saw and that water flow is good if you cut wet.", fix: "Run a harder bond made for abrasive material.", ids: ["wolverine-supreme", "wolverine-premium", "superblade-extreme"] },
    { k: "under", n: "The core is wearing under the segments", s: "Undercutting. Steel wears away below the diamond.", why: "Abrasive fines are grinding the steel core faster than the segments wear.", now: "If you cut wet, turn the water up to flush the cut.", fix: "Run a blade with undercut protection: drop segments or a wear-resistant core.", ids: ["superblade-extreme", "wolverine-premium-plus-drop-segment", "wolverine-supreme"] },
    { k: "wobble", n: "It wobbles or it’s warped", s: "Blade won’t run true.", why: "Usually the mount, not the blade: wrong collar size, dirty or loose flanges, or the saw running off its rated RPM. A blade that has been dropped or twisted is done.", now: "Check the flanges are clean and tight and the collars are the right size. Check the RPM rating on the blade against the saw.", fix: "If the core is bent, take it out of service. It is not safe to run.", ids: [] },
    { k: "segs", n: "It’s losing segments", s: "Segments coming off.", why: "Either the blade is too hard for the material, or the core is worn from undercutting and can’t hold them.", now: "Stop using that blade.", fix: "Match the blade to the material, and use enough water to flush the cut.", ids: ["dragon-supreme", "superblade-extreme", "t-rex"] },
    { k: "crack", n: "Cracks in the core or segments", s: "Hairline cracks.", why: "The blade is too hard for the material, or the saw needs attention: bearings, belts, shaft or flanges.", now: "Stop using that blade. Check the saw and the direction of rotation.", fix: "Run a softer bonded blade rated for that saw.", ids: ["dragon-supreme", "hybrid"] },
    { k: "hot", n: "It’s overheating", s: "Blued core, burning smell.", why: "Not enough coolant. Wet blades need steady water. Dry blades need shallow passes and air.", now: "Check water flow. Cutting dry, take shallow passes and let the blade spin free every 10 to 15 seconds.", fix: "Make sure the blade is rated for the saw and for dry cutting if you run dry.", ids: [] },
    { k: "uneven", n: "Segments wearing uneven", s: "One side wears faster.", why: "Uneven water on the two sides of the blade, or a saw problem: bad bearings, a worn arbor or a spindle out of line.", now: "Flush the water system and check both sides are getting flow.", fix: "Have the saw checked before it eats another blade.", ids: [] }
  ];
  var FIXWHY = {
    glazed: { "dragon-supreme": "Softer bond that keeps wearing on hard, reinforced concrete, so fresh diamond stays on the edge and it keeps biting.", "superblade-arrow": "Arrow-shaped segments put less diamond on the cut at once. More pressure per diamond, so it keeps cutting hard material instead of polishing it.", "swordfish": "Open, aggressive segment built for speed on hard material. It clears the slurry that glazes a blade over." },
    fast: { "wolverine-supreme": "Hard bond built for asphalt and abrasive material. It holds its diamond instead of letting the sand strip it.", "wolverine-premium": "Same hard asphalt bond at a lower cost-in. Made for abrasive material that eats a general-purpose blade.", "superblade-extreme": "Tall segments and a tough bond. More diamond to wear through before the blade is done." },
    under: { "superblade-extreme": "Built-in undercut protection keeps abrasive slurry off the steel under the segments.", "wolverine-premium-plus-drop-segment": "Drop segments reach down the side of the core and take the wear, so the steel doesn’t.", "wolverine-supreme": "Wide undercut-protecting segments made for asphalt, the most abrasive thing you cut." },
    segs: { "dragon-supreme": "Laser-welded segments on a softer bond. It cuts freely on hard material instead of hammering the welds.", "superblade-extreme": "Undercut protection keeps the core thick under the segments, so they have steel to hold onto.", "t-rex": "W-shaped segments cut cool and fast, with less shock on the weld." },
    crack: { "dragon-supreme": "A softer bond cuts without forcing it. Less stress on the core means fewer cracks.", "hybrid": "Runs wet or dry and cuts smooth on mixed material, so the blade isn’t fighting the cut." }
  };
  /* The questions customers actually ask, answered straight. From the sales floor. */
  var ANSWERS = [
    ["I already have a blade supplier.", "Good. You should. Are you under contract, or just used to calling the same guy? When’s the last time he called you with a better deal? Tell me what you cut and what saw you run. I’ll recommend the blade and get you a price on your order."],
    ["Your price looks high.", "Compared to what? Send us what you’re paying and we’ll show you where we are. If we can’t beat it or match it, we’ll be the first to tell you. And the more you buy, the better your price gets."],
    ["I can get blades cheaper at the supply house.", "Per box, maybe. Price per foot of cut is what counts on a job. A blade that lasts longer costs less per cut. Run it yourself in the cost-per-cut calculator."],
    ["What if a blade doesn’t do what you said?", "If my blades don’t do everything I said they would, and more, I’ll do whatever it takes to make it right. Most of the time it’s the wrong bond for the material, and that’s on me to get right."],
    ["I don’t like ordering this way.", "Then don’t. Call or text your rep and order the way you always have. This site is for the days you just want to punch it in and go. Nothing here charges a card, and a person confirms every order."],
    ["I just bought blades. I’m good right now.", "I’m not asking you to throw out your stock. Keep my number. When you’re ready to reorder, send me your blade, size and quantity and I’ll have a price back to you fast."],
    ["It’s slow right now. Call me in the spring.", "Slow season is the smart time to buy. You’re not buying for today. You’re buying so the first day your crew is back to full speed, the right blades are on the saw and nobody’s scrambling."],
    ["Last time the blades didn’t work for my guys.", "Tell me what they were cutting and what was happening. A lot of times there’s a fixable reason. I may have sent the wrong bond for your job. Let me make it right. I don’t miss twice."],
    ["I don’t want to open an account.", "Then don’t. I’m going to work with however you do business, not the other way around. Open account, card, or check. Billing should never be the reason you go without blades."],
    ["I’ve been burned by phone guys before.", "I respect that. If I were you I’d say the same thing. So hold me to what I tell you. I’m not going to promise you something I can’t deliver."],
    ["I get a good price from my supplier.", "A good price on a blade that lasts, or a good price on a blade you replace twice as often? Cost per cut is where you’re winning or bleeding money. If I can’t beat it or match it with a better blade, I’ll be the first to tell you."],
    ["I don’t have time for this.", "Then give me one answer: what size blade are you running? That’s all I need to put something worth your time in front of you. Fast Reorder is two taps."],
    ["I’ll think about it.", "Fair. What part? Text me the question and I’ll answer it straight, today."],
    ["I’m not sure which blade I need.", "Tell us the material and the saw. That’s all we need. Use the Blade Finder, or ask Frank and get one answer."]
  ];

  /* Starter orders: one tap loads a sensible first order. [family id, diameter, qty]. Everything stays editable. */
  var STARTERS = [
    { k: "concrete", n: "Concrete crew", s: "Dragon and T-Rex for the cut-off saws, turbo cups for the grinders.", items: [["dragon", 14, 6], ["t-rex", 14, 6], ["turbo-cup-premium", 7, 2]] },
    { k: "asphalt", n: "Paving crew", s: "Wolverine Supreme for production, Wolverine Premium for the patch truck.", items: [["wolverine-supreme", 14, 6], ["wolverine-premium", 14, 6]] },
    { k: "hardscape", n: "Hardscape crew", s: "Superblade G3 and Hybrid for pavers and block, Blue Tornado for the grinders.", items: [["superblade-g3", 14, 6], ["hybrid", 14, 3], ["blue-tornado", 4.5, 6]] },
    { k: "utility", n: "Utility crew", s: "Dragon Supreme for concrete and pipe, Blacksmyth and Ductile for iron.", items: [["dragon-supreme", 14, 6], ["blacksmyth", 14, 3], ["americut-ductile-premium", 14, 3]] }
  ];
  function starterLines(st) { return st.items.map(function (it) { var f = FAM[it[0]], v = f && f.vars.filter(function (x) { return x[2] === it[1]; })[0]; return v ? { f: f, v: v, q: it[2] } : null; }).filter(Boolean); }
  function startersHTML() {
    return '<div class="starters swipe">' + STARTERS.map(function (st) { var L = starterLines(st); if (!L.length) return ""; var tot = L.reduce(function (n, l) { return n + l.v[3] * l.q; }, 0), cnt = L.reduce(function (n, l) { return n + l.q; }, 0);
      return '<div class="starter"><b>' + esc(st.n) + "</b><span>" + esc(st.s) + "</span><ul>" + L.map(function (l) { return "<li>" + l.q + " x " + esc(l.f.n) + " " + esc(String(l.v[2])) + '"</li>'; }).join("") + '</ul><div class="st-foot"><em>' + cnt + " pieces" + (HIDE ? "" : " · " + money(tot) + " Buy It Now") + '</em><button class="add" data-starter="' + st.k + '">Load it</button></div></div>'; }).join("") + "</div>";
  }
  var HDEPTH = { 12: '4"', 14: '5"', 16: '6"' }, GDEPTH = { 4: '1"', 4.5: '1-1/4"', 5: '1-1/2"', 7: '2-1/4"', 9: '3-1/4"' };
  function depthFor(f, v) { if (!v[2]) return ""; if (f.saws.indexOf("cutoff") >= 0 && HDEPTH[v[2]]) return HDEPTH[v[2]]; if (f.saws.indexOf("grinder") >= 0 && GDEPTH[v[2]] && f.cats.indexOf("cup") < 0) return GDEPTH[v[2]]; return ""; }

  var byK = function (arr, k) { return arr.filter(function (x) { return x.k === k; })[0]; };

  var FAM = {}, SKU = {}, MATNAME = {}, SAWNAME = {}, CATNAME = {};
  C.materials.forEach(function (m) { MATNAME[m.k] = m.n; });
  C.saws.forEach(function (s) { SAWNAME[s.k] = s.n; });
  C.cats.forEach(function (c) { CATNAME[c.k] = c.n; });
  C.families.forEach(function (f, i) {
    f.i = i; FAM[f.id] = f;
    f.hay = (f.n + " " + f.hook + " " + f.vars.map(function (v) { return v[0] + " " + v[1] + " " + v[4]; }).join(" ")).toLowerCase();
    f.vars.forEach(function (v, vi) { var k = v[0].toUpperCase().replace(/[^A-Z0-9.]/g, ""); if (!SKU[k]) SKU[k] = [f, vi]; });
  });

  function lastOrder() { var l = store.get("last", null); return l && Array.isArray(l.items) ? l : null; }
  var cart = store.get("cart", []);
  /* A rep's own page lives one folder down (/adamwest/). ROOT is always the store's main address. */
  var ROOT = location.origin + (window.WISCO_REP ? location.pathname.replace(/[^\/]+\/(index\.html)?$/, "") : location.pathname);
  var isPreview = !/^https?:$/.test(location.protocol) || /claude|anthropic/.test(location.hostname);
  var wiz = { mode: "finder", mat: null, saw: null, want: null, all: false, hp: null };
  var LOWHP = W.lowHpMax || 20, WETLINE = "Our wet blades are specifically bonded for your area and what you are cutting, so you get optimal performance every time.";
  var HPS = [{ k: "low", n: "Low horsepower", s: "Up to " + LOWHP + " HP. Push saws and small walk-behinds." }, { k: "high", n: "High horsepower", s: "Over " + LOWHP + " HP. Flat saws from 35 to 110 HP. Blades 14\" to 68\"." }, { k: "any", n: "Not sure", s: "Show me what fits and I’ll ask." }];
  var SHOPPAGE = 12, ordRef = "";
  var shop = { cat: "all", q: "", sort: "pop", n: SHOPPAGE, tag: "" };
  var deal = store.get("deal2", { saw: "", lines: [] });
  var extras = { free: "", stock: false, breaks: [] };

  /* ---------- small pieces ---------- */
  function vkey(v) { return v[0] + "|" + v[1]; }
  function findVar(f, key) { for (var i = 0; i < f.vars.length; i++) if (vkey(f.vars[i]) === key) return f.vars[i]; return null; }
  function vlabel(v) { return [v[1], v[4]].filter(Boolean).join(" · ") || v[0]; }
  function rating(f, mat) { if (!mat) return 0; var r = 0; mat.keys.forEach(function (k) { r = Math.max(r, f.m[k] || 0); }); return r; }
  function fitsSaw(f, saw) { return !saw || saw.keys.some(function (k) { return f.saws.indexOf(k) >= 0; }); }
  function inSaw(v, saw) { if (!saw || !SAWDIA[saw.k]) return true; return v[2] != null && v[2] >= SAWDIA[saw.k][0] && v[2] <= SAWDIA[saw.k][1]; }
  function varsFor(f, saw) { var a = f.vars.filter(function (v) { return inSaw(v, saw); }); return a.length ? a : f.vars; }
  function defVar(f, vs) { var pref = f.cats.indexOf("highspeed") >= 0 ? 14 : (f.cats.indexOf("small") >= 0 ? 4.5 : null); for (var i = 0; i < vs.length; i++) if (pref && vs[i][2] === pref) return vs[i]; return vs[0]; }
  function stars(r) { return '<span class="stars" style="--p:' + (r / 5 * 100) + '%" role="img" aria-label="' + r + ' out of 5"></span>'; }
  function pic(f) { return '<span class="pic ' + (f.img ? "" : "none") + '">' + (f.img ? '<img loading="lazy" alt="" src="img/' + esc(f.img) + '">' : "") + "</span>"; }
  /* Any number goes in the box. The buttons under it name the price breaks and set the box. One button adds to the cart. */
  function howMany(setAttr, goAttr) {
    return '<div class="qhow2"><div class="qadd">' + qtyHTML(1) + '<button type="button" class="btn gold qgo" ' + goAttr + '>Add to cart</button></div>' +
      '<div class="qbrk" role="group" aria-label="Price breaks"><span>Better price at</span>' + QUICK.map(function (q) { return '<button type="button" ' + setAttr + '="' + q + '" aria-label="Set quantity to ' + q + '">' + q + "</button>"; }).join("") + "</div>" +
      '<small class="qbrknote">Any number works. The more you buy, the better the price.</small></div>';
  }
  function howSet(el, n) { var box = el.closest(".qhow2"), inp = $(".qty input", box); inp.value = n; $$(".qbrk button", box).forEach(function (b) { b.classList.toggle("on", b === el); }); var g = $(".qgo", box); g.textContent = "Add " + n + " to cart"; }
  function howQty(el) { return Math.max(1, parseInt($(".qty input", el.closest(".qhow2")).value, 10) || 1); }
  function qtyHTML(n) { return '<span class="qty"><button type="button" data-q="-1" aria-label="Fewer">−</button><input type="number" inputmode="numeric" min="1" max="9999" value="' + n + '" aria-label="Quantity"><button type="button" data-q="1" aria-label="More">+</button></span>'; }
  function toast(msg) { var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2400); }
  var PROMO = (W.promos || {}).cardFreeBlade || {}, PROMO_ON = !!PROMO.on;
  function isCard(pay) { return /card/i.test(pay || ""); }
  function promoBar() { return PROMO_ON ? '<div class="promo"><b>' + esc(PROMO.title || "Free blade when you pay this order by card") + "</b><span>" + esc(PROMO.text || "") + "</span></div>" : ""; }
  /* priceMode "account": the site shows one list price. Nobody is charged list. The rep bills the account price.
     priceMode "brackets": the site shows quantity prices and prices the order itself. */
  var PRIVCAT = C.private === true;   /* a catalog built with --private holds no prices: nothing can turn them back on */
  var ACCT = PRIVCAT || W.priceMode !== "brackets", RNG = !PRIVCAT && W.priceMode === "range", HIDE = PRIVCAT || W.priceMode === "private";   /* "private": no price is shown anywhere unless a rep link carries the customer's own. */
  function lowOf(v) { return typeof v[6] === "number" && v[6] > 0 && v[6] < v[3] ? v[6] : v[3]; }
  function ranged(v) { return lowOf(v) < v[3]; }
  var BRK = [12, 24, 36, 50, 100];
  function tiered(v) { return v && Array.isArray(v[6]); }
  function eachAt(v, q) { if (!tiered(v)) return v[3]; var i = 0; BRK.forEach(function (b, k) { if (q >= b) i = k + 1; }); return i ? v[6][i - 1] : v[3]; }
  function rangeTxt(v) { if (HIDE) return ""; return tiered(v) ? money(v[6][4]) + " to " + money(v[3]) : ranged(v) ? money(lowOf(v)) + " to " + money(v[3]) : money(v[3]); }
  function totTxt(t) { if (HIDE && !t.quoted) return "Priced by your rep"; return RNG && !t.quoted && t.low < t.total - 0.005 ? money(t.low) + " to " + money(t.total) : money(t.total); }
  function buyRow(v) { if (HIDE) return '<div class="buy-row" data-row><div class="partno">Part # ' + esc(v[0]) + '</div><div class="act">' + qtyHTML(1) + '<button class="add" data-add>Add to cart</button></div></div>';
    return '<div class="buy-row" data-row><div class="price' + (tiered(v) || ranged(v) ? " rng" : "") + '">' + rangeTxt(v) + "<small>" + (HIDE ? "confirmed by your rep before it ships · " : tiered(v) ? "each, by quantity · " : ranged(v) ? "each · your rep sets your price · " : RNG ? "each · " : ACCT ? "list price · " : "") + esc(v[0]) + '</small></div><div class="act">' + qtyHTML(1) + '<button class="add" data-add>Add to order</button></div></div>'; }
  var MIXM = W.mixMonths || [3, 5, 8, 10], ONEMIN = W.singleItemMin || 24, QUICK = W.quickQty || [12, 24, 36, 50], MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function mixOn() { return MIXM.indexOf(new Date().getMonth() + 1) >= 0; }
  function breakList() { return BREAKS.slice(0, -1).join(", ") + " and " + BREAKS[BREAKS.length - 1]; }
  function mixNames() { var a = MIXM.map(function (m) { return MONTHS[m - 1]; }); return a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function mixLine() { if (HIDE) return ""; return mixOn() ? "Mix and match is on this month: blades in the same size group count together toward your price break." : "Mix and match pricing runs in " + mixNames() + ". This month, special pricing takes " + ONEMIN + " of the same item."; }
  /* Where the order stands against the price breaks. Mix months count the whole order; other months count the biggest single line. */
  function breakState(t) {
    var mix = mixOn(), big = null, lg = 0, sm = 0;
    t.lines.forEach(function (l) { if (!big || l.c.q > big.c.q) big = l; if (l.v[2] && l.v[2] < 12) sm += l.c.q; else lg += l.c.q; });
    var n = mix ? Math.max(lg, sm) : (big ? big.c.q : 0), list = mix ? BREAKS : BREAKS.filter(function (q) { return q >= ONEMIN; });
    var nb = list.filter(function (q) { return q > n; })[0], pb = list.filter(function (q) { return q <= n; }).pop();
    return { mix: mix, n: n, nb: nb, pb: pb, of: mix ? (lg >= sm ? " large blades" : " small blades") : (big ? " of " + big.f.n : " of one item"), need: nb ? nb - n : 0 };
  }
  function breaksLine() { return 'Buying more? <button class="more" data-breaks>Ask for ' + BREAKS.join(", ") + " piece price breaks</button>"; }

  function cardHTML(f, o) {
    o = o || {};
    var vs = varsFor(f, o.saw), first = defVar(f, vs), r = rating(f, o.mat);
    var size = vs.length > 1
      ? '<select aria-label="Size" data-size>' + vs.map(function (v) { return '<option value="' + esc(vkey(v)) + '"' + (v === first ? " selected" : "") + ">" + esc(vlabel(v)) + "</option>"; }).join("") + "</select>"
      : '<div class="one">' + esc(vlabel(first)) + "</div>";
    return '<article class="card' + (o.pick ? " pick" : "") + '" data-f="' + f.id + '">' +
      (o.ribbon ? '<div class="ribbon ' + (o.rc || "") + '"><span>' + o.ribbon + "</span>" + (o.ribbon2 ? "<span>" + o.ribbon2 + "</span>" : "") + "</div>" : "") +
      '<button class="c-top" data-open aria-label="Details for ' + esc(f.n) + '">' + pic(f) + "<span>" +
      (f.tier ? '<span class="tier ' + f.tier + '">' + (o.ribbon ? tierTag(f).split(" · ").pop() : tierTag(f)) + "</span>" : "") + "<h3>" + esc(f.n) + "</h3>" +
      (r ? '<span class="rate">' + stars(r) + "<span>Our rating <b>" + r.toFixed(1) + "</b> on " + esc(o.mat.n) + "</span></span>" : "") + "</span></button>" +
      (f.hook ? '<p class="hook">' + esc(f.hook) + "</p>" : "") +
      '<div class="buy">' + size + buyRow(first) + '<button class="learn" data-open><b>Learn more</b><span>Why it works · ' + f.vars.length + (f.vars.length === 1 ? " size" : " sizes") + "</span></button>" + (f.cats.indexOf("equip") >= 0 ? '<button class="btn gold sm block" data-equip>Negotiate with your sales rep</button>' : "") + "</div></article>";
  }

  /* ---------- picking blades ---------- */
  function isDragon(f) { return f.id === "dragon-supreme" || f.id === "dragon"; }
  function isHiHp(f) { return f.id.indexOf("americut-high-hp") === 0; }
  function hpClass(f) { return /35-60/.test(f.id) ? "35 to 60 HP saws" : "65 to 110 HP saws"; }
  function candidates(mat, saw) {
    var all = candidatesRaw(mat, saw), wolf = mat && (mat.k === "a" || mat.k === "g");
    var good = all.filter(function (f) { return f.id.indexOf("eagle") !== 0 && (wolf || f.id.indexOf("wolverine") !== 0) && f.cats.indexOf("equip") < 0 && (mat.k === "x" || f.cats.indexOf("metal") < 0); });
    return good.length ? good : all;
  }
  function candidatesRaw(mat, saw) {
    return C.families.filter(function (f) { return rating(f, mat) >= 3 && fitsSaw(f, saw) && (!saw || !SAWDIA[saw.k] || f.vars.some(function (v) { return inSaw(v, saw); })); });
  }
  function priceFor(f, saw) { return defVar(f, varsFor(f, saw))[3]; }
  function rank(list, mat, saw, want) {
    var a = list.slice();
    a.sort(function (x, y) {
      var rx = rating(x, mat), ry = rating(y, mat);
      if (want === "price") return (priceFor(x, saw) - priceFor(y, saw)) || (ry - rx);
      if (want === "life") return (TR[y.tier] - TR[x.tier]) || (ry - rx) || (x.rank - y.rank);
      if (want === "frank") return (x.rank - y.rank) || (ry - rx);
      return (ry - rx) || (x.rank - y.rank) || (TR[y.tier] - TR[x.tier]) || (x.i - y.i);
    });
    return a;
  }
  function ladder(list) {
    var ids = {}; list.forEach(function (f) { ids[f.id] = f; });
    return LADDER.filter(function (L) { return ids[L.id]; }).map(function (L) { return { f: ids[L.id], label: L.label, rc: L.rc }; });
  }
  /* Good, better, best: the first blade on each rung. */
  function rungs(lad) { var seen = {}; return lad.filter(function (p) { if (seen[p.label]) return false; seen[p.label] = 1; return true; }); }
  function bestBetterGood(list, mat, saw) {
    var a = rank(list, mat, saw), out = [], used = {};
    [["supreme", "pro"], ["premium"], ["standard", "economy"]].forEach(function (tiers) {
      var hit = a.filter(function (f) { return tiers.indexOf(f.tier) >= 0 && !used[f.id]; })[0];
      if (hit) { used[hit.id] = 1; out.push(hit); }
    });
    a.forEach(function (f) { if (out.length < 3 && !used[f.id]) { used[f.id] = 1; out.push(f); } });
    out.sort(function (x, y) { return TR[y.tier] - TR[x.tier]; });
    var lab = [["★ Top pick", ""], ["Better", "b"], ["Good", "g"]];
    return out.map(function (f, i) { return { f: f, label: i === 0 && isDragon(f) ? "★ Best" : lab[Math.min(i, 2)][0], rc: lab[Math.min(i, 2)][1] }; });
  }

  /* ---------- screens ---------- */
  var app = $("#app");
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function setNav(h) { $$(".nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === h); }); }

  function welcomeBack() {
    var last = lastOrder(), n = last && last.items ? last.items.filter(function (c) { return FAM[c.f] && findVar(FAM[c.f], c.v); }).length : 0, who = (me().name || "").split(/\s+/)[0];
    if (!n) return "";
    return '<div class="last wb"><div><b>Welcome back' + (who ? ", " + esc(who) : "") + '.</b><span>Same as last time? ' + n + (n === 1 ? " line" : " lines") + " from " + esc(last.date) + '</span></div><button class="btn red sm" data-reorder>Reorder it</button></div>';
  }
  /* A rep's own page: their face, their name, their phone. */
  function isBoss(r) { return (r.aka || []).indexOf("frank") >= 0; }
  function repFirst(r) { return isBoss(r) ? "Big Frank" : r.nick ? r.nick : r.name.replace(/[“"].*?[”"]\s*/, "").split(" ")[0]; }
  function prettyPhone(c) { var d = String(c || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6) : ""; }
  function mineCard(r) {
    var cell = r.cell || W.textNumber || "", mail = r.email || (isBoss(r) ? W.orderEmail || "" : ""), who = isBoss(r) ? FRANK : repFirst(r);
    return '<div class="mine">' + (r.photo ? '<img alt="" src="brand/reps/' + esc(r.photo) + '">' : '<span class="av">' + esc(initials(r.name)) + "</span>") +
      '<div class="mine-id"><b>' + esc(isBoss(r) ? "Big Frank" : r.name) + "</b><span>Your Blade Guy</span>" + (prettyPhone(cell) ? '<a class="mine-num" href="tel:' + esc(cell) + '">' + prettyPhone(cell) + "</a>" : "") + "<small>Goes straight to " + esc(String(who).replace(/\.$/, "")) + (isBoss(r) ? " himself" : "") + ". Nothing automated. No AI bots.</small>" + (isBoss(r) ? '<small class="mine-247">My phone is on 24/7. Need bailing out past midnight? I’ll expect a big order in the morning.</small>' : "") + "</div>" +
      '<div class="mine-act">' + (cell ? '<a class="btn chrome sm" href="sms:' + esc(cell) + '">Text ' + esc(who) + "</a>" : "") + (mail ? '<a class="btn chrome sm" href="mailto:' + esc(mail) + '">Email ' + esc(who) + "</a>" : "") + (cell ? '<a class="btn chrome sm" href="tel:' + esc(cell) + '">Call ' + esc(who) + "</a>" : "") + '</div><button type="button" class="mine-x" data-norep>Not your rep? Tap here</button></div>';
  }
  var LASTS = [["recent", "Within 18 months"], ["old", "Longer than that"], ["unsure", "Don’t remember"]];
  function lastTxt(k) { return k === "recent" ? "within the past 18 months" : k === "old" ? "more than 18 months ago" : k === "unsure" ? "not sure" : ""; }
  var acctEdit = false;
  function acctBox() {
    var i = me(), r = repBySlug(i.rep), done = i.acctSet && !acctEdit, kind = i.acct === "new" ? "new" : i.acctSet ? "yes" : "";
    var fine = '<p class="acct-fine">Accounts with no order in 18 months are updated before reordering, and a new sales rep may be assigned.</p>';
    if (done && i.acct === "new" && !i.newSent) return '<div class="acct done newlead"><b>✓ New to DBW. Welcome.</b><span>One more tap and ' + esc(WHO()) + " sets you up. It opens a text that is already written. Nothing goes out until you hit Send.</span>" +
      '<button type="button" class="btn gold herogo block" data-newtext>Text ' + esc(WHO()) + ' so he can set me up</button><button type="button" class="link" data-acctedit>Change</button></div>';
    if (done) return '<div class="acct done"><b>✓ ' + esc(i.acct === "new" ? "New to DBW. Welcome." : (i.company || "Your account")) + "</b><span>" + esc((r ? "Rep: " + r.name : "Rep: we’ll match you") + (i.acct !== "new" && lastTxt(i.last) ? " · Last order: " + lastTxt(i.last) : "")) + '</span><button type="button" class="link" data-acctedit>Change</button></div>';
    return '<div class="acct" id="acctbox"><b class="acct-h">Already buy from us?</b><p class="acct-p">Tell us once, so your order lands with the right person.</p>' +
      '<div class="acct-seg" role="group" aria-label="Are you on account">' + [["yes", "Yes, I’m on account"], ["new", "I’m new"], ["unsure", "Not sure"]].map(function (x) { return '<button type="button" data-acctkind="' + x[0] + '" aria-pressed="' + (kind === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      '<div class="acct-more" id="acctmore"' + (kind === "yes" ? "" : " hidden") + ">" +
      '<label for="ac-co">What name is the account under?</label><input id="ac-co" autocomplete="organization" autocapitalize="words" placeholder="Company name" value="' + esc(i.company || "") + '">' +
      '<label for="ac-rep">Who’s your rep?</label><select id="ac-rep"><option value="">Not sure</option>' + (W.reps || []).map(function (x) { var sl = slug(x.name); return '<option value="' + sl + '"' + (r && slug(r.name) === sl ? " selected" : "") + ">" + esc(x.name) + "</option>"; }).join("") + "</select>" +
      '<label>When did you last buy from us?</label><div class="acct-seg three" role="group" aria-label="Last order">' + LASTS.map(function (x) { return '<button type="button" data-acctlast="' + x[0] + '" aria-pressed="' + (i.last === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      '<p class="acct-note">Don’t remember? No problem. We only ask because relationships are everything here. Like your salesperson? Keep buying from them.</p></div>' +
      '<button type="button" class="btn gold sm acct-save" data-acctsave' + (kind ? "" : " hidden") + ">Save</button>" + fine + "</div>";
  }
  var WHY = [
    ["Deep warehouse.", "Stock on the shelf means it ships same day or next. I’ll put our warehouse up against anybody’s."],
    ["We can get our hands on anything.", "If it cuts, cores or grinds, we either stock it or we know who does."],
    ["We’ve been at this a long time.", "We were here before most of the outfits calling you, and we’ll be here after."],
    ["Our own engineers.", "Manufacturing engineers and developers who build blades for a living. Built up to a standard, not down to a cost."],
    ["Reps who stay.", "The guy who sold you your first blade still answers his phone. Our people don’t leave."],
    ["Customers who reorder.", "Crews come back. That’s the whole business, and it’s why this site exists."]
  ];
  function bigFrank() {
    var cell = W.textNumber || "";
    return '<section class="sec bfsec"><div class="wrap narrow"><div class="bfhero"><img alt="Big Frank" loading="lazy" src="brand/reps/' + BOSSPIC + '"><div>' +
      '<span class="kick">In the blade business since 2002</span><h2>Big Frank, Your Blade Guy!</h2>' +
      '<p class="bfline">“Selling blades ain’t glamorous, but someone has to do it. I’m your guy.”</p>' +
      "<p>I’ve been in the blade business since 2002 and never left. Diamond Blade Warehouse has been at it since 1987.</p><p>That many years teaches you two things: what works, and who to call when you’re not sure. So tell me what you’re cutting and you’ll get a straight answer. If it’s a job I haven’t seen before, I know exactly who has, and I’ll get you the answer.</p><p>Either way you end up with the right blade at a fair price, from a guy who picks up when you call.</p>" +
      (cell ? '<div class="mine-act"><a class="btn gold shine" href="sms:' + esc(cell) + '">Text Big Frank</a><a class="btn chrome" href="tel:' + esc(cell) + '">Call ' + esc(W.textDisplay || "") + "</a></div>" : "") +
      '</div></div>' + fold("Why contractors buy from us", WHY.length + " reasons", '<ul class="why">' + WHY.map(function (x) { return "<li><b>" + x[0] + "</b> " + x[1] + "</li>"; }).join("") + "</ul>", "foldwhy") + "</div></section>";
  }
  function home() {
    var top = C.families.filter(function (f) { return f.rank < 99 && f.id.indexOf("eagle") !== 0 && f.cats.indexOf("core") < 0; }).slice(0, 16);
    var line = ["dragon", "superblade-g3", "dragon-supreme", "superblade-arrow", "zenesis-green-kut-purple"];
    var lines = LINES.map(function (L) {
      var fs = lineFams(L); if (!fs.length) return "";
      var from = Math.min.apply(null, fs.map(function (f) { return f.min; }));
      return '<a class="linecard" href="#line-' + L.k + '"><span class="lc-art">' + L.img.map(function (id) { return FAM[id] && FAM[id].img ? '<img alt="" loading="lazy" src="img/' + esc(FAM[id].img) + '">' : ""; }).join("") + "</span><b>" + esc(L.n) + "</b><span>" + esc(L.s) + "</span><em>" + (HIDE ? "See the line" : "From " + money(from)) + " →</em></a>";
    }).join("");
    var r0 = repBySlug(me().rep);
    var T = (W.testimonials || []).filter(function (t) { return t && t.quote; });
    app.innerHTML =
      '<section class="hero"><div class="wrap"><div>' +
      (function () { var r = repBySlug(me().rep); var rf = store.get("ref", ""); return '<span class="pill"><i>★</i> ' + (r ? "Your salesman: " + esc(r.name) : rf ? "Referred by " + esc(rf) : "A division of Diamond Blade Warehouse, LLC") + " <i>★</i></span>"; })() +
      (r0 ? mineCard(r0) : "") + '<span class="kick">Simplified reorder</span>' +
      "<h1>The right blade. Right now.</h1>" +
      '<p class="sub">Tell us what you cut. We ship it anywhere in the USA, same day or next. <b>Your blades, your price, 60 seconds.</b></p>' +
      '<div class="herocta"><a class="btn gold herogo shine" href="#reorder">Reorder my blades</a><a class="btn chrome" href="#finder">Find my blade</a></div>' + acctBox() +
      welcomeBack() + (!lastOrder() && !repBySlug(me().rep) ? '<div class="newhere"><b>New here?</b><span>Text a photo of your old blade, or tell us the size and how many. A real rep texts you back with your price.</span><div class="mine-act"><button class="btn gold sm" data-photo>Text a photo of my blade</button><button class="btn chrome sm" data-pricing>Get my price</button></div></div>' : "") +
      '<div class="doors">' +
      '<a class="door d3 withav" href="#ask"><img alt="" src="' + askImg() + '"><div><b>Ask ' + esc(WHO()) + "</b><span>Not sure? Get " + esc(SAYER()) + "’s pick in 3 taps.</span></div><em>→</em></a>" +
      "</div>" +
      '</div><div class="art"><img class="logo" src="brand/logo.webp" alt="DBW WISCO, a division of Diamond Blade Warehouse" width="430" height="458">' +
      '<div class="stage"><div class="lineup">' + line.map(function (n) { return '<img alt="" src="brand/lineup/' + n + '.webp">'; }).join("") + "</div></div></div></div></section>" +

      cpfBlock() +
      (PROMO_ON ? '<section class="promoband"><div class="wrap">' + promoBar() + "</div></section>" : "") +
      '<section class="costco"><div class="wrap"><div><b>' + (HIDE ? "No login. No card. No runaround." : "The more you buy, the better the price.") + "</b><span>" + (HIDE ? "Pick your blades and send the order. A real rep confirms your price before anything ships. Nothing is charged on this site." : RNG ? "Every blade shows a price range. Where you land depends on how many you buy and what you buy with it. Your rep sets your number and confirms it before anything ships." : ACCT ? "The price you see is list. Nobody pays list. Send your order and it’s billed at your account price, and that drops again at 12, 24, 36, 50 and 100." : "We price like Costco. Build your order and the price drops at 12, 24, 36, 50 and 100. Have an account? Your rep’s number beats ours.") + '</span></div><button class="btn gold shine" data-pricing>Get my price</button></div></section>' +

      '<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>Our heavy hitters</h2><p>The blades and bits we put our name on.</p></div><div class="lines">' + lines + '</div><div class="center"><a class="btn blue" href="#shop">Shop everything</a></div></div></section>' +



      '<section class="sec deal"><div class="wrap narrow"><div class="sec-head"><h2>Need a saw?</h2><p>Bundle a saw with your blades. One package price, one invoice. Your rep builds it and confirms your total.</p></div><div class="center"><a class="btn chrome shine" href="#saw-deal">Build my saw package</a><a class="btn ghost" href="#saw-deal" data-rentgo>Renting? Run the math</a></div></div></section>' +

      (myRep() ? "" : bigFrank()) +
      '<section class="sec alt"><div class="wrap narrow"><div class="sec-head"><h2>Real people. Real relationships.</h2><p>It matters more than anything else we do.</p></div>' + fold("How we do business", "Six things you can count on", '<ul class="ppl">' +
      "<li><b>Like your salesperson? Keep buying from them.</b> Your account stays with the person who earned it.</li>" +
      "<li><b>Nobody here is a robot.</b> We don’t send our sales overseas. We don’t run auto-dialers. No AI bot is ever going to call you. When your phone rings, it’s one of us.</li>" +
      "<li><b>We sell blades to put food on our families’ tables.</b> You run them to put food on yours.</li>" +
      "<li><b>Our reps stay.</b> Every one of them has been here a long time. They’re trained to know the answer, and smart enough to go ask when they don’t.</li>" +
      "<li><b>Once you buy from us, we work for you.</b> And you don’t even have to put us on payroll.</li>" +
      "<li><b>We know we’re not the only game in town.</b> But if we’re not the best, we’re pretty damn close.</li>" +
      "</ul>", "foldppl") + "</div></section>" +

      (HIDE ? "" : '<section class="sec levels"><div class="wrap"><div class="sec-head"><h2>Your account has a level</h2><p>The site price is the price with no account behind it. Your real price depends on your account level.</p></div><div class="three swipe">' +
      '<div class="lvl"><em>1</em><b>' + (HIDE ? "Pick it" : RNG ? "Price range" : ACCT ? "List price" : "Site price") + "</b><p>" + (HIDE ? "Find your blade and tap a quantity. No account or login needed." : RNG ? "What you see here. Your price lands inside it. Your rep sets the number." : ACCT ? "What you see here. It’s the ceiling. Nobody with an account pays it." : "What you see here. No account needed. It drops as the quantity goes up.") + "</p></div>" +
      '<div class="lvl"><em>2</em><b>Quantity breaks</b><p>' + breakList() + " pieces. " + esc(mixLine()) + "</p></div>" +
      '<div class="lvl top"><em>3</em><b>Account pricing</b><p>Every account has a level, and the price drops at each one. One quick text or email and we send back what your level gets you.</p><div class="lvls">' + (W.levels || ["Contractor", "Pro", "Gold", "Distributor", "Platinum"]).map(function (x, i, a) { return "<span" + (i === a.length - 1 ? ' class="top"' : "") + ">" + esc(x) + "</span>"; }).join("<i>›</i>") + "</div></div>" +
      '</div><div class="center"><button class="btn gold shine" data-account>Open a free account</button><button class="btn chrome" data-pricing>Check my account pricing</button><button class="btn ghost-d" data-terms>Apply for Net 30 terms</button></div></div></section>') +

      '<section class="sec"><div class="wrap narrow">' + fold("Straight answers", "The questions we hear every day", '<div class="qa">' + ANSWERS.filter(function (x, i) { return !HIDE || [0, 2, 3, 5].indexOf(i) >= 0; }).map(function (x) { return "<details><summary>" + esc(x[0]) + "</summary><p>" + esc(x[1]) + "</p></details>"; }).join("") + "</div>", "foldqa") + '<div class="promise"><b>Our word</b><span>If my blades don’t do everything I said they would, and more, I’ll do whatever it takes to make it right.</span><small>We don’t build our blades down to a cost. We build them up to a standard.</small></div></div></section>' +

      (T.length ? '<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>Straight from the jobsite</h2><p>Real customers. Their words.</p></div><div class="three">' + T.map(function (t) { return '<figure class="quote"><blockquote>' + esc(t.quote) + "</blockquote><figcaption>" + esc(t.who || "") + "</figcaption></figure>"; }).join("") + "</div></div></section>" : "") +

      '<section class="sec dark"><div class="wrap">' + fold("Two ways to save", "Leave a review or refer a contractor", '<div class="three swipe">' +
      '<div class="point"><b>Leave a review</b><p>Tell us how the blades held up, good or bad. An honest review earns you ' + esc(RW.review) + '.</p><button class="btn chrome sm" data-review style="margin-top:12px">Leave a review</button></div>' +
      '<div class="point"><b>Refer a contractor</b><p>Send someone our way. When they place a first order and name you, you get ' + esc(RW.referrer) + '.</p><button class="btn chrome sm" data-refer style="margin-top:12px">Refer a contractor</button></div>' +
      '<div class="point"><b>Just tell us</b><p>Something off with an order, a blade or a rep? ' + (myRep() ? esc(WHO()) + " and " + FRANK + " read" : esc(WHO()) + " reads") + ' every note.</p><button class="btn ghost sm" data-feedback style="margin-top:12px">Send ' + esc(WHO()) + " a note</button></div>" +
      "</div>", "foldsave") + "</div></section>";
    setNav("#home");
  }

  function dots(n, total) { var s = ""; for (var i = 1; i <= total; i++) s += '<i class="' + (i < n ? "done" : i === n ? "on" : "") + '"></i>'; return '<div class="dots" aria-label="Step ' + n + " of " + total + '">' + s + "</div>"; }
  function tiles(list, attr, cls) { return '<div class="tiles ' + (cls || "") + '">' + list.map(function (x) { return '<button class="tile" data-' + attr + '="' + x.k + '"><b>' + esc(x.n) + "</b><span>" + esc(x.s) + "</span></button>"; }).join("") + "</div>"; }
  function shell(kicker, step, total, body, wide) {
    return '<section class="screen wiz"><div class="wrap' + (wide ? " wide" : "") + '"><div class="wiz-top"><button class="back" data-back>← Back</button>' + (total ? dots(step, total) : "") + '</div><div class="wiz-kicker">' + kicker + "</div>" + body + "</div></section>";
  }
  function chosen() { var a = []; if (wiz.mat) a.push(wiz.mat.n); if (wiz.saw) a.push(wiz.saw.n); if (wiz.hp) a.push(byK(HPS, wiz.hp).n); if (wiz.want) a.push(wiz.want.n); return a.length ? '<div class="chosen">' + a.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" : ""; }

  function aggBox() {
    return '<div class="frank aggbox"><b class="h">What’s in your concrete matters</b>' +
      "<p>Limestone, dolomite, sandstone, pit gravel, river rock, traprock, granite, basalt, quartzite, chert, flint. They don’t cut the same, and they change from one part of the country to the next. Houston river rock is some of the hardest there is, so the bond has to be very soft. That same blade is the wrong blade in Wisconsin.</p>" +
      "<p><b>We take that seriously.</b> Tell me where you cut and I’ll recommend the bond for the aggregate you actually have. The goal is the most footage for your money, not the most blades sold per year. We want to save you money and be your blade guys every year after this one.</p>" +
      '<div class="hprow"><input id="aggloc" type="text" placeholder="City, state" autocomplete="address-level2" aria-label="City and state"><button class="btn gold sm" data-aggask>Get ' + esc(WHO()) + '’s recommendation</button></div>' +
      '<div class="center" style="margin-top:10px"><a class="btn ghost-d sm" href="#early">See the aggregate map</a></div></div>';
  }
  function wizard() {
    var ask = wiz.mode === "ask", total = ask ? 3 : 2, kick = ask ? "Ask " + esc(WHO()) : "Blade Finder";
    if (!wiz.mat) { app.innerHTML = shell(kick, 1, total, "<h1>What are you cutting?</h1>" + says(QUIP.mat[0]) + tiles(MATS, "mat") + aggBox()); return; }
    if (!wiz.saw) {
      var saws = SAWS.filter(function (s) { return (!s.only || s.only.indexOf(wiz.mat.k) >= 0) && candidates(wiz.mat, s).length; });
      if (saws.length === 1) { wiz.saw = saws[0]; return wizard(); }
      app.innerHTML = shell(kick, 2, total, chosen() + "<h1>What saw are you running?</h1>" + says(QUIP.saw[0]) + tiles(saws, "saw")); return;
    }
    if (wiz.saw.k === "walk" && !wiz.hp) {
      app.innerHTML = shell(kick, 2, total, chosen() + "<h1>How much horsepower?</h1>" + says("Horsepower changes the bond. Tell me what the saw puts out and I’ll match the blade to it.") + tiles(HPS, "hp", "three-up") +
        '<div class="frank hpbox"><b class="h">Or type it in</b><div class="hprow"><input id="hpin" type="number" inputmode="numeric" min="1" max="200" placeholder="e.g. 13 or 65" aria-label="Saw horsepower"><button class="btn gold sm" data-hpgo>Show my blades</button></div></div>'); return;
    }
    if (ask && !wiz.want) { app.innerHTML = shell(kick, 3, total, chosen() + "<h1>What matters most?</h1>" + says(QUIP.want[0]) + tiles(WANTS, "want")); return; }
    var list = candidates(wiz.mat, wiz.saw), o = { mat: wiz.mat, saw: wiz.saw }, h = chosen();
    if (wiz.saw.k === "early") h += '<div class="frank wetbox"><b class="h">Which color for your aggregate?</b><p>The color is the bond. Tap your area on the map and we tell you which one to run.</p><div class="sendrow"><a class="btn gold sm" href="#early">Open the color guide</a></div></div>';
    if (wiz.saw.k === "walk") {
      var lowFam = function (f) { return /low-hp/.test(f.id); };
      /* High horsepower means the Americut high-horsepower wet blades. A typed horsepower picks the 35-60 or the 65-110 class. */
      if (wiz.hp === "high") {
        var dl = list.filter(isHiHp);
        if (wiz.hpn) { var mid = wiz.hpn <= 60, cls = dl.filter(function (f) { return /35-60/.test(f.id) === mid; }); if (cls.length) dl = cls; }
        list = dl;
      }
      if (wiz.hp === "low") list = list.filter(lowFam).concat(list.filter(function (f) { return !lowFam(f) && !isHiHp(f); }));
      h += '<div class="frank wetbox"><b class="h">Wet blades, bonded for you</b><p>' + esc(WETLINE) + (wiz.hp === "high" ? " On a high-horsepower saw that means our Americut wet blades, 14\" to 68\", for 35 to 110 HP saws. Don’t see your size below? Tell us the saw, the horsepower and where you cut and we match the blade." : "") + '</p><div class="sendrow"><button class="btn gold sm" data-wetspec>Spec my wet blade</button></div></div>';
    }
    if (!list.length) { app.innerHTML = shell(kick, 0, 0, h + "<h1>That one’s a phone call.</h1>" + '<div class="empty">Nothing on the shelf matches that combo. ' + esc(WHO()) + " will spec it for you.</div>" + frankBox("")); return; }
    if (ask) {
      var r = rank(list, wiz.mat, wiz.saw, wiz.want.k), ladA = rungs(ladder(list)), picksA = ladA.length >= 3 ? ladA : bestBetterGood(list, wiz.mat, wiz.saw);
      var top = r.filter(function (f) { return picksA.some(function (p) { return p.f === f; }); })[0] || r[0];
      if (!picksA.some(function (p) { return p.f === top; })) picksA = [{ f: top, label: isDragon(top) ? "Best" : "Top pick", rc: "b" }].concat(picksA).slice(0, 4);
      var why = { speed: "it’s the fastest of the three for that job", life: "it’ll outlast the others on that saw", price: "it’s the lowest cost-in that still does the job right", frank: "it’s what I’d put on my own saw" }[wiz.want.k];
      h += says("Good, better, best. My pick is the " + top.n + ". For " + wiz.mat.n.toLowerCase() + (/^[aeiou]/i.test(wiz.saw.n) ? " on an " : " on a ") + wiz.saw.n.toLowerCase() + ", " + why + ".", true) +
        '<div class="results">' + picksA.map(function (p) { var mine = p.f === top; return cardHTML(p.f, { mat: wiz.mat, saw: wiz.saw, pick: mine, ribbon: p.label, ribbon2: mine ? "★ " + esc(WHO()) + "’s Pick" : "", rc: p.rc }); }).join("") + "</div>" + frankBox(top.n);
    } else {
      var lad = ladder(list), picks = lad.length >= 3 ? lad : bestBetterGood(list, wiz.mat, wiz.saw), shown = {};
      var pre = wiz.saw.k === "walk" && wiz.hp === "low" ? list.filter(function (f) { return /low-hp/.test(f.id); }) : [];
      picks = pre.map(function (f) { return { f: f, label: "Built for low horsepower", rc: "" }; }).concat(picks);
      if (wiz.saw.k === "walk" && wiz.hp === "high" && list.every(isHiHp)) picks = rank(list, wiz.mat, wiz.saw).map(function (f) { return { f: f, label: hpClass(f), rc: "" }; });
      picks.forEach(function (p) { shown[p.f.id] = 1; });
      var rest = rank(list, wiz.mat, wiz.saw).filter(function (f) { return !shown[f.id]; });
      h += "<h1>Here’s your lineup.</h1>" + says((wiz.saw.k === "walk" && wiz.hp === "high" && list.every(isHiHp) ? "For this setup, run an Americut high-horsepower wet blade. Tell me the saw, the horsepower and where you cut and I’ll confirm the bond." : wiz.saw.k === "walk" && pre.length ? "On a low-horsepower walk-behind, start with the " + pre[0].n + ". It’s bonded for your saw." : wiz.saw.k === "walk" ? "Start at the top and work down." : (bigSaw(wiz.saw) && MATQUIP[wiz.mat.k]) || "Start at the top and work down.") + " " + list.length + (list.length === 1 ? " blade fits." : " fit, best first.")) +
        '<div class="results">' + picks.map(function (p, i) { return cardHTML(p.f, { mat: wiz.mat, saw: wiz.saw, pick: i === 0, ribbon: p.label, rc: p.rc }); }).join("") + rest.map(function (f) { return cardHTML(f, o); }).join("") + "</div>" +
        '<div class="center"><a class="btn gold" href="#ask" data-keep>Still not sure? Ask ' + esc(WHO()) + "</a></div>";
    }
    app.innerHTML = shell(kick, 0, 0, h);
  }
  function frankMsg(pickName) {
    return "Hey " + WHO() + ", question from the DBW WISCO site." + (wiz.mat ? " I’m cutting " + wiz.mat.n.toLowerCase() : "") + (wiz.saw ? " with a " + wiz.saw.n.toLowerCase() : "") + (wiz.want ? ". Priority: " + wiz.want.n.toLowerCase() : "") + "." + (pickName ? " The site says run the " + pickName + "." : "") + " My question: ";
  }
  function frankBox(pickName) {
    return '<div class="frank" data-frank="' + esc(pickName) + '"><div class="frankme"><img alt="' + esc(SAYER()) + '" src="' + askImg(1) + '" width="96" height="104" loading="lazy"><div><b class="h">Talk it through with me.</b>' +
      (myRep() ? "<p>Send over your question and your setup, and tell me what you’re looking to accomplish. I’ll get you set up right.</p>" + '<span class="sig">' + esc(myRep().name) + ", your rep at DBW WISCO</span></div></div>"
        : "<p>I’ve been in this industry since 2002. I’m not always right, but I’m not wrong very often either. Send over your question and your setup, and tell me what you’re looking to accomplish. I’ll get you set up right. I can promise you that.</p>" +
      '<span class="sig">' + esc(W.managerName || "Frank") + ", " + esc(W.managerTitle || "") + "</span></div></div>") +
      '<div class="sendrow">' + (W.textNumber ? '<button class="btn gold sm" data-fsms>Text ' + esc(WHO()) + "</button>" : "") + '<button class="btn gold sm" data-femail>Email ' + esc(WHO()) + '</button><button class="btn ghost-d sm" data-fcopy>Copy my question</button></div>' +
      '<p class="note">' + (cellShow() ? "Text: <b style=\"user-select:all\">" + esc(cellShow()) + "</b> · " : "") + (mailShow() ? 'Email: <b style="user-select:all">' + esc(mailShow()) + "</b>" : "") + "</p></div>";
  }

  function hitHTML(f, v) {
    return '<div class="hit" data-f="' + f.id + '" data-v="' + esc(vkey(v)) + '">' + pic(f) + "<div><h4>" + esc(f.n) + '</h4><div class="meta">' + esc(vlabel(v)) + "<br>" + esc(v[0]) + '</div></div><div class="r">' + (HIDE ? "" : '<span class="p">' + rangeTxt(v) + "</span>") + '<span class="act">' + qtyHTML(1) + '<button class="add" data-add>Add</button></span></div></div>';
  }
  function searchVars(q, limit, fuzzy) {
    var t = q.toLowerCase().replace(/["”]/g, "").split(/\s+/).filter(Boolean), out = [];
    if (!t.length) return out;
    C.families.forEach(function (f) {
      var fn = f.n.toLowerCase();
      f.vars.forEach(function (v) {
        var hay = fn + " " + v[0].toLowerCase() + " " + v[0].toLowerCase().replace(/[^a-z0-9]/g, "") + " " + (v[1] + " " + v[4]).toLowerCase().replace(/"/g, "");
        var ok = t.every(function (x) { return /^\d+(\.\d+)?$/.test(x) && parseFloat(x) < 40 ? v[2] === parseFloat(x) : hay.indexOf(x) >= 0; });
        if (ok) out.push([f, v, (v[0].toLowerCase().indexOf(t[0]) === 0 ? 0 : 1) * 1000 + f.rank * 5 + f.i / 100]);
      });
    });
    if (!out.length && !fuzzy) {
      var words = {}; C.families.forEach(function (f) { f.n.toLowerCase().split(/[^a-z0-9]+/).forEach(function (w) { if (w.length > 3) words[w] = 1; }); });
      var fixed = t.map(function (x) { if (x.length < 4 || /^\d/.test(x)) return x; var best = x, bd = 3; Object.keys(words).forEach(function (w) { var d = lev(x, w); if (d < bd) { bd = d; best = w; } }); return best; });
      if (fixed.join(" ") !== t.join(" ")) return searchVars(fixed.join(" "), limit, true);
    }
    return out.sort(function (a, b) { return a[2] - b[2]; }).slice(0, limit);
  }
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j; for (i = 1; i <= a.length; i++) { var q = [i]; for (j = 1; j <= b.length; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; } return p[b.length]; }
  function quickRows() {
    var fs = C.families.filter(function (f) { return f.rank < 99 && f.id.indexOf("eagle") !== 0; }).slice(0, 14);
    return '<div class="qrows">' + fs.map(function (f) {
      var vs = f.vars, d = defVar(f, vs);
      return '<div class="qrow" data-f="' + f.id + '">' + pic(f) + '<div class="qmain"><b>' + esc(f.n) + "</b>" +
        (vs.length > 1 ? '<select aria-label="Size" data-qsize>' + vs.map(function (v) { return '<option value="' + esc(vkey(v)) + '"' + (v === d ? " selected" : "") + ">" + esc(vlabel(v)) + "</option>"; }).join("") + "</select>" : '<span class="one">' + esc(vlabel(d)) + "</span>") + '<small class="qrng" data-qrng>' + (HIDE ? "Part # " + esc(d[0]) : rangeTxt(d) + " each") + "</small>" + ((f.learn || []).length ? '<button type="button" class="qlearn" data-open>Learn more ›</button>' : "") + (f.cats.indexOf("green") >= 0 ? '<a class="qmore" href="#early">Other colors and how to pick ›</a>' : "") +
        '</div>' + howMany("data-qadd", "data-qgo") + "</div>";
    }).join("") + "</div>";
  }
  var CREWS = [
    { n: "Concrete crew", s: "Flatwork, walls, curb, pipe", mat: "c" }, { n: "Paving crew", s: "Asphalt and overlays", mat: "a" },
    { n: "Hardscape crew", s: "Pavers, block, retaining wall", mat: "bp" }, { n: "Utility crew", s: "Ductile, pipe, reinforced", mat: "x" },
    { n: "Masonry crew", s: "Brick, block, mortar joints", mat: "m" }, { n: "Demolition crew", s: "Rebar and hard aggregate", mat: "r" }
  ];
  /* Fast Reorder picker: blade, then size, then how many. Every size of every blade, not just 14 inch. */
  var p3 = { f: "", v: "", tab: "top" };
  /* Step 1 is sorted into types, so every blade, bit, cup and chain is one tap away. */
  var P3TABS = [["top", "Most popular"], ["highspeed", "High-speed"], ["wet", "Wet & walk-behind"], ["small", "Small diameter"], ["green", "Early-entry"], ["core", "Core bits"], ["cup", "Cup wheels"], ["tuck", "Tuck point"], ["tile", "Tile & stone"], ["metal", "Metal & rescue"], ["abrasive", "Abrasive wheels"], ["chain", "Diamond chain"]];
  function p3List(tab) {
    if (tab === "top") return pickFams();
    return C.families.filter(function (f) { return f.cats.indexOf(tab) >= 0; }).sort(function (a, b) { var ea = a.id.indexOf("eagle") === 0 ? 1 : 0, eb = b.id.indexOf("eagle") === 0 ? 1 : 0; return ea - eb || a.rank - b.rank || (TR[b.tier] || 0) - (TR[a.tier] || 0) || a.n.localeCompare(b.n); });
  }
  function pickFams() { return C.families.filter(function (f) { return f.rank < 99 && f.id.indexOf("eagle") !== 0; }).slice(0, 14); }
  /* A blade button is the blade itself: its picture with the name under it. */
  function btile(f, attr, on) { return '<button type="button" class="btile" ' + attr + '="' + f.id + '" aria-pressed="' + !!on + '">' + (f.img ? '<img loading="lazy" alt="" src="img/' + esc(f.img) + '">' : '<span class="noimg" aria-hidden="true"></span>') + "<span>" + esc(f.n) + "</span></button>"; }
  function pick3HTML() {
    var f = FAM[p3.f], v = f && p3.v ? findVar(f, p3.v) : null;
    return '<div class="p3s"><b class="p3h"><i>1</i> Pick your blade</b><label class="p3type"><span>Show me</span><select id="p3tab" aria-label="Type of blade">' + P3TABS.filter(function (x) { return x[0] === "top" || p3List(x[0]).length; }).map(function (x) { return '<option value="' + x[0] + '"' + (p3.tab === x[0] ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join("") + '</select></label><div class="btiles" id="p3blades">' + p3List(p3.tab).map(function (x) { return btile(x, "data-pf", p3.f === x.id); }).join("") + "</div></div>" +
      (f ? '<div class="p3s" id="p3size"><b class="p3h"><i>2</i> Pick the size</b><div class="p3chips sizes">' + f.vars.map(function (x) { return '<button type="button" data-pv="' + esc(vkey(x)) + '" aria-pressed="' + (p3.v === vkey(x)) + '">' + esc(vlabel(x)) + "</button>"; }).join("") + "</div></div>" : "") +
      (v ? '<div class="p3s" id="p3qty"><b class="p3h"><i>3</i> How many?</b>' + howMany("data-pq", "data-pgo") + '<small class="p3part">' + esc(f.n) + " · " + esc(vlabel(v)) + " · Part # " + esc(v[0]) + "</small></div>" : "");
  }
  function pick3Draw(focusId) { var b = $("#pick3"); if (!b) return; b.innerHTML = pick3HTML(); var t = focusId && $("#" + focusId); if (t && t.scrollIntoView) t.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  function reorder() {
    var last = lastOrder(), n = last && last.items ? last.items.length : 0;
    app.innerHTML = shell("Fast Reorder", 0, 0,
      "<h1>Know what you run?</h1>" +
      '<input class="search-big" id="rq" type="search" placeholder="Search: Dragon 14 or AES14SGC1" autocomplete="off" aria-label="Search by blade, size or part number">' +
      '<div id="rhints"><div class="pick3" id="pick3">' + pick3HTML() + "</div></div>" + cpfStrip() +
      '<div class="hits" id="rhits"></div>' +
      '<div class="pkgbox"><b class="pkg-h">Saw Packages</b><p>Bundle a saw with your blades. One price, one invoice. Tap one to build it.</p>' + pkgButtons(0) + "</div>" +
      (n ? '<div class="last"><div><b>Same as last time?</b><span>' + n + (n === 1 ? " line" : " lines") + " from " + esc(last.date) + '</span></div><button class="btn red sm" data-reorder>Reorder it</button></div>' : "") +
      fold("Browse our most common blades", "14 blades, tap a quantity", '<p class="lead sm">Our most common blades. ' + (HIDE ? "Bigger quantities get better pricing. Your rep confirms the number. " : RNG ? "The more you buy, the closer you land to the low end of the range. " : "The price drops at every button. ") + esc(mixLine()) + "</p>" + quickRows(), "foldrows") +
      '<div class="center"><a class="btn gold" href="#shop">Browse our full catalog</a><button class="btn gold" data-pricing>Ask ' + esc(WHO()) + " about pricing" + "</button></div>" +
      (W.textNumber ? '<div class="frank photo"><b class="h">Easiest reorder there is</b><p>Snap a picture of your old blade and send it to ' + esc(WHO()) + '. We’ll read the label and write it up.</p><a class="bignum" href="#" data-photo>' + esc(cellShow()) + '</a><div class="sendrow"><button class="btn gold" data-photo>Text ' + esc(WHO()) + ' a photo</button><button class="btn blue" data-photomail>Email a photo</button></div></div>' : "") +
      '<h2 class="wiz-h2">Not sure what to reorder?</h2><p class="lead sm">Pick your crew and we walk you to the right blade.</p><div class="tiles">' + CREWS.map(function (c) { return '<button class="tile" data-crew="' + c.mat + '"><b>' + esc(c.n) + "</b><span>" + esc(c.s) + "</span></button>"; }).join("") + "</div>" +
      '<div class="frank"><b class="h">Your rep can build your list for you</b><p>Ask your rep to text you a reorder link. It opens with your usual blades already in the cart. You can change anything before you send it.</p></div>');
    $("#rq").addEventListener("input", function (e) { runSearch(e.target.value); });
  }
  function runSearch(q) {
    var hits = searchVars(q.trim(), 40), box = $("#rhits");
    $("#rhints").hidden = !!q.trim();
    box.innerHTML = !q.trim() ? "" : hits.length ? hits.map(function (h) { return hitHTML(h[0], h[1]); }).join("") : '<div class="empty">No match for “' + esc(q) + "”. Try the blade name or fewer words." + (W.textNumber ? ' <button class="btn chrome sm" data-photo style="margin-top:10px">Text ' + esc(WHO()) + " a photo of it</button>" : "") + "</div>";
  }

  var moreIO = null;
  function watchMore() {
    var el = $("#shopmore"); if (moreIO) { moreIO.disconnect(); moreIO = null; } if (!el) return;
    if (!("IntersectionObserver" in window)) { shop.n = 9999; shopScreen(); return; }
    moreIO = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) { shop.n += SHOPPAGE; shopScreen(); } }, { rootMargin: "900px" }); moreIO.observe(el);
  }
  var SHOPCATS = [
    { k: "all", n: "Everything", s: "Every blade, bit, chain and saw we sell. The more you buy, the better the price." },
    { k: "highspeed", n: "High-Speed Blades", s: "Dry blades for cut-off saws and walk-behinds. Dragons, Superblades, T-Rex. This is where the footage gets made." },
    { k: "wet", n: "Wet Blades", s: "Bonded for your area and what you cut. Flat saw, loop, wall saw and prestress." },
    { k: "small", n: "Small Diameter", s: '4" to 10" for grinders and circular saws. Fast, clean, on every truck.' },
    { k: "core", n: "Core Bits", s: "4-Core Pro Series plus stock wet and dry bits. Built for rebar and hard aggregate." },
    { k: "cup", n: "Cup Wheels", s: "Grind, level and strip. Turbo and double-row cups that move material." },
    { k: "tuck", n: "Tuck Point & Crack", s: "Mortar out fast, brick left alone. Tuck point blades and crack chasers." },
    { k: "tile", n: "Tile & Stone", s: "Chip-free cuts on porcelain, ceramic, marble and granite." },
    { k: "green", n: "Green Concrete", s: "Early-entry blades color-matched to your aggregate. Clean joints the same day." },
    { k: "chain", n: "Diamond Chain", s: "Chains, bars and sprockets matched to your saw. Deep cuts and square corners." },
    { k: "metal", n: "Metal & Rescue", s: "Ductile, rail, rebar and rescue. One diamond blade instead of a box of abrasives." },
    { k: "abrasive", n: "Abrasive Wheels", s: "Bonded cut-off wheels, by the box, when that’s what the job calls for." },
    { k: "equip", n: "Saws & Equipment", s: "Saws, core rigs and drill stands. Buy it with blades and the price gets better." },
    { k: "dust", n: "Vacs & Dust Control", s: "Shrouds and vacs for dust control on dry cutting and grinding." }
  ];
  var SHOPTAGS = [
    { k: "s1216", n: '12" to 16"', t: function (f) { return f.vars.some(function (v) { return v[2] >= 12 && v[2] <= 16; }); } },
    { k: "s1820", n: '18" to 20"', t: function (f) { return f.vars.some(function (v) { return v[2] >= 18 && v[2] <= 20; }); } },
    { k: "cured", n: "Cured concrete", t: function (f) { return (f.m.c || 0) >= 4; } },
    { k: "greenc", n: "Green concrete", t: function (f) { return (f.m.g || 0) >= 4; } },
    { k: "asph", n: "Asphalt", t: function (f) { return (f.m.a || 0) >= 4; } },
    { k: "lowhp", n: "Low horsepower", t: function (f) { return /low-hp/.test(f.id); } },
    { k: "highhp", n: "High horsepower", t: function (f) { return isHiHp(f); } }
  ];
  function shopScreen() {
    var cats = SHOPCATS.filter(function (c) { return c.k === "all" || C.families.some(function (f) { return f.cats.indexOf(c.k) >= 0; }); });
    var t = shop.q.toLowerCase().split(/\s+/).filter(Boolean), tag = byK(SHOPTAGS, shop.tag), curCat = byK(SHOPCATS, shop.cat) || SHOPCATS[0];
    var list = C.families.filter(function (f) { return (shop.cat === "all" || f.cats.indexOf(shop.cat) >= 0) && (!tag || tag.t(f)) && t.every(function (x) { return f.hay.indexOf(x) >= 0; }); });
    if (shop.sort === "low") list.sort(function (a, b) { return a.min - b.min; });
    else if (shop.sort === "high") list.sort(function (a, b) { return b.min - a.min; });
    else if (shop.sort === "az") list.sort(function (a, b) { return a.n.localeCompare(b.n); });
    list = list.filter(function (f) { return f.id.indexOf("eagle") !== 0; }).concat(list.filter(function (f) { return f.id.indexOf("eagle") === 0; }));
    var left = list.length - shop.n;
    var grid = list.length ? list.slice(0, shop.n).map(function (f) { return cardHTML(f); }).join("") + (left > 0 ? '<div class="shopmorewrap" style="grid-column:1/-1"><button type="button" class="btn blue" data-shopmore>Show ' + Math.min(SHOPPAGE, left) + ' more</button><small>Showing ' + Math.min(shop.n, list.length) + " of " + list.length + "</small></div>" : "")
      : shop.tag === "highhp" ? '<div class="frank" style="grid-column:1/-1"><b class="h">High-horsepower blades are built for you</b><p>' + esc(WETLINE) + ' Tell us the saw, the horsepower and where you cut.</p><div class="sendrow"><button class="btn gold sm" data-wetspec>Spec my blade</button></div></div>'
      : '<div class="empty d" style="grid-column:1/-1">Nothing matches that. Clear a filter, try fewer words, or ask ' + esc(WHO()) + ".</div>";
    setTimeout(watchMore, 0);
    if ($("#shopgrid")) { $("#shopgrid").innerHTML = grid; $("#shopn").textContent = list.length + (list.length === 1 ? " product" : " products"); $("#shopblurb").textContent = curCat.s; $$(".cat").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cat === shop.cat); }); $$(".tagc").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.tag === shop.tag); }); return; }
    app.innerHTML = '<section class="sec"><div class="wrap"><div class="sec-head"><h1 class="h2like">Shop everything</h1><p>Pick what you’re after. The more you buy, the better your price.</p></div>' +
      '<input id="sq" class="shopsearch" type="search" placeholder="Search blade, size or part #" aria-label="Search" value="' + esc(shop.q) + '">' +
      '<b class="flabel">What are you looking for?</b><div class="cats wrapc">' + cats.map(function (c) { return '<button class="cat" data-cat="' + c.k + '" aria-pressed="' + (shop.cat === c.k) + '">' + esc(c.n) + "</button>"; }).join("") + "</div>" +
      '<p class="shopblurb" id="shopblurb">' + esc(curCat.s) + "</p>" +
      '<b class="flabel">Narrow it down (optional)</b><div class="cats wrapc tags">' + SHOPTAGS.map(function (g) { return '<button class="cat tagc" data-tag="' + g.k + '" aria-pressed="' + (shop.tag === g.k) + '">' + esc(g.n) + "</button>"; }).join("") + "</div>" +
      cpfStrip() + '<div class="shopbar"><select id="ssort" aria-label="Sort"><option value="pop">Most popular</option>' + (HIDE ? "" : '<option value="low">Price: low to high</option><option value="high">Price: high to low</option>') + '<option value="az">A to Z</option></select><b id="shopn">' + list.length + (list.length === 1 ? " product" : " products") + '</b></div><div class="grid" id="shopgrid">' + grid + "</div></div></section>";
    $("#sq").addEventListener("input", function (e) { shop.q = e.target.value.trim(); shop.n = SHOPPAGE; shopScreen(); });
    $("#ssort").value = shop.sort; $("#ssort").addEventListener("change", function (e) { shop.sort = e.target.value; shopScreen(); });
    setNav("#shop");
  }

  function lineFams(L) { return L.cat ? C.families.filter(function (f) { return f.cats.indexOf(L.cat) >= 0; }) : L.ids.map(function (id) { return FAM[id]; }).filter(Boolean); }
  function coreScreen() {
    var four = ["punisher", "wolv", "sabertooth"].map(function (id) { return FAM[id]; }).filter(Boolean), stock = C.families.filter(function (f) { return f.cats.indexOf("core") >= 0 && four.indexOf(f) < 0; });
    app.innerHTML = shell("Core bits", 0, 0, "<h1>Core bits.</h1>" + says("Rebar, hard aggregate, deep holes. Tell me the rig and the diameter and I’ll tell you the bit.") +
      '<h2 class="wiz-h2">4-Core Pro Series</h2><p class="lead sm">Punisher, Wolv and Sabertooth. Our bits for heavy rebar and hard aggregate.</p><div class="results">' + four.map(function (f) { return cardHTML(f); }).join("") + "</div>" +
      '<h2 class="wiz-h2">Stock core bits and adaptors</h2><p class="lead sm">Premium wet and dry concrete bits off the shelf, plus extensions and adaptors.</p><div class="results">' + stock.map(function (f) { return cardHTML(f); }).join("") + "</div>" + frankBox(""));
    setNav("");
  }
  /* Early-entry bond colors. Chart and map are Diamond Blade Warehouse's own (Green Kut page and Aggregate Map page). */
  var AGG = [
    { k: "soft", n: "Soft", rocks: "Soft limestone, sandstone, dolomite limestone, siliceous, soft shell", color: "Yellow", hex: "#0490c3", cls: "g" },
    { k: "medsoft", n: "Medium soft", rocks: "Pit gravel, limestone, dolomite", color: "Orange", hex: "#263c7a", cls: "c" },
    { k: "med", n: "Medium", rocks: "Medium hard river rock, gravel, medium traprock, decomposed granite", color: "Red", hex: "#e6a823", cls: "e" },
    { k: "medhard", n: "Medium hard", rocks: "Granite, slate, traprock, basalt, quartzite", color: "Green", hex: "#e02326", cls: "f" },
    { k: "hard", n: "Hard", rocks: "Hard chert, hard quartz, flint rock, hard river rock", color: "Purple", hex: "#3f3a23", cls: "d" }
  ], eeSel = "";
  function earlyPick(k) { eeSel = k; earlyScreen(true); var r = $("#eeres"); if (r) r.scrollIntoView({ block: "start", behavior: "smooth" }); }
  function earlyScreen(keep) {
    var a = byK(AGG, eeSel), fams = a ? C.families.filter(function (f) { return f.cats.indexOf("green") >= 0 && new RegExp("\\b" + a.color + "$", "i").test(f.n); }).sort(function (x, y) { var o = function (f) { return /^Zenesis/.test(f.n) ? 0 : /^Arix/.test(f.n) ? 1 : 2; }; return o(x) - o(y); }) : [];
    var y = keep ? window.scrollY : 0;
    app.innerHTML = shell("Early-entry saws", 0, 0, "<h1>Which color blade?</h1>" + says("Soff-Cut style or Gorilla style, the color is the bond. Match it to your aggregate and the joint comes out clean.") +
      '<div class="frank"><b class="h">1. Tap where you cut</b><p>Find your area on the map and tap it. Colors on the map show how hard the aggregate is there.</p><div class="aggmap" id="aggmap"><span class="note">Loading the map…</span></div>' +
      '<div class="agglegend">' + AGG.map(function (x) { return '<span><i style="background:' + x.hex + '"></i>' + esc(x.n) + "</span>"; }).join("") + "</div></div>" +
      '<div class="frank"><b class="h">Or 2. Pick your aggregate</b><div class="aggs">' + AGG.map(function (x) { return '<button type="button" class="agg" data-agg="' + x.k + '" aria-pressed="' + (x.k === eeSel) + '"><b>' + esc(x.n) + "</b><span>" + esc(x.rocks) + "</span></button>"; }).join("") + "</div></div>" +
      '<div class="eelines"><div><b>Zenesis</b><span>The best. Speed and life in one blade.</span></div><div><b>Arix</b><span>Built for speed. Cuts fast, gives up some life.</span></div><div><b>Green Kut</b><span>Built for life. Lasts long, gives up some speed.</span></div></div>' +
      '<div id="eeres">' + (a ? '<div class="eepick"><span>' + esc(a.n) + " aggregate</span><b>Run " + esc(a.color.toUpperCase()) + "</b><small>" + esc(a.rocks) + ".</small></div>" +
        (fams.length ? '<div class="results">' + fams.map(function (f) { return cardHTML(f); }).join("") + "</div>" : "") : "") + "</div>" +
      '<div class="frank"><b class="h">The whole color chart</b><table class="cmp"><thead><tr><th>Blade color</th><th>Aggregate</th></tr></thead><tbody>' +
      [["White", "Soft and abrasive"], ["Yellow", "Soft"], ["Orange", "Medium soft"], ["Red", "Medium"], ["Green", "Medium hard"], ["Purple", "Hard"], ["Black", "Critically hard"], ["Next Day", "Cutting the next day, partially cured"]].map(function (r) { return "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + "</td></tr>"; }).join("") + '</tbody></table><p class="note">Fits Soff-Cut and Core Cut early-entry saws. Zenesis Green Kut also comes in Gorilla arbors. Aggregate changes from one pit to the next, so if you’re between two colors, ask.</p></div>' +
      '<div class="frank"><b class="h">Not sure? Tell me where you cut</b><div class="hprow"><input id="eeloc" type="text" placeholder="City, state" autocomplete="address-level2" aria-label="City and state"><button class="btn gold sm" data-eeask>Ask ' + esc(WHO()) + "</button></div><p class=\"note\">I’ll confirm the color for your area and your mix.</p></div>");
    setNav(""); if (keep) window.scrollTo(0, y);
    var put = function () { var m = $("#aggmap"); if (!m || !window.AGGMAP) return; m.innerHTML = window.AGGMAP; m.addEventListener("click", function (e) { var c = e.target.getAttribute && e.target.getAttribute("class"), hit = AGG.filter(function (x) { return x.cls === c; })[0]; if (hit) earlyPick(hit.k); }); };
    if (window.AGGMAP) put(); else { var sc = document.createElement("script"); sc.src = "aggmap.js"; sc.onload = put; sc.onerror = function () { var m = $("#aggmap"); if (m) m.innerHTML = '<span class="note">Map didn’t load. Pick your aggregate below.</span>'; }; document.head.appendChild(sc); }
  }
  function lineScreen(k) {
    var L = byK(LINES, k); if (!L) return home();
    var fs = lineFams(L);
    app.innerHTML = shell("Our heavy hitters", 0, 0, "<h1>" + esc(L.n) + ".</h1>" + says(L.s) + '<div class="results">' + fs.map(function (f) { return cardHTML(f); }).join("") + "</div>" + frankBox(""));
  }

  /* ---------- saw package calculator ---------- */
  var SD = C.sawdeal || { tiers: [], saws: [] };
  function dealBlades() { return C.families.filter(function (f) { return f.id.indexOf("eagle") !== 0 && f.vars.some(function (v) { return v[5]; }); }); }
  /* Saw packages: [blades, saws, better blade price?]. Set in config.js as sawPackages. */
  var PKGS = (W.sawPackages || [[15, 1, 0], [25, 1, 1], [36, 2, 0], [50, 2, 1]]).slice().sort(function (a, b) { return a[0] - b[0]; });
  function pkgFor(n) { var p = null; PKGS.forEach(function (x) { if (n >= x[0]) p = x; }); return p; }
  function sawsTxt(k) { return k + (k === 1 ? " saw" : " saws"); }
  function pkgButtons(cur) {
    return '<div class="pkgs" role="group" aria-label="Saw packages">' + PKGS.map(function (x) { return '<button type="button" class="pkg' + (cur === x[0] ? " on" : "") + '" data-pkgq="' + x[0] + '"><b>' + x[0] + " blades</b><span>" + sawsTxt(x[1]) + " in the package</span>" + (x[2] ? "<em>Better price per blade</em>" : "") + "</button>"; }).join("") + "</div>";
  }
  function pkgLine(n) {
    var p = pkgFor(n); if (!p) return "Add " + (PKGS[0][0] - n) + " more to make a " + PKGS[0][0] + "-blade package.";
    return sawsTxt(p[1]).replace(/^(\d+)/, function (m) { return m === "1" ? "1" : m; }) + " in the package" + (p[2] ? ", and a better price per blade." : ".");
  }
  var dealPreset = 0;
  function dealCount() { return deal.lines.reduce(function (n, l) { return n + l.q; }, 0); }
  function dealTier(n) { return pkgFor(n); }
  function dealTotal() { return null; }
  function dealReady() { return false && deal.lines.every(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); return v && v[6]; }); }
  function dealBIN() {
    var hit = SKU[(deal.saw || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")], sawP = hit ? hit[0].vars[hit[1]][3] : 0, blades = 0;
    deal.lines.forEach(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); if (v) blades += v[3] * l.q; });
    return { saw: sawP, blades: blades };
  }
  /* Package math uses only the prices already on the site: blades at their quantity price, saw at its price.
     "Saw after blade savings" = saw price minus what the quantity pricing took off the blades. */
  function dealCalc() {
    var mix = mixOn(), grp = { lg: 0, sm: 0 }, L = [], n = 0, blades = 0, list = 0;
    deal.lines.forEach(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); if (v) { var g = v[2] && v[2] < 12 ? "sm" : "lg"; grp[g] += l.q; L.push({ l: l, f: f, v: v, g: g }); } });
    L.forEach(function (x) { x.each = eachAt(x.v, mix ? grp[x.g] : x.l.q); n += x.l.q; blades += x.each * x.l.q; list += x.v[3] * x.l.q; });
    var hit = SKU[(deal.saw || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")], sawP = hit ? hit[0].vars[hit[1]][3] : 0;
    return { lines: L, n: n, blades: blades, save: list - blades, sawP: sawP, total: blades + sawP, net: Math.max(0, sawP - (list - blades)) };
  }
  function dealCur() { return { f: $("#dfam").value, v: $("#dvar").value }; }
  function dealLine(c) { return deal.lines.filter(function (l) { return l.f === c.f && l.v === c.v; })[0]; }
  function dealSetQty(q) {
    q = Math.max(0, Math.min(9999, parseInt(q, 10) || 0)); var c = dealCur(), ln = dealLine(c);
    if (ln && !q) deal.lines.splice(deal.lines.indexOf(ln), 1); else if (ln) ln.q = q; else if (q) deal.lines.push({ f: c.f, v: c.v, q: q });
    store.set("deal2", deal); dealRefresh();
  }
  function dealSync() { var ln = dealLine(dealCur()), q = ln ? ln.q : 0; $("#dqty").value = Math.min(50, q); $("#dqn").value = q; }
  function dealRefresh() {
    var d = dealCalc(), saw = SD.saws.filter(function (x) { return x.sku === deal.saw; })[0], cur = dealLine(dealCur()), q = cur ? cur.q : 0;
    $("#dqout").textContent = q + (q === 1 ? " blade" : " blades"); if (document.activeElement !== $("#dqn")) $("#dqn").value = q; if (document.activeElement !== $("#dqty")) $("#dqty").value = Math.min(50, q);
    $("#deallines").innerHTML = d.lines.length ? d.lines.map(function (x) { return '<div class="dl" data-i="' + deal.lines.indexOf(x.l) + '"><span><b>' + x.l.q + " x " + esc(x.f.n) + "</b><small>" + esc(vlabel(x.v)) + (HIDE ? "" : " · " + money(x.each) + " each") + '</small></span><button class="link" data-dealrm>Remove</button></div>'; }).join("") : "";
    $("#dealout").innerHTML = !saw ? '<div class="dealtotal off"><span>Pick a saw to see your package</span></div>' :
      HIDE && !d.n ? '<div class="dealtotal off"><span>Pick how many blades to start.</span></div>' :
      HIDE ? '<div class="dealtotal"><span>Your package</span><div class="drow"><i>' + d.n + (d.n === 1 ? " blade" : " blades") + '</i><b>✓</b></div><div class="drow"><i>' + (pkgFor(d.n) ? pkgFor(d.n)[1] + " x " : "") + esc(saw.n) + "</i><b>" + (pkgFor(d.n) ? "✓" : "") + '</b></div><strong>' + esc(pkgLine(d.n)) + "</strong>" + (pkgFor(d.n) ? "<span>One package price. Send it and " + esc(WHO()) + " " + backV() + " with your total.</span>" : "") + '<small>Nothing is charged on this site.</small></div>' :
      '<div class="dealtotal"><span>Your package</span>' +
      '<div class="drow"><i>' + d.n + (d.n === 1 ? " blade" : " blades") + "</i><b>" + money(d.blades) + "</b></div>" +
      (d.save > 0.005 ? '<div class="drow good"><i>Quantity pricing took off</i><b>− ' + money(d.save) + "</b></div>" : "") +
      '<div class="drow"><i>' + esc(saw.n) + "</i><b>" + money(d.sawP) + "</b></div>" +
      '<div class="drow big"><i>Package total</i><b>' + money(d.total) + "</b></div>" +
      (d.n ? '<strong>' + (d.net <= 0 ? "Your blade savings cover the whole saw." : d.save > 0.005 ? "After your blade savings, the saw works out to " + money(d.net) + ", down from " + money(d.sawP) + "." : ACCT ? "That’s at list. Your rep prices the package on your account, and every blade you add brings the saw down." : "Add blades and watch the saw get cheaper. The price drops at 12.") + "</strong>" : "<strong>Slide the blades up and watch the price move.</strong>") +
      "<small>Before freight and tax. Your rep can sharpen this further on a real package.</small></div>";
    var sb = $("[data-dealsend]"); if (sb) sb.disabled = !(saw && d.n);
    var pw = $("#pkgwrap"); if (pw) { var pc = pkgFor(d.n); pw.innerHTML = pkgButtons(pc ? pc[0] : 0); }
    var rp = $("#r-price"); if (rp) { rp.value = HIDE ? "" : d.sawP || ""; rentCalc(); }
  }
  var rentGo = 0;
  function sawDeal() {
    var fams = dealBlades();
    if (!deal.saw && SD.saws.some(function (x) { return x.sku === "TS420"; })) deal.saw = "TS420";
    var sawCard = '<div class="frank"><b class="h">3. Which saw?</b><select id="dsaw" class="bigsel" aria-label="Saw"><option value="">Choose a saw…</option>' + SD.saws.map(function (x) { return '<option value="' + esc(x.sku) + '"' + (x.sku === deal.saw ? " selected" : "") + ">" + esc(x.n) + "</option>"; }).join("") + "</select></div>";
    var h = "<h1>Saw packages.</h1>" + '<p class="lead">' + (HIDE ? "Buy your blades as a package and the saw comes with them. One price for all of it." : "The more you buy, the better the price. Every blade you add lowers the price of the package.") + "</p>" +
      '<ol class="csteps dark" aria-label="How a saw package works"><li class="on"><i>1</i><span>Pick how many blades</span></li><li><i>2</i><span>Pick your blade and saw</span></li><li><i>3</i><span id="dealstep3">' + esc(WHO()) + " " + backV() + " with one price</span></li></ol>" +
      '<div class="frank"><b class="h">1. How many blades?</b><div id="pkgwrap">' + pkgButtons(0) + "</div>" +
      '<div class="ownnum"><span>Or your own number</span><div class="slidenum"><button type="button" class="stp" data-dstep="-1" aria-label="One fewer">−</button><input id="dqn" type="number" inputmode="numeric" min="0" max="9999" value="0" aria-label="Number of blades"><button type="button" class="stp" data-dstep="1" aria-label="One more">+</button></div></div>' +
      '<div hidden><b id="dqout">0 blades</b><input id="dqty" type="range" min="0" max="50" step="1" value="0" aria-label="How many blades" tabindex="-1"></div></div>' +
      '<div class="frank"><b class="h">2. Which blade?</b><button type="button" class="bsel" data-dfamopen aria-expanded="false" aria-controls="dfamgrid"></button><div class="btiles light" id="dfamgrid" hidden>' + fams.map(function (f) { return btile(f, "data-dfam", f.id === "superblade-extreme"); }).join("") + '</div><div class="dealadd two"><select id="dfam" class="vh" aria-label="Blade" tabindex="-1">' + fams.map(function (f) { return '<option value="' + f.id + '"' + (f.id === "superblade-extreme" ? " selected" : "") + ">" + esc(f.n) + "</option>"; }).join("") + '</select><select id="dvar" aria-label="Size"></select></div>' +
      (HIDE ? "" : '<p class="note">Pricing gets better at 12, 24, 36, 50 and 100 blades. ' + esc(mixLine()) + "</p>") + '<div class="deallines" id="deallines"></div></div>' +
      sawCard +
      '<div id="dealout"></div>' +
      '<div class="center"><button class="btn gold shine" data-dealsend disabled>Send my package to ' + esc(WHO()) + '</button><button class="btn ghost" data-dealclear>Start over</button></div>' +
      '<p class="note light" id="dealback">' + esc(WHO()) + " " + backV(1) + ' with one package price. Nothing is charged on this site.</p>' + replyPick() +
      '<details class="rentd"><summary>Renting saws now? See what it costs you</summary>' + rentBox() + "</details>" +
      '<p class="note light">Want a saw that isn’t listed, or a bigger stack? Your rep can build any package. That’s where the real deals are.</p>';
    app.innerHTML = shell("Build your own saw package", 0, 0, h);
    if (rentGo) { rentGo = 0; var rd = $(".rentd"); if (rd) { rd.open = true; setTimeout(function () { rd.scrollIntoView({ block: "start" }); window.scrollBy(0, -150); }, 60); } }
    fillDealVars(); dfamDraw(); if (dealPreset) { deal.lines = []; dealSetQty(dealPreset); dealPreset = 0; } dealSync(); dealRefresh(); setNav("#saw-deal");
  }
  function rentBox() {
    return '<div class="frank cc"><b class="h">Renting your saws? Do the math.</b><p>Two sliders. That’s it.</p>' +
      '<div class="rs"><label for="r-day">Rental per day <b id="r-day-o">$75</b></label><input id="r-day" type="range" min="20" max="300" step="5" value="75"></div>' +
      '<div class="rs"><label for="r-days">Days you rent in a month <b id="r-days-o">8</b></label><input id="r-days" type="range" min="1" max="25" step="1" value="8"></div>' +
      '<input type="hidden" id="r-price" value=""><div id="rout" class="ccout"></div></div>';
  }
  function dfamDraw() { var f = FAM[$("#dfam").value], b = $("[data-dfamopen]"); if (!f || !b) return; b.innerHTML = (f.img ? '<img alt="" src="img/' + esc(f.img) + '">' : "") + "<span><small>Your blade</small><b>" + esc(f.n) + '</b></span><em>Change ›</em>'; $$("#dfamgrid [data-dfam]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.dfam === f.id); }); }
  function fillDealVars() {
    var f = FAM[$("#dfam").value]; if (!f) return;
    var vs = f.vars.filter(function (v) { return v[5]; }), d = vs.filter(function (v) { return v[2] === 14; })[0] || defVar(f, vs);
    $("#dvar").innerHTML = vs.map(function (v) { return '<option value="' + esc(vkey(v)) + '"' + (v === d ? " selected" : "") + ">" + esc(vlabel(v)) + "</option>"; }).join("");
  }
  function dealText() {
    var saw = SD.saws.filter(function (s) { return s.sku === deal.saw; })[0], n = dealCount(), t = dealTier(n), L = [];
    L.push("SAW PACKAGE REQUEST (" + n + " blades" + (t ? ", " + sawsTxt(t[1]) : "") + ")");
    if (saw) L.push("Saw: " + (t ? t[1] + " x " : "") + saw.n + " (" + saw.sku + ")");
    if (t) L.push("Package: " + t[0] + "+ blades = " + sawsTxt(t[1]) + (t[2] ? ", better price per blade" : ""));
    deal.lines.forEach(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); if (v) L.push(l.q + " x " + v[0] + "  " + f.n + " " + vlabel(v)); });
    var dc = dealCalc(); if (dc.n && !HIDE) L.push("Site price: blades " + money(dc.blades) + " + saw " + money(dc.sawP) + " = " + money(dc.total) + "  (before freight and tax, customer wants your best package price)");
    return L.join("\n");
  }

  /* ---------- equipment + depth chart ---------- */
  var EQUIP = ["Hand-held cut-off saws", "Walk-behind saws", "Core drills & rigs", "Wall, ring & chain saws", "Diamond wire", "Grinders", "Circular saws", "Floor grinders & scarifiers", "Plate compactors & rammers", "Mortar & concrete mixers", "Trash pumps (dirty water)", "Clean water pumps", "Vacuums & dust control", "Power trowels & screeds", "Generators", "Something else"], eqSel = [];
  function equipPicker(cta, short) {
    var list = short ? ["Hand-held cut-off saws", "Walk-behind saws", "Core drills & rigs", "Plate compactors & rammers", "Mortar & concrete mixers", "Trash pumps (dirty water)", "Vacuums & dust control", "Something else"] : EQUIP;
    return '<div class="eqchips">' + list.map(function (x) { return '<button type="button" class="eqchip" data-eqpick="' + esc(x) + '" aria-pressed="' + (eqSel.indexOf(x) >= 0) + '">' + esc(x) + "</button>"; }).join("") + "</div>" + (short ? '<p class="eqbrands"><a href="#equipment">See everything we can get →</a></p>' : "") +
      '<p class="eqbrands">Pulse-Bac, Husqvarna, Diamond Products, Core Cut and every other major brand.</p>' +
      '<div class="center"><button class="btn chrome shine" data-equip>' + cta + "</button></div>";
  }
  var STONE = ["Router bits", "CNC tooling", "Polishing pads", "Diamond saw blades", "Core bits", "Grinding wheels", "In-line tooling", "Adhesives", "Sealers & cleaners", "Polishers & grinders", "Saws", "Material handling", "Abrasives"], stSel = [];
  function stoneScreen() {
    app.innerHTML = shell("Stone fabrication", 0, 0,
      "<h1>Granite, marble and stone shops.</h1>" + says("For fabrication we run Helix Professional Tools. Tell me the material and the machine and I’ll get you the right tooling and a price.") +
      '<div class="frank"><b class="h">Tap what you need</b><p>Granite, marble, quartzite, engineered stone, porcelain and glass. Pick the categories, send it, and we come back with the right Helix product and your price.</p><div class="eqchips">' + STONE.map(function (x) { return '<button type="button" class="eqchip" data-stonepick="' + esc(x) + '" aria-pressed="' + (stSel.indexOf(x) >= 0) + '">' + esc(x) + "</button>"; }).join("") + '</div><div class="center"><button class="btn gold shine" data-stone>Get my Helix price</button></div>' +
      '<p class="note">Want to look through the full Helix line first? <a href="https://helixtools.net" target="_blank" rel="noopener">helixtools.net</a> opens in a new tab. Their site has its own login. Order through us and it goes on your DBW account.</p></div>' + frankBox(""));
    setNav("");
  }
  function equipment() {
    var rows = SD.saws.map(function (s) { var hit = SKU[s.sku.toUpperCase().replace(/[^A-Z0-9.]/g, "")]; var v = hit && hit[0].vars[hit[1]]; var d = (s.n.match(/(\d+)"/) || [])[1]; var depth = { 12: '4"', 14: '5"', 16: '6"' }[d] || ""; return v ? "<tr><td>" + esc(s.n) + "</td><td>" + (d ? d + '"' : "") + "</td><td>" + depth + "</td>" + (HIDE ? "" : "<td class=\"num\">" + money(v[3]) + "</td>") + '<td><button class="add" data-eqadd="' + esc(s.sku) + '">Add</button><button class="add pk" data-pkg="' + esc(s.sku) + '">+ Blades</button></td></tr>' : ""; }).join("");
    var eq = C.families.filter(function (f) { return f.cats.indexOf("equip") >= 0 || f.cats.indexOf("dust") >= 0; });
    app.innerHTML = shell("Equipment deals", 0, 0,
      "<h1>If they make it, we can get it.</h1>" + says(QUIP.equipment[0]) +
      '<div class="frank"><b class="h">Tap what you need</b><p>Pick as many as you want. ' + esc(WHO()) + " goes hunting and comes back with a price. Bundle a saw with your blades: one price, one invoice.</p>" + equipPicker("Go find me the best price") + '<div class="center"><a class="btn blue sm" href="#saw-deal">Build a saw package</a></div></div>' +
      '<div class="frank"><b class="h">Gas cut-off saws, side by side</b><p class="pknote"><b>Bundle a saw with your blades. One package price, one invoice.</b> Tap <b>+ Blades</b> on any saw to build the package. Your rep confirms your total.</p><div class="tablewrap"><table class="cmp saws"><thead><tr><th>Saw</th><th>Blade</th><th>Max depth</th>' + (HIDE ? "" : '<th class="num">Buy now</th>') + '<th></th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="note">Depth is typical for that blade size. Buying blades with it? Your rep can do better on the saw.</p><div class="center"><button class="btn gold sm" data-equip>Negotiate with your sales rep</button></div></div>' +
      '<h2 class="wiz-h2">Equipment on the shelf</h2><div class="results two-up swipe">' + eq.map(function (f) { return cardHTML(f); }).join("") + "</div>", true);
    setNav("#equipment");
  }
  function depth() {
    app.innerHTML = shell("Cutting depth chart", 0, 0,
      "<h1>How deep will it cut?</h1>" + says(QUIP.depth[0]) + '<p class="lead">Typical maximum depth of cut by blade size. Your saw’s guard and flanges can change it by up to half an inch.</p>' +
      DEPTH.map(function (g) { return '<div class="frank"><b class="h">' + esc(g[0]) + '</b><div class="tablewrap"><table class="cmp"><thead><tr><th>Blade / tool</th><th>Max depth of cut</th></tr></thead><tbody>' + g[1].map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>"; }).join("") +
      '<div class="center"><a class="btn chrome" href="#finder">Find the blade for it</a></div>');
    setNav("");
  }

  var fixSel = "";
  function fixScreen() {
    var f = byK(FIX, fixSel), h;
    if (!f) h = "<h1>What’s the blade doing?</h1>" + says(QUIP.fix[0]) + '<div class="tiles">' + FIX.map(function (x) { return '<button class="tile" data-fix="' + x.k + '"><b>' + esc(x.n) + "</b><span>" + esc(x.s) + "</span></button>"; }).join("") + "</div>";
    else {
      var fs = f.ids.map(function (id) { return FAM[id]; }).filter(Boolean);
      h = "<h1>" + esc(f.n) + ".</h1>" +
        '<div class="frank"><b class="h">What’s going on</b><p>' + esc(f.why) + '</p><b class="h">Do this now</b><p>' + esc(f.now) + '</p><b class="h">The real fix</b><p>' + esc(f.fix) + "</p></div>" +
        (fs.length ? '<h2 class="wiz-h2">Blades that fix it</h2><div class="results">' + fs.map(function (x) { var w = (FIXWHY[f.k] || {})[x.id]; return "<div>" + (w ? '<div class="whyfix"><b>Why this one</b><span>' + esc(w) + "</span></div>" : "") + cardHTML(x) + "</div>"; }).join("") + "</div>" : "") + frankBox("");
    }
    app.innerHTML = shell("Blade trouble?", 0, 0, h); setNav("");
  }
  /* A section that stays one line tall until it is tapped. */
  function fold(title, sub, inner, id) { return '<details class="fold"' + (id ? ' id="' + id + '"' : "") + "><summary><span><b>" + title + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + '</span><i aria-hidden="true">+</i></summary><div class="fold-in">' + inner + "</div></details>"; }
  function cpfBlock() {
    return '<section class="cpf"><div class="wrap"><div class="cpf-in"><div class="cpf-ic" aria-hidden="true">$<small>/ft</small></div><div class="cpf-tx"><span class="kick">Free tool · 20 seconds</span><h2>The price on the box isn’t what a blade costs you.</h2>' +
      "<p>What matters is what it costs to own and run: the <b>cost per foot</b>. A blade that costs more up front and cuts farther is the cheaper blade. Use this free calculator and see for yourself what your cuts are costing you, or saving you, every day, every week, every month and every year.</p></div>" +
      '<a class="btn blue cpf-go" href="#cost">Run the cost per foot calculator</a></div></div></section>';
  }
  function cpfStrip() { return '<a class="cpfstrip" href="#cost"><b>$<small>/ft</small></b><span><strong>Cost per foot calculator</strong> See which blade is really cheaper.</span><em>›</em></a>'; }
  function costScreen() {
    var d = FAM["dragon-supreme"] || FAM["dragon"], dv = d ? defVar(d, d.vars) : null;
    app.innerHTML = shell("Cost per foot calculator", 0, 0,
      "<h1>Price per box or price per foot?</h1>" + says(QUIP.cost[0]) +
      '<p class="lead">The upfront price is not what matters most. What matters is what the blade costs you to own and run, and that is the <b>cost per foot</b>. Put in what you pay and how many feet you get, and see what your cuts cost you every day, every week, every month and every year. Use your own numbers.</p>' +
      '<div class="frank cc"><div class="ccgrid"><div><b class="h">Blade A (what you run now)</b><div class="field"><label for="ca-p">What you pay per blade ($)</label><input id="ca-p" type="number" inputmode="decimal" min="0" placeholder="e.g. 110"></div><div class="field"><label for="ca-f">Feet you get out of one</label><input id="ca-f" type="number" inputmode="decimal" min="0" placeholder="your number"></div></div>' +
      '<div><b class="h">Blade B (the one you’re considering)</b><div class="field"><label for="cb-p">What it costs per blade ($)</label><input id="cb-p" type="number" inputmode="decimal" min="0" value="' + (dv && !HIDE ? dv[3] : "") + '"></div><div class="field"><label for="cb-f">Feet you’d get out of one</label><input id="cb-f" type="number" inputmode="decimal" min="0" placeholder="your number"></div></div></div>' +
      '<div class="field"><label for="c-ft">Feet you cut in a month</label><input id="c-ft" type="number" inputmode="decimal" min="0" placeholder="e.g. 5000"></div><div id="ccout" class="ccout">Fill in both blades to see the cost per foot.</div></div>' +
      '<p class="note light">Put in what you pay for each blade and how far it cuts. We don’t fill in prices or blade life for you, because they depend on your account, your material, your saw and your operator.</p>' +
      '<div class="center"><a class="btn chrome" href="#finder">Find the right blade</a><button class="btn ghost" data-breaks>Get my price breaks</button></div>');
    setNav("");
    costCalc();
  }
  function costCalc() {
    var g = function (id) { return parseFloat(($("#" + id) || {}).value) || 0; }, ap = g("ca-p"), af = g("ca-f"), bp = g("cb-p"), bf = g("cb-f"), ft = g("c-ft"), o = $("#ccout");
    if (!o) return;
    if (!(ap && af && bp && bf)) { o.className = "ccout"; o.innerHTML = 'Fill in both blades to see the cost per foot. <button type="button" class="btn gold sm" data-ccex style="margin-top:8px">Show me an example</button>'; return; }
    var a = ap / af, b = bp / bf, win = a === b ? "" : a < b ? "A" : "B", diff = Math.abs(a - b);
    o.className = "ccout on";
    o.innerHTML = '<div class="ccrow"><span>Blade A</span><b>' + money(a) + ' / ft</b></div><div class="ccrow"><span>Blade B</span><b>' + money(b) + " / ft</b></div>" +
      (win ? "<strong>Blade " + win + " is cheaper per foot by " + money(diff) + (ft ? ". On " + ft.toLocaleString() + " feet a month that’s " + money(diff * ft) + " a month, " + money(diff * ft * 12) + " a year." : ".") + "</strong>" +
        (ft ? '<div class="ccsave" aria-label="What Blade ' + win + ' saves you"><b class="ccsave-h">Running Blade ' + win + ' saves you</b>' + [["Every day", diff * ft * 12 / 260], ["Every week", diff * ft * 12 / 52], ["Every month", diff * ft], ["Every year", diff * ft * 12]].map(function (x) { return "<div><span>" + x[0] + "</span><b>" + money(x[1]) + "</b></div>"; }).join("") + '<small>Day is a working day, five a week.</small></div>' : '<small class="ccnudge">Add the feet you cut in a month to see it by day, week, month and year.</small>')
        : "<strong>Dead even per foot.</strong>") +
      "<small>Blades per month: A " + (ft ? (ft / af).toFixed(1) : "?") + ", B " + (ft ? (ft / bf).toFixed(1) : "?") + ". Fewer blade changes is time back on the job.</small>";
  }
  function rentCalc() {
    var g = function (id) { return parseFloat(($("#" + id) || {}).value) || 0; }, day = g("r-day"), days = g("r-days"), price = g("r-price"), o = $("#rout");
    if (!o) return;
    if (!(day && days)) { o.className = "ccout"; o.textContent = "Enter your rental rate and days to see what renting costs you."; return; }
    var mo = day * days, yr = mo * 12;
    o.className = "ccout on";
    o.innerHTML = '<div class="ccrow"><span>Rental per month</span><b>' + money(mo) + '</b></div><div class="ccrow"><span>Rental per year</span><b>' + money(yr) + "</b></div>" +
      (price ? "<strong>You’re renting " + days + " days a month. A " + money(price) + " saw pays for itself in about " + (price / mo < 1 ? "under a month" : (price / mo).toFixed(1) + " months") + ". After that it’s yours.</strong>" : "<strong>" + (HIDE ? "Ask your rep what the saw runs, then divide it by that monthly number. That’s how many months until it’s yours." : "Pick a saw above to see how fast it pays for itself.") + "</strong>");
  }

  function repTools() {
    var cur = me().rep || "", base = ROOT;
    app.innerHTML = shell("For the sales team", 0, 0,
      "<h1>Your own link.</h1>" + '<p class="lead">Text customers a link with your name on it. When they order, it comes in marked as yours.</p>' +
      '<div class="frank"><b class="h">1. Pick your name</b><div class="reps" id="rtreps">' + (W.reps || []).map(function (r) { var sl = slug(r.name); return '<button type="button" class="rep' + (cur === sl ? " on" : "") + '" data-rtrep="' + sl + '"><span class="av">' + (r.photo ? '<img alt="" src="brand/reps/' + esc(r.photo) + '">' : esc(initials(r.name))) + "</span><b>" + esc(r.name) + "</b></button>"; }).join("") + "</div></div>" +
      '<div class="frank"><b class="h">2. Copy your link</b><pre class="order" id="rtlink">' + esc(cur ? repLink(base, cur) : "Pick your name first") + '</pre><div class="sendrow"><button class="btn chrome sm" data-rtcopy>Copy my link</button></div><p class="note">Customers who open it see “Your salesman: ' + esc(cur ? (repBySlug(cur) || {}).name || "" : "you") + '” and you’re pre-picked when they send their cart.</p></div>' +
      '<div class="frank"><b class="h">3. Send a customer their usual order</b><p>Fill the cart with what they normally buy. Add their company and a one-line note if you want, then tap <b>Copy the reorder link</b> and text it. It opens with their blades and quantities already loaded. <b>No price rides in the link.</b> Put the price in your text, where it can’t be edited or passed around.</p>' +
      '<div class="field"><label for="rt-co">Customer or company (optional)</label><input id="rt-co" maxlength="60" autocapitalize="words" placeholder="Acme Concrete"></div><div class="field"><label for="rt-note">One-line note they’ll see (optional)</label><input id="rt-note" maxlength="140" placeholder="Dragons are back in stock."></div>' +
      '<div class="sendrow"><a class="btn blue sm" href="#reorder">Build a cart</a><button class="btn chrome sm" data-rtshare>Copy the reorder link</button></div></div>' +
      '<div class="frank"><b class="h">Put a rep’s page on your phone</b><p>Each rep’s page can sit on your home screen with their face and name on it. Open one, then in Safari tap <b>Share</b> (the square with the arrow), scroll down, tap <b>Add to Home Screen</b>, then <b>Add</b>. On Android: Chrome menu, then <b>Add to Home screen</b>.</p><div class="replinks">' + (W.reps || []).map(function (r) { var nick = (r.aka || [])[0]; return nick ? '<a href="' + esc(/\/$/.test(ROOT) ? ROOT + nick + "/" : ROOT + "?rep=" + nick) + '" data-ext>' + (r.photo ? '<img alt="" src="brand/reps/' + esc(r.photo) + '">' : '<span class="av">' + esc(initials(r.name)) + "</span>") + "<b>" + esc(r.name) + "</b><span>Open ›</span></a>" : ""; }).join("") + "</div></div>" +
      '<div class="frank"><b class="h">Texts that work</b><p class="tpl">Running low on blades? Reorder in 60 seconds, no phone tag: [your link]</p><p class="tpl">I loaded your usual order. Change the quantities if you need to and hit send: [reorder link]</p><p class="tpl">Not sure what to run on that job? Tap Ask Frank. Three questions and you get good, better and best: [your link]</p></div>');
    setNav("");
  }

  /* Every page change lands at the top. Said three times because iPhone Safari can settle the old scroll
     position back in after the new page is drawn. */
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
  function toTop() {
    var z = function () { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; };
    z(); if (window.requestAnimationFrame) requestAnimationFrame(z); setTimeout(z, 60);
  }
  /* Tapping a button for the page you are already on still takes you to its top. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var h = a.getAttribute("href");
    if (window.WISCO_REP) { e.preventDefault(); if (!h || h.length < 2) return; if (h === (location.hash || "#home")) route(); else location.hash = h; return; }   /* on a rep page links must not fall back to the main address */
    if (!h || h.length < 2 || h.indexOf("#blade-") === 0) return;
    if (h === (location.hash || "#home")) { e.preventDefault(); route(); }
  });
  function route() {
    var h = location.hash || "#home"; document.body.dataset.r = h.slice(1).split("-")[0];
    if (h.indexOf("#blade-") === 0) { var f = FAM[h.slice(7)]; if (!app.innerHTML) home(); if (f) openDetail(f); return; }
    toTop();
    if (h === "#ask-frank") { try { history.replaceState(null, "", location.pathname + location.search + "#ask"); } catch (e) {} h = "#ask"; }
    if (h === "#finder" || h === "#ask") {
      var mode = h === "#finder" ? "finder" : "ask";
      if (!wiz.keep) { wiz.mat = wiz.saw = null; } wiz.hp = null; wiz.hpn = null;
      wiz.keep = false; wiz.mode = mode; wiz.want = null; wiz.all = false; wizard(); setNav(h); bfShow("mat");
    } else if (h === "#reorder") { reorder(); setNav(h); bfShow("reorder"); }
    else if (h === "#shop") { app.innerHTML = ""; shopScreen(); bfShow("shop"); }
    else if (h === "#saw-deal") { sawDeal(); bfShow("equipment"); }
    else if (h === "#equipment") { equipment(); bfShow("equipment"); }
    else if (h === "#stone") { stoneScreen(); bfShow("home"); }
    else if (h === "#core") { coreScreen(); bfShow("line"); }
    else if (h === "#early") { eeSel = ""; earlyScreen(); bfShow("line"); }
    else if (h === "#depth") { depth(); bfShow("depth"); }
    else if (h === "#team") { repTools(); bfShow("home"); }
    else if (h === "#fix") { fixSel = ""; fixScreen(); bfShow("fix"); }
    else if (h === "#cost") { costScreen(); bfShow("cost"); }
    else if (h.indexOf("#line-") === 0) { lineScreen(h.slice(6)); setNav(""); bfShow("line"); }
    else { home(); bfShow("home"); }
  }

  /* ---------- floating Big Frank ---------- */
  var bfCtx = "home", bfI = 0;
  function bfLines() {
    var t = totals(), a = bfCtx === "home" || !QUIP[bfCtx] ? [] : QUIP[bfCtx].slice();
    if (bfCtx === "results" && wiz.mat && MATQUIP[wiz.mat.k] && bigSaw(wiz.saw)) a = [MATQUIP[wiz.mat.k]];
    if (t.units) { var bs = breakState(t); if (bs.nb) a.unshift(bs.need + " more" + bs.of + " hits the " + bs.nb + "-piece price."); }
    return a;
  }
  var HOMEQ = QUIP.home.slice().sort(function () { return Math.random() - 0.5; });
  function bfShow(ctx) { if (ctx) { bfCtx = ctx; bfI = 0; } var a = bfLines(); a = a.concat(HOMEQ.filter(function (q) { return a.indexOf(q) < 0 && !(myRep() && /since 2002/.test(q)); })); $("#bfp").textContent = a[bfI % a.length]; }
  var lastY = 0; window.addEventListener("scroll", function () { var y = window.scrollY, el = $("#bf"); if (Math.abs(y - lastY) < 12) return; el.classList.toggle("away", y > lastY && y > 160); lastY = y; }, { passive: true });
  function bfOpen(open) { $("#bf").classList.toggle("open", open); store.set("bf", open ? 1 : 0); }

  /* ---------- cart ---------- */
  function cartLines() { return cart.map(function (c) { var f = FAM[c.f], v = f && findVar(f, c.v); return f && v ? { c: c, f: f, v: v } : null; }).filter(Boolean); }
  /* Each line is priced by its quantity bracket. Small months: the line's own quantity. Big months: its size group's total. */
  function totals() {
    var L = cartLines(), t = 0, n = 0, list = 0, low = 0, mix = mixOn(), grp = { lg: 0, sm: 0 };
    L.forEach(function (l) { l.g = l.v[2] && l.v[2] < 12 ? "sm" : "lg"; if (tiered(l.v)) grp[l.g] += l.c.q; });
    L.forEach(function (l) { l.bq = mix && tiered(l.v) ? grp[l.g] : l.c.q; l.each = l.c.p > 0 ? l.c.p : HIDE ? 0 : eachAt(l.v, l.bq); n += l.c.q; t += l.each * l.c.q; list += l.v[3] * l.c.q; low += (l.c.p > 0 ? l.c.p : lowOf(l.v)) * l.c.q; });
    return { lines: L, total: t, units: n, list: list, low: low, save: list - t, quoted: L.length > 0 && L.every(function (l) { return l.c.p > 0; }), anyQuoted: L.some(function (l) { return l.c.p > 0; }) };
  }
  function addToCart(fid, key, q) {
    q = Math.max(1, Math.min(9999, parseInt(q, 10) || 1));
    var hit = cart.filter(function (c) { return c.f === fid && c.v === key; })[0];
    if (hit) hit.q += q; else cart.push({ f: fid, v: key, q: q });
    saveCart();
  }
  function saveCart() { store.set("cart", cart); badge(); bfI = 0; bfShow(); }
  function badge() {
    var t = totals(); $("#cartn").textContent = t.units; $("#dock").hidden = !t.units; setTimeout(dockLift, 0);
    if (t.units) $("#dockinfo").innerHTML = "<b>" + t.units + (t.units === 1 ? " item" : " items") + (HIDE && !t.quoted ? "" : " · " + totTxt(t)) + "</b><span>" + (t.quoted ? "Your price, from your rep." : HIDE ? "In your cart. " + WHO() + " " + backV() + " with your price." : RNG ? "Your rep sets the price." : ACCT ? "List total. You pay your account price." : "Priced by quantity. Your account may do better.") + "</span>";
  }
  /* Things worth adding: one pick from each kind of product the cart is missing, then the best sellers. */
  var SUGCATS = [["core", "Core bits"], ["cup", "Cup wheels"], ["small", "Small blades"], ["tuck", "Tuck point"]];
  function cartSuggest(t) {
    var have = {}, cats = {}, units = 0, picks = [], seen = {};
    t.lines.forEach(function (l) { have[l.f.id] = 1; units += l.c.q; l.f.cats.forEach(function (c) { cats[c] = 1; }); });
    var take = function (f, tag) { if (f && !have[f.id] && !seen[f.id] && f.cats.indexOf("equip") < 0 && picks.length < 6) { seen[f.id] = 1; picks.push([f, tag]); } };
    SUGCATS.forEach(function (c) { if (!cats[c[0]]) take(p3List(c[0])[0], c[1]); });
    pickFams().forEach(function (f) { take(f, "Popular"); });
    if (!picks.length) return "";
    var nb = QUICK.filter(function (q) { return q > units; })[0];
    return '<div class="csug"><b>Add to your cart?</b><small>Ships with this order, on the same freight bill.</small>' + (nb ? '<p class="cbrk">Add <b>' + (nb - units) + " more</b> and you’re at the <b>" + nb + "</b> price break.</p>" : "") +
      '<div class="btiles light">' + picks.map(function (x) { return btile(x[0], "data-sug", false).replace("</span></button>", "</span><em>" + esc(x[1]) + "</em><i>+ Add</i></button>"); }).join("") + "</div></div>";
  }
  function renderCart() {
    var t = totals(), b = $("#cartbody");
    var units = 0; t.lines.forEach(function (l) { units += l.c.q; });
    $("#carttitle").textContent = HIDE ? "Your cart" + (units ? " · " + units + (units === 1 ? " item" : " items") : "") : "Your order";
    if (!t.lines.length) { b.innerHTML = '<div class="empty d">' + (HIDE ? "Your cart is empty. Tap Reorder or Blade Finder and add what you need." : "Your order’s empty. Hit Blade Finder or Fast Reorder and load it up.") + "</div>"; $("#cartfoot").hidden = true; return; }
    $("#cartfoot").hidden = false;
    var bs = breakState(t), nb = bs.nb, pb = bs.pb;
    var hasCat = {}; t.lines.forEach(function (l) { l.f.cats.forEach(function (c) { hasCat[c] = 1; }); });
    var cq = !HIDE && nb && bs.need <= 6 ? "You’re " + bs.need + " away" + bs.of + " from the " + nb + "-piece price." : !hasCat.core ? "No core bits on here? It’s the same freight bill either way." : !hasCat.small && !hasCat.cup ? "Running grinders? Small blades and cup wheels ship on this same order." : HIDE ? "Good order. Send it and " + WHO() + " confirms your price." : "Good order. Ask for your price break before you send it.";
    var pk = isPackage(t), lr = repBySlug(me().rep);
    var quote = linkFor || linkNote ? '<div class="quote"><b>' + esc((lr ? repFirst(lr) + "’s order" : "Your order") + (linkFor ? " for " + linkFor : "")) + "</b>" + (linkNote ? "<span>“" + esc(linkNote) + "”</span>" : "") + "<small>Change a quantity if you need to, then send it.</small></div>" : "";
    var steps = '<ol class="csteps" aria-label="How ordering works"><li class="on"><i>1</i><span>Check your cart</span></li><li><i>2</i><span>Send it to ' + esc(WHO()) + "</span></li><li><i>3</i><span>" + esc(WHO()) + " " + backV() + " with your price</span></li></ol>" + replyPick();
    var nudge = HIDE ? quote + steps : '<div class="nudge">' + says(cq) + (nb ? '<div class="nbar"><i style="width:' + Math.min(100, bs.n / nb * 100) + '%"></i></div><span>' + (pb ? "You’ve hit the " + pb + "-piece price. " : "") + bs.need + " more" + esc(bs.of) + " to the " + nb + "-piece price break.</span>" : "<span>You’ve hit our biggest listed break. Your rep takes it from here.</span>") + '<small class="mixnote">' + esc(mixLine()) + "</small></div>";
    b.innerHTML = nudge + t.lines.map(function (l, i) {
      return '<div class="line' + (HIDE ? " haspic" : "") + '" data-i="' + i + '">' + (HIDE ? pic(l.f) : "") + "<div><h4>" + esc(l.f.n) + '</h4><div class="meta">' + esc(vlabel(l.v)) + "<br>" + esc(l.v[0]) + (HIDE ? "" : " · <b>" + (RNG ? rangeTxt(l.v) : (ACCT ? "List " : "") + money(l.each)) + " each</b>") + (!HIDE && l.each < l.v[3] ? " <s>" + money(l.v[3]) + "</s>" : "") + '</div></div><div class="lp">' + (RNG && !(l.c.p > 0) && ranged(l.v) ? "<small>up to</small> " : "") + (HIDE && !(l.c.p > 0) ? "" : money(l.each * l.c.q)) + "</div><div>" + qtyHTML(l.c.q) + "</div>" +
        (repMode() ? '<label class="rp">This customer’s price each $<input type="number" inputmode="decimal" min="0" step="1" data-rp value="' + (l.c.p > 0 ? l.c.p : "") + '" placeholder="' + (HIDE ? "" : l.v[3]) + '"></label>' : "") + '<button class="rm" data-rm>Remove</button></div>';
    }).join("") + (HIDE ? '<label class="cnote" for="cnote"><b>Add a note for ' + esc(WHO()) + '</b><small>Optional. Need-by date, jobsite, delivery, a question.</small><textarea id="cnote" maxlength="400" rows="3" placeholder="Example: Need these by Friday. Deliver to the Oak Street job.">' + esc(store.get("cnote", "") || "") + "</textarea></label>" + cartSuggest(t) : "") + (HIDE && pk ? '<div class="callout one"><b>One package price. Saw included.</b><span>' + esc(WHO()) + " " + backV() + " with your total.</span></div>" : "") + (HIDE ? "" : '<div class="callout"><b>' + (t.quoted ? "These are your prices." : HIDE ? "Your price is your price." : RNG ? "Your rep sets your price." : ACCT ? "You don’t pay list." : "The more you buy, the better the price.") + "</b><span>" + (t.quoted ? "Your rep set them for your account. Change a quantity and send it." : HIDE ? "No hunting for a number. Send the order and your rep confirms your price before anything ships. Nothing is charged on this site." : RNG ? "Your order lands inside the range shown. Send it and your rep confirms your exact number before it ships. Bigger order or a saw with it gets you closer to the low end." : ACCT ? "Send the order and your rep bills it at your account price. They confirm the number before it ships. Bigger order or a saw with it? Ask." : (t.save > 0.005 ? "Quantity pricing is already saving you " + money(t.save) + " on this order. " : "") + "Have an account price, or want a package deal? Ask.") + '</span><button class="btn gold sm" data-breaks>Ask ' + esc(WHO()) + " about pricing" + "</button></div>");
    $("#carttot").innerHTML = HIDE ? "<span>In your cart</span><span>" + units + (units === 1 ? " item" : " items") + "</span>" : "<span>" + (t.quoted ? "Your total" : HIDE ? "Your price" : RNG ? "Order range" : ACCT ? "List total" : "Order total") + "</span><span>" + totTxt(t) + "</span>";
    $("#cartnote").textContent = HIDE ? "" : (t.quoted ? "Priced for your account." : RNG || HIDE ? "Your rep confirms your exact price before it ships." : ACCT ? "List is the ceiling. Your account price is what you’re billed." : "Priced by quantity.") + " Freight and tax are added by your rep. Nothing is charged on this site."; if (HIDE) $("#cartnote").innerHTML = "<b>What happens next:</b> " + esc(WHO()) + " " + backV(1) + " with your price before anything ships. Nothing is charged on this site."; $("#cartnote").classList.toggle("next", HIDE);
    var known = !!(me().name), q = $("#quick"), rt = route2(repBySlug(me().rep) ? me().rep : "");
    if (q) q.innerHTML = known && W.textNumber ? '<button class="btn gold block shine" data-quicksms>Text my cart to ' + esc(rt.who) + '</button><p class="note" id="quickmsg" hidden></p>' : "";
    $("[data-checkout]").textContent = known ? "Review, email or add a note" : HIDE ? "Send my cart to " + WHO() : "Send my order"; $("[data-checkout]").className = known ? "btn ghost-d block" : HIDE ? "btn gold block shine" : "btn chrome block shine";
  }

  /* ---------- before you send it ---------- */
  function openExtras() {
    var t = totals(), have = {};
    t.lines.forEach(function (l) { l.f.cats.forEach(function (c) { have[c] = 1; }); });
    var miss = DONTFORGET.filter(function (d) { return !have[d.cat]; });
    extras = { free: "", stock: false, breaks: [] };
    $("#extrasbody").innerHTML =
      promoBar() +
      '<div class="xcard"><b>Stock up and save.</b><span>We keep deep inventory on Dragon, Superblade Extreme, Super G, T-Rex and Viper. Want our stock-up pricing on those?</span><label class="xcheck"><input type="checkbox" id="xstock"> Yes, have my rep quote stock-up pricing</label></div>' +
      '<div class="xcard"><b>Buying in quantity?</b><span>Tap the price breaks you want quoted.</span><div class="xchips" id="xbreaks">' + BREAKS.map(function (q) { return '<button type="button" data-xbreak="' + q + '" aria-pressed="false">' + q + "</button>"; }).join("") + "</div></div>" +
      (miss.length ? '<div class="xcard"><b>Don’t forget your…</b><span>One order, one freight bill. Tap to add.</span><div class="xchips">' + miss.map(function (d) { return '<button type="button" data-xcat="' + d.cat + '">' + esc(d.n) + "</button>"; }).join("") + "</div></div>" : "");
    $("#cart").close(); $("#extras").showModal();
  }

  /* ---------- send ---------- */
  var mode = "order";
  var MODES = {
    account: { title: "Open a free account", intro: "An account makes reordering faster and gets you pricing set for your company. Tell us who you are and your rep sets it up and calls you. This is a request, not a login.", head: "DBW WISCO NEW ACCOUNT REQUEST", subj: "New account request" },
    stone: { title: "Stone shop: Helix tools", intro: "Tell us what you fabricate and what you need. We quote Helix Professional Tools and get back to you.", head: "DBW WISCO HELIX / STONE SHOP REQUEST", subj: "Helix request", msg: "What do you need?" },
    terms: { title: "Apply for Net 30 terms", intro: "Tell us who you are. Add two or three trade references and the credit limit you’re after. We’ll get it in front of the right person and call you.", head: "DBW WISCO TERMS APPLICATION", subj: "Net 30 terms application" },
    order: { title: "Send my order", intro: "Fill this in once. This phone remembers it, so next time it’s two taps.", head: "DBW WISCO ORDER", subj: "Order" },
    pricing: { title: "Get my price breaks", intro: "Tell us which pricing to check. Your rep comes back with your real numbers.", head: "DBW WISCO PRICING REQUEST", subj: "Pricing request" },
    saw: { title: "Send my saw package", intro: "Your rep confirms the package, freight and ship date, then it’s yours.", head: "DBW WISCO SAW PACKAGE", subj: "Saw package request" },
    equip: { title: "Find me equipment", intro: "Give us as much as you can: make, model, size, new or used, how soon.", head: "DBW WISCO EQUIPMENT REQUEST", subj: "Equipment request", msg: "What are you looking for? Make, model, anything you know" },
    feedback: { title: "How’d we do?", intro: "Tell us what worked and what didn’t. We read every one.", head: "DBW WISCO FEEDBACK", subj: "Feedback", msg: "Tell us how we did" },
    review: { title: "Leave a review", intro: "An honest review, good or bad, earns you " + RW.review + ". Your rep applies it.", head: "DBW WISCO REVIEW", subj: "Review" },
    refer: { title: "Refer a contractor", intro: "Send a contractor our way. When they place their first order and name you, you get " + (RW.referrerYou || RW.referrer) + ".", head: "DBW WISCO REFERRAL", subj: "Referral" }
  };
  function me() { return store.get("me", {}); }
  function myRep() { var r = repBySlug(me().rep); return r && !isBoss(r) ? r : null; }
  function cellShow() { var r = myRep(); return (r && r.cell && prettyPhone(r.cell)) || W.textDisplay || ""; }
  function mailShow() { var r = myRep(); return r ? (r.email || "") : (W.orderEmail || ""); }
  var BOSSPIC = ((W.reps || []).filter(function (x) { return /frank/i.test(x.name) && x.photo; })[0] || {}).photo || "frank.webp";
  /* How the customer wants the price back: call, text or email. Unset means call or text. */
  var REPLY = { call: ["Call me", "calls you back", "CALL"], text: ["Text me", "texts you back", "TEXT"], email: ["Email me", "emails you back", "EMAIL"] };
  function replyHow() { var r = me().reply; return REPLY[r] ? r : ""; }
  function backV(long) { var r = replyHow(); return r ? REPLY[r][1] : long ? "calls or texts you back" : "calls you back"; }
  function replyPick() { var r = replyHow(); return '<div class="rpick"><b>How do you want your price?</b><div role="group" aria-label="How do you want your price?">' + ["call", "text", "email"].map(function (k) { return '<button type="button" data-reply="' + k + '" aria-pressed="' + (r === k) + '">' + REPLY[k][0] + "</button>"; }).join("") + "</div></div>"; }
  function WHO() { var r = myRep(); return r ? repFirst(r) : FRANK; }
  function SAYER() { var r = myRep(); return r ? repFirst(r) : "Big " + FRANK; }
  function askImg(big) { var r = myRep(); return "brand/reps/" + (r && r.photo ? r.photo : BOSSPIC); }   /* one face per person, the same one everywhere */
  function isPackage(t) { var saw = false, blade = false; t.lines.forEach(function (l) { if (l.f.cats.indexOf("equip") >= 0) saw = true; else blade = true; }); return saw && blade; }
  /* The order text for someone whose name this phone already knows: no form. */
  function quickOrder() { var i = me(); return { name: i.name || "", company: i.company || "", phone: i.phone || "", email: i.email || "", po: "", notes: store.get("cnote", "") || "", rep: repBySlug(i.rep) ? i.rep : "", pay: i.pay || PAY0, feedback: "", msg: "", acct: i.acct || "existing", addr: i.addr || "", city: i.city || "", state: i.state || "", zip: i.zip || "", ref: "", limit: "", r1: "", r1p: "", r2: "", r2p: "", r3: "", r3p: "", stars: "", review: "", fname: "", fco: "", intent: "buy", pub: false, disc: [] }; }
  var PAY0 = "Not sure, have my rep call";
  /* On the live site a rep's link is their own short address (…/wisco/miz/). Opened as a file, fall back to ?rep=. */
  function repLink(base, s) { var r = repBySlug(s), nick = r && r.aka && r.aka[0]; return /\/$/.test(base) && nick ? base + nick + "/" : base + "?rep=" + s; }
  function repBySlug(s) { if (!s) return undefined; return (W.reps || []).filter(function (r) { return slug(r.name) === s || (r.aka || []).indexOf(s) >= 0; })[0]; }
  function initials(n) { return n.split(/\s+/).map(function (x) { return x[0]; }).join("").slice(0, 2).toUpperCase(); }
  function renderReps(cur) {
    var lockR = store.get("replock", 0) === 1 && repBySlug(cur);
    if (lockR) { $("#reps").innerHTML = '<div class="replock"><span class="av">' + (lockR.photo ? '<img alt="" src="brand/reps/' + esc(lockR.photo) + '">' : esc(initials(lockR.name))) + "</span><div><b>" + esc(lockR.name) + '</b><small>Your salesman. This goes straight to them.</small></div><button type="button" class="link" data-repchange>Not your rep?</button></div>'; $("#f-rep").value = slug(lockR.name); $("#replabel").textContent = "Your salesman"; var rd0 = $("#repd"); if (rd0) { rd0.open = true; rd0.classList.add("locked"); } return; }
    var rd = $("#repd"); if (rd) rd.classList.remove("locked");
    $("#reps").innerHTML = '<button type="button" class="rep' + (!cur ? " on" : "") + '" data-rep=""><span class="av q">?</span><b>Not sure</b></button>' + (W.reps || []).map(function (r) {
      var s = slug(r.name);
      return '<button type="button" class="rep' + (cur === s ? " on" : "") + '" data-rep="' + s + '"><span class="av">' + (r.photo ? '<img alt="" src="brand/reps/' + esc(r.photo) + '">' : esc(initials(r.name))) + "</span><b>" + esc(r.name) + "</b></button>";
    }).join("");
    var cr = repBySlug(cur), rs = $("#repsum"); if (rs) rs.textContent = cr ? "Your rep: " + cr.name + " (tap to change)" : "Know your rep? Pick them (optional)";
    $("#f-rep").value = cur || "";
  }
  function setIntent(v) {
    $("#f-intent").value = v; $$("#intentseg [data-intent]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.intent === v); });
    $("#intentnote").textContent = v === "buy" ? (HIDE ? "It ships at your price. Your rep confirms the number with you, adds freight and tax, and sends it." : RNG ? "It ships at your price. Your rep sets the number inside the range, confirms it with you, adds freight and tax, and sends it." : ACCT ? "It ships at your account price. Your rep confirms the number, adds freight and tax, and sends it." : "You’re buying at the order total. Your rep confirms it, adds freight and tax, and it ships.") : "Nothing ships and nothing is billed until you see your price and say go.";
    preview();
  }
  function setAcct(v) {
    var f = $("#sendform"), order = mode === "order" || mode === "saw";
    $("#f-acct").value = v;
    $$("#acctseg [data-acct]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.acct === v); });
    $("#newwrap").hidden = !(order && v === "new");
    $("#replabel").textContent = v === "new" ? "New to DBW? We’ll match you with a rep." : "Your salesman";
    $("#creditsum").textContent = v === "new" ? "Want terms? Add trade references to set up credit" : "Need a higher credit limit? Add trade references";
    $("#creditnote").textContent = v === "new" ? "Three trade references get a Net 30 or Net 45 account moving. Skip this if you’re paying by card or check." : "Tell us the limit you need and give us current references. Your rep takes it to credit.";
    if (v === "new" && /terms/i.test(f.elements.pay.value)) $("#creditwrap").open = true;
    preview();
  }
  function openSend(m) {
    mode = m; ordRef = newRef(); var M = MODES[m], info = me(), f = $("#sendform"), order = m === "order" || m === "saw", terms = m === "terms";
    $("#sendtitle").textContent = M.title; $("#sendintro").textContent = M.intro;
    $("#discwrap").hidden = m !== "pricing";
    $("#msgwrap").hidden = !M.msg; if (M.msg) $("#msglabel").textContent = M.msg;
    $("#intentseg").hidden = $("#intentnote").hidden = m !== "order" || HIDE; setIntent(ACCT ? "buy" : "quote");
    if (ACCT) { var ib = $$("#intentseg [data-intent]"); ib.forEach(function (x) { var buy = x.dataset.intent === "buy"; x.innerHTML = buy ? "<b>Order it</b><span>" + (RNG || HIDE ? "My rep confirms my price" : "Bill my account price") + "</span>" : "<b>Price it first</b><span>Show me before it ships</span>"; x.style.order = buy ? 0 : 1; }); }
    $("#acctseg").hidden = !(order || terms); $("#orderwrap").hidden = !(order || terms || m === "pricing");
    $("#paywrap").hidden = $("#paynote").hidden = !order; $("#creditwrap").hidden = !(order || terms);
    $("#reviewwrap").hidden = m !== "review"; $("#referwrap").hidden = m !== "refer";
    ["name", "company", "phone", "email", "addr", "city", "state", "zip"].forEach(function (k) { f.elements[k].value = info[k] || ""; });
    ["po", "notes", "msg", "review", "stars", "fname", "fco", "limit", "r1", "r1p", "r2", "r2p", "r3", "r3p"].forEach(function (k) { f.elements[k].value = ""; });
    if (m === "order") f.elements.notes.value = store.get("cnote", "") || "";
    f.elements.ref.value = store.get("ref", "") || "";
    $("#refhint").textContent = m === "saw" ? "" : "They earn " + RW.referrer + " when you order.";
    var pl = $('label[for="f-phone"]'); if (pl) pl.textContent = m === "review" || m === "refer" || m === "feedback" ? "Cell (optional)" : "Cell (so your rep can text your price)";
    $$("#starpick button").forEach(function (x) { x.classList.remove("on"); });
    $("#creditwrap").open = terms;
    f.elements.pay.innerHTML = [PAY0].concat((W.payments || []).filter(function (p) { return p !== PAY0; })).map(function (p) { return "<option>" + esc(p) + "</option>"; }).join("");
    var mw = $("#morewrap"); if (mw) { mw.hidden = !(order || terms || m === "pricing"); mw.open = terms || (replyHow() === "email" && (order || m === "pricing")); }
    if (info.pay) f.elements.pay.value = info.pay;
    renderReps(repBySlug(info.rep) ? info.rep : "");
    $("#discs").innerHTML = (W.discounts || []).map(function (d, i) { return '<label><input type="checkbox" name="disc" value="' + esc(d) + '"' + (i < 2 ? " checked" : "") + "> " + esc(d) + "</label>"; }).join("");
    $("#textbtn").hidden = !W.textNumber; sendLabels(repBySlug(info.rep) ? info.rep : ""); $("#sentmsg").hidden = true;
    $("#sharebtn").hidden = !(m === "order"); $("#friendbtn").hidden = m !== "refer";
    setAcct(m === "account" ? "new" : info.acct === "new" && !info.sent ? "new" : (info.sent ? "existing" : (info.acct || "existing")));
    if (m === "account") { $("#newwrap").hidden = false; $("#orderwrap").hidden = false; }
    payNote();
    ["cart", "detail", "extras"].forEach(function (id) { if ($("#" + id).open) $("#" + id).close(); }); $("#send").showModal(); $("#sendform").scrollTop = 0;
  }
  function newRef() { var d = new Date(), a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = ""; for (var i = 0; i < 4; i++) r += a[Math.floor(Math.random() * a.length)]; return "W" + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + "-" + r; }
  function remind() {
    var d = new Date(Date.now() + 30 * 864e5), p = function (n) { return ("0" + n).slice(-2); }, day = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
    var last = lastOrder(), items = last && last.items ? last.items.map(function (c) { var v = FAM[c.f] && findVar(FAM[c.f], c.v); return v ? encodeURIComponent(v[0]) + "*" + c.q : ""; }).filter(Boolean) : [];
    var link = ROOT + (items.length ? "?cart=" + items.join(",") : "") + (me().rep ? (items.length ? "&" : "?") + "rep=" + me().rep : "");
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DBW WISCO//Reorder//EN", "BEGIN:VEVENT", "UID:" + Date.now() + "@dbwwisco", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d+/g, ""), "DTSTART:" + day + "T090000", "DTEND:" + day + "T091500", "SUMMARY:Reorder blades from DBW WISCO", "DESCRIPTION:Running low? Your last order is one tap away: " + link.replace(/,/g, "\\,") + "\\nOr text " + WHO() + ": " + cellShow(), "URL:" + link, "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:Reorder blades from DBW WISCO", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a"); a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics); a.download = "reorder-dbw-wisco.ics"; document.body.appendChild(a); a.click(); a.remove();
    toast("Reminder made for " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ". Add it to your calendar.");
  }
  function formData() { var f = $("#sendform"), o = {}; ["name", "company", "phone", "email", "po", "notes", "rep", "pay", "feedback", "msg", "acct", "addr", "city", "state", "zip", "ref", "limit", "r1", "r1p", "r2", "r2p", "r3", "r3p", "stars", "review", "fname", "fco", "intent"].forEach(function (k) { o[k] = (f.elements[k].value || "").trim(); }); o.pub = f.elements.pub.checked; o.disc = $$('input[name="disc"]:checked', f).map(function (x) { return x.value; }); return o; }
  function buildText(o) {
    var t = totals(), rep = repBySlug(o.rep), L = [], M = MODES[mode], items = mode === "order" || mode === "pricing";
    L.push((mode === "order" ? (o.intent === "buy" ? (HIDE ? "DBW WISCO ORDER REQUEST: REP CONFIRMS THE PRICE FIRST" : RNG ? "DBW WISCO ORDER: REP SETS THE PRICE" : ACCT ? "DBW WISCO ORDER: BILL AT ACCOUNT PRICE" : "DBW WISCO ORDER: BUY AT SITE PRICE") : "DBW WISCO QUOTE REQUEST: send my account price first") : M.head) + (ordRef ? "  ·  Ref " + ordRef : ""));
    L.push("From: " + (o.name || "(name)") + (o.company ? ", " + o.company : ""));
    if (o.phone) L.push("Phone: " + o.phone);
    if (o.email) L.push("Email: " + o.email);
    if (replyHow() && (mode === "order" || mode === "saw" || mode === "pricing")) L.push("REPLY BY: " + REPLY[replyHow()][2] + (replyHow() === "email" ? (o.email ? "" : " (no email given)") : (o.phone ? "" : " (no number given)")));
    var order = mode === "order" || mode === "saw", terms = mode === "terms";
    if (mode === "account") { L.push("Wants a new account set up."); if (o.addr || o.city || o.zip) L.push("Ship to: " + [o.addr, [o.city, o.state].filter(Boolean).join(", "), o.zip].filter(Boolean).join(" · ")); L.push("Salesman: " + (rep ? rep.name : "None yet")); }
    if (order || terms) L.push("Account: " + (o.acct === "new" ? "NEW ACCOUNT" : "Existing customer") + (o.acct !== "new" && lastTxt(me().last) ? " · last order " + lastTxt(me().last) : ""));
    if ((order || terms) && o.acct === "new" && (o.addr || o.city || o.zip)) L.push("Ship to: " + [o.addr, [o.city, o.state].filter(Boolean).join(", "), o.zip].filter(Boolean).join(" · "));
    if (order || terms || mode === "pricing") L.push("Salesman: " + (rep ? rep.name : (o.acct === "new" ? "None yet" : "Not sure")));
    if (order) { if (o.pay && o.pay !== PAY0) L.push("Pay by: " + o.pay); if (o.po) L.push("PO #: " + o.po); }
    if (mode === "order" && PROMO_ON && isCard(o.pay)) L.push("PROMO: FREE BLADE for paying this order by card. Rep confirms which blade.");
    if ((order || mode === "pricing") && o.ref) L.push("REFERRED BY: " + o.ref + "  (they earn " + RW.referrer + ")");
    var refs = [[o.r1, o.r1p], [o.r2, o.r2p], [o.r3, o.r3p]].filter(function (x) { return x[0] || x[1]; });
    if ((order || terms) && (refs.length || o.limit || terms)) {
      L.push(""); L.push(o.acct === "new" ? "CREDIT REQUEST: set up terms" + (o.limit ? ", limit " + o.limit : "") : "CREDIT REQUEST: raise limit" + (o.limit ? " to " + o.limit : ""));
      refs.forEach(function (x, i) { L.push("  Ref " + (i + 1) + ": " + [x[0], x[1]].filter(Boolean).join(" · ")); });
    }
    if (mode === "review") { L.push(""); L.push("RATING: " + (o.stars ? "★★★★★".slice(0, +o.stars) + "☆☆☆☆☆".slice(0, 5 - o.stars) + " (" + o.stars + " of 5)" : "(not rated)")); if (o.review) L.push(o.review); L.push("OK to post on the site: " + (o.pub ? "YES" : "NO")); L.push("Reward owed: " + RW.review); }
    if (mode === "refer") { L.push(""); L.push("REFERRING: " + [o.fname, o.fco].filter(Boolean).join(" · ")); L.push("Reward when they order: " + RW.referrer + " for the referrer"); }
    if (mode === "pricing" && o.disc.length) { L.push(""); L.push("Please check: " + o.disc.join("; ")); }
    if (M.msg && o.msg) { L.push(""); L.push(o.msg); }
    if (mode === "saw") { L.push(""); L.push(dealText()); }
    if (items) {
      L.push(""); L.push(t.lines.length ? "ITEMS" : "(no items in cart yet)");
      t.lines.forEach(function (l) { L.push(l.c.q + " x " + l.v[0] + "  " + l.f.n + " " + vlabel(l.v) + (HIDE ? "" : "  @ ") + (l.c.p > 0 ? "rep-link price " + money(l.each) + " = " + money(l.each * l.c.q) : HIDE ? "" : RNG ? "site range " + rangeTxt(l.v) + " each" : (ACCT ? "list " : "") + money(l.each) + " = " + money(l.each * l.c.q))); });
      if (t.lines.length) { L.push(""); L.push(t.quoted ? "Total at the prices on the customer’s rep link: " + money(t.total) + "  (VERIFY against the account before billing)" : HIDE ? (isPackage(t) ? "PACKAGE: one price for the whole package, saw included. " : "") + "No price was shown on the site. Rep confirms the price with the customer before it ships." : RNG ? "Site range for this order: " + totTxt(t) + "  (the site did not commit to a price. REP SETS THE PRICE and confirms it with the customer before it ships.)" + (t.anyQuoted ? "  Some lines carry a rep-link price: verify those." : "") : ACCT ? "List total: " + money(t.total) + "  (reference only. The site did not quote this customer a price. Bill at their account price.)" + (t.anyQuoted ? "  Some lines carry a rep-link price: verify those." : "") : "Site total: " + money(t.total) + "  (quantity pricing, before freight and tax)" + (mode === "order" && o.intent === "buy" ? "  CUSTOMER IS BUYING AT THIS PRICE" : "  customer wants their account price or a better deal")); }
    }
    if (mode === "order" && linkNote) { L.push(""); L.push("Rep’s note on the link: " + linkNote); }
    if (mode === "order") {
      var x = [];
      if (extras.stock) x.push("Wants stock-up pricing on the most common blades");
      if (extras.breaks.length) x.push("Quote price breaks at: " + extras.breaks.join(", ") + " pieces");
      if (x.length) { L.push(""); x.forEach(function (s) { L.push(s); }); }
    }
    if (o.notes) { L.push(""); L.push("Notes: " + o.notes); }
    if (o.feedback) { L.push(""); L.push("FEEDBACK: " + o.feedback); }
    L.push(""); L.push("Sent from the DBW WISCO site");
    return L.join("\n");
  }
  function preview() { $("#preview").textContent = buildText(formData()); }
  function afterSend(how) {
    var o = formData(), t = totals();
    store.set("me", { name: o.name, company: o.company, phone: o.phone, email: o.email, rep: o.rep, pay: o.pay === PAY0 ? "" : o.pay, acct: o.acct, addr: o.addr, city: o.city, state: o.state, zip: o.zip, sent: mode === "order" || me().sent ? 1 : 0 });
    if (mode === "order" && t.lines.length) store.set("last", { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), items: cart.slice() });
    var m = $("#sentmsg"); m.hidden = false; var refLine = ordRef && (mode === "order" || mode === "saw" || mode === "pricing") ? " <span class=\"bigref\">Reference <b class=\"sel\">" + ordRef + "</b> · screenshot this</span>" : "";
    m.innerHTML = how === "posted" ? "<b>Sent.</b><span>A real person has it. Expect a call or text back." + refLine + "</span>"
      : how === "copied" ? "<b>Copied.</b><span>Paste it into a text or email to " + esc(WHO()) + "." + refLine + "</span>"
        : "<b>Order prepared. It is not sent yet.</b><span>Hit Send in your " + (how === "sms" ? "messages" : "email") + " app. It’s already written for you. Once it’s sent, " + esc(WHO()) + " " + backV(1) + " with your price. If nothing opened, tap Copy and paste it to " + esc(how === "sms" ? cellShow() : mailShow()) + "." + refLine + "</span>";
    if (mode === "order" || mode === "saw") m.innerHTML += '<div class="aftersend"><span>Want ' + esc(RW.review) + '?</span><button type="button" class="btn blue sm" data-review>Leave a review</button><button type="button" class="btn ghost-d sm" data-refer>Refer a contractor</button></div>';
    if (mode === "order" && t.lines.length) m.innerHTML += '<div class="aftersend"><span>Don’t run out mid-job.</span><button type="button" class="btn ghost-d sm" data-remind>Remind me to reorder in 30 days</button></div>';
    m.scrollIntoView({ block: "nearest" });
  }
  function friendLink() { var o = formData(), who = (o.company || o.name || "").slice(0, 60); return ROOT + "?ref=" + encodeURIComponent(who); }
  function needName(how) {
    var f = $("#sendform"), M = MODES[mode];
    if (M.msg && !f.elements.msg.value.trim()) { f.elements.msg.focus(); toast("Tell us a little so we know what to chase"); return true; }
    if (!f.elements.name.value.trim()) { f.elements.name.focus(); toast("Add your name so we know who it’s from"); return true; }
    if (mode === "review" && !f.elements.stars.value) { toast("Tap a star rating first"); return true; }
    if (mode === "review" && !f.elements.review.value.trim()) { f.elements.review.focus(); toast("Tell us a little about how it went"); return true; }
    if (mode === "refer" && !f.elements.fname.value.trim()) { f.elements.fname.focus(); toast("Who are you referring?"); return true; }
    if ((mode === "order" || mode === "saw" || mode === "pricing") && replyHow() === "email" && !f.elements.email.value.trim()) { var mw = $("#morewrap"); if (mw) mw.open = true; f.elements.email.focus(); toast("Add your email so " + WHO() + " can email your price"); return true; }
    if ((mode === "order" || mode === "saw" || mode === "pricing") && (replyHow() === "call" || replyHow() === "text") && !f.elements.phone.value.trim()) { f.elements.phone.focus(); toast("Add your cell so " + WHO() + " can " + replyHow() + " you"); return true; }
    if (how !== "sms" && (mode === "order" || mode === "saw" || mode === "terms" || mode === "account") && !f.elements.phone.value.trim()) { f.elements.phone.focus(); toast("Add a phone number so we can confirm the order"); return true; }
    if ((mode === "order" || mode === "saw") && f.elements.acct.value === "new" && !f.elements.zip.value.trim()) { f.elements.zip.focus(); toast("Add your ship-to ZIP so we can quote freight"); return true; }
    return false;
  }
  /* Who gets it. A rep with an email in config.js gets the order; Frank and the rep's manager are copied. No rep email = it goes to Frank. */
  function route2(slugv) {
    var r = repBySlug(slugv) || {}, main = W.orderEmail || "", toRep = W.ordersTo === "rep", uniq = function (a) { var seen = {}; return a.filter(function (x) { x = (x || "").toLowerCase(); if (!x || seen[x]) return false; seen[x] = 1; return true; }); };
    var both = W.ordersTo === "both";
    /* "both": the manager AND the customer's rep each get the email (both on the To line) and the text (one group text). */
    var tos = both ? uniq([r.email, main]) : [toRep && r.email ? r.email : main], to = tos.join(",");
    var cc = uniq([main, r.email, r.manager].concat(W.alsoCopy || [])).filter(function (x) { return tos.map(function (y) { return y.toLowerCase(); }).indexOf(x.toLowerCase()) < 0; });
    var repText = toRep && r.cell, cells = both ? uniq([r.cell, W.textNumber]) : [repText ? r.cell : (W.textNumber || "")];
    var first = function (n) { return (n || "").replace(/^Big /, "").split(" ")[0]; };
    return { to: to, cc: cc, cell: cells.join(","), who: both && cells.length > 1 ? first(r.name) + " and " + FRANK : repText || (toRep && r.email) ? r.name : FRANK };
  }
  function mailWho(slugv) { var r = repBySlug(slugv), rt = route2(slugv), f1 = function (n) { return (n || "").replace(/^Big /, "").split(" ")[0]; }; return r && r.email && rt.to.toLowerCase().indexOf(r.email.toLowerCase()) >= 0 && !isBoss(r) ? f1(r.name) + " and " + FRANK : FRANK; }
  function sendLabels(slugv) { $("#textbtn").textContent = "Text it to " + route2(slugv).who; var eb = $("[data-email]"); if (eb) eb.textContent = "Email it to " + mailWho(slugv); }
  function mailto(to, subj, body, cc) { location.href = "mailto:" + (to || "").split(",").map(encodeURIComponent).join(",") + "?" + (cc && cc.length ? "cc=" + encodeURIComponent(cc.join(",")) + "&" : "") + "subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body); }
  function sms(body, cell) {
    cell = cell || W.textNumber; var many = cell.indexOf(",") > 0, ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    /* Group text: iPhone needs the /open?addresses= form, Android takes a comma list. */
    location.href = many && ios ? "sms:/open?addresses=" + cell + "&body=" + encodeURIComponent(body) : "sms:" + cell + "?&body=" + encodeURIComponent(body);
  }
  function sendEmail() {
    if (needName()) return;
    var o = formData(), rep = repBySlug(o.rep), body = buildText(o);
    var subj = (mode === "order" && o.intent !== "buy" ? "Quote request" : MODES[mode].subj) + " from " + (o.company || o.name) + (rep ? " (salesman: " + rep.name + ")" : "") + (o.po ? " PO " + o.po : "") + (ordRef ? " [" + ordRef + "]" : "");
    var viaMail = function () { try { navigator.clipboard.writeText(body).catch(function () {}); } catch (e) {} var rt = route2(o.rep); mailto(rt.to, subj, body, rt.cc); afterSend("email"); };
    if (W.formEndpoint && !isPreview) {
      fetch(W.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ _subject: subj, name: o.name, company: o.company, phone: o.phone, email: o.email, salesman: rep ? rep.name : "", message: body }) })
        .then(function (r) { if (!r.ok) throw 0; afterSend("posted"); }).catch(viaMail);
    } else viaMail();
  }
  function copyText(txt, done) {
    var fb = function () { toast("Couldn’t copy automatically. Press and hold the text to copy."); };
    try { navigator.clipboard.writeText(txt).then(function () { done && done(); }, fb); } catch (e) { fb(); }
  }
  function shareLink() { var o = formData(); return ROOT + "?cart=" + cartLines().map(function (l) { return encodeURIComponent(l.v[0]) + "*" + l.c.q; }).join(",") + (o.rep ? "&rep=" + o.rep : "") + linkExtras(); }
  function repMode() { return false; }   /* price entry on the site is gone: a price typed here could be edited or forwarded */
  var linkFor = "", linkNote = "";
  function clean(x, n) { return String(x || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n); }
  function linkExtras() { var c = $("#rt-co"), n = $("#rt-note"), cv = clean(c ? c.value : linkFor, 60), nv = clean(n ? n.value : linkNote, 140); return (cv ? "&c=" + encodeURIComponent(cv) : "") + (nv ? "&note=" + encodeURIComponent(nv) : ""); }

  /* ---------- product detail ---------- */
  function openDetail(f) {
    var vurl = (W.videos || {})[f.id], mats = Object.keys(f.m).sort(function (a, b) { return f.m[b] - f.m[a]; }), cur = wiz.mat ? wiz.mat.keys : [];
    var h = '<div class="pd"><div>' + pic(f) + "</div><div>" + (f.tier ? '<span class="tier ' + f.tier + '">' + tierTag(f) + "</span>" : "") + "<h3>" + esc(f.n) + "</h3>" +
      (f.hook ? '<p class="lede">' + esc(f.hook) + "</p>" : "") +
      ((f.learn || []).length ? '<div class="learn-list"><h4>Why it works</h4>' + f.learn.map(function (x) { return '<div class="lq"><b>' + esc(x[0]) + "</b><p>" + esc(x[1]) + "</p></div>"; }).join("") + "</div>" : f.ben.length ? '<ul class="ben">' + f.ben.map(function (b) { return "<li>" + (b[0] ? "<b>" + esc(b[0]) + "</b>" : "") + esc(b[1]) + "</li>"; }).join("") + "</ul>" : (f.desc ? '<p class="note" style="font-size:15px;color:var(--ink)">' + esc(f.desc) + "</p>" : "")) + "</div></div>";
    var fly = (W.flyers || {})[f.id];
    if (fly) h += '<div class="center"><a class="btn gold" href="' + esc(fly) + '" target="_blank" rel="noopener">View the product flyer (PDF)</a></div>';
    if (TIERQUIP[f.tier]) h += says(TIERQUIP[f.tier]);
    h += '<div class="blk"><h4>Pick your size</h4><div class="sizes">' + f.vars.map(function (v) {
      return '<div class="sz' + (inSaw(v, wiz.saw) ? "" : " dim") + '" data-v="' + esc(vkey(v)) + '"><div><b>' + esc(vlabel(v)) + "</b><small>" + esc(v[0]) + (depthFor(f, v) ? " · cuts about " + depthFor(f, v) + " deep" : "") + '</small></div><div class="r">' + (HIDE ? "" : '<span class="p">' + rangeTxt(v) + "</span>") + qtyHTML(1) + '<button class="add" data-add>Add</button></div></div>';
    }).join("") + "</div></div>";
    var tv = defVar(f, f.vars);
    if (tiered(tv)) h += '<div class="blk"><h4>The more you buy, the better the price</h4><div class="tiers">' + ["1 to 11", "12+", "24+", "36+", "50+", "100+"].map(function (lab, i) { return "<div><span>" + lab + "</span><b>" + money(i ? tv[6][i - 1] : tv[3]) + "</b></div>"; }).join("") + '</div><p class="note">Each, for the ' + esc(vlabel(tv)) + ". " + esc(mixLine()) + " Your account may do better.</p></div>";
    h += '<div class="callout"><b>Want a better number?</b><span>Bigger order, a saw to go with it, or an account price you already have. Ask.</span><button class="btn gold sm" data-pricing>Ask ' + esc(WHO()) + " about pricing" + "</button></div>";
    if (mats.length) h += '<div class="blk"><h4>How it rates</h4><div class="rates">' + mats.map(function (k) { return '<div class="' + (cur.indexOf(k) >= 0 ? "on" : "") + '"><span>' + esc(MATNAME[k]) + "</span><span>" + stars(f.m[k]) + " " + f.m[k].toFixed(1) + "</span></div>"; }).join("") + "</div></div>";
    if (vurl) {h += '<div class="blk"><h4>Watch it cut</h4>' + (vurl
      ? '<a class="video" href="' + esc(vurl) + '" target="_blank" rel="noopener"><span class="play"></span><span><b>See the ' + esc(f.n) + " in action</b><span>Opens the video in a new tab</span></span></a>"
      : '<div class="video soon"><span class="play"></span><span><b>Video coming soon</b><span>Want to see it cut first? Ask ' + esc(WHO()) + " for a demo.</span></span></div>") + "</div>"; }
    if (f.saws.length) h += '<div class="blk"><h4>Runs on</h4><div class="tags">' + f.saws.map(function (k) { return "<span>" + esc(SAWNAME[k]) + "</span>"; }).join("") + "</div></div>";
    $("#detailtitle").textContent = f.n;
    var b = $("#detailbody"); b.innerHTML = h; b.dataset.f = f.id; b.scrollTop = 0;
    if (!$("#detail").open) $("#detail").showModal();
  }

  /* ---------- events ---------- */
  function flash(el, txt) { el.classList.add("ok"); var old = el.textContent; el.textContent = txt || "Added ✓"; setTimeout(function () { el.classList.remove("ok"); el.textContent = old; }, 1100); }
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if (t.closest("[data-bftoggle]")) { bfOpen(!$("#bf").classList.contains("open")); return; }
    if (t.closest("[data-bfhide]")) { bfOpen(false); return; }
    if (t.closest("[data-bfnext]")) { bfI++; bfShow(); return; }
    if ((el = t.closest("[data-rtrep]"))) { var inf = me(); inf.rep = el.dataset.rtrep; store.set("me", inf); repTools(); return; }
    if (t.closest("[data-rtshare]")) { if (!cartLines().length) { toast("Build the cart first, then copy the link"); return; } if (!me().rep) { toast("Pick your name first"); return; } var rl = ROOT + "?cart=" + cartLines().map(function (l) { return encodeURIComponent(l.v[0]) + "*" + l.c.q; }).join(",") + "&rep=" + me().rep + linkExtras(); copyText(rl, function () { toast("Reorder link copied. Text it with your price."); }); return; }
    if (t.closest("[data-rtcopy]")) { var lk = $("#rtlink").textContent; if (/^http|^file/.test(lk)) copyText(lk, function () { toast("Link copied. Text it to a customer."); }); else toast("Pick your name first"); return; }
    if ((el = t.closest("[data-starter]"))) { var st = byK(STARTERS, el.dataset.starter); starterLines(st).forEach(function (l) { addToCart(l.f.id, vkey(l.v), l.q); }); renderCart(); $("#cart").showModal(); return; }
    if (t.closest("[data-photo]")) { var pr = route2(me().rep); sms("Hey " + pr.who + ", here’s a picture of my blade. I need more of these. Name / company: ", pr.cell); return; }
    if ((el = t.closest("[data-mat]"))) { wiz.mat = byK(MATS, el.dataset.mat); wizard(); window.scrollTo(0, 0); bfShow(wiz.saw ? "results" : "saw"); return; }
    if ((el = t.closest("[data-hp]"))) { wiz.hp = el.dataset.hp; wizard(); window.scrollTo(0, 0); bfShow(wiz.mode === "ask" ? "want" : "results"); return; }
    if (t.closest("[data-hpgo]")) { var hv = parseFloat($("#hpin").value); if (!(hv > 0)) { $("#hpin").focus(); toast("Type the horsepower, or tap one of the choices"); return; } wiz.hp = hv <= LOWHP ? "low" : "high"; wiz.hpn = hv; wizard(); window.scrollTo(0, 0); return; }
    if (t.closest("[data-wetspec]")) { openSend("pricing"); $("#f-notes").value = "Wet blade spec. Cutting: " + (wiz.mat ? wiz.mat.n : "") + ". Saw: walk-behind" + (wiz.hpn ? ", " + wiz.hpn + " HP" : wiz.hp ? ", " + byK(HPS, wiz.hp).n.toLowerCase() : "") + ". Blade size: \nCity / state where I cut: "; preview(); return; }
    if ((el = t.closest("[data-saw]"))) { wiz.hp = null; wiz.hpn = null; wiz.saw = byK(SAWS, el.dataset.saw); wizard(); window.scrollTo(0, 0); bfShow(wiz.mode === "ask" ? "want" : "results"); return; }
    if ((el = t.closest("[data-want]"))) { wiz.want = byK(WANTS, el.dataset.want); wizard(); window.scrollTo(0, 0); return; }
    if (t.closest("[data-all]")) { wiz.all = true; wizard(); return; }
    if (t.closest("[data-keep]")) { wiz.keep = true; return; }
    if (t.closest("[data-back]")) {
      var h = location.hash;
      if (h === "#finder" || h === "#ask" || h === "#ask-frank") { if (wiz.want) wiz.want = null; else if (wiz.hp) { wiz.hp = null; wiz.hpn = null; } else if (wiz.saw) { wiz.saw = null; wiz.all = false; } else if (wiz.mat) wiz.mat = null; else return go("#home"); wizard(); return; }
      if (h === "#fix" && fixSel) { fixSel = ""; fixScreen(); return; }
      return go("#home");
    }
    if ((el = t.closest("[data-fix]"))) { fixSel = el.dataset.fix; fixScreen(); window.scrollTo(0, 0); return; }
    if ((el = t.closest("[data-cat]"))) { shop.cat = el.dataset.cat; shop.n = SHOPPAGE; shopScreen(); return; }
    if ((el = t.closest("[data-crew]"))) { wiz.mat = byK(MATS, el.dataset.crew); wiz.saw = null; wiz.keep = true; go("#finder"); return; }
    if (t.closest("[data-photomail]")) { var pm = route2(me().rep); location.href = "mailto:" + pm.to.split(",").map(encodeURIComponent).join(",") + "?" + (pm.cc.length ? "cc=" + encodeURIComponent(pm.cc.join(",")) + "&" : "") + "subject=" + encodeURIComponent("Blade photo for a reorder") + "&body=" + encodeURIComponent("Attach the picture of your blade label to this email.\n\nName / company: \nPhone: \nHow many do you need: "); return; }
    if (t.closest("[data-account]")) { openSend("account"); return; }
    if ((el = t.closest("[data-stonepick]"))) { var on3 = el.getAttribute("aria-pressed") !== "true"; el.setAttribute("aria-pressed", on3); var ix3 = stSel.indexOf(el.dataset.stonepick); if (on3 && ix3 < 0) stSel.push(el.dataset.stonepick); if (!on3 && ix3 >= 0) stSel.splice(ix3, 1); return; }
    if (t.closest("[data-stone]")) { openSend("stone"); if (stSel.length) { $("#f-msg").value = "Helix products I need: " + stSel.join(", ") + ".\nMaterial (granite, marble, quartzite, engineered stone, porcelain, glass): \nMachine or tool: "; preview(); } return; }
    if ((el = t.closest("[data-qadd], [data-qgo]"))) { var qr = el.closest(".qrow"), qf = FAM[qr.dataset.f], qs = $("[data-qsize]", qr), qk = qs ? qs.value : vkey(defVar(qf, qf.vars)), qn, qv = findVar(qf, qk); if (el.matches("[data-qadd]")) { howSet(el, parseInt(el.dataset.qadd, 10)); return; } qn = howQty(el); addToCart(qf.id, qk, qn); flash(el, "✓ In your cart"); toast(qn + " x " + qf.n + (ACCT ? " added to your cart" : " added at " + money(eachAt(qv, qn)) + " each")); return; }
    if ((el = t.closest("[data-eqpick]"))) { var on = el.getAttribute("aria-pressed") !== "true"; el.setAttribute("aria-pressed", on); var ix2 = eqSel.indexOf(el.dataset.eqpick); if (on && ix2 < 0) eqSel.push(el.dataset.eqpick); if (!on && ix2 >= 0) eqSel.splice(ix2, 1); $$("[data-eqpick]").forEach(function (b) { b.setAttribute("aria-pressed", eqSel.indexOf(b.dataset.eqpick) >= 0); }); return; }
    if ((el = t.closest("[data-intent]"))) { setIntent(el.dataset.intent); return; }
    if (t.closest("[data-rentgo]")) rentGo = 1;
    if ((el = t.closest("[data-sug]"))) { var sf = FAM[el.dataset.sug]; if (!sf) return; addToCart(sf.id, vkey(defVar(sf, sf.vars)), 1); renderCart(); toast("1 x " + sf.n + " added to your cart. Change the number or size right here."); return; }
    if (t.closest("[data-newtext]")) { var nm = me(), nr2 = route2(repBySlug(nm.rep) ? nm.rep : "");
      sms("Hey " + nr2.who + ", I’m a new customer from the DBW WISCO site. Please set me up.\nName: " + (nm.name || "") + "\nCompany: " + (nm.company || "") + "\nWhat I cut: \nBest number to reach me: " + (nm.phone || ""), nr2.cell);
      nm.newSent = 1; store.set("me", nm); if ((location.hash || "#home") === "#home") { var ny = window.scrollY; home(); window.scrollTo(0, ny); } toast("Your text is ready. Hit Send in your messages app."); return; }
    if ((el = t.closest("[data-reply]"))) { var rm = me(); rm.reply = rm.reply === el.dataset.reply ? "" : el.dataset.reply; store.set("me", rm); badge(); if ($("#cart").open) renderCart(); $$("[data-reply]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.reply === rm.reply); });
      var db2 = $("#dealback"); if (db2) { db2.textContent = WHO() + " " + backV(1) + " with one package price. Nothing is charged on this site."; $("#dealstep3").textContent = WHO() + " " + backV() + " with one price"; dealRefresh(); } return; }
    if ((el = t.closest("[data-acctkind]"))) { var ak = el.dataset.acctkind; $$("[data-acctkind]").forEach(function (x) { x.setAttribute("aria-pressed", x === el); }); $("#acctmore").hidden = ak === "new"; $("[data-acctsave]").hidden = false; $("#acctbox").dataset.kind = ak; if (ak !== "new") $("#ac-co").focus(); return; }
    if ((el = t.closest("[data-acctlast]"))) { $$("[data-acctlast]").forEach(function (x) { x.setAttribute("aria-pressed", x === el); }); return; }
    if (t.closest("[data-acctedit]")) { acctEdit = true; go("#home"); return; }
    if (t.closest("[data-acctsave]")) {
      var ai = me(), kd = $("#acctbox").dataset.kind || (ai.acct === "new" ? "new" : "yes"), lp = $('[data-acctlast][aria-pressed="true"]');
      ai.acct = kd === "new" ? "new" : "existing"; ai.acctSet = 1;
      if (kd !== "new") { ai.company = clean($("#ac-co").value, 60); ai.last = lp ? lp.dataset.acctlast : (kd === "unsure" ? "unsure" : ai.last || ""); var pick = $("#ac-rep").value; if (pick !== (ai.rep || "")) { ai.rep = pick; store.set("replock", pick ? 1 : 0); } }
      store.set("me", ai); acctEdit = false; contactWire(); go("#home"); toast(kd === "new" ? "Welcome. One more tap and " + WHO() + " sets you up." : "Got it. Your orders go to the right person."); return;
    }
    if (t.closest("[data-norep]")) { var nr = me(); nr.rep = ""; store.set("me", nr); store.set("replock", 0); if (window.WISCO_REP) { location.href = ROOT; return; } contactWire(); go("#home"); toast("Okay. You’re on the main DBW WISCO page."); return; }
    if (t.closest("[data-repchange]")) { store.set("replock", 0); renderReps($("#f-rep").value); var rdc = $("#repd"); if (rdc) rdc.open = true; return; }
    if ((el = t.closest("[data-tag]"))) { shop.tag = shop.tag === el.dataset.tag ? "" : el.dataset.tag; shop.n = SHOPPAGE; shopScreen(); return; }
    if ((el = t.closest("[data-agg]"))) { earlyPick(el.dataset.agg); return; }
    if (t.closest("[data-aggask]")) { var al = ($("#aggloc") ? $("#aggloc").value : "").trim(); if (!al) { $("#aggloc").focus(); toast("Type your city and state first"); return; } openSend("pricing"); $("#f-notes").value = "Blade recommendation for my aggregate. I cut in: " + al + "\nWhat I cut (concrete, asphalt, green): \nSaw and blade size: "; preview(); return; }
    if (t.closest("[data-eeask]")) { openSend("pricing"); $("#f-notes").value = "Early-entry blade color check. I cut in (city, state): " + ($("#eeloc") ? $("#eeloc").value : "") + "\nSaw (Soff-Cut or Gorilla, model): \nBlade size: "; preview(); return; }
    if (t.closest("[data-shopmore]")) { shop.n += SHOPPAGE; shopScreen(); return; }
    if (t.closest("[data-remind]")) { remind(); return; }
    if ((el = t.closest("[data-hint]"))) { $("#rq").value = el.dataset.hint; runSearch(el.dataset.hint); return; }
    if ((el = t.closest("[data-dfamopen]"))) { var dg = $("#dfamgrid"); dg.hidden = !dg.hidden; el.setAttribute("aria-expanded", !dg.hidden); return; }
    if ((el = t.closest("[data-dfam]"))) { $("#dfam").value = el.dataset.dfam; fillDealVars(); dealSync(); dealRefresh(); dfamDraw(); $("#dfamgrid").hidden = true; var db = $("[data-dfamopen]"); db.setAttribute("aria-expanded", "false"); db.scrollIntoView({ block: "nearest" }); return; }
    if ((el = t.closest("[data-pf]"))) { var pf = FAM[el.dataset.pf]; p3.f = pf.id; p3.v = pf.vars.length === 1 ? vkey(pf.vars[0]) : ""; pick3Draw(p3.v ? "p3qty" : "p3size"); return; }
    if ((el = t.closest("[data-pv]"))) { p3.v = el.dataset.pv; pick3Draw("p3qty"); return; }
    if ((el = t.closest("[data-pq]"))) { howSet(el, parseInt(el.dataset.pq, 10)); return; }
    if ((el = t.closest("[data-pgo]"))) { var kf = FAM[p3.f], kv = kf && findVar(kf, p3.v), kq = howQty(el); if (!kv) return; addToCart(kf.id, p3.v, kq); flash(el, "✓ In your cart"); toast(kq + " x " + kf.n + " " + vlabel(kv) + " added to your cart"); return; }
    if ((el = t.closest("[data-q]"))) { var inp = $("input", el.parentNode); inp.value = Math.max(1, (parseInt(inp.value, 10) || 1) + parseInt(el.dataset.q, 10)); inp.dispatchEvent(new Event("change", { bubbles: true })); return; }
    if ((el = t.closest("[data-dealadd]"))) {
      var q = Math.max(1, parseInt($(".dealadd .qty input").value, 10) || 1), fid2 = $("#dfam").value, key2 = $("#dvar").value;
      var ex = deal.lines.filter(function (l) { return l.f === fid2 && l.v === key2; })[0];
      if (ex) ex.q += q; else deal.lines.push({ f: fid2, v: key2, q: q });
      store.set("deal2", deal); sawDeal(); return;
    }
    if ((el = t.closest("[data-dstep]"))) { var cl = dealLine(dealCur()); dealSetQty((cl ? cl.q : 0) + parseInt(el.dataset.dstep, 10)); return; }
    if ((el = t.closest("[data-pkg]"))) { deal.saw = el.dataset.pkg; store.set("deal2", deal); go("#saw-deal"); return; }
    if (t.closest("[data-ccex]")) { [["ca-p", 100], ["ca-f", 1000], ["cb-p", 150], ["cb-f", 2500], ["c-ft", 10000]].forEach(function (x) { $("#" + x[0]).value = x[1]; }); costCalc(); toast("Made-up numbers to show the math. They are not our prices. Put in your own."); return; }
    if ((el = t.closest("[data-dealrm]"))) { deal.lines.splice(parseInt(el.closest(".dl").dataset.i, 10), 1); store.set("deal2", deal); sawDeal(); return; }
    if (t.closest("[data-dealclear]")) { deal = { saw: "TS420", lines: [] }; store.set("deal2", deal); sawDeal(); return; }
    if ((el = t.closest("[data-pkgq]"))) { var pq = parseInt(el.dataset.pkgq, 10); if ($("#dqn") && document.body.dataset.r === "saw") { dealSetQty(pq); dealSync(); } else { dealPreset = pq; go("#saw-deal"); } return; }
    if (t.closest("[data-dealsend]")) { openSend("saw"); return; }
    if ((el = t.closest("[data-eqadd]"))) { var hitE = SKU[el.dataset.eqadd.toUpperCase().replace(/[^A-Z0-9.]/g, "")]; if (hitE) { addToCart(hitE[0].id, vkey(hitE[0].vars[hitE[1]]), 1); flash(el); } return; }
    if ((el = t.closest("[data-add]"))) {
      var card = el.closest(".card"), sz = el.closest(".sz"), hit = el.closest(".hit"), fid, key, qty;
      if (sz) { fid = $("#detailbody").dataset.f; key = sz.dataset.v; qty = $("input", sz).value; }
      else if (hit) { fid = hit.dataset.f; key = hit.dataset.v; qty = $("input", hit).value; }
      else if (card) { fid = card.dataset.f; var sel = $("[data-size]", card); key = sel ? sel.value : vkey(defVar(FAM[fid], varsFor(FAM[fid], wiz.saw))); if (!findVar(FAM[fid], key)) key = vkey(FAM[fid].vars[0]); qty = $(".qty input", card).value; }
      if (fid) { addToCart(fid, key, qty); flash(el); }
      return;
    }
    if ((el = t.closest("[data-open]"))) { openDetail(FAM[el.closest("[data-f]").dataset.f]); return; }
    if (t.closest("[data-pricing]") || t.closest("[data-breaks]")) { e.preventDefault(); openSend("pricing"); return; }
    if (t.closest("[data-equip]")) { openSend("equip"); if (eqSel.length) { $("#f-msg").value = "Looking for: " + eqSel.join(", ") + ".\nMake / model / size / how soon: "; preview(); } return; }
    if (t.closest("[data-terms]")) { e.preventDefault(); openSend("terms"); return; }
    if (t.closest("[data-review]")) { openSend("review"); return; }
    if (t.closest("[data-refer]")) { openSend("refer"); return; }
    if ((el = t.closest("[data-acct]"))) { setAcct(el.dataset.acct); return; }
    if ((el = t.closest("[data-star]"))) { var sv = +el.dataset.star; $("#f-stars").value = sv; $$("#starpick button").forEach(function (x) { x.classList.toggle("on", +x.dataset.star <= sv); }); preview(); return; }
    if (t.closest("[data-friend]")) { if (!$("#f-name").value.trim()) { $("#f-name").focus(); toast("Add your name so they know who sent them"); return; } location.href = "sms:?&body=" + encodeURIComponent("I get my diamond blades from DBW WISCO. A real rep prices every order and picks up the phone. Tell them I sent you: " + friendLink()); return; }
    if (t.closest("[data-feedback]")) { openSend("feedback"); return; }
    if (t.closest("[data-cart]")) { ["detail", "extras", "send"].forEach(function (id) { if ($("#" + id).open) $("#" + id).close(); }); renderCart(); $("#cart").showModal(); return; }
    if (t.closest("[data-checkout]")) { openSend("order"); return; }
    if (t.closest("[data-quicksms]")) {
      if (!cartLines().length) return; mode = "order"; ordRef = newRef(); var qo = quickOrder(), qt = buildText(qo), qr = route2(qo.rep);
      sms(qt, qr.cell); store.set("last", { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), items: cart.slice() });
      var qm = $("#quickmsg"); if (qm) { qm.hidden = false; qm.innerHTML = "<b>Order prepared. It is not sent yet.</b> Hit Send in your messages app. Your reference: <b class=\"sel\">" + ordRef + "</b>"; }
      return;
    }
    if (t.closest("[data-tosend]")) { extras.stock = $("#xstock").checked; openSend("order"); return; }
    if (t.closest("[data-backcart]")) { $("#extras").close(); renderCart(); $("#cart").showModal(); return; }
    if ((el = t.closest("[data-xbreak]"))) { var qn = parseInt(el.dataset.xbreak, 10), ix = extras.breaks.indexOf(qn); if (ix >= 0) extras.breaks.splice(ix, 1); else extras.breaks.push(qn); extras.breaks.sort(function (a, b) { return a - b; }); el.setAttribute("aria-pressed", ix < 0); return; }
    if ((el = t.closest("[data-xcat]"))) { $("#extras").close(); shop.cat = el.dataset.xcat; shop.q = ""; shop.n = SHOPPAGE; app.innerHTML = ""; go("#shop"); return; }
    if ((el = t.closest("[data-rep]"))) { renderReps(el.dataset.rep); sendLabels(el.dataset.rep); preview(); return; }
    if ((el = t.closest("[data-close]"))) { el.closest("dialog").close(); return; }
    if ((el = t.closest("[data-rm]"))) { cart.splice(parseInt(el.closest(".line").dataset.i, 10), 1); saveCart(); renderCart(); return; }
    if (t.closest("[data-reorder]")) { var last = lastOrder(); if (last) { last.items.forEach(function (c) { if (FAM[c.f] && findVar(FAM[c.f], c.v)) addToCart(c.f, c.v, c.q); }); renderCart(); $("#cart").showModal(); } return; }
    if (t.closest("[data-email]")) { sendEmail(); return; }
    if (t.closest("[data-sms]")) { if (needName("sms")) return; var fo = formData(); sms(buildText(fo), route2(fo.rep).cell); afterSend("sms"); return; }
    if (t.closest("[data-copy]")) { if (needName()) return; copyText(buildText(formData()), function () { afterSend("copied"); }); return; }
    if (t.closest("[data-share]")) { copyText(shareLink(), function () { toast("Reorder link copied. Text it to anyone."); }); return; }
    if ((el = t.closest("[data-fsms]"))) { sms(frankMsg(el.closest("[data-frank]").dataset.frank), route2(repBySlug(me().rep) ? me().rep : "").cell); return; }
    if ((el = t.closest("[data-femail]"))) { var fq = route2(repBySlug(me().rep) ? me().rep : ""); mailto(fq.to, "Blade question from the DBW WISCO site", frankMsg(el.closest("[data-frank]").dataset.frank), fq.cc); return; }
    if ((el = t.closest("[data-fcopy]"))) { copyText(frankMsg(el.closest("[data-frank]").dataset.frank), function () { toast("Copied. Paste it in a text to " + WHO() + "."); }); return; }
    if (t.closest("[data-emptycart]")) { cart = []; store.set("cnote", ""); saveCart(); renderCart(); return; }
    if (t.tagName === "DIALOG") t.close();
  });
  document.addEventListener("change", function (e) {
    if (e.target.matches && e.target.matches("[data-rp]")) { var li = parseInt(e.target.closest(".line").dataset.i, 10), pv = parseFloat(e.target.value); if (cart[li]) { if (pv > 0) cart[li].p = Math.round(pv * 100) / 100; else delete cart[li].p; saveCart(); renderCart(); } return; }
    if (e.target.matches && e.target.matches("[data-qsize]")) { var qr2 = e.target.closest(".qrow"), qv2 = findVar(FAM[qr2.dataset.f], e.target.value); if (qv2) $("[data-qrng]", qr2).textContent = HIDE ? "Part # " + qv2[0] : rangeTxt(qv2) + " each"; }
    var t = e.target, card = t.closest(".card"), line = t.closest(".line");
    if (t.matches("[data-size]") && card) { var f = FAM[card.dataset.f], keep = $(".qty input", card).value; $("[data-row]", card).outerHTML = buyRow(findVar(f, t.value)); $(".qty input", card).value = keep; }
    if (t.matches(".qhow2 .qty input")) { var hb = t.closest(".qhow2"), hn = Math.max(1, parseInt(t.value, 10) || 1); $(".qgo", hb).textContent = hn > 1 ? "Add " + hn + " to cart" : "Add to cart"; $$(".qbrk button", hb).forEach(function (x) { x.classList.toggle("on", parseInt(x.textContent, 10) === hn); }); }
    if (line && t.matches(".qty input")) { cart[parseInt(line.dataset.i, 10)].q = Math.max(1, parseInt(t.value, 10) || 1); saveCart(); renderCart(); }
    if (t.id === "dsaw") { deal.saw = t.value; store.set("deal2", deal); dealRefresh(); }
    if (t.id === "dvar") dealSync(), dealRefresh();
    if (t.id === "dfam") { fillDealVars(); dealSync(); dealRefresh(); dfamDraw(); }
    if (t.id === "p3tab") { p3.tab = t.value; if (p3.f && p3List(p3.tab).map(function (x) { return x.id; }).indexOf(p3.f) < 0) { p3.f = ""; p3.v = ""; } pick3Draw(); var ps = $("#p3tab"); if (ps) ps.focus(); }
  });
  document.addEventListener("input", function (e) { var id = e.target.id || "";
    if (id === "dqty" || id === "dqn") dealSetQty(e.target.value);
    if (id === "r-day" && $("#r-day-o")) $("#r-day-o").textContent = "$" + e.target.value; if (id === "r-days" && $("#r-days-o")) $("#r-days-o").textContent = e.target.value; if (/^c[ab]-|^c-ft/.test(id)) costCalc(); if (/^r-/.test(id)) rentCalc(); });
  $("#sendform").addEventListener("input", function () {
    preview();
    var f = $("#sendform"), info = me();   // keep what they typed, even if they close the sheet
    ["name", "company", "phone", "email", "addr", "city", "state", "zip"].forEach(function (k) { info[k] = f.elements[k].value.trim(); });
    info.acct = f.elements.acct.value; store.set("me", info);
  });
  function payNote() { var el = $("#promonote"); if (!el) return; var on = PROMO_ON && mode === "order", card = isCard($("#f-pay").value); el.hidden = !on; el.className = "promonote" + (card ? " won" : ""); el.textContent = card ? "You’re paying by card, so this order gets a free blade. Your rep confirms which one." : (PROMO.title || "Free blade when you pay this order by card") + ". Pick a card option above to get it."; }
  $("#sendform").addEventListener("change", function (e) { payNote(); if (e.target.id === "f-pay" && /terms/i.test(e.target.value) && $("#f-acct").value === "new") $("#creditwrap").open = true; preview(); });
  $("#sendform").addEventListener("submit", function (e) { e.preventDefault(); });
  /* Quick-access strip: arrows show there is more to the side, and move it. */
  (function () {
    var w = $("#toolswrap"), L = $(".tsc.l"), R = $(".tsc.r"); if (!w) return;
    var upd = function () { var max = w.scrollWidth - w.clientWidth; L.hidden = w.scrollLeft < 8; R.hidden = max < 8 || w.scrollLeft > max - 8; };
    w.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); setTimeout(upd, 60); setTimeout(upd, 800);
    document.addEventListener("click", function (e) { var b = e.target.closest("[data-tsc]"); if (b) w.scrollBy({ left: parseInt(b.dataset.tsc, 10) * Math.max(180, w.clientWidth * 0.7), behavior: "smooth" }); });
  })();
  window.addEventListener("hashchange", route);

  /* ---------- boot ---------- */
  /* The floating Ask button always sits above the cart bar, however tall the bar is. */
  function dockLift() { var d = $("#dock"), h = d && !d.hidden ? d.offsetHeight : 0; document.documentElement.style.setProperty("--dockh", h + "px"); }
  window.addEventListener("resize", dockLift);
  /* The cart note is saved as it is typed, so it survives adding more items or closing the cart. */
  document.addEventListener("input", function (e) { if (e.target && e.target.id === "cnote") store.set("cnote", e.target.value.slice(0, 400)); });
  function contactWire() {
    var r = myRep(), cell = (r && r.cell) || W.textNumber || "", mail = (r && r.email) || W.orderEmail || "", who = r ? repFirst(r) : FRANK;
    $$("[data-text-btn]").forEach(function (a) { a.href = "sms:" + cell; if (a.closest(".footact")) a.textContent = "Text " + who; });
    $$("[data-call-btn]").forEach(function (a) { a.href = "tel:" + cell; a.textContent = "Call " + who; });
    var noMail = !!(r && !r.email); if (noMail) mail = "";
    $$("[data-mail-btn]").forEach(function (a) { a.href = "mailto:" + mail; a.textContent = "Email " + who; a.hidden = noMail; });
    $$("[data-askname]").forEach(function (a) { a.textContent = "Ask " + who; });
    $$("[data-sayname]").forEach(function (a) { a.textContent = (r ? who : "Big " + FRANK) + " says"; });
    $$("[data-askimg]").forEach(function (a) { a.src = askImg(); a.classList.add("repface"); });
    var bfa = $("#bf"); if (bfa) bfa.setAttribute("aria-label", (r ? who : "Big " + FRANK) + " says");
    $$(".footmgr").forEach(function (fm) { if (fm.firstChild && fm.firstChild.nodeType === 3) fm.firstChild.textContent = noMail ? "Text or call " : "Text, call or email "; });
    $$("[data-mgr]").forEach(function (a) { a.textContent = r ? r.name + ", your rep" : (W.managerName || "Frank") + ", " + (W.managerTitle || ""); });
    $$("[data-text]").forEach(function (a) { a.textContent = cellShow(); a.href = "sms:" + cell; });
    $$("[data-oemail-link]").forEach(function (a) { a.textContent = mail; a.href = "mailto:" + mail; a.hidden = noMail; });
    $$(".footnum").forEach(function (fn) { [].forEach.call(fn.childNodes, function (n) { if (n.nodeType === 3) n.textContent = noMail ? "" : " · "; }); });
    $$("[data-oemail]").forEach(function (a) { a.textContent = mail; });
    $$("[data-bftoggle]").forEach(function (a) { a.setAttribute("aria-label", (r ? who : "Big " + FRANK) + " says"); });
    $$("[data-bfhide]").forEach(function (a) { a.setAttribute("aria-label", "Hide " + (r ? who : "Big " + FRANK)); });
  }
  $$("[data-oemail-link]").forEach(function (a) { a.textContent = W.orderEmail || ""; a.href = "mailto:" + (W.orderEmail || ""); });
  $$("[data-mgr]").forEach(function (a) { a.textContent = (W.managerName || "Frank") + ", " + (W.managerTitle || ""); });
  $$("[data-text]").forEach(function (a) { a.textContent = W.textDisplay || ""; a.href = "sms:" + (W.textNumber || ""); });
  $$("[data-oemail]").forEach(function (a) { a.textContent = W.orderEmail || ""; });
  $$("[data-pl]").forEach(function (a) { a.textContent = C.priceList || "current"; });
  var P = new URLSearchParams(location.search);
  var REPQ = window.WISCO_REP || P.get("rep");   /* a rep's own page always belongs to that rep */
  if (REPQ) { var info = me(), rr = repBySlug(slug(REPQ)); if (rr) { info.rep = slug(rr.name); store.set("me", info); store.set("replock", 1); } }
  if (P.get("ref")) store.set("ref", P.get("ref").replace(/[<>]/g, "").slice(0, 60));
  if (P.get("cart")) {
    cart = [];
    P.get("cart").split(",").forEach(function (x) { var a = x.split("*"), hit = SKU[(a[0] || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")]; var qp = (a[1] || "").split("@"); if (hit) cart.push({ f: hit[0].id, v: vkey(hit[0].vars[hit[1]]), q: Math.max(1, parseInt(qp[0], 10) || 1) }); });
    store.set("cart", cart);
  }
  cart.forEach(function (c) { delete c.p; });
  if (P.get("c")) { linkFor = clean(P.get("c"), 60); var mi = me(); if (!mi.company) { mi.company = linkFor; store.set("me", mi); } }
  if (P.get("note")) linkNote = clean(P.get("note"), 140);
  deal.lines = (Array.isArray(deal.lines) ? deal.lines : []).filter(function (l) { return FAM[l.f] && findVar(FAM[l.f], l.v); });
  /* Any link somebody taps opens on the home page, even if it was copied from deep inside the site. */
  if (location.hash && location.hash !== "#home") { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; } }
  contactWire();
  (function fresh() {
    if (isPreview || !window.WISCO_VER || !window.fetch) return;
    try { if (P.get("_v")) { var q2 = new URLSearchParams(location.search); q2.delete("_v"); history.replaceState(null, "", location.pathname + (q2.toString() ? "?" + q2 : "") + location.hash); } } catch (e) {}
    fetch("version.txt?" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (v) {
      v = (v || "").trim(); if (!v || v === String(window.WISCO_VER)) return;
      var seen = ""; try { seen = sessionStorage.getItem("wisco.fresh") || ""; } catch (e) {} if (seen === v) return;
      try { sessionStorage.setItem("wisco.fresh", v); } catch (e) {}
      var q3 = new URLSearchParams(location.search); q3.set("_v", v); location.replace(location.pathname + "?" + q3 + location.hash);
    }).catch(function () {});
  })();
  route(); badge();
  if (P.get("tools")) location.hash = "#team";   /* the rep tools are not linked anywhere on the site */
  /* One link that opens a tool directly: ?go=cost lands on the cost per foot calculator (used in emails and texts).
     Every other link still opens on the home page. The go is dropped from the address so a refresh goes home. */
  if (P.get("go") === "cost") {
    try { var qg = new URLSearchParams(location.search); qg.delete("go"); history.replaceState(null, "", location.pathname + (qg.toString() ? "?" + qg : "")); } catch (e) {}
    location.hash = "#cost";
  }
  bfOpen(store.get("bf", 0) === 1);
  if (P.get("cart") && cart.length) { renderCart(); $("#cart").showModal(); }
})();
