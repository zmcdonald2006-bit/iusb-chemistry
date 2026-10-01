// "Nursing connection" notes: how each topic shows up in nursing school and on the job.
// They appear at the end of the matching lesson section and all together under Reference → Nursing.
// They go beyond the lecture slides — for motivation and context, not exam material.
//
// Each note: { id, lecture, section, title, text }. `section` must be a section id in that lecture.
// Text uses the same markup as lectures (**bold**, $H_2O$ formulas, ^sup^).
export const NURSING = [
  // Lecture 1 — Intro to organic chemistry
  {
    id: 'n-l01-drugs', lecture: 'l01', section: 'what', title: 'Almost every medication is organic',
    text: 'Nearly every drug a nurse gives (acetaminophen, insulin, antibiotics) is an organic molecule. Its carbon skeleton and functional groups decide how it dissolves, how it\'s absorbed and how the liver breaks it down. Pharmacology keeps coming back to the chemistry in this class.',
  },
  {
    id: 'n-l01-shape', lecture: 'l01', section: 'shapes', title: 'Shape is how drugs work',
    text: 'Drugs act by fitting into receptors and enzymes, like a key in a lock. The 3-D shape built from tetrahedral, trigonal planar and linear atoms decides whether a molecule fits. A small change in shape can turn a medicine into an inactive (or harmful) one.',
  },
  {
    id: 'n-l01-skeletal', lecture: 'l01', section: 'skeletal', title: 'Reading a drug\'s structure',
    text: 'Drug references and package inserts draw medications as skeletal structures. Spotting the rings, the –OH and the C=O in one lets you connect a new drug to families you already know.',
  },

  // Lecture 2 — Functional groups
  {
    id: 'n-l02-bbb', lecture: 'l02', section: 'solubility', title: 'Getting into the brain',
    text: 'The brain is protected by the **blood–brain barrier**. Nonpolar (fat-soluble) molecules cross it far more easily than polar or charged ones. That\'s why general anesthetics are small, nonpolar molecules, and why many polar drugs barely reach the brain.',
  },
  {
    id: 'n-l02-vitk', lecture: 'l02', section: 'vitamins', title: 'Vitamin K and warfarin',
    text: 'The blood thinner **warfarin** works against **vitamin K**, a fat-soluble vitamin found in leafy greens. Patients on warfarin are taught to keep their vitamin K intake **consistent**, because a sudden big change in how many greens they eat changes how well the drug works.',
  },
  {
    id: 'n-l02-toxic', lecture: 'l02', section: 'vitamins', title: 'Fat-soluble vitamins can build up',
    text: 'Vitamins A, D, E and K are stored in body fat, so very large doses can build up to **toxic** levels. (High-dose vitamin A can also cause birth defects.) Extra B and C vitamins mostly leave in the urine.',
  },

  // Lecture 3 — Alkanes
  {
    id: 'n-l03-petrolatum', lecture: 'l03', section: 'intro', title: 'Alkanes on the skin',
    text: '**Petroleum jelly** is a mixture of large alkanes. It\'s nonpolar, so water can\'t pass through it. That makes it a good skin barrier, for dry, cracked skin and in diaper-rash ointments that keep moisture off the skin.',
  },
  {
    id: 'n-l03-mineral', lecture: 'l03', section: 'intro', title: 'Mineral oil and the lungs',
    text: '**Mineral oil** (liquid alkanes) is sometimes used as a laxative. If it\'s breathed into the lungs it can cause **lipoid pneumonia**, because the body can\'t break alkanes down. It\'s used with caution in people who have trouble swallowing.',
  },
  {
    id: 'n-l03-names', lecture: 'l03', section: 'naming', title: 'One syllable, a different drug',
    text: 'Medication errors happen with look-alike names like **hydrOXYzine** (for itching and anxiety) and **hydrALAZINE** (for blood pressure). Hospitals print the letters that differ in capitals ("tall man" lettering). Reading a name syllable by syllable is the same skill as IUPAC naming.',
  },

  // Lecture 4 — Alkenes & alkynes
  {
    id: 'n-l04-vision', lecture: 'l04', section: 'cis-trans', title: 'Cis–trans in your eyes',
    text: 'Vision starts with a cis–trans change. Light flips **11-cis-retinal** (made from vitamin A) into its **trans** form in the retina, and that triggers a nerve signal. Too little vitamin A means too little retinal, and an early sign is **night blindness**.',
  },
  {
    id: 'n-l04-diet', lecture: 'l04', section: 'fats', title: 'Heart-healthy diet teaching',
    text: 'Nurses often teach heart-healthy eating: swap **saturated** fats (solid: butter, fatty meat) for **unsaturated** oils (olive, canola), and avoid **trans** fats. Saturated and trans fats raise LDL ("bad") cholesterol.',
  },
  {
    id: 'n-l04-fumarase', lecture: 'l04', section: 'addition', title: 'Your cells do hydration too',
    text: 'In the citric acid cycle, which makes energy in every cell, the enzyme **fumarase** adds water across a C=C (fumarate → malate). It\'s the same hydration reaction, done by an enzyme instead of $H_2SO_4$.',
  },

  // Lecture 5 — Alcohols
  {
    id: 'n-l05-sanitizer', lecture: 'l05', section: 'interesting', title: 'Hand sanitizer and skin prep',
    text: 'Hand sanitizers need at least **60% alcohol** (ethanol or isopropyl alcohol) to kill most germs (CDC). Alcohol is flammable, so in surgery an alcohol skin prep must **dry completely** before electrical tools are used.',
  },
  {
    id: 'n-l05-isopropyl', lecture: 'l05', section: 'oxidation', title: 'Rubbing alcohol poisoning',
    text: 'Isopropyl alcohol (2-propanol, a **2° alcohol**) is oxidized in the liver to **acetone**, a ketone, and oxidation of a 2° alcohol stops there. These patients have ketones in their blood and breath, but not the severe acidosis of methanol poisoning.',
  },
  {
    id: 'n-l05-fomepizole', lecture: 'l05', section: 'metabolism', title: 'An antidote that blocks oxidation',
    text: 'In methanol or antifreeze (ethylene glycol) poisoning, the real danger is the **oxidation products**. The antidote **fomepizole** blocks alcohol dehydrogenase so the toxic aldehydes and acids aren\'t made, while the alcohol is cleared (sometimes by dialysis).',
  },
  {
    id: 'n-l05-disulfiram', lecture: 'l05', section: 'metabolism', title: 'Disulfiram (Antabuse)',
    text: '**Disulfiram** blocks **aldehyde dehydrogenase**. After any alcohol, acetaldehyde builds up and causes flushing, nausea and a racing heart. Patients are taught to avoid hidden alcohol too, in some mouthwashes, cough syrups and sauces.',
  },

  // Lecture 6 — Ethers, halides & thiols
  {
    id: 'n-l06-anesthetics', lecture: 'l06', section: 'ethers', title: 'Today\'s anesthetic gases',
    text: 'Modern inhaled anesthetics like **sevoflurane** and **desflurane** are ethers with fluorine atoms attached. In rare, genetically at-risk patients they can trigger **malignant hyperthermia**, a dangerous spike in temperature with rigid muscles, treated with **dantrolene**.',
  },
  {
    id: 'n-l06-nac', lecture: 'l06', section: 'thiols', title: 'A thiol antidote',
    text: '**Acetylcysteine**, the antidote for acetaminophen (Tylenol) overdose, is a thiol. It restores the liver\'s supply of **glutathione** (another thiol), which neutralizes acetaminophen\'s toxic breakdown product. Like other thiols, it smells like rotten eggs.',
  },
  {
    id: 'n-l06-insulin', lecture: 'l06', section: 'thiols', title: 'Disulfides hold insulin together',
    text: 'Insulin\'s two chains are held together by **disulfide bonds** (–S–S–) between cysteine thiols. A protein only works in its proper shape. Heat and freezing can ruin that shape, which is why insulin is stored as directed and never frozen.',
  },

  // Lecture 7 — Chirality
  {
    id: 'n-l07-prefixes', lecture: 'l07', section: 'drugs', title: 'Drug names that mean one enantiomer',
    text: 'Some drug names tell you a single enantiomer is used: **es**omeprazole and **es**citalopram (the S forms), **lev**albuterol, **lev**ofloxacin and **dex**methylphenidate. If you know the parent drug, you know what the single-enantiomer version does.',
  },

  // Lecture 8 — Aldehydes & ketones
  {
    id: 'n-l08-dka', lecture: 'l08', section: 'interesting', title: 'Ketones in diabetic emergencies',
    text: 'In **DKA** the body burns fat for fuel and makes **ketone bodies**, including acetone. Nurses check blood or urine ketones, and may notice a **fruity smell** on the patient\'s breath. That\'s acetone, which is volatile and gets breathed out.',
  },
  {
    id: 'n-l08-formalin', lecture: 'l08', section: 'interesting', title: 'Formalin safety',
    text: 'Biopsy and surgical specimens go to the lab in **formalin** (formaldehyde in water), which preserves tissue. Formaldehyde irritates the eyes, skin and lungs and can cause cancer, so containers stay closed and are handled with gloves.',
  },
  {
    id: 'n-l08-lactate', lecture: 'l08', section: 'reduction', title: 'A reduction in your muscles',
    text: 'When muscles run short of oxygen, NADH reduces the ketone group of **pyruvate** to the 2° alcohol group of **lactate**. A high blood lactate level is a warning sign of poor oxygen delivery, as in **shock or sepsis**, so nurses draw and trend lactate levels.',
  },

  // Lecture 9 — Acids & bases
  {
    id: 'n-l09-antacids', lecture: 'l09', section: 'ph', title: 'Antacids are bases',
    text: 'Antacids like **calcium carbonate** (Tums) and **magnesium hydroxide** (milk of magnesia) neutralize stomach acid (pH about 1.5–3.5). They can also block absorption of some other drugs, such as certain antibiotics, so those doses are spaced hours apart.',
  },
  {
    id: 'n-l09-lr', lecture: 'l09', section: 'buffers', title: 'An IV fluid that adds buffer',
    text: '**Lactated Ringer\'s**, a common IV fluid, contains lactate. The liver converts lactate into **bicarbonate**, which adds to the blood\'s main buffer.',
  },
  {
    id: 'n-l09-abg', lecture: 'l09', section: 'blood', title: 'Reading an ABG',
    text: 'An arterial blood gas (ABG) reports pH, CO₂ and bicarbonate. Normal values: pH **7.35–7.45**, PaCO₂ **35–45 mmHg**, $HCO_3^−^$ **22–26 mEq/L**. A low pH with **high CO₂** points to a breathing (respiratory) problem. A low pH with **low bicarbonate** points to a metabolic one, like DKA.',
  },
  {
    id: 'n-l09-metabolic', lecture: 'l09', section: 'blood', title: 'Metabolic acidosis and alkalosis',
    text: 'DKA and severe **diarrhea** (bicarbonate lost in stool) cause **metabolic acidosis**. Repeated **vomiting** (stomach acid lost) causes **metabolic alkalosis**. The lungs respond within minutes by breathing faster or slower. The kidneys take hours to days.',
  },

  // Lecture 10 — Carboxylic acids
  {
    id: 'n-l10-nsaid', lecture: 'l10', section: 'health', title: 'NSAIDs and the stomach',
    text: 'Aspirin, ibuprofen and naproxen also block the prostaglandins that protect the stomach lining, so they can cause **irritation, ulcers and bleeding**. Patients are taught to take them with food, and nurses watch for signs of GI bleeding such as black, tarry stools.',
  },
  {
    id: 'n-l10-salts', lecture: 'l10', section: 'acidity', title: 'Drugs made into salts',
    text: 'Turning a carboxylic acid into its sodium salt makes it **water soluble**. That\'s how many drugs are made to dissolve faster or be given by IV, for example **naproxen sodium** (Aleve) and **valproate sodium**.',
  },
  {
    id: 'n-l10-aspirin', lecture: 'l10', section: 'aspirin', title: 'Aspirin safety',
    text: 'Aspirin stops platelets from clumping for the rest of their life (about 7–10 days), so it\'s often stopped before surgery when the provider orders it. It\'s avoided in children and teens with viral illnesses because of the risk of **Reye\'s syndrome**.',
  },
];

export const nursingFor = (lecture, section) => NURSING.filter((n) => n.lecture === lecture && n.section === section);
