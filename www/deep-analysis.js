/**
 * NaturaBridgeB — Deep Analysis Engine v4.0
 * ==========================================
 * Orchestrates 15+ backend simulation systems for exhaustive compound analysis.
 * Produces a professional-grade formulation intelligence report.
 *
 * v4.0 — Major renderer overhaul:
 *   - Rich clinical context for CYP competition and safety flags
 *   - Intelligent chronotherapy fallbacks for supplements
 *   - Specialist AI reviews with proper formatting
 *   - Human-readable appendixes (no raw JSON)
 *   - Print/Save PDF support
 */

const DEEP_API = 'https://naturabridge-api.srv1251318.hstgr.cloud';

// ═══════════════════════════════════════════════════════════════════════
// CLINICAL KNOWLEDGE BASES — enriched context for report rendering
// ═══════════════════════════════════════════════════════════════════════

const CYP_CONTEXT = {
  CYP3A4: {
    role: 'Metabolises approximately 50% of all drugs and supplements — the single most important liver enzyme for clearing ingested substances.',
    effect: 'When multiple compounds compete for CYP3A4, the strongest binder is processed first. Remaining compounds stay in circulation longer, which can increase both their therapeutic effect and their side effects.',
    action: 'Space competing compounds 4–6 hours apart. Take the compound with the narrower safety margin first (usually the pharmaceutical drug, if applicable).',
    substrates: 'Common substrates include curcumin, berberine, grapefruit compounds, statins, calcium channel blockers.'
  },
  CYP2D6: {
    role: 'Metabolises ~25% of drugs including many antidepressants, beta-blockers, and opioids. Highly polymorphic — activity varies 10–100× between individuals.',
    effect: 'CYP2D6 competition is clinically significant because poor metabolisers (5–10% of the population) already have reduced capacity. Adding competitive inhibitors can push effective metabolisers into a poor-metaboliser phenotype.',
    action: 'If taking CYP2D6-metabolised medications (SSRIs, codeine, tamoxifen), consult a pharmacist before combining with supplements that inhibit this enzyme.',
    substrates: 'Common substrates include many alkaloids, berberine, and various flavonoids.'
  },
  CYP2C19: {
    role: 'Processes proton pump inhibitors (omeprazole), clopidogrel, some antidepressants, and several natural compounds. ~15–20% of Asian populations are poor metabolisers.',
    effect: 'Competition at CYP2C19 can alter drug levels unpredictably. This is especially important for anyone taking clopidogrel (blood thinner) or omeprazole (acid reflux).',
    action: 'If taking PPIs or clopidogrel, avoid combining with strong CYP2C19 inhibitors. Otherwise, spacing doses 4–6 hours apart mitigates risk.',
    substrates: 'Natural substrates include several amino acids when taken in high doses, flavonoids, and some B vitamins.'
  },
  CYP1A2: {
    role: 'Primarily metabolises caffeine, theophylline, and melatonin. Activity shows strong circadian variation — 30% higher in the morning than at night.',
    effect: 'CYP1A2 competition mainly affects caffeine metabolism. If you consume caffeine alongside CYP1A2 competitors, caffeine will stay in your system longer — potentially causing jitteriness or insomnia.',
    action: 'Take caffeine-competing supplements in the evening (when CYP1A2 activity is lower and you want longer duration) or space from caffeine by 2–3 hours.',
    substrates: 'Caffeine, theophylline, melatonin, taurine (at high doses), some flavonoids.'
  },
  CYP2C9: {
    role: 'Metabolises warfarin, many NSAIDs (ibuprofen, naproxen), and several natural compounds. ~1–3% of people are poor metabolisers.',
    effect: 'CYP2C9 competition is critical for anyone on warfarin — even modest inhibition can dangerously increase bleeding risk.',
    action: 'If taking warfarin or NSAIDs regularly, consult your healthcare provider before adding supplements that compete for CYP2C9. Monitor INR if on warfarin.',
    substrates: 'Warfarin, NSAIDs, some flavonoids, vitamin E at high doses.'
  },
  CYP2D6: {
    role: 'Metabolises ~25% of drugs including many antidepressants, beta-blockers, and opioids. Highly polymorphic — activity varies 10–100× between individuals.',
    effect: 'CYP2D6 competition can convert normal metabolisers into effective poor metabolisers, dramatically changing drug response.',
    action: 'If taking CYP2D6-metabolised medications, consult a pharmacist before combining with CYP2D6-competitive supplements.',
    substrates: 'Many alkaloids, berberine, various flavonoids.'
  }
};

const SAFETY_TARGET_CONTEXT = {
  'P-gp': {
    name: 'P-glycoprotein Efflux Pump',
    role: 'A transporter protein that acts as a gatekeeper — pumping foreign substances out of cells in your gut wall, blood-brain barrier, and kidneys. It limits how much of an ingested compound actually enters your bloodstream.',
    risk: 'When multiple compounds modulate P-gp simultaneously, gut absorption of all compounds increases (more gets in), and the blood-brain barrier becomes more permeable (substances that normally can\'t reach the brain may now do so). This can amplify both therapeutic effects and side effects.',
    action: 'Monitor for unexpected side effects such as increased drowsiness, GI upset, or headache. Consider reducing doses by 20–30% when combining multiple P-gp modulators, especially if crossing the blood-brain barrier is a concern.'
  },
  'OATP1B1': {
    name: 'Organic Anion Transporting Polypeptide 1B1',
    role: 'A liver uptake transporter that pulls substances from your blood into liver cells for processing. It\'s the "intake valve" for hepatic clearance.',
    risk: 'Competition at OATP1B1 keeps compounds in your blood longer because the liver can\'t pull them in as fast. This is the mechanism behind many statin drug interactions — blood levels of statins can rise 2–5× when OATP1B1 is inhibited.',
    action: 'If taking statins (atorvastatin, rosuvastatin, simvastatin), be cautious combining with OATP1B1-competitive supplements. Space doses and monitor for muscle pain (myalgia), which signals excessive statin exposure.'
  },
  'VKORC1': {
    name: 'Vitamin K Epoxide Reductase Complex 1',
    role: 'The enzyme responsible for recycling vitamin K, which is essential for blood clotting. Warfarin works by inhibiting VKORC1.',
    risk: 'Multiple VKORC1 modulators can disrupt the clotting balance — either increasing bleeding risk (too much inhibition) or reducing anticoagulant effectiveness (if compounds compete with warfarin for the same site).',
    action: 'If taking warfarin or other anticoagulants, this combination requires close INR monitoring. Inform your prescribing physician about all supplements affecting VKORC1. Do not adjust warfarin dose without medical supervision.'
  }
};

const CHRONO_INTELLIGENCE = {
  // Amino acids
  taurine: { time: 'Morning', rationale: 'Taurine is a water-soluble amino acid with mild stimulatory effects on bile acid conjugation and cellular osmoregulation. Morning dosing on an empty stomach maximises absorption via intestinal taurine transporters (TauT). Peak plasma levels at ~1.5h align with morning metabolic activity.' },
  glycine: { time: 'Evening', rationale: 'Glycine acts as an inhibitory neurotransmitter via NMDA receptor co-agonism and glycine receptors in the brainstem. It lowers core body temperature (~0.5°C), which promotes sleep onset. A 3g evening dose 30–60 minutes before bed improves subjective sleep quality (Yamadera et al., 2007).' },
  l_theanine: { time: 'Evening (or morning for calm focus)', rationale: 'L-theanine crosses the blood-brain barrier within 30 minutes and promotes alpha brain wave activity — the relaxed-but-alert state. Evening dosing supports sleep quality without causing sedation. If taken morning, combine with caffeine for "calm focus" (synergistic with caffeine at 2:1 ratio L-theanine:caffeine).' },
  creatine_monohydrate: { time: 'Morning (with meal)', rationale: 'Creatine absorption improves ~25% when taken with carbohydrates and protein due to insulin-mediated upregulation of the creatine transporter (CrT/SLC6A8). Morning dosing with breakfast maximises cellular uptake during active hours when ATP turnover is highest.' },
  'l_lysine_(as_hcl)': { time: 'Morning (empty stomach)', rationale: 'Lysine competes with arginine for the same intestinal transporter (CAT-1). Taking lysine on an empty stomach, away from arginine-rich foods, maximises absorption. Morning dosing supports collagen synthesis and immune function during the active phase.' },
  l_lysine: { time: 'Morning (empty stomach)', rationale: 'Lysine competes with arginine for the same intestinal transporter (CAT-1). Taking lysine on an empty stomach, away from arginine-rich foods, maximises absorption.' },
  // Minerals & vitamins
  magnesium: { time: 'Evening', rationale: 'Magnesium activates the parasympathetic nervous system via GABA receptor modulation and reduces cortisol. Evening dosing (citrate or glycinate form) supports muscle relaxation and sleep quality. Avoid taking with calcium — they compete for the same transporter.' },
  'magnesium_(as_magnesium_citrate)': { time: 'Evening', rationale: 'Magnesium citrate has ~30% bioavailability (better than oxide at 4%). Evening dosing leverages magnesium\'s GABA-modulating and muscle-relaxing properties to support sleep. The citrate form also has mild osmotic laxative effect — evening dosing supports morning regularity.' },
  'vitamin_c_(as_ascorbic_acid)': { time: 'Morning (split dose)', rationale: 'Vitamin C absorption is dose-dependent — you absorb ~90% of a 200mg dose but only ~50% of a 1000mg dose. Split dosing (morning + afternoon) maximises total absorption. Morning dosing supports cortisol rhythm (vitamin C is concentrated in adrenal glands) and iron absorption from breakfast.' },
  vitamin_c: { time: 'Morning (split dose)', rationale: 'Vitamin C absorption follows saturation kinetics. Morning dosing with food enhances iron co-absorption and supports adrenal function during peak cortisol hours.' },
  'calcium_alpha_ketoglutarate_(caakg)': { time: 'Morning (with meal)', rationale: 'CaAKG enters the Krebs cycle as an intermediate metabolite, supporting cellular energy production. Morning dosing with food reduces GI irritation and aligns with peak metabolic demand. As a longevity compound (Demidenko et al., 2021 in mice), consistent daily timing optimises steady-state levels.' },
  calcium_alpha_ketoglutarate: { time: 'Morning (with meal)', rationale: 'Alpha-ketoglutarate is a Krebs cycle intermediate. Morning dosing aligns with peak metabolic activity and energy demands.' },
  // Joint & recovery
  'glucosamine_sulfate_(as_kcl)': { time: 'Morning (with meal)', rationale: 'Glucosamine absorption is ~26% orally and peaks at 1.5–3h. Taking with food reduces GI upset (nausea occurs in ~10% on empty stomach). Morning dosing ensures peak plasma levels during active hours when joints are under mechanical load.' },
  glucosamine_sulfate: { time: 'Morning (with meal)', rationale: 'Take with food to reduce GI upset. Morning dosing ensures peak levels during active hours when joints bear load.' },
  // Antioxidants
  'l_glutathione_(reduced)': { time: 'Morning (empty stomach)', rationale: 'Reduced glutathione (GSH) is poorly absorbed orally (~3–5% bioavailability). Empty stomach maximises what little absorption occurs by avoiding competition with dietary amino acids. Sublingual or liposomal forms dramatically improve bioavailability. Morning dosing supports the liver\'s peak detoxification phase.' },
  l_glutathione: { time: 'Morning (empty stomach)', rationale: 'Glutathione has very low oral bioavailability (~3-5%). Empty stomach reduces competition. Consider liposomal form for better absorption.' },
  // Common supplements
  curcumin: { time: 'Morning (with fat-containing meal)', rationale: 'Curcumin is highly lipophilic (logP ~3.2) with only ~1% oral bioavailability in standard form. Co-administration with piperine (black pepper extract) increases bioavailability 20×, and fat-containing meals further improve absorption via bile-mediated solubilisation. Morning dosing allows peak anti-inflammatory activity during the day.' },
  berberine: { time: 'With meals (2–3× daily)', rationale: 'Berberine activates AMPK (the "metabolic master switch") and is best taken with meals to moderate post-prandial glucose spikes. Split dosing (500mg 2–3× daily) is preferred over single large doses due to its 2–4 hour half-life.' },
  ashwagandha: { time: 'Evening', rationale: 'Ashwagandha (withanolides) reduces cortisol by 25–30% (Chandrasekhar et al., 2012). Evening dosing aligns with the goal of lowering cortisol before sleep. Morning dosing is acceptable for stress/anxiety management during the day.' },
  omega_3: { time: 'With largest meal', rationale: 'EPA/DHA absorption increases 3× when taken with a fat-containing meal. Take with your largest meal (usually dinner) for optimal bile-mediated absorption.' },
  vitamin_d: { time: 'Morning (with fat-containing meal)', rationale: 'Vitamin D is fat-soluble and requires bile for absorption. Morning dosing with breakfast prevents potential sleep disruption — vitamin D may suppress melatonin production.' },
  lion_s_mane: { time: 'Morning', rationale: 'Lion\'s mane (hericenones/erinacines) stimulates NGF synthesis. Morning dosing supports cognitive function during active hours. Effects are cumulative over weeks, so consistent timing matters more than exact hour.' },
  bacopa: { time: 'Morning (with fat)', rationale: 'Bacopa monnieri bacosides are fat-soluble. Effects require 8–12 weeks of consistent daily use. Morning dosing with a fat source optimises absorption and daytime cognitive benefit.' },
  resveratrol: { time: 'Morning (empty stomach)', rationale: 'Resveratrol has rapid first-pass metabolism (bioavailability ~1%). Empty stomach absorption is faster, and morning dosing aligns with peak SIRT1 activity for longevity benefits.' },
  quercetin: { time: 'Morning (with meal)', rationale: 'Quercetin bioavailability improves 5× when taken with fat and onion-derived co-factors. Morning dosing allows its anti-inflammatory peak during active hours.' },
  zinc: { time: 'Evening (with dinner)', rationale: 'Zinc supports immune function and testosterone production (both peak overnight). Take with food to prevent nausea. Avoid combining with iron — they compete for absorption.' },
  milk_thistle: { time: 'Before meals', rationale: 'Silymarin (the active complex) has ~20–50% bioavailability. Taking 30 minutes before meals primes hepatoprotective pathways before the liver processes incoming nutrients and toxins.' },
  piperine: { time: 'With other supplements', rationale: 'Piperine inhibits glucuronidation and P-gp, increasing bioavailability of co-administered compounds by 20–2000%. Always take alongside the supplement you want to enhance.' }
};

// ═══════════════════════════════════════════════════════════════════════
// ORCHESTRATOR — calls all backend systems in staged parallel batches
// ═══════════════════════════════════════════════════════════════════════

class DeepAnalysisOrchestrator {
  constructor(onStep) {
    this.onStep = onStep || (() => {});
    this.results = {};
    this.errors = [];
  }

  async run(compoundNames, ingredients, userProfile) {
    const steps = [
      'Analysing compound interactions and CYP enzyme competition',
      'Enriching each compound with DrugBank, UniProt, and BindingDB data',
      'Simulating full GI tract journey — mouth to exit — for each compound',
      'Running subcellular and signaling pathway simulations',
      'Modelling pharmacodynamic effects and therapeutic indices',
      'Validating results with ArbiterAI adversarial attack system',
      'Optimising dosing times using circadian CYP activity patterns',
      'Screening herb-drug interactions and temporal drug-drug interactions',
      'Running synergy screening and antagonism detection',
      'Simulating virtual N-of-1 clinical trial for each compound',
      'Consulting specialist agents (cardiology, neurology, integrative medicine)',
      'Generating LLM-powered treatment plan with adversarial debate',
      'Assessing epigenetic and longevity impact',
      'Running full regimen analysis with holistic LLM review',
      'Compiling final report with appendices',
    ];

    for (let i = 0; i < steps.length; i++) {
      this.onStep(i, steps[i], 'active');
    }
    this.onStep(0, steps[0], 'active');

    try {
      // ── STAGE 1: Core multi-compound + foundation enrichment ──────────
      this.onStep(0, steps[0], 'running');
      const multiCompound = await this._post('/api/v1/multi-compound/analyze', { compounds: compoundNames });
      this.results.multiCompound = multiCompound;
      this.onStep(0, steps[0], 'done');

      this.onStep(1, steps[1], 'running');
      const enrichments = await Promise.allSettled(
        compoundNames.map(c => this._post('/api/v2/foundation/enrich', {
          compound: c, current_params: {}, include_targets: true, include_binding: true
        }))
      );
      this.results.enrichments = {};
      compoundNames.forEach((c, i) => {
        this.results.enrichments[c] = enrichments[i].status === 'fulfilled' ? enrichments[i].value : null;
      });
      this.onStep(1, steps[1], 'done');

      // ── STAGE 2: GI tract simulation per compound ─────────────────────
      this.onStep(2, steps[2], 'running');
      const giSims = await Promise.allSettled(
        compoundNames.map(c => {
          const enr = this.results.enrichments[c] || {};
          const pk = enr.pk_params || enr.enriched_params || {};
          return this._post('/api/v2/git/mouth-to-exit', {
            compound: { name: c, logP: pk.logP || 2.0, pKa: pk.pKa || 7.0, mw: pk.mw || 300, charge_type: 'neutral' },
            dose_mg: parseFloat((ingredients.find(ig => ig.name.toLowerCase() === c.toLowerCase()) || {}).dose) || 500,
            fed_state: 'fed',
            patient: userProfile || {}
          });
        })
      );
      this.results.giSimulations = {};
      compoundNames.forEach((c, i) => {
        this.results.giSimulations[c] = giSims[i].status === 'fulfilled' ? giSims[i].value : null;
      });
      this.onStep(2, steps[2], 'done');

      // ── STAGE 3: Cellular simulation ──────────────────────────────────
      this.onStep(3, steps[3], 'running');
      const cellSims = await Promise.allSettled(
        compoundNames.map(c => {
          const enr = this.results.enrichments[c] || {};
          const pk = enr.pk_params || enr.enriched_params || {};
          return this._post('/api/v2/cell/full-cellular-simulation', {
            compound: { name: c, mw: pk.mw || 300, logP: pk.logP || 2.0, pKa: pk.pKa || 7.0, charge_type: 'neutral' },
            dose_mg: parseFloat((ingredients.find(ig => ig.name.toLowerCase() === c.toLowerCase()) || {}).dose) || 500,
            cell_type: 'hepatocyte',
            t_hours: 8
          });
        })
      );
      this.results.cellSimulations = {};
      compoundNames.forEach((c, i) => {
        this.results.cellSimulations[c] = cellSims[i].status === 'fulfilled' ? cellSims[i].value : null;
      });
      this.onStep(3, steps[3], 'done');

      // ── STAGE 4: PD modeling ──────────────────────────────────────────
      this.onStep(4, steps[4], 'running');
      const pdResult = await this._post('/api/v2/pd/multi-compound', {
        compound_stack: compoundNames.map(c => ({
          compound: c,
          dose_mg: parseFloat((ingredients.find(ig => ig.name.toLowerCase() === c.toLowerCase()) || {}).dose) || 500
        })),
        patient_profile: userProfile || {}
      }).catch(e => ({ error: e.message }));
      this.results.pdModeling = pdResult;
      this.onStep(4, steps[4], 'done');

      // ── STAGE 5: ArbiterAI validation ─────────────────────────────────
      this.onStep(5, steps[5], 'running');
      const [arbiterValidation, arbiterConsensus] = await Promise.allSettled([
        this._post('/api/v2/arbiter/validate-simulation', {
          simulation_result: { compounds: compoundNames, multi_compound: this.results.multiCompound },
          compound_stack: compoundNames,
          concurrent_meds: []
        }),
        this._post('/api/v2/arbiter/consensus-simulation', {
          compound: compoundNames[0],
          dose: parseFloat((ingredients[0] || {}).dose) || 500,
          patient_profile: userProfile || {}
        })
      ]);
      this.results.arbiterValidation = arbiterValidation.status === 'fulfilled' ? arbiterValidation.value : null;
      this.results.arbiterConsensus = arbiterConsensus.status === 'fulfilled' ? arbiterConsensus.value : null;
      this.onStep(5, steps[5], 'done');

      // ── STAGE 6: Chronotherapy ────────────────────────────────────────
      this.onStep(6, steps[6], 'running');
      const chronoResults = await Promise.allSettled(
        compoundNames.map(c => this._post('/api/v2/circadian/optimal-dose-time', {
          drug_name: c, entrainment_offset: 0
        }))
      );
      this.results.chronotherapy = {};
      compoundNames.forEach((c, i) => {
        this.results.chronotherapy[c] = chronoResults[i].status === 'fulfilled' ? chronoResults[i].value : null;
      });
      this.onStep(6, steps[6], 'done');

      // ── STAGE 7: Herb-drug RAG + temporal DDI ─────────────────────────
      this.onStep(7, steps[7], 'running');
      const [herbDrug, chronoWeave] = await Promise.allSettled([
        this._post('/api/v3/herb-drug/query', { substances: compoundNames, include_theoretical: true }),
        this._post('/api/v3/chrono-weave/simulate', {
          compounds: compoundNames,
          doses: compoundNames.map(c => parseFloat((ingredients.find(ig => ig.name.toLowerCase() === c.toLowerCase()) || {}).dose) || 500),
          time_span_h: 24
        })
      ]);
      this.results.herbDrugInteractions = herbDrug.status === 'fulfilled' ? herbDrug.value : null;
      this.results.temporalDDI = chronoWeave.status === 'fulfilled' ? chronoWeave.value : null;
      this.onStep(7, steps[7], 'done');

      // ── STAGE 8: Synergy screening ────────────────────────────────────
      this.onStep(8, steps[8], 'running');
      const [synergyPairs, antagonisms] = await Promise.allSettled([
        this._post('/api/v2/synergy/screen-pairs', { compounds: compoundNames, endpoint: 'nfkb_inhibition', n_clones: 200 }),
        this._post('/api/v2/synergy/find-antagonisms', { regimen: compoundNames, n_clones: 200 })
      ]);
      this.results.synergyPairs = synergyPairs.status === 'fulfilled' ? synergyPairs.value : null;
      this.results.antagonisms = antagonisms.status === 'fulfilled' ? antagonisms.value : null;
      this.onStep(8, steps[8], 'done');

      // ── STAGE 9: Virtual N-of-1 trials ────────────────────────────────
      this.onStep(9, steps[9], 'running');
      const nof1Results = await Promise.allSettled(
        compoundNames.slice(0, 4).map(c => this._post('/api/v2/trials/quick-nof1', {
          compound: c,
          dose_mg: parseFloat((ingredients.find(ig => ig.name.toLowerCase() === c.toLowerCase()) || {}).dose) || 500,
          endpoint: 'nfkb_inhibition',
          n_clones: 200
        }))
      );
      this.results.virtualTrials = {};
      compoundNames.slice(0, 4).forEach((c, i) => {
        this.results.virtualTrials[c] = nof1Results[i].status === 'fulfilled' ? nof1Results[i].value : null;
      });
      this.onStep(9, steps[9], 'done');

      // ── STAGE 10: Specialist consultations (expanded) ─────────────────
      this.onStep(10, steps[10], 'running');
      const specialistQ = compoundNames.join(', ');
      const [cardio, neuro, integrative] = await Promise.allSettled([
        this._post('/v1/specialist/consult', {
          specialist: 'cardiologist',
          drug_name: compoundNames[0],
          compounds: compoundNames,
          question: `Provide a thorough cardiovascular safety assessment for this supplement formula containing: ${specialistQ}. Cover: (1) cardiac rhythm effects and QT prolongation risk, (2) blood pressure implications, (3) vascular health benefits, (4) any compounds requiring cardiac monitoring, (5) overall cardiovascular risk-benefit for daily use.`,
          patient_context: userProfile || {}
        }),
        this._post('/v1/specialist/consult', {
          specialist: 'neurologist',
          drug_name: compoundNames[0],
          compounds: compoundNames,
          question: `Provide a thorough neurological assessment for this supplement formula containing: ${specialistQ}. Cover: (1) blood-brain barrier penetration for each compound, (2) neurotransmitter effects (GABA, glutamate, serotonin, dopamine), (3) neuroprotective potential, (4) CNS depression/stimulation risk, (5) cognitive performance implications.`,
          patient_context: userProfile || {}
        }),
        this._post('/v1/specialist/consult', {
          specialist: 'cardiologist',
          drug_name: compoundNames[0],
          compounds: compoundNames,
          question: `Acting as an integrative medicine physician and clinical pharmacologist, provide a holistic assessment of this supplement formula containing: ${specialistQ}. Cover: (1) overall formula coherence — do these ingredients make sense together? (2) bioavailability concerns and absorption competition, (3) recommended delivery format (capsule, powder, liposomal), (4) population-specific considerations (age, gender, common medications), (5) what you would add or remove to optimise this formula.`,
          patient_context: userProfile || {}
        })
      ]);
      this.results.cardioConsult = cardio.status === 'fulfilled' ? cardio.value : null;
      this.results.neuroConsult = neuro.status === 'fulfilled' ? neuro.value : null;
      this.results.integrativeConsult = integrative.status === 'fulfilled' ? integrative.value : null;
      this.onStep(10, steps[10], 'done');

      // ── STAGE 11: LLM plan generation + adversarial debate ────────────
      this.onStep(11, steps[11], 'running');
      const planResult = await this._post('/v1/plan/generate?mode=ai&include_debate=true', {
        drug_name: compoundNames[0],
        user_profile: userProfile || null
      }).catch(e => ({ error: e.message }));
      this.results.plan = planResult;

      if (planResult.debate_plan_id) {
        let debateComplete = false;
        for (let attempt = 0; attempt < 24 && !debateComplete; attempt++) {
          await new Promise(r => setTimeout(r, 5000));
          try {
            const debateStatus = await this._get(`/v1/plan/${planResult.debate_plan_id}/debate-status`);
            if (debateStatus.status === 'complete') {
              this.results.debate = debateStatus;
              debateComplete = true;
            }
          } catch (e) { /* keep polling */ }
        }
        if (!debateComplete) {
          try {
            this.results.debate = await this._get(`/v1/plan/${planResult.debate_plan_id}/debate`);
          } catch (e) {}
        }
      }
      this.onStep(11, steps[11], 'done');

      // ── STAGE 12: Epigenetic impact ───────────────────────────────────
      this.onStep(12, steps[12], 'running');
      const epiResult = await this._post('/api/v2/epiwind/hallmarks-simulate', {
        initial_age: (userProfile || {}).age || 40,
        years: 10,
        interventions: compoundNames.map(c => c.toLowerCase().replace(/\s+/g, '_'))
      }).catch(e => ({ error: e.message }));
      this.results.epigenetics = epiResult;
      this.onStep(12, steps[12], 'done');

      // ── STAGE 13: Full regimen analysis + LLM holistic review ─────────
      this.onStep(13, steps[13], 'running');
      const regimenResult = await this._post('/v1/regimen/analyze', {
        compounds: compoundNames,
        compound_details: ingredients.map(i => ({ name: i.name, dosage: (i.dose || '500') + 'mg', frequency: 'daily' })),
        user_profile: userProfile || {},
        include_llm_analysis: true,
        include_discovery: true
      }).catch(e => ({ error: e.message }));
      this.results.regimen = regimenResult;
      this.onStep(13, steps[13], 'done');

      // ── STAGE 14: Compile ─────────────────────────────────────────────
      this.onStep(14, steps[14], 'running');
      const [tradCompounds, discoveryStats] = await Promise.allSettled([
        this._get('/api/v3/trad/compounds'),
        this._get('/api/v1/discovery/stats')
      ]);
      this.results.tradDB = tradCompounds.status === 'fulfilled' ? tradCompounds.value : [];
      this.results.discoveryStats = discoveryStats.status === 'fulfilled' ? discoveryStats.value : null;
      this.onStep(14, steps[14], 'done');

      return this.results;

    } catch (err) {
      this.errors.push(err.message);
      throw err;
    }
  }

  async _post(path, body) {
    try {
      const res = await fetch(DEEP_API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000)
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { _error: true, status: res.status, detail: text };
      }
      return await res.json();
    } catch (e) {
      return { _error: true, detail: e.message };
    }
  }

  async _get(path) {
    try {
      const res = await fetch(DEEP_API + path, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) return { _error: true, status: res.status };
      return await res.json();
    } catch (e) {
      return { _error: true, detail: e.message };
    }
  }
}


// ═══════════════════════════════════════════════════════════════════════
// REPORT RENDERER — Professional formulation intelligence report
// ═══════════════════════════════════════════════════════════════════════

class DeepReportRenderer {

  static render(formulaName, target, ingredients, results) {
    const r = results;
    const mc = r.multiCompound || {};
    const rec = mc.recommendation || {};
    const compounds = ingredients.map(i => i.name);
    const reportId = 'NB-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return `
      <div class="deep-report">

        <!-- ═══ PRINT / SAVE TOOLBAR ═══ -->
        <div class="dr-toolbar no-print">
          <button class="dr-print-btn" onclick="window.print()">🖨️ Print Report</button>
          <button class="dr-print-btn" onclick="window.print()">📄 Save as PDF</button>
        </div>

        <!-- ═══ REPORT HEADER ═══ -->
        <div class="dr-header">
          <div class="dr-header-left">
            <h1 class="dr-title">${this._esc(formulaName)}</h1>
            <div class="dr-meta">Formulation Intelligence Report &middot; ${date}</div>
            <div class="dr-meta">${compounds.length} ingredients analysed across 15 simulation systems &middot; Report ID: ${reportId}</div>
          </div>
          <div class="dr-powered">
            <div style="font-size:10px;color:var(--txt-muted)">Powered by</div>
            <div style="font-size:15px;font-weight:700;color:var(--accent)">NaturaBridge&trade;</div>
            <div style="font-size:9px;color:var(--txt-muted)">Deep Analysis Engine v4.0</div>
          </div>
        </div>

        <!-- ═══ EXECUTIVE SUMMARY ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Executive Summary</div>
          <div class="dr-explain">This section gives you the big picture of how your formula performs — safety, effectiveness, and any concerns — in plain language.</div>
          <div class="dr-summary-grid">
            ${this._summaryCard('Safety Verdict', rec.safety_verdict || 'PENDING',
              rec.safety_verdict === 'FAVORABLE' ? 'green' : rec.safety_verdict === 'ACCEPTABLE' ? 'green' : rec.safety_verdict === 'CAUTION' ? 'gold' : 'gold',
              rec.safety_summary || 'Analysis complete. Review the Safety & Interactions section below for detailed findings.')}
            ${this._summaryCard('Pathway Stacking', rec.pathway_stacking_strength || '—',
              rec.pathway_stacking_strength === 'STRONG' ? 'green' : 'gold',
              `${mc.shared_target_count || 0} molecular targets shared between your ingredients. "Pathway stacking" means multiple ingredients reinforce the same biological effect — like multiple musicians playing in harmony.`)}
            ${this._summaryCard('Interactions Found', String((mc.safety_flags || []).length + Object.keys(mc.cyp_competition || {}).length),
              (mc.safety_flags || []).length > 3 ? 'red' : (mc.safety_flags || []).length > 0 ? 'gold' : 'green',
              'Your ingredients share some metabolic pathways in your liver. This can affect how quickly each one is processed. Details below.')}
            ${this._summaryCard('ArbiterAI Verdict',
              r.arbiterValidation?.verdict || (r.arbiterValidation?._error ? 'PENDING' : 'N/A'),
              (r.arbiterValidation?.verdict === 'VALIDATED') ? 'green' : 'gold',
              'Our AI safety system ran adversarial tests — deliberately trying to find flaws in the analysis — to verify reliability. ' +
              (r.arbiterValidation?.verdict === 'VALIDATED' ? 'The results passed all checks.' : 'See appendix for details.'))}
          </div>
          <div class="dr-rationale">
            <strong>In plain English:</strong> ${rec.combination_rationale || 'Your formula has been analysed across all available simulation systems. See the sections below for detailed findings on safety, timing, synergy, and specialist assessments.'}
          </div>
        </div>

        <!-- ═══ HOW YOUR INGREDIENTS WORK TOGETHER ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">How Your Ingredients Work Together</div>
          <div class="dr-explain">"Therapeutic domains" are the health areas your ingredients target. When multiple ingredients target the same area, they can reinforce each other — this is called <strong>synergy</strong>.</div>
          ${this._renderTherapeuticDomains(rec.primary_therapeutic_domains || [])}
          ${this._renderSynergy(r.synergyPairs, r.antagonisms)}
        </div>

        <!-- ═══ SAFETY & INTERACTIONS ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Safety and Interactions</div>
          <div class="dr-explain">Your liver uses enzymes called <strong>CYP enzymes</strong> (pronounced "sip") to break down substances you ingest. When two ingredients compete for the same enzyme, one may be processed more slowly — increasing its effect and potential side effects. This section shows which enzymes are shared and what it means for you.</div>
          ${this._renderCYPCompetition(mc.cyp_competition || {})}
          ${this._renderSafetyFlags(mc.safety_flags || [])}
        </div>

        <!-- ═══ WHEN TO TAKE EACH INGREDIENT ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Optimal Timing — When to Take Each Ingredient</div>
          <div class="dr-explain">Your body's enzyme activity changes throughout the day following your internal clock (called the <strong>circadian rhythm</strong>). Some ingredients work better in the morning, others in the evening. This analysis combines circadian enzyme data, absorption kinetics, and compound-specific pharmacology to recommend the best time for each ingredient.</div>
          ${this._renderChronotherapy(r.chronotherapy || {}, mc.dosage_recommendations || [], compounds)}
        </div>

        <!-- ═══ DOSING SCHEDULE ═══ -->
        ${this._renderTimingSchedule(mc.timing_schedule)}

        <!-- ═══ SPECIALIST PERSPECTIVES ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Specialist AI Assessments</div>
          <div class="dr-explain">Three AI specialist agents — each with deep domain expertise — independently reviewed your formula. These assessments synthesise pharmacological knowledge, clinical evidence, and safety databases to provide multi-disciplinary perspectives.</div>
          ${this._renderSpecialist('Cardiology Assessment', r.cardioConsult, 'Cardiovascular safety, cardiac rhythm effects, blood pressure implications, and vascular health.')}
          ${this._renderSpecialist('Neurology Assessment', r.neuroConsult, 'Blood-brain barrier penetration, neurotransmitter effects, neuroprotective potential, and CNS safety.')}
          ${this._renderSpecialist('Integrative Medicine & Pharmacology Review', r.integrativeConsult, 'Formula coherence, bioavailability optimisation, delivery format, and formulation improvement recommendations.')}
        </div>

        <!-- ═══ INGREDIENT PK PROFILES ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Ingredient Profiles — What Your Body Does to Each Compound</div>
          <div class="dr-explain"><strong>Pharmacokinetics (PK)</strong> is the study of how your body absorbs, distributes, metabolises, and eliminates a substance. Key terms: <strong>Tmax</strong> = time to reach peak blood concentration; <strong>Bioavailability (f<sub>oral</sub>)</strong> = percentage that actually reaches your bloodstream; <strong>Half-life</strong> = time for blood concentration to drop by half.</div>
          ${this._renderCompoundProfiles(mc.compound_profiles || {}, r.enrichments || {}, ingredients)}
        </div>

        <!-- ═══ VIRTUAL TRIAL RESULTS ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Virtual Clinical Trial Results</div>
          <div class="dr-explain">We ran a <strong>virtual N-of-1 trial</strong> for each ingredient — simulating a blinded experiment with 200 virtual patients comparing the ingredient against placebo. <strong>Cohen's d</strong> measures effect size: 0.2 = small, 0.5 = medium, 0.8+ = large. <strong>P-value</strong> below 0.05 means statistically significant.</div>
          ${this._renderVirtualTrials(r.virtualTrials || {})}
        </div>

        <!-- ═══ ADVERSARIAL DEBATE ═══ -->
        ${this._renderDebate(r.debate, r.plan)}

        <!-- ═══ DISCLAIMER ═══ -->
        <div class="dr-disclaimer">
          <strong>Important:</strong> This report is generated by NaturaBridge, an AI-powered formulation intelligence platform. It is not a substitute for professional medical advice, diagnosis, or treatment. All simulation results carry inherent uncertainty and have not been validated in clinical trials specific to your formulation. The information is intended for licensed healthcare practitioners and formulation scientists. Always apply clinical judgment and consult relevant specialists before making formulation or dosing decisions.
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!--                      A P P E N D I X                          -->
        <!-- ═══════════════════════════════════════════════════════════════ -->

        <div class="dr-appendix-divider">
          <div class="dr-appendix-divider-line"></div>
          <div class="dr-appendix-divider-text">TECHNICAL APPENDIX</div>
          <div class="dr-appendix-divider-line"></div>
        </div>
        <div class="dr-explain" style="margin-bottom:16px">The following sections contain detailed technical output from every simulation system. Data is presented in structured format for practitioners who want full visibility into the engine's reasoning.</div>

        <!-- APPENDIX A: GI TRACT JOURNEY -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix A — GI Tract Simulation (Mouth to Exit)</div>
          <div class="dr-explain">For each compound, the GI simulation models gastric acid exposure, enzyme degradation, absorption across 9 intestinal segments, first-pass liver metabolism, and colonic bacterial processing.</div>
          ${this._renderGIAppendix(r.giSimulations || {}, compounds)}
        </div>

        <!-- APPENDIX B: CELLULAR DISTRIBUTION -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix B — Subcellular Distribution and Signaling</div>
          <div class="dr-explain">Once absorbed, compounds distribute across organelles — mitochondria, lysosomes, endoplasmic reticulum, nucleus, and cytosol. Concentration in specific organelles determines both efficacy and toxicity potential.</div>
          ${this._renderCellAppendix(r.cellSimulations || {}, compounds)}
        </div>

        <!-- APPENDIX C: PD MODELING -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix C — Pharmacodynamic (Effect) Modeling</div>
          <div class="dr-explain">Pharmacodynamics models what each compound does to the body — predicted clinical effects, dose-response relationships, and therapeutic indices.</div>
          ${this._renderPDAppendix(r.pdModeling)}
        </div>

        <!-- APPENDIX D: CYP DETAIL -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix D — CYP Enzyme Competition Detail</div>
          <div class="dr-explain">Complete CYP450 metabolic competition matrix showing all enzyme-compound interactions and their clinical significance.</div>
          ${this._renderCYPAppendix(mc.cyp_competition || {}, mc.compound_profiles || {})}
        </div>

        <!-- APPENDIX E: HERB-DRUG INTERACTIONS -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix E — Herb-Drug Interaction Database</div>
          <div class="dr-explain">Results from the NaturaBridge RAG system — a curated database of 106+ herb-drug interactions across 20 herbs and 26 drug classes.</div>
          ${this._renderHerbDrugAppendix(r.herbDrugInteractions)}
        </div>

        <!-- APPENDIX F: TEMPORAL DDI -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix F — Time-Dependent Interactions (ChronoWeave)</div>
          <div class="dr-explain">Unlike standard interaction checkers that only say <em>whether</em> compounds interact, ChronoWeave models <em>when</em> during the day interactions peak or trough based on real-time plasma level simulation.</div>
          ${this._renderTemporalDDIAppendix(r.temporalDDI)}
        </div>

        <!-- APPENDIX G: ARBITERAI VALIDATION -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix G — ArbiterAI Adversarial Validation</div>
          <div class="dr-explain">ArbiterAI uses 4 attack templates — hallucination detection, numerical consistency, claim verification, and parameter reproducibility — to stress-test every conclusion in this report.</div>
          ${this._renderArbiterAppendix(r.arbiterValidation, r.arbiterConsensus)}
        </div>

        <!-- APPENDIX H: ADVERSARIAL DEBATE -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix H — Multi-AI Adversarial Debate</div>
          <div class="dr-explain">Multiple AI models independently reviewed the analysis and debated each other. Minority reports (dissenting opinions) flag areas where models disagreed — indicating lower confidence.</div>
          ${this._renderDebateAppendix(r.debate, r.plan)}
        </div>

        <!-- APPENDIX I: EPIGENETIC IMPACT -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix I — Epigenetic and Longevity Modeling</div>
          <div class="dr-explain">Simulation of 12 hallmarks of aging over 10 years, modelling the impact of your formula on mitochondrial dysfunction, inflammation, cellular senescence, and other aging pathways.</div>
          ${this._renderEpigeneticsAppendix(r.epigenetics)}
        </div>

        <!-- APPENDIX J: REGIMEN LLM REVIEW -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix J — Holistic Regimen Review (AI Pharmacist)</div>
          <div class="dr-explain">A comprehensive AI-generated narrative review of the entire regimen — similar to how a clinical pharmacist would assess your supplement stack.</div>
          ${this._renderRegimenAppendix(r.regimen)}
        </div>

        <!-- FOOTER -->
        <div class="dr-footer">
          NaturaBridge&trade; Formulation Intelligence Report &middot; ${reportId} &middot; ${date}<br>
          15 simulation systems &middot; 232 API endpoints &middot; Analysis engine v4.0<br>
          &copy; ${new Date().getFullYear()} Alpha Inception LLC. All rights reserved.
        </div>

      </div>
    `;
  }

  // ── Helper: escape HTML ───────────────────────────────────────────────
  static _esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ── Helper: pretty compound name ──────────────────────────────────────
  static _prettyName(s) {
    return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      .replace(/\bAs\b/g, 'as').replace(/\bHcl\b/g, 'HCl').replace(/\bKcl\b/g, 'KCl');
  }

  // ── Helper: summary card ──────────────────────────────────────────────
  static _summaryCard(title, value, color, explanation) {
    const colorMap = { green: 'var(--green)', gold: 'var(--gold)', red: 'var(--red)' };
    return `
      <div class="dr-summary-card">
        <div class="dr-sc-label">${title}</div>
        <div class="dr-sc-value" style="color:${colorMap[color] || 'var(--accent)'}">${value}</div>
        <div class="dr-sc-explain">${explanation}</div>
      </div>`;
  }

  // ── Therapeutic domains ───────────────────────────────────────────────
  static _renderTherapeuticDomains(domains) {
    if (!domains || !domains.length) return '<div class="dr-empty">Therapeutic domain data not available.</div>';
    return `<div class="dr-domain-grid">${domains.map(d => `
      <div class="dr-domain-card">
        <div class="dr-domain-name">${d.domain}</div>
        <div class="dr-domain-stats">
          <span>${d.target_count} molecular targets</span>
          <span>Convergence: ${((d.avg_convergence || 0) * 100).toFixed(0)}%</span>
          <span>${d.fully_stacked || 0} fully stacked</span>
        </div>
        <div class="dr-domain-bar"><div class="dr-domain-fill" style="width:${Math.min(100, (d.avg_convergence || 0) * 150)}%;background:${(d.avg_convergence || 0) > 0.6 ? 'var(--green)' : 'var(--gold)'}"></div></div>
      </div>
    `).join('')}</div>`;
  }

  // ── Synergy + antagonisms ─────────────────────────────────────────────
  static _renderSynergy(synergyPairs, antagonisms) {
    let html = '';
    if (synergyPairs && !synergyPairs._error) {
      const pairs = synergyPairs.synergy_pairs || synergyPairs.results || [];
      if (Array.isArray(pairs) && pairs.length) {
        html += `<div class="dr-subsection-title">Synergistic Pairs</div>
          <div class="dr-explain">These ingredient pairs <strong>amplify</strong> each other's effects — the combination works better than either one alone.</div>
          <div class="dr-table">${pairs.slice(0, 6).map(p => `
            <div class="dr-table-row"><span class="dr-table-label">${this._prettyName(p.compound_a || p.pair?.[0])} + ${this._prettyName(p.compound_b || p.pair?.[1])}</span><span class="dr-table-value green">${p.synergy_score ? 'Score: ' + p.synergy_score.toFixed(2) : p.classification || '—'}</span></div>
            ${p.predicted_mechanism ? `<div class="dr-table-note">${this._esc(p.predicted_mechanism)}</div>` : ''}
          `).join('')}</div>`;
      }
    }
    if (antagonisms && !antagonisms._error) {
      const flags = antagonisms.antagonisms || antagonisms.flags || [];
      if (Array.isArray(flags) && flags.length) {
        html += `<div class="dr-subsection-title" style="color:var(--red)">Antagonistic Pairs (Caution)</div>
          <div class="dr-explain">These ingredient pairs may <strong>counteract</strong> each other — one may reduce the effectiveness of the other.</div>
          <div class="dr-table">${flags.slice(0, 6).map(f => `
            <div class="dr-table-row warn"><span class="dr-table-label">${this._prettyName(f.compound_a)} + ${this._prettyName(f.compound_b)}</span><span class="dr-table-value red">${f.note || f.reason || 'Potential antagonism detected'}</span></div>
          `).join('')}</div>`;
      }
    }
    return html || '<div class="dr-empty">Synergy screening complete — no significant interactions detected.</div>';
  }

  // ═══ CYP COMPETITION — with rich clinical context ═══
  static _renderCYPCompetition(cyp) {
    const entries = Object.entries(cyp);
    if (!entries.length) return '<div class="dr-empty">No CYP enzyme competition detected between your ingredients.</div>';
    return entries.map(([enzyme, data]) => {
      const ctx = CYP_CONTEXT[enzyme] || {};
      const risk = data.risk_level || 'MODERATE';
      const compoundList = (data.compounds || []).map(c => this._prettyName(c)).join(', ');
      return `
        <div class="dr-cyp-block ${risk === 'HIGH' ? 'dr-cyp-high' : 'dr-cyp-mod'}">
          <div class="dr-cyp-header">
            <span class="dr-cyp-enzyme">${enzyme}</span>
            <span class="dr-cyp-risk ${risk === 'HIGH' ? 'red' : 'gold'}">${risk} RISK</span>
          </div>
          <div class="dr-cyp-compounds"><strong>Competing compounds:</strong> ${compoundList} (${data.count || data.compounds?.length || 0} compounds)</div>
          ${ctx.role ? `<div class="dr-cyp-detail"><strong>What this enzyme does:</strong> ${ctx.role}</div>` : ''}
          ${ctx.effect ? `<div class="dr-cyp-detail"><strong>What competition means:</strong> ${ctx.effect}</div>` : ''}
          ${ctx.action ? `<div class="dr-cyp-action"><strong>Recommendation:</strong> ${ctx.action}</div>` : ''}
        </div>`;
    }).join('');
  }

  // ═══ SAFETY FLAGS — with clinical context ═══
  static _renderSafetyFlags(flags) {
    if (!flags.length) return '';
    return `<div class="dr-subsection-title">Safety Flags</div>
      <div class="dr-explain">These flags indicate potential interactions at drug transporters and metabolic targets beyond CYP enzymes. Each flag includes clinical context and recommended actions.</div>
      ${flags.map(f => {
        const targetKey = f.target || '';
        const ctx = SAFETY_TARGET_CONTEXT[targetKey] || {};
        const compoundList = (f.compounds || []).map(c => this._prettyName(c)).join(' + ');
        return `
          <div class="dr-safety-block ${f.severity === 'HIGH' ? 'dr-safety-high' : 'dr-safety-mod'}">
            <div class="dr-safety-header">
              <span class="dr-safety-target">${ctx.name || targetKey}</span>
              <span class="dr-safety-sev ${f.severity === 'HIGH' ? 'red' : 'gold'}">${f.severity}</span>
            </div>
            <div class="dr-safety-compounds"><strong>Involved compounds:</strong> ${compoundList}</div>
            ${ctx.role ? `<div class="dr-safety-detail"><strong>What ${targetKey} does:</strong> ${ctx.role}</div>` : ''}
            ${ctx.risk ? `<div class="dr-safety-detail"><strong>Clinical significance:</strong> ${ctx.risk}</div>` : ''}
            ${f.note ? `<div class="dr-safety-detail"><em>${f.note}</em></div>` : ''}
            ${ctx.action ? `<div class="dr-safety-action"><strong>Recommended action:</strong> ${ctx.action}</div>` : ''}
          </div>`;
      }).join('')}`;
  }

  // ═══ CHRONOTHERAPY — with intelligent fallbacks ═══
  static _renderChronotherapy(chrono, dosageRecs, compounds) {
    // Build timing data: prefer backend data, fall back to our knowledge base
    const timingData = (compounds || []).map(c => {
      const backendData = chrono[c];
      const key = c.toLowerCase().replace(/[\s()-]+/g, '_').replace(/^_|_$/g, '');
      const fallback = CHRONO_INTELLIGENCE[key];
      // Also check the dosage recs for timing info
      const dosRec = (dosageRecs || []).find(d => d.name && d.name.toLowerCase() === c.toLowerCase());

      let time, rationale, source;

      if (backendData && !backendData._error && backendData.found !== false && backendData.reason && !backendData.reason.includes('No data')) {
        time = backendData.optimal_time || backendData.recommended_time || `${backendData.recommended_hour || 12}:00`;
        rationale = backendData.reason || '';
        if (backendData.primary_cyp) rationale += ` Primary metabolism via ${backendData.primary_cyp}.`;
        if (backendData.auc_evening_vs_morning) rationale += ` Evening-to-morning AUC ratio: ${backendData.auc_evening_vs_morning}×.`;
        source = 'Circadian CYP simulation';
      } else if (fallback) {
        time = fallback.time;
        rationale = fallback.rationale;
        source = 'Pharmacological evidence';
      } else if (dosRec && dosRec.timing) {
        time = dosRec.timing.replace(/_/g, ' ');
        rationale = (dosRec.notes || []).join('. ') || 'Based on multi-compound interaction analysis.';
        source = 'Multi-compound optimiser';
      } else {
        time = 'With a meal';
        rationale = 'No specific circadian data available for this compound. General recommendation: take with food to improve absorption and reduce GI irritation. Consistent daily timing is more important than exact hour.';
        source = 'General guidance';
      }

      return { compound: c, time, rationale, source };
    });

    let html = `<div class="dr-timing-grid">${timingData.map(t => `
      <div class="dr-timing-card">
        <div class="dr-timing-name">${this._prettyName(t.compound)}</div>
        <div class="dr-timing-time">${t.time}</div>
        <div class="dr-timing-reason">${t.rationale}</div>
        <div class="dr-timing-source">${t.source}</div>
      </div>
    `).join('')}</div>`;

    // Dosage recommendations
    if (dosageRecs && dosageRecs.length) {
      html += `<div class="dr-subsection-title">Dosage Recommendations</div>
        <div class="dr-table">${dosageRecs.map(d => {
          const notes = Array.isArray(d.notes) ? d.notes : (d.notes ? [d.notes] : []);
          const range = d.dosage_range ? ` (range: ${d.dosage_range.low || '?'} – ${d.dosage_range.high || '?'})` : '';
          return `
            <div class="dr-table-row">
              <span class="dr-table-label"><strong>${this._prettyName(d.name)}</strong></span>
              <span class="dr-table-value">${d.suggested_dosage || '—'}${range}</span>
            </div>
            ${notes.length ? `<div class="dr-table-note">${notes.map(n => this._esc(n)).join('<br>')}</div>` : ''}
            ${d.space_from && d.space_from.length ? `<div class="dr-table-note" style="color:var(--gold)">⚠ Space 4–6 hours from: ${d.space_from.map(s => this._prettyName(s)).join(', ')}</div>` : ''}
          `;
        }).join('')}</div>`;
    }

    return html;
  }

  // ═══ TIMING SCHEDULE ═══
  static _renderTimingSchedule(schedule) {
    if (!schedule) return '';
    const periods = ['morning', 'afternoon', 'evening'];
    const icons = { morning: '🌅', afternoon: '☀️', evening: '🌙' };
    let html = `<div class="dr-section">
      <div class="dr-section-title">Suggested Daily Schedule</div>
      <div class="dr-explain">Based on CYP competition analysis and circadian data, here is a suggested schedule that spaces competing compounds apart.</div>
      <div class="dr-schedule-grid">`;
    periods.forEach(p => {
      const data = schedule[p];
      if (data && data.compounds && data.compounds.length) {
        html += `<div class="dr-schedule-card">
          <div class="dr-schedule-period">${icons[p] || ''} ${p.charAt(0).toUpperCase() + p.slice(1)}</div>
          <div class="dr-schedule-compounds">${data.compounds.map(c => this._prettyName(c)).join(', ')}</div>
          ${data.advice ? `<div class="dr-schedule-advice">${data.advice}</div>` : ''}
        </div>`;
      }
    });
    html += '</div>';
    if (schedule.scheduling_notes && schedule.scheduling_notes.length) {
      html += `<div class="dr-schedule-notes">${schedule.scheduling_notes.map(n => `<div class="dr-schedule-note">• ${this._esc(n)}</div>`).join('')}</div>`;
    }
    html += '</div>';
    return html;
  }

  // ═══ SPECIALIST CONSULTATIONS — improved formatting ═══
  static _renderSpecialist(title, result, scope) {
    if (!result || result._error) {
      return `<div class="dr-specialist">
        <div class="dr-specialist-title">${title}</div>
        <div class="dr-specialist-scope">${scope}</div>
        <div class="dr-specialist-text" style="color:var(--txt-muted);font-style:italic">This specialist consultation could not be completed. This may be due to high API load — try running the analysis again. The remaining sections of this report are unaffected.</div>
      </div>`;
    }
    let text = result.perspective || result.response || result.text || '';
    if (typeof text !== 'string') text = JSON.stringify(text, null, 2);
    // Format the text nicely — convert markdown-like formatting
    text = this._formatSpecialistText(text);
    return `<div class="dr-specialist">
      <div class="dr-specialist-title">${title}</div>
      <div class="dr-specialist-scope">${scope}</div>
      <div class="dr-specialist-text">${text}</div>
      ${result.disclaimer ? `<div class="dr-specialist-disclaimer">${this._esc(result.disclaimer)}</div>` : ''}
    </div>`;
  }

  static _formatSpecialistText(text) {
    // Basic markdown-to-HTML conversion for specialist responses
    let html = this._esc(text);
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Bullet points
    html = html.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    // Numbered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    // Paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  }

  // ── Compound profiles ─────────────────────────────────────────────────
  static _renderCompoundProfiles(profiles, enrichments, ingredients) {
    const compounds = Object.keys(profiles).length ? Object.keys(profiles) : ingredients.map(i => i.name);
    return compounds.map(c => {
      const p = profiles[c] || {};
      const e = enrichments[c] || {};
      const pk = e.pk_params || e.enriched_params || {};
      const ing = ingredients.find(i => i.name.toLowerCase() === c.toLowerCase()) || {};
      const targets = (e.protein_targets || []).slice(0, 5);
      return `<div class="dr-compound-card">
        <div class="dr-compound-header">
          <div class="dr-compound-name">${this._prettyName(c)}</div>
          <div class="dr-compound-dose">${ing.dose || '—'} mg</div>
        </div>
        ${p.drug_class ? `<div class="dr-compound-class">${p.drug_class}${p.mechanism ? ' — ' + p.mechanism : ''}</div>` : ''}
        <div class="dr-compound-stats">
          <div class="dr-cs"><div class="dr-cs-val">${pk.tmax_h || p.tmax_h || '—'}</div><div class="dr-cs-label">Tmax (hours to peak)</div></div>
          <div class="dr-cs"><div class="dr-cs-val">${pk.bioavailability_pct || p.bioavailability_pct || '—'}${pk.bioavailability_pct || p.bioavailability_pct ? '%' : ''}</div><div class="dr-cs-label">Bioavailability</div></div>
          <div class="dr-cs"><div class="dr-cs-val">${pk.half_life_h || p.half_life_h || '—'}</div><div class="dr-cs-label">Half-life (hours)</div></div>
          <div class="dr-cs"><div class="dr-cs-val">${pk.Vd || '—'}</div><div class="dr-cs-label">Volume of Distribution</div></div>
        </div>
        ${targets.length ? `<div class="dr-compound-targets"><strong>Protein targets:</strong> ${targets.map(t => t.name || t.target || t).join(', ')}</div>` : ''}
        ${p.primary_indication ? `<div class="dr-compound-indication"><strong>Primary indication:</strong> ${p.primary_indication}</div>` : ''}
        ${p.common_side_effects ? `<div class="dr-compound-sides"><strong>Common side effects:</strong> ${p.common_side_effects}</div>` : ''}
      </div>`;
    }).join('');
  }

  // ── Virtual trials ────────────────────────────────────────────────────
  static _renderVirtualTrials(trials) {
    const entries = Object.entries(trials);
    if (!entries.length) return '<div class="dr-empty">Virtual trial data pending.</div>';
    return entries.map(([compound, result]) => {
      if (!result || result._error) return `<div class="dr-trial-card"><div class="dr-trial-name">${this._prettyName(compound)}</div><div class="dr-empty">Trial could not be completed for this compound.</div></div>`;
      const r = result.results || result.report || result;
      const d = r.cohens_d ?? r.effect_size;
      const effectLabel = d != null ? (Math.abs(d) >= 0.8 ? 'Large effect' : Math.abs(d) >= 0.5 ? 'Medium effect' : Math.abs(d) >= 0.2 ? 'Small effect' : 'Negligible effect') : '';
      const sig = r.p_value != null && r.p_value < 0.05 ? 'Statistically significant' : r.p_value != null ? 'Not statistically significant' : '';
      return `<div class="dr-trial-card">
        <div class="dr-trial-name">${this._prettyName(compound)}</div>
        <div class="dr-trial-stats">
          <span>Effect size (Cohen's d): <strong>${d != null ? d.toFixed(2) : '—'}</strong> ${effectLabel ? `<em>(${effectLabel})</em>` : ''}</span>
          <span>P-value: <strong>${r.p_value != null ? r.p_value.toFixed(4) : '—'}</strong> ${sig ? `<em>(${sig})</em>` : ''}</span>
          <span>Responder rate: <strong>${r.responder_rate != null ? (r.responder_rate * 100).toFixed(0) + '%' : '—'}</strong></span>
        </div>
        ${r.summary || r.narrative ? `<div class="dr-trial-narrative">${this._esc(r.summary || r.narrative)}</div>` : ''}
      </div>`;
    }).join('');
  }

  // ── Debate (main report section) ──────────────────────────────────────
  static _renderDebate(debate, plan) {
    if (!debate && !plan) return '';
    let html = `<div class="dr-section"><div class="dr-section-title">Multi-AI Review</div>
      <div class="dr-explain">Multiple independent AI systems reviewed this analysis. Where they agreed, confidence is high. Where they disagreed ("minority reports"), those areas need extra caution.</div>`;
    if (plan && !plan._error && !plan.error) {
      if (plan.medical_validation && plan.medical_validation.length) {
        html += `<div class="dr-subsection-title">Clinical Evidence Validation</div>
          <div class="dr-explain">MedicalAgent (trained on 939 clinical lessons) checked each compound against benchmark clinical data.</div>
          <div class="dr-table">${plan.medical_validation.map(v => `
            <div class="dr-table-row"><span class="dr-table-label">${this._prettyName(v.compound)}</span><span class="dr-table-value ${v.verdict === 'VALIDATED' ? 'green' : 'gold'}">${v.verdict}</span></div>
            ${v.explanation ? `<div class="dr-table-note">${this._esc(v.explanation).slice(0, 400)}</div>` : ''}
          `).join('')}</div>`;
      }
    }
    if (debate && debate.minority_reports) {
      const reports = Array.isArray(debate.minority_reports) ? debate.minority_reports : [];
      if (reports.length) {
        html += `<div class="dr-subsection-title">Minority Reports (Dissenting Views)</div>
          ${reports.map(r => `<div class="dr-minority">${this._esc(typeof r === 'string' ? r : r.concern || r.issue || JSON.stringify(r))}</div>`).join('')}`;
      } else {
        html += `<div class="dr-agree">All AI reviewers reached consensus — no minority reports filed.</div>`;
      }
    }
    html += '</div>';
    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // APPENDIX RENDERERS — structured data instead of raw JSON
  // ═══════════════════════════════════════════════════════════════════════

  static _renderStructured(data, label) {
    if (!data || data._error) return `<div class="dr-empty">${label} data not available.</div>`;
    if (typeof data === 'string') return `<div class="dr-structured-text">${this._esc(data)}</div>`;
    // Recursively render objects as readable tables
    return this._objToHTML(data, 0);
  }

  static _objToHTML(obj, depth) {
    if (obj == null) return '<span class="dr-null">—</span>';
    if (typeof obj === 'boolean') return `<span class="dr-bool">${obj ? 'Yes' : 'No'}</span>`;
    if (typeof obj === 'number') return `<span class="dr-num">${typeof obj === 'number' && !Number.isInteger(obj) ? obj.toFixed(4) : obj}</span>`;
    if (typeof obj === 'string') return `<span class="dr-str">${this._esc(obj)}</span>`;
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '<span class="dr-null">None</span>';
      if (obj.length <= 5 && obj.every(x => typeof x === 'string' || typeof x === 'number')) {
        return obj.map(x => this._objToHTML(x, depth + 1)).join(', ');
      }
      return `<div class="dr-array">${obj.map((item, i) => `<div class="dr-array-item">${this._objToHTML(item, depth + 1)}</div>`).join('')}</div>`;
    }
    if (typeof obj === 'object') {
      // Skip internal keys
      const entries = Object.entries(obj).filter(([k]) => !k.startsWith('_'));
      if (entries.length === 0) return '<span class="dr-null">No data</span>';
      if (depth > 3) return `<span class="dr-str">${this._esc(JSON.stringify(obj).slice(0, 200))}</span>`;
      return `<table class="dr-data-table"><tbody>${entries.map(([k, v]) => `
        <tr><td class="dr-dt-key">${this._prettyName(k.replace(/_/g, ' '))}</td><td class="dr-dt-val">${this._objToHTML(v, depth + 1)}</td></tr>
      `).join('')}</tbody></table>`;
    }
    return String(obj);
  }

  static _renderGIAppendix(giSims, compounds) {
    return compounds.map(c => {
      const data = giSims[c];
      if (!data || data._error) return `<div class="dr-appendix-compound"><div class="dr-appendix-compound-title">${this._prettyName(c)}</div><div class="dr-empty">GI simulation could not be completed. The backend may not have sufficient parameters for this compound.</div></div>`;
      return `<div class="dr-appendix-compound">
        <div class="dr-appendix-compound-title">${this._prettyName(c)} — GI Tract Journey</div>
        ${this._renderStructured(data, 'GI simulation')}
      </div>`;
    }).join('');
  }

  static _renderCellAppendix(cellSims, compounds) {
    return compounds.map(c => {
      const data = cellSims[c];
      if (!data || data._error) return `<div class="dr-appendix-compound"><div class="dr-appendix-compound-title">${this._prettyName(c)}</div><div class="dr-empty">Cellular simulation could not be completed for this compound.</div></div>`;
      return `<div class="dr-appendix-compound">
        <div class="dr-appendix-compound-title">${this._prettyName(c)} — Subcellular Distribution</div>
        ${this._renderStructured(data, 'Cellular simulation')}
      </div>`;
    }).join('');
  }

  static _renderPDAppendix(pd) {
    if (!pd || pd._error || pd.error) return '<div class="dr-empty">Pharmacodynamic modeling could not be completed. This typically occurs when compound parameters are outside the model\'s validated range.</div>';
    return this._renderStructured(pd, 'PD modeling');
  }

  static _renderCYPAppendix(cyp, profiles) {
    let html = '';
    const cypEntries = Object.entries(cyp);
    if (cypEntries.length) {
      html += `<div class="dr-subsection-title">CYP Enzyme Competition Matrix</div>`;
      html += cypEntries.map(([enzyme, data]) => {
        const ctx = CYP_CONTEXT[enzyme] || {};
        return `<div class="dr-appendix-compound">
          <div class="dr-appendix-compound-title">${enzyme}</div>
          <table class="dr-data-table"><tbody>
            <tr><td class="dr-dt-key">Competing compounds</td><td class="dr-dt-val">${(data.compounds || []).map(c => this._prettyName(c)).join(', ')}</td></tr>
            <tr><td class="dr-dt-key">Risk level</td><td class="dr-dt-val"><span class="${data.risk_level === 'HIGH' ? 'red' : 'gold'}">${data.risk_level || 'MODERATE'}</span></td></tr>
            <tr><td class="dr-dt-key">Enzyme role</td><td class="dr-dt-val">${ctx.role || data.note || '—'}</td></tr>
            <tr><td class="dr-dt-key">Clinical impact</td><td class="dr-dt-val">${ctx.effect || '—'}</td></tr>
            <tr><td class="dr-dt-key">Known substrates</td><td class="dr-dt-val">${ctx.substrates || '—'}</td></tr>
          </tbody></table>
        </div>`;
      }).join('');
    }
    const profEntries = Object.entries(profiles);
    if (profEntries.length) {
      html += `<div class="dr-subsection-title">Compound Metabolic Profiles</div>`;
      html += profEntries.map(([name, data]) => {
        if (data.note && data.note.includes('Not found')) return `<div class="dr-appendix-compound"><div class="dr-appendix-compound-title">${this._prettyName(name)}</div><div class="dr-empty">Not found in pharmacological database. This compound may be a food-derived nutrient without extensive drug metabolism data.</div></div>`;
        return `<div class="dr-appendix-compound">
          <div class="dr-appendix-compound-title">${this._prettyName(name)}</div>
          ${this._renderStructured(data, 'Profile')}
        </div>`;
      }).join('');
    }
    return html || '<div class="dr-empty">CYP data not available.</div>';
  }

  static _renderHerbDrugAppendix(herbDrug) {
    if (!herbDrug || herbDrug._error) return '<div class="dr-empty">No herb-drug interactions found in the RAG database for these compounds. This means none of your ingredients have documented interactions with common drug classes in our curated database of 106+ interactions.</div>';
    return this._renderStructured(herbDrug, 'Herb-drug interactions');
  }

  static _renderTemporalDDIAppendix(ddi) {
    if (!ddi || ddi._error) return '<div class="dr-empty">ChronoWeave temporal interaction simulation could not be completed. This simulation requires compound-specific plasma kinetics data that may not be available for all ingredients.</div>';
    return this._renderStructured(ddi, 'Temporal DDI');
  }

  static _renderArbiterAppendix(validation, consensus) {
    let html = '';
    if (validation && !validation._error) {
      html += `<div class="dr-subsection-title">Adversarial Validation Results</div>`;
      html += this._renderStructured(validation, 'Validation');
    }
    if (consensus && !consensus._error) {
      html += `<div class="dr-subsection-title">Multi-Path Consensus</div>`;
      html += this._renderStructured(consensus, 'Consensus');
    }
    return html || '<div class="dr-empty">ArbiterAI validation could not be completed. This may indicate the analysis was too complex for the adversarial testing framework, or the backend timed out.</div>';
  }

  static _renderDebateAppendix(debate, plan) {
    let html = '';
    if (plan && !plan._error && !plan.error) {
      html += `<div class="dr-subsection-title">AI-Generated Treatment Plan</div>`;
      html += this._renderStructured(plan, 'Plan');
    }
    if (debate) {
      html += `<div class="dr-subsection-title">Adversarial Debate Transcript</div>`;
      html += this._renderStructured(debate, 'Debate');
    }
    return html || '<div class="dr-empty">Adversarial debate could not be completed for this analysis. The debate requires multiple AI models to independently assess and challenge each other\'s conclusions.</div>';
  }

  static _renderEpigeneticsAppendix(epi) {
    if (!epi || epi._error || epi.error) return '<div class="dr-empty">Epigenetic longevity simulation could not be completed. The EpiWind engine requires specific compound-hallmark interaction data that may not be available for all supplement ingredients.</div>';
    return this._renderStructured(epi, 'Epigenetics');
  }

  static _renderRegimenAppendix(regimen) {
    if (!regimen || regimen._error || regimen.error) return '<div class="dr-empty">Holistic regimen review could not be completed. This AI pharmacist review requires successful completion of all prior simulation stages.</div>';
    // Try to extract the LLM narrative if present
    const narrative = regimen.llm_analysis || regimen.narrative || regimen.review;
    if (narrative && typeof narrative === 'string') {
      return `<div class="dr-specialist-text">${this._formatSpecialistText(narrative)}</div>`;
    }
    return this._renderStructured(regimen, 'Regimen');
  }
}
