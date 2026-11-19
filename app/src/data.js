(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};
  const grades = Object.freeze(["platinum", "gold", "silver", "bronze"]);
  const kinds = Object.freeze(["story", "collectibles", "activities", "online", "misc"]);
  const kindLabels = Object.freeze({story: "Story", collectibles: "Collectibles", activities: "Activities", online: "Online", misc: "Misc"});
  const stages = Object.freeze([
    Object.freeze({id: 1, title: "Story first, eyes open", short: "Story first", description: "Play the story in order, earning story trophies and every missable the moment its chapter opens."}),
    Object.freeze({id: 2, title: "Collectibles sweep", short: "Collectibles", description: "Every collect/find trophy, using the counts the descriptions name."}),
    Object.freeze({id: 3, title: "Activities and challenges", short: "Activities", description: "Ranges, races, challenges and minigames."}),
    Object.freeze({id: 4, title: "The long counts", short: "Long counts", description: "Cumulative grinds and totals."}),
    Object.freeze({id: 5, title: "Platinum cleanup", short: "Cleanup", description: "Anything left, then the platinum itself."})
  ]);
  const sources = Object.freeze([
    "Official PlayStation trophy description — supplied PS5 list, 2026-11-18",
    "PLATINUM PATH — guide method reasoned from that description"
  ]);

  // A directly authored mirror of trophies.json lets Chrome open this app from disk.
  // Tuple order: id, name, description, grade, kind, missable, reason, stage, guide.
  const offlineRecords = [
    [1,"Vice Got a Price!","Congratulations! You're a Leonida Legend.","platinum","misc",false,"",5,"Use the five-stage route to clear the other 54 entries, then compare your checklist with the console's trophy list. Leave this final check until every other requirement is recorded; the description does not add a separate action for the platinum."],
    [2,"Just Like Paradise","Complete Gone Fishing.","bronze","story",true,"This named story mission has no replay guarantee in the description.",1,"When Gone Fishing becomes available in the story, follow its objectives through the end. Prepare a separate save if the game allows it, then check for the trophy when the mission ends. Treat this first-pass mission as missable because the description does not guarantee replay."],
    [3,"Paradise Lost","Complete Chapter 1.","bronze","story",true,"This chapter ending belongs to the story pass, with no stated replay guarantee.",1,"Work through Chapter 1's available story objectives before moving on to the next chapter. Keep a separate save if possible and confirm the trophy at the chapter transition. Flag this for the first pass: the description gives no chapter-replay guarantee."],
    [4,"T**s Ass Drug Money","Complete Chapter 2.","bronze","story",true,"This chapter ending belongs to the story pass, with no stated replay guarantee.",1,"In Chapter 2, follow the story's own objective order and check the trophy list before advancing beyond the chapter. Set aside a save if possible so you have a fallback for unfinished chapter progress. Treat the chapter ending as missable; replay is not confirmed by the description."],
    [5,"Vice City, Baby!","Complete Chapter 3.","bronze","story",true,"This chapter ending belongs to the story pass, with no stated replay guarantee.",1,"Use Chapter 3 as a story checkpoint in your route, finishing its objectives before starting a later chapter. Restock between missions and keep a separate save if available. Check the trophy at the transition, since the description gives no promise that this chapter can be replayed."],
    [6,"Top Of The World, Ma","Complete Chapter 4.","bronze","story",true,"This chapter ending belongs to the story pass, with no stated replay guarantee.",1,"Keep following Chapter 4's story objectives until the game moves beyond that chapter. Before the ending, make a separate save if possible and check any other first-pass warnings. Confirm the trophy before progressing further because chapter replay is not established by the description."],
    [7,"You Gotta Know When to Get Off","Complete the final mission.","gold","story",true,"The final story mission has no stated repeat opportunity.",1,"Before entering the story's final mission, resolve any open first-pass warnings and prepare the resources you normally need for a mission. Keep a separate save if available, then finish the mission and confirm the trophy. Treat this ending as missable because the description does not establish a replay option."],
    [8,"Trust","Complete Breakfast Run.","bronze","story",true,"This named story mission has no replay guarantee in the description.",1,"As Breakfast Run appears in the story, prioritize it during the first pass. Follow the mission objectives and check for the award after the ending. Make a separate save if possible beforehand; the description does not confirm that this mission can be repeated."],
    [9,"Break the Bank","Complete The Cartel Heist.","bronze","story",true,"This named story mission has no replay guarantee in the description.",1,"When The Cartel Heist opens, prepare your usual mission equipment before committing to its objectives. Finish the mission in the order the game presents and verify the trophy afterward. Keep a separate save if possible: this named story ending has no replay guarantee in the description."],
    [10,"Family Matters","Complete Child's Play.","bronze","story",true,"This named story mission has no replay guarantee in the description.",1,"Keep Child's Play on your first-pass checklist as soon as the story makes it available. Save separately if possible before starting, then follow the mission through its ending and check the award. The description ties this trophy to that mission without confirming another chance."],
    [11,"DWNFALL","Complete Headliners.","bronze","story",true,"This named story mission has no replay guarantee in the description.",1,"Plan to finish Headliners during the story pass, checking your resources before you start. Work through its objectives and verify the award at the end so you can confirm the completed run. Preserve a separate save if possible, since the description does not promise mission replay."],
    [12,"Hi-Jacked","Complete VCIA Takedown.","bronze","story",true,"This named story mission has no replay guarantee in the description.",1,"Schedule VCIA Takedown for the first story pass when the mission becomes available. Prepare for the mission and follow its objectives to completion. Keep a separate save if possible and confirm the trophy afterward; this mission has no stated replay guarantee."],
    [13,"Snow Storm","Complete Operation Savage Glory.","bronze","story",true,"This named story mission has no replay guarantee in the description.",1,"Add Operation Savage Glory to your first-pass checklist and prepare your usual mission resources before entering it. Follow the presented objectives through the ending and check the trophy list immediately afterward. Keep a separate save if possible because replay of this named mission is not confirmed."],
    [14,"A Long Road","Attain 100% Completion.","gold","misc",false,"",5,"Use the game's completion readout, if available, to identify what remains after the story, sweep and activity stages. Work through those outstanding items and recheck the percentage as you go. The description names 100% but supplies no checklist, so do not assume that the trophy list alone defines every completion requirement."],
    [15,"Cunning Stunts","Complete 250 Stunts.","silver","activities",false,"",4,"Keep a tally of successful stunts while working on the earlier stages, then dedicate a cleanup session to the remaining count. Practice an attempt before repeating it so failed runs do not inflate your tally. The description asks for 250 but does not say whether stunts must be distinct, so use any in-game counter to confirm what counts."],
    [16,"Master of None","Try each type of activity once.","bronze","activities",false,"",3,"Keep a checklist of activity types you encounter and tick each only after you have actually tried it. Use the activities stage to revisit any types you skipped during the story. The description gives no number of types, so follow the game's available activity list instead of an assumed total."],
    [17,"The Shootist","Earn a gold medal in all Shooting Range challenges.","silver","activities",false,"",3,"Work through the Shooting Range challenge list and record the medal earned for each challenge. Practice any challenge below gold, then retry it before moving on to the remaining entries. Check the whole range list at the end; the description requires gold throughout but gives no challenge count."],
    [18,"Top Fun","Win a Top Fun Drone Race at every location.","bronze","activities",false,"",3,"Record the location of each Top Fun Drone Race you encounter and mark it only after a win. Learn a course with a practice run, then revisit locations that still lack a win. The description does not give a location total, so use the game's race listings to check your coverage."],
    [19,"Earn Cash, Not Kudos","Win 20 different races.","bronze","activities",false,"",3,"Keep a list of race events you have won so repeated wins in one event do not inflate your progress. Practice unfamiliar courses, then move to another event after securing its win. Reconcile your list at 20 different wins; the description does not specify a vehicle class or location."],
    [20,"Baited My Tackle","Beat Cal in a fishing challenge.","bronze","activities",false,"",3,"Look for a fishing challenge involving Cal when that activity becomes available. Learn the fishing controls before attempting the head-to-head challenge, then verify the award after beating him. The description does not specify a venue, fish or score to target."],
    [21,"Stick Fiddler","Complete an arcade game.","bronze","activities",false,"",3,"Choose an arcade game you can learn and work toward its own ending. Practice its controls and reserve enough time to finish a full run. The description gives no game title or extra score condition, so check for the trophy after completion."],
    [22,"Road to Rehabilitation","Complete the final mission for Andy.","bronze","story",true,"This character's final mission has no stated replay opportunity.",1,"Follow Andy's missions in their presented order so you reach the strand's final mission. Before that ending, prepare your usual mission resources and keep a separate save if possible. Confirm the trophy afterward; the description does not guarantee a replay of this final mission."],
    [23,"This Was No Boat Accident","Complete the final mission for Kenton.","bronze","story",true,"This character's final mission has no stated replay opportunity.",1,"Stay with Kenton's mission strand until its final mission becomes available, using the game's objectives to guide the order. Save separately if possible before the ending and prepare for a full mission attempt. Treat the final mission as missable for this pass because the description gives no replay guarantee."],
    [24,"The Lone Rider","Complete the final mission for Billy.","bronze","story",true,"This character's final mission has no stated replay opportunity.",1,"Complete Billy's earlier available missions in order to reach the ending of his strand. Prepare before the final mission and keep a separate save if the game allows it. Check the trophy at the end; a repeat opportunity is not stated in the description."],
    [25,"Strangers & Freaks","Complete 8 mission strands for strangers across the state of Leonida.","silver","story",false,"",1,"Keep a checklist of stranger strands encountered across Leonida and follow each selected strand through its ending. Count finished strands, since individual missions within one strand do not establish another completed strand. Review your checklist at eight completions; the description does not specify which strangers or a time limit."],
    [26,"Supply & Demand","Complete the final mission for Randy.","bronze","story",true,"This character's final mission has no stated replay opportunity.",1,"Work through Randy's available missions in the order presented until the final one opens. Set aside a save if possible and prepare your usual resources before committing to the ending. Verify the trophy afterward because the description does not confirm that this final mission can be replayed."],
    [27,"Spin On This!","Complete the final mission for Tyrone.","bronze","story",true,"This character's final mission has no stated replay opportunity.",1,"Follow Tyrone's mission strand as it opens and keep its final mission on your first-pass checklist. Make a separate save if possible before the ending, then finish the objectives and confirm the award. Treat this as a missable story ending because no replay option is stated."],
    [28,"Positive Mental Attitude","Meditate at every spot across Leonida.","bronze","activities",false,"",3,"Record meditation spots as you encounter them during your travels through Leonida, marking each after using it. Return to gaps in that checklist during the activity stage so revisits do not conceal an unvisited spot. The description gives no total or precise coordinates, so use the game's available listings to check coverage."],
    [29,"Fair Game","Hunt a unique animal for Bret.","bronze","activities",false,"",3,"Use Bret's hunting activity as the lead and identify the unique animal from whatever information the game supplies. Learn the hunting controls and prepare before the attempt, then check the award after the hunt. No species or hunting location is established by the description."],
    [30,"Don't Touch My Deck","Complete 3 Collectible Card sets.","silver","collectibles",false,"",2,"Organize your card progress by set so you can see which sets are closest to completion. Focus the sweep on missing cards within those sets and count a set only when it is complete. The target is three completed sets; the description supplies neither card locations nor a total number of cards."],
    [31,"You WAiNKer!","WAiNK It at 100 locations.","silver","misc",false,"",4,"Keep a location checklist for WAiNK It and build the 100-location total while traveling for other objectives. Mark a location only after performing the named action there, then revisit gaps during the long-count stage. The description does not define the action or give coordinates, so use the game's own prompts to identify valid attempts."],
    [32,"One Last Thing","Complete 50 Challenges.","bronze","activities",false,"",3,"Work through the available challenge list and track completed entries separately from attempts. Prioritize challenges you already understand, then practice the remaining ones until your completion tally reaches 50. The description gives no challenge categories or locations, so follow the game's own listings."],
    [33,"Hot Together","Lose a 4 star Wanted Level with your partner and escape the heat.","bronze","misc",false,"",5,"Prepare a reliable escape route before starting an attempt with your partner, and make sure the Wanted Level reaches four stars. Keep the partner with you while losing pursuit, then wait until the heat has cleared before checking the award. The description does not give a required escape location."],
    [34,"Retail Therapy","Rob 3 shops back-to-back with your partner without losing your Wanted Level.","bronze","misc",false,"",5,"Plan a route between three shops before starting the partnered robbery sequence. Keep the same run going through all three and monitor the Wanted Level so it never clears between shops. Arrange your final escape after the third robbery; the description gives no required shop locations."],
    [35,"Whip It Good","Discover 100 vehicles.","bronze","collectibles",false,"",2,"Log vehicle discoveries as you encounter them and use any in-game discovery counter to follow the 100 target. Explore a variety of vehicles during the sweep so your checklist reflects the vehicles the game registers. The description does not define a discovery or require a particular model, so confirm progress through the game's feedback."],
    [36,"Gunslinger","Take down 5 enemies in a single use of Combat Focus.","bronze","misc",false,"",5,"Wait for an encounter where at least five enemies are available before activating Combat Focus. Prepare the resources needed for the attempt, then aim to take down all five during that one activation. Separate uses do not satisfy the stated single-use condition, and the description specifies no weapon or encounter location."],
    [37,"Catch Me If You Can","Make an unscheduled departure at VCIA.","bronze","misc",false,"",5,"Use VCIA as the destination for a deliberate cleanup attempt and explore the departure options the game presents there. The phrase 'unscheduled departure' does not establish a vehicle, route or exact action, so keep this as an unverified lead. Check the trophy list after a plausible departure and keep your notes tied to what actually registers."],
    [38,"Challenging Tank","Kinda hot in these Rhinos.","bronze","misc",false,"",5,"Keep 'Rhinos' as a lead to revisit during cleanup when the game gives that term context. The wording does not establish a place, action or unlock condition, so a precise walkthrough would be guesswork. Observe whether an encounter connected to that lead registers the trophy before drawing a conclusion."],
    [39,"Sneakthief","Rob a jewelry store without being detected.","bronze","misc",false,"",5,"Choose a jewelry-store attempt where you can observe the surroundings before acting, and plan an escape in advance. Keep the robbery undetected from start to finish and retry if the game indicates that you were detected. The description does not name a store, entry route or tool requirement."],
    [40,"Maximum Withdrawal","Rob 5 Bank Vaults and escape.","silver","misc",false,"",4,"Plan an escape before each bank-vault attempt and record the robbery only after getting away. Use the long-count stage to finish the five successful robberies, checking any in-game progress feedback after each escape. The description does not require five different vaults or identify their locations."],
    [41,"A Classic Blitz Play","Rob an Armored Truck and escape.","bronze","misc",false,"",5,"Prepare your approach and escape before attempting an armored-truck robbery. Follow through until you have escaped, then check for the trophy so the robbery and getaway form one completed attempt. The description names no truck location or required equipment."],
    [42,"The Goodtime State","Explore all of Leonida.","bronze","misc",false,"",5,"Use a coverage checklist while exploring Leonida and revisit regions you have left untouched. Compare that checklist with any map or exploration feedback the game provides. The description gives no region count or definition of full coverage, so avoid treating a guessed list as complete."],
    [43,"Pest Control","Rob an Illegal Operation belonging to each gang.","bronze","misc",false,"",5,"Keep a separate checklist for gangs and mark each after successfully robbing one of its Illegal Operations. During cleanup, seek an operation associated with every gang still missing from your checklist and prepare for the attempt. The description supplies no gang total or operation coordinates."],
    [44,"In The Beginning…","Enjoy a cocktail with a view on Ocean Beach.","bronze","misc",false,"",5,"Include an Ocean Beach stop in your cleanup route and look for an available way to enjoy a cocktail with a view there. Check the trophy after doing so, using the location and activity as the supported leads. The description does not identify a particular venue, drink or time of day."],
    [45,"Capital Offense","Smash your way out of a vehicle showroom in classic style.","bronze","misc",false,"",5,"Use a vehicle showroom as the place for a deliberate cleanup attempt and prepare to leave by smashing your way out. Treat 'classic style' as an unresolved clue when choosing the approach. The description does not establish a particular vehicle or exit, so verify the award before calling any approach confirmed."],
    [46,"Let’s Go Bowling","Follow-through at the Kolt & Associates' bowling alley.","bronze","activities",false,"",3,"Visit the Kolt & Associates' bowling alley and use bowling as the lead for an activity-stage attempt. The phrase 'follow-through' does not establish a score or an exact input sequence. Watch for the trophy during play instead of treating a particular result as a verified requirement."],
    [47,"Personal Best","A partnership with mass appeal.","bronze","misc",false,"",5,"Reserve this for cleanup and keep notes on moments the game presents as a partnership. 'Mass appeal' is a clue without a stated action, place or count. Check whether a relevant moment registers the trophy, and leave the exact method unverified until the game supplies evidence."],
    [48,"Actions Speak Louder","Choices made (for better or worse).","bronze","story",true,"Choices may be one-time decisions, and the description gives no repeat guarantee.",1,"Watch for choices during the first story pass and keep a separate save before committing if the game allows it. Check the trophy list after those decisions so you can connect the award to a choice you actually made. Treat this as missable because the description mentions choices without confirming a repeat opportunity or a required outcome."],
    [49,"Bad Luck, I Guess","Second time's the charm.","bronze","misc",false,"",5,"Keep this in the cleanup list and note situations where the game offers a second attempt. The description does not identify which activity or event 'second time' refers to. Check for the award after a relevant retry, and do not assume a generic second success is a verified unlock method."],
    [50,"The Truth Is Out There","What the hell just happened?","bronze","misc",false,"",5,"Leave this clue for cleanup while noting unusual events you encounter during normal play. The description names no place, action or timing window, so it cannot support an exact sequence. Check the trophy list after an unusual event and keep any resulting method labeled unverified until it actually unlocks."],
    [51,"Ten Pin","Bowl 'em over with a melee drive-by.","bronze","misc",false,"",5,"Practice the game's melee drive-by controls before a cleanup attempt. Prepare for a moving melee hit and check the trophy after the action connects. The wording does not specify a target count, vehicle or location, so a particular score cannot be claimed as a requirement."],
    [52,"Dime on the Dollar","Earn $250,000 laundering Marked Bills through your contacts.","bronze","misc",false,"",4,"Route Marked Bills through the contacts named by the game's laundering options and keep a tally of the money earned from that process. Build the total alongside other objectives, then use the long-count stage to reach $250,000. Keep the tally specific to laundering earnings; the description gives no contact names or required transaction size."],
    [53,"Treat Yo Self","Spend $100,000 across all shops.","bronze","misc",false,"",4,"Track shop purchases while completing earlier stages so you can see how much remains toward $100,000. In the long-count stage, budget for the remaining shop spending and confirm any spending counter the game provides. The description names no required shop, item or single-purchase amount."],
    [54,"Little Boxes","Purchase all garage properties.","bronze","misc",false,"",4,"Keep a checklist of garage properties the game offers and budget for the ones you have not bought. Purchase the remaining garages during the long-count stage, then compare your ownership with the available property list. The description gives no garage count, prices or required purchase order."],
    [55,"On the Spot","Register 10 vehicles to the Scooter Bros app.","bronze","misc",false,"",4,"Use the Scooter Bros app to register vehicles as the game makes that option available, recording each successful registration. Build the tally alongside your vehicle sweep, then finish any remaining registrations in the long-count stage. The target is ten vehicles, and the description adds no model or location restriction."]
  ];

  function normalize(text) {
    return String(text).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").replace(/…/g, "...").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function classify(trophy) {
    // Enriched categories are decided from the official description, not the title.
    if (kinds.includes(trophy.kind)) return trophy.kind;
    const text = trophy.description || "";
    if (/multiplayer|online|other players/i.test(text)) return "online";
    if (/chapter|mission|choices made/i.test(text)) return "story";
    if (/collect|find|discover/i.test(text)) return "collectibles";
    if (/challenge|race|activity|arcade|stunts|meditate|hunt|bowling/i.test(text)) return "activities";
    return "misc";
  }

  function indexDocument(documentData) {
    if (!documentData || documentData.game !== "Grand Theft Auto VI" || documentData.platform !== "PlayStation 5" || !Array.isArray(documentData.trophies) || documentData.trophies.length !== 55) {
      throw new Error("The local trophy list must contain all 55 GTA VI PS5 trophies.");
    }
    const byId = new Map();
    const byKind = new Map(kinds.map(kind => [kind, []]));
    const byGrade = new Map(grades.map(grade => [grade, []]));
    const byStage = new Map(stages.map(stage => [stage.id, []]));
    const searchIndex = new Map();
    const trophies = documentData.trophies.map(record => {
      if (!Number.isInteger(record.id) || record.id < 1 || record.id > 55 || byId.has(record.id) || !grades.includes(record.grade) || !kinds.includes(record.kind) || !byStage.has(record.stage) || typeof record.missable !== "boolean" || typeof record.missableWhy !== "string" || (record.missable ? !record.missableWhy.trim() : record.missableWhy !== "")) {
        throw new Error("A local trophy has an invalid ID, grade, category, stage or missable flag.");
      }
      for (const field of ["name", "description", "guide"]) {
        if (typeof record[field] !== "string" || !record[field].trim()) throw new Error("A local trophy is missing its " + field + ".");
      }
      if (!Array.isArray(record.sources) || !record.sources.length || record.sources.some(source => typeof source !== "string" || !source.trim())) {
        throw new Error("Every local trophy needs a source citation.");
      }
      const trophy = Object.freeze({...record, kind: classify(record), sources: Object.freeze([...record.sources])});
      byId.set(trophy.id, trophy);
      byKind.get(trophy.kind).push(trophy);
      byGrade.get(trophy.grade).push(trophy);
      byStage.get(trophy.stage).push(trophy);
      searchIndex.set(trophy.id, normalize([trophy.name, trophy.description, trophy.guide, "trophy " + String(trophy.id).padStart(2, "0"), trophy.kind, trophy.grade, trophy.missableWhy, trophy.missable ? "missable" : "", "stage " + trophy.stage].join(" ")));
      return trophy;
    });
    for (const index of [byKind, byGrade, byStage]) for (const group of index.values()) Object.freeze(group);

    function isHidden(trophy, earned, hideSpoilers) {
      return hideSpoilers && trophy.kind === "story" && !earned;
    }
    function displayName(trophy, earned, hideSpoilers) {
      return isHidden(trophy, earned, hideSpoilers) ? "Story trophy " + String(trophy.id).padStart(2, "0") : trophy.name;
    }
    function matchesSearch(trophy, query, earned, hideSpoilers) {
      const terms = normalize(query).split(" ").filter(Boolean);
      if (!terms.length) return true;
      const haystack = isHidden(trophy, earned, hideSpoilers)
        ? normalize([displayName(trophy, earned, hideSpoilers), trophy.kind, trophy.grade, trophy.missable ? "missable" : "", "stage " + trophy.stage].join(" "))
        : searchIndex.get(trophy.id);
      return terms.every(term => haystack.includes(term));
    }
    function roadmapOrder(left, right) {
      return left.stage - right.stage || Number(left.grade === "platinum") - Number(right.grade === "platinum") || left.id - right.id;
    }
    return Object.freeze({game: documentData.game, platform: documentData.platform, list: documentData.list, trophies: Object.freeze(trophies), byId, byKind, byGrade, byStage, grades, kinds, kindLabels, stages, isHidden, displayName, matchesSearch, roadmapOrder});
  }

  async function load() {
    let documentData;
    if (window.location.protocol === "file:") {
      documentData = {
        game: "Grand Theft Auto VI",
        platform: "PlayStation 5",
        list: "the official 55 trophies, 2026-11-18",
        trophies: offlineRecords.map(([id, name, description, grade, kind, missable, missableWhy, stage, guide]) => ({id, name, description, grade, kind, missable, missableWhy, stage, guide, sources: [...sources]}))
      };
    } else {
      const response = await fetch(new URL("./data/trophies.json", document.baseURI), {cache: "no-store"});
      if (!response.ok) throw new Error("The local data/trophies.json file could not be loaded.");
      documentData = await response.json();
    }
    return indexDocument(documentData);
  }

  app.data = Object.freeze({load, stages, grades, kinds, kindLabels, normalize, classify});
})();
