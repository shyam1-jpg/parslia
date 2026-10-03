/**
 * House manual chapters from the Vedanta Pro update.
 * Each step has something to look for and something to do.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HouseManual = api;
})(typeof self !== "undefined" ? self : this, function () {
  var chapters = [
    {
      slug: "app-report-a-problem",
      department: "House",
      kind: "App",
      title: "Reporting a problem, and how it gets fixed",
      summary: "Every fault has one card. It says what is wrong, exactly where, and how urgent. The General Manager sees it on Manager view the moment it is sent, gives it to someone, and the reporter can watch it move from New to Being fixed to Fixed.",
      body: "Staff report from Staff hub → Report a problem. Pick what kind of problem it is, say where (room number or building area), and choose how urgent: Right now (someone could be hurt, or a guest cannot use their room), Today (it blocks work or a room later today), This week (it can wait for the next maintenance round).\n\nThe card lands on Maintenance tasks and on Manager view. The General Manager or a manager gives it to the right person — maintenance, grounds, or an outside contractor — and can block a room from bookings until it is safe.\n\nThe person fixing it presses Start work, then Mark fixed. The reporter sees the status under Problems I've reported. A manager may verify the repair.\n\nNever put a guest's name or health details on a fault card. If it is dangerous right now, make the area safe and tell a manager in person as well as on the card.",
      diagram: [
        ["See", "What is wrong"],
        ["Report", "Staff hub"],
        ["Assign", "Manager view"],
        ["Fix", "Start → Fixed"],
        ["Close", "Reporter sees it"]
      ],
      steps: [
        ["Make safe first", "Nobody can slip, touch a live wire or walk into the hazard.", "Sign, cone, switch off at the local isolator if trained, or keep people away. Then report."],
        ["Write one clear card", "Someone who was not there can find it and understand it.", "Kind of problem, exact place, a few words on what is happening. Add a photo if it helps."],
        ["Choose urgency honestly", "Right now is rare and means it.", "Right now = danger or a guest room unusable. Today = blocks work. This week = can wait."],
        ["Manager assigns", "Every New card has an owner within the shift.", "General Manager or duty manager opens Manager view, gives the job to someone, blocks the room if needed."],
        ["Fix and close", "Status shows Fixed and the reporter can see it.", "Press Start work when you begin and Mark fixed when it is done. Tell the reporter if the guest is waiting."]
      ]
    },
    {
      slug: "front-group-arrival",
      department: "Front of house",
      kind: "SOP",
      title: "Front of house — a group arriving",
      summary: "When a group walks in, the welcome is ready before the coach is: room list printed and checked against the room board, keys in named envelopes, diets confirmed with the kitchen, tea out, the organiser met by name. Nobody queues for long and nobody's room is a surprise.",
      body: "The day before: open the booking, check numbers against the room list, confirm every room is Ready or scheduled to be, and check the kitchen has every dietary need and allergy. Print or prepare the arrival list and key envelopes.\n\nOn the day: the organiser is the first person you greet. Agree any changes with them, not with individual guests in the queue. Late arrivals and early arrivals are written on the House log so the night porter and housekeeping know.\n\nAllergies are confirmed privately with each guest who has one — never read out across the lobby. If a room is not ready, offer the lounge, tea and luggage storage, and give a realistic time. Do not promise what housekeeping has not confirmed.\n\nAfter the last guest: update the room board, note who has not arrived, and hand over to the next shift.",
      diagram: [
        ["Day before", "Rooms · diets · keys"],
        ["Organiser", "Greet first"],
        ["Check-in", "Name · key · diet"],
        ["Settle", "Tea · tour · times"],
        ["Handover", "Who is still to come"]
      ],
      steps: [
        ["The day before", "Room list matches the room board. Kitchen has every diet.", "Check numbers, rooms, diets and arrival time with the organiser. Prepare key envelopes by name."],
        ["Ready the lobby", "Tea and water out, arrival list in hand, desk clear.", "Ask housekeeping which rooms are Ready. Agree a plan for any that are not."],
        ["Meet the organiser", "The organiser feels looked after first.", "Greet by name, confirm numbers and changes, agree timings for meals and the first session."],
        ["Check each guest in", "Under two minutes each, no queue out of the door.", "Name, key, room, meal times, Wi-Fi. Confirm any allergy quietly and that the kitchen has it."],
        ["If a room is not ready", "The guest is comfortable, not standing in a corridor.", "Offer the lounge, tea and luggage storage. Give a time housekeeping has confirmed."],
        ["Close the arrival", "Room board and House log are true.", "Mark arrivals in, list no-shows, write late arrivals for the night porter, hand over."]
      ]
    },
    {
      slug: "front-departure-billing",
      department: "Front of house",
      kind: "SOP",
      title: "Front of house — departures and settling the bill",
      summary: "A good departure is calm: the bill is right before the guest asks, keys come back, lost property is checked, housekeeping knows the room is free, and the organiser leaves with nothing outstanding and a reason to come back.",
      body: "The evening before: check the folio for each departing booking — extras added, deposits applied, nothing missing. Agree with the organiser who pays what (organiser account, individual extras).\n\nOn the morning: collect keys, take payment for anything outstanding, and send the receipt by email. Tell housekeeping as each room is vacated so turnaround can start — do not wait for the whole group.\n\nIf a guest disputes a charge, listen, check the folio together, and correct genuine mistakes on the spot. Anything you cannot resolve goes to the duty manager — do not argue at the desk.\n\nNever show one guest another guest's bill, room or contact details.",
      diagram: [
        ["Night before", "Folio checked"],
        ["Keys", "Back and counted"],
        ["Pay", "Receipt by email"],
        ["Room free", "Tell housekeeping"],
        ["Goodbye", "Organiser first"]
      ],
      steps: [
        ["Check folios the night before", "Every departing folio is complete and correct.", "Add missing extras, apply deposits, agree organiser vs individual charges."],
        ["Keys and rooms", "All keys back, each vacated room passed to housekeeping.", "Count keys against the room list. Mark rooms vacated as they come back."],
        ["Take payment", "Nothing outstanding unless agreed in writing.", "Take card or confirm the invoice route. Email the receipt."],
        ["Disputes", "Calm, private, resolved or escalated.", "Go through the folio together. Fix genuine errors. Escalate the rest to the duty manager."],
        ["Lost property and goodbye", "Nothing left behind; the organiser thanked.", "Ask about valuables in safes. Log lost property. Thank the organiser and mention rebooking."]
      ]
    },
    {
      slug: "hk-turnaround",
      department: "Housekeeping",
      kind: "SOP",
      title: "Housekeeping — same-day turnaround between groups",
      summary: "When one group leaves and another arrives the same day, the team works to a plan, not a rush: departure rooms are cleaned in the order the new group needs them, each room is inspected before it is marked Ready, and front of house always knows the true count.",
      body: "Before checkout: the supervisor lists the rooms in priority order — rooms needed first by the arriving group, accessible rooms, rooms with special set-up (twin to double, extra bed, welcome pack). Linen, amenities and trolleys are stocked before the first room is free.\n\nAs rooms empty: front of house tells housekeeping room by room. Strip, air, clean, make, restock, check for faults and lost property. Report faults on the card before marking the room inspected.\n\nInspection: a supervisor or trained attendant checks every departure room before it becomes Ready. Ready means a guest could walk in now.\n\nIf the clock is against you: tell the supervisor early, not at five to three. The supervisor can move staff, ask the duty manager for help, or agree with front of house which rooms will be late.",
      diagram: [
        ["Plan", "Order of rooms"],
        ["Stock", "Linen · trolleys"],
        ["Clean", "Room by room"],
        ["Inspect", "Then Ready"],
        ["Tell FOH", "True count"]
      ],
      steps: [
        ["Plan the order", "A written list: which rooms first, and who does each.", "Supervisor ranks rooms by the arriving group's needs and splits them between attendants."],
        ["Stock up first", "Trolleys full before checkout time.", "Linen, towels, amenities, welcome packs and any special items ready on each floor."],
        ["Clean as rooms free", "No attendant waiting idle for a whole group to leave.", "Start each room as soon as front of house marks it vacated."],
        ["Faults and lost property", "Nothing hidden, nothing pocketed.", "Report faults on the card. Log lost property and take it to the safe."],
        ["Inspect, then Ready", "Only inspected rooms show Ready on the room board.", "Supervisor checks each room and marks it Ready. Fix anything missed straight away."],
        ["Running late", "Front of house hears early and plans for it.", "Tell the supervisor as soon as a room will miss its time. Agree which rooms go first."]
      ]
    },
    {
      slug: "kitchen-allergen-plate",
      department: "Kitchen",
      kind: "Safety",
      title: "Kitchen — making and sending an allergen plate",
      summary: "An allergen plate is made on its own, from checked ingredients, with clean kit, labelled and carried by hand to the right guest. It never shares a tray, a spoon or a guess. If anyone is unsure, it does not leave the pass.",
      body: "Information: the guest's allergy comes from the booking and is confirmed at check-in. The kitchen keeps the list for every meal. A new allergy mentioned at the table is passed to the kitchen before anything is served.\n\nIngredients: check the label or recipe for every component, including stocks, sauces, garnishes and oils. Watch for 'may contain' warnings. If a supplier has changed a product, check the new label.\n\nMaking: clean the area, wash hands, use clean boards, pans and utensils. Make the allergen plate first or in a separate area. Cover it and label it with the guest's name or table and the allergen.\n\nService: the chef calls it at the pass. The server carries it by hand, alone, to the right guest and names the dish. If a plate is wrong or contaminated, it is remade from the start — never 'picked off'.\n\nIf a guest has a reaction: call for help, call 999 if there are signs of a severe reaction, and help the guest use their own adrenaline auto-injector if they have one. Tell the duty manager and record what happened.",
      diagram: [
        ["Know", "Allergy list per meal"],
        ["Check", "Every label"],
        ["Make apart", "Clean kit"],
        ["Label", "Name · allergen"],
        ["Carry by hand", "Alone, to the guest"]
      ],
      steps: [
        ["Read the list", "Every allergy for this meal is on the board before prep.", "Head chef checks the board against the bookings. New allergies from the floor go on immediately."],
        ["Check every ingredient", "Labels read, including sauces and garnishes.", "Check the recipe and labels. Treat 'may contain' as contains for that guest."],
        ["Make it apart", "Clean board, clean pan, washed hands, separate space.", "Prepare allergen plates first or in a separate area. Never share oil or utensils."],
        ["Cover and label", "The plate says who it is for and what it is free from.", "Cover, label with name or table and the allergen, keep it apart at the pass."],
        ["Hand it over", "The server carries one plate, by hand, to one guest.", "Call it at the pass. Server names the dish to the guest. Never on a shared tray."],
        ["If in doubt", "Nothing uncertain leaves the kitchen.", "Stop, check, remake. If a guest reacts: help, 999 for a severe reaction, tell the manager, record it."]
      ]
    },
    {
      slug: "house-service-recovery",
      department: "House",
      kind: "Hospitality",
      title: "When a guest is unhappy — putting it right",
      summary: "An unhappy guest is listened to properly, thanked for telling us, and given a fix they can see. Whoever hears the complaint owns it until it is solved or clearly handed to someone who will.",
      body: "Listen without interrupting or defending. Repeat back what you heard so the guest knows you understood. Thank them for telling us — most unhappy guests never do.\n\nApologise for how it felt, even before you know whose fault it was. Then fix what you can straight away: move the room, replace the dish, send maintenance, bring the extra blanket. Tell the guest exactly what will happen and when.\n\nIf you cannot fix it, bring in the duty manager — and introduce them so the guest does not repeat the story. Write it on the House log so the next shift knows, and follow up later the same day to check it is still right.\n\nOnly a manager agrees refunds or money off. Never blame a colleague or another department in front of a guest.",
      diagram: [
        ["Listen", "All of it"],
        ["Thank", "For telling us"],
        ["Fix", "Something visible"],
        ["Follow up", "Same day"]
      ],
      steps: [
        ["Listen", "The guest has finished speaking and feels heard.", "Stop what you are doing, face them, let them finish, repeat it back."],
        ["Apologise and thank", "Calm voice, no excuses, no blame.", "Say sorry for the experience and thank them for telling you."],
        ["Fix what you can now", "The guest sees something happen.", "Act within your role straight away and tell them what you are doing and when it will be done."],
        ["Bring in a manager if needed", "The guest does not have to tell the story twice.", "Introduce the duty manager and summarise. Refunds or discounts are a manager's decision."],
        ["Record and follow up", "The next shift knows; the guest is checked on.", "Write it on the House log. Check back later that day that it is still right."]
      ]
    },
    {
      slug: "house-fire-evacuation",
      department: "House",
      kind: "Safety",
      title: "Fire alarm — what every person does",
      summary: "When the alarm sounds, everyone leaves by the nearest safe exit to the assembly point on the fire notice — staff included. Nobody goes back for belongings. The fire marshal or duty manager takes the count and meets the fire service.",
      body: "This chapter is the everyday summary. The house fire risk assessment, fire notices and your fire training are the authority — follow them where they say more.\n\nIf you find a fire: raise the alarm at the nearest call point, call 999, and only tackle a small fire if you are trained and it is safe. Close doors behind you to slow the fire.\n\nWhen the alarm sounds: stop work, switch off cooking equipment only if it is safe and quick, and guide guests to the nearest safe exit. Do not use lifts. Help anyone who needs assistance as set out in their personal evacuation plan.\n\nAt the assembly point: report to the fire marshal or duty manager. Front of house brings the current guest list; the duty manager brings the staff list from the time clock. Report anyone known to be missing and where they were last seen. Nobody re-enters until the fire service says it is safe.\n\nNight: the night porter leads the evacuation, calls 999, and meets the fire service.",
      diagram: [
        ["Alarm", "Call point · 999"],
        ["Leave", "Nearest safe exit"],
        ["Assemble", "As on the fire notice"],
        ["Count", "Guests and staff"],
        ["Wait", "Fire service decides"]
      ],
      steps: [
        ["Find a fire", "Alarm raised within seconds.", "Press the nearest call point, call 999, close doors. Only use an extinguisher if trained and safe."],
        ["Alarm sounds", "Everyone moving to the nearest safe exit, calmly.", "Stop work, guide guests out, do not use lifts, do not collect belongings."],
        ["Help others", "Anyone who needs help has someone with them.", "Follow each person's evacuation plan. Report anyone you could not reach to the marshal."],
        ["Count", "Every guest and staff member accounted for.", "Front of house: guest list. Duty manager: staff on the time clock. Report missing people."],
        ["Do not go back", "Nobody re-enters the building.", "Wait until the fire service says it is safe. The duty manager decides when guests return."]
      ]
    },
    {
      slug: "house-medical-emergency",
      department: "House",
      kind: "Safety",
      title: "Someone is hurt or taken ill",
      summary: "In a medical emergency the person gets help first: a first aider or 999 within moments, someone staying with them, a clear way in for the ambulance, and a manager told. Paperwork comes after.",
      body: "Your first aid training is the authority. This is what the house expects around it.\n\nIf someone is seriously ill or injured — not breathing normally, unconscious, severe bleeding, chest pain, signs of a stroke or a severe allergic reaction — call 999 straight away, then call a first aider. If the person is not breathing normally, start CPR if trained and send someone for the defibrillator.\n\nFor anything less serious, call a first aider and the duty manager.\n\nOne person stays with the casualty. Another meets the ambulance at the entrance and guides the crew. Keep other guests calm and give the person privacy.\n\nAfterwards: record the incident in the accident book or incident record and tell the duty manager. Some injuries must be reported under RIDDOR — the manager decides. Never share a guest's health details beyond the people who need them.",
      diagram: [
        ["Danger", "Make it safe"],
        ["Call", "999 · first aider"],
        ["Stay", "With the person"],
        ["Guide", "Meet the ambulance"],
        ["Record", "Incident record"]
      ],
      steps: [
        ["Check for danger", "You are not putting yourself at risk.", "Make the area safe before you approach."],
        ["Call for help", "999 called for anything serious; a first aider on the way.", "Call 999 first if it is serious, then a first aider and the duty manager."],
        ["Stay with them", "The person is never left alone.", "Follow your first aid training. Start CPR and get the defibrillator if they are not breathing normally."],
        ["Guide the ambulance", "Someone is waiting at the entrance.", "Send a colleague to meet the crew and bring them straight to the person."],
        ["Record and protect privacy", "The incident is written down; health details stay private.", "Complete the incident record. Tell the duty manager. Share health details only with those who need them."]
      ]
    }
  ];

  function chapterBySlug(slug) {
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].slug === slug) return chapters[i];
    }
    return null;
  }

  return { chapters: chapters, chapterBySlug: chapterBySlug };
});
