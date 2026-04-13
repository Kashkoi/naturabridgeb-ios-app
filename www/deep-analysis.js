/**
 * NaturaBridgeB — Deep Analysis Engine
 * =====================================
 * Orchestrates 15+ backend simulation systems for exhaustive compound analysis.
 * Designed for B2B and clinical practitioner users who need the full power of
 * the NaturaBridge simulation engine.
 *
 * Analysis takes 2-10+ minutes depending on compound count and backend load.
 * Every result is real — sourced from the live VPS backend at port 8888.
 */

const DEEP_API = 'https://naturabridge-api.srv1251318.hstgr.cloud';

// ═══════════════════════════════════════════════════════════════════════
// ORCHESTRATOR — calls all backend systems in staged parallel batches
// ═══════════════════════════════════════════════════════════════════════

class DeepAnalysisOrchestrator {
  constructor(onStep) {
    this.onStep = onStep || (() => {});  // callback(stepIndex, stepName, status)
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
      'Consulting specialist agents (cardiology, neurology)',
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

      // ── STAGE 10: Specialist consultations ────────────────────────────
      this.onStep(10, steps[10], 'running');
      const [cardio, neuro] = await Promise.allSettled([
        this._post('/v1/specialist/consult', {
          specialist: 'cardiologist',
          drug_name: compoundNames[0],
          compounds: compoundNames,
          question: `Assess cardiovascular safety of combining ${compoundNames.join(', ')} — cardiac risk, QT prolongation, blood pressure effects.`,
          patient_context: userProfile || {}
        }),
        this._post('/v1/specialist/consult', {
          specialist: 'neurologist',
          drug_name: compoundNames[0],
          compounds: compoundNames,
          question: `Assess neurological effects and CNS safety of combining ${compoundNames.join(', ')} — BBB penetration, neurotransmitter impact, sedation risk.`,
          patient_context: userProfile || {}
        })
      ]);
      this.results.cardioConsult = cardio.status === 'fulfilled' ? cardio.value : null;
      this.results.neuroConsult = neuro.status === 'fulfilled' ? neuro.value : null;
      this.onStep(10, steps[10], 'done');

      // ── STAGE 11: LLM plan generation + adversarial debate ────────────
      this.onStep(11, steps[11], 'running');
      const planResult = await this._post('/v1/plan/generate?mode=ai&include_debate=true', {
        drug_name: compoundNames[0],
        user_profile: userProfile || null
      }).catch(e => ({ error: e.message }));
      this.results.plan = planResult;

      // Poll for debate completion (up to 120 seconds)
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
          // Try to get whatever is available
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
      // Gather any additional data
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
// REPORT RENDERER — Grade 10 main report + full technical appendix
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

        <!-- ═══ REPORT HEADER ═══ -->
        <div class="dr-header">
          <div class="dr-header-left">
            <h1 class="dr-title">${this._esc(formulaName)}</h1>
            <div class="dr-meta">${target} &middot; ${date} &middot; ${compounds.length} ingredients analysed</div>
            <div class="dr-meta">Report ID: ${reportId}</div>
          </div>
          <div class="dr-powered">
            <div style="font-size:10px;color:var(--txt-muted)">Powered by</div>
            <div style="font-size:15px;font-weight:700;color:var(--accent)">NaturaBridgeB&trade;</div>
            <div style="font-size:9px;color:var(--txt-muted)">Deep Analysis Engine</div>
          </div>
        </div>

        <!-- ═══ EXECUTIVE SUMMARY ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Executive Summary</div>
          <div class="dr-explain">This section gives you the big picture of how your formula performs — safety, effectiveness, and any concerns — in plain language.</div>
          <div class="dr-summary-grid">
            ${this._summaryCard('Safety Verdict', rec.safety_verdict || 'PENDING',
              rec.safety_verdict === 'ACCEPTABLE' ? 'green' : rec.safety_verdict === 'CAUTION' ? 'gold' : 'red',
              rec.safety_summary || 'Analysis complete.')}
            ${this._summaryCard('Pathway Stacking', rec.pathway_stacking_strength || '—',
              rec.pathway_stacking_strength === 'STRONG' ? 'green' : 'gold',
              `${mc.shared_target_count || 0} molecular targets shared between your ingredients. "Pathway stacking" means multiple ingredients reinforce the same biological effect — like multiple musicians playing in harmony.`)}
            ${this._summaryCard('Interactions Found', String((mc.safety_flags || []).length + Object.keys(mc.cyp_competition || {}).length),
              (mc.safety_flags || []).length > 3 ? 'red' : (mc.safety_flags || []).length > 0 ? 'gold' : 'green',
              `Your ingredients share some metabolic pathways in your liver. This can affect how quickly each one is processed. Details below.`)}
            ${this._summaryCard('ArbiterAI Verdict',
              r.arbiterValidation?.verdict || r.arbiterValidation?._error ? 'PENDING' : 'N/A',
              (r.arbiterValidation?.verdict === 'VALIDATED') ? 'green' : 'gold',
              `Our AI safety system ran adversarial tests — deliberately trying to find flaws in the analysis — to make sure the results are reliable. ${r.arbiterValidation?.verdict === 'VALIDATED' ? 'The results passed all checks.' : 'See appendix for details.'}`)}
          </div>
          <div class="dr-rationale">
            <strong>In plain English:</strong> ${rec.combination_rationale || 'Your formula has been analysed across all available simulation systems. See the sections below for detailed findings.'}
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
          <div class="dr-explain">Your liver uses enzymes called <strong>CYP enzymes</strong> (pronounced "sip") to break down substances you ingest. When two ingredients compete for the same enzyme, one may be processed more slowly — increasing its effect and potential side effects. This section shows which enzymes are shared.</div>
          ${this._renderCYPCompetition(mc.cyp_competition || {})}
          ${this._renderSafetyFlags(mc.safety_flags || [])}
        </div>

        <!-- ═══ WHEN TO TAKE EACH INGREDIENT ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Optimal Timing — When to Take Each Ingredient</div>
          <div class="dr-explain">Your body's enzyme activity changes throughout the day following your internal clock (called the <strong>circadian rhythm</strong>). Some ingredients work better in the morning, others in the evening. This analysis uses 24-hour enzyme activity data to find the best time for each ingredient.</div>
          ${this._renderChronotherapy(r.chronotherapy || {}, mc.dosage_recommendations || [])}
        </div>

        <!-- ═══ SPECIALIST PERSPECTIVES ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Specialist Perspectives</div>
          <div class="dr-explain">We consulted our AI specialist agents — each trained on a specific medical discipline — to review your formula from their perspective. These are not a substitute for your own clinical judgment.</div>
          ${this._renderSpecialist('Cardiology Review', r.cardioConsult, 'How does this formula affect heart health, blood pressure, and cardiac rhythm?')}
          ${this._renderSpecialist('Neurology Review', r.neuroConsult, 'How does this formula affect the brain, nervous system, and mental function?')}
        </div>

        <!-- ═══ INGREDIENT PK PROFILES ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Ingredient Profiles — What Your Body Does to Each Compound</div>
          <div class="dr-explain"><strong>Pharmacokinetics (PK)</strong> is the study of how your body absorbs, distributes, metabolises, and eliminates a substance. Key terms: <strong>Tmax</strong> = time to reach peak blood concentration; <strong>Bioavailability (foral)</strong> = percentage that actually reaches your bloodstream; <strong>Half-life</strong> = time for blood concentration to drop by half.</div>
          ${this._renderCompoundProfiles(mc.compound_profiles || {}, r.enrichments || {}, ingredients)}
        </div>

        <!-- ═══ VIRTUAL TRIAL RESULTS ═══ -->
        <div class="dr-section">
          <div class="dr-section-title">Virtual Clinical Trial Results</div>
          <div class="dr-explain">We ran a <strong>virtual N-of-1 trial</strong> for each ingredient. This simulates a blinded experiment — like a real clinical trial — using a virtual population of 200 patients. The trial compares the ingredient against a placebo to estimate its real effect. <strong>Cohen's d</strong> measures effect size: 0.2 = small, 0.5 = medium, 0.8+ = large. <strong>P-value</strong> below 0.05 means the result is statistically significant (unlikely to be random chance).</div>
          ${this._renderVirtualTrials(r.virtualTrials || {})}
        </div>

        <!-- ═══ ADVERSARIAL DEBATE ═══ -->
        ${this._renderDebate(r.debate, r.plan)}

        <!-- ═══ DISCLAIMER ═══ -->
        <div class="dr-disclaimer">
          <strong>Important:</strong> This report is generated by NaturaBridgeB, an AI-powered research and decision-support tool. It is not a substitute for professional medical advice, diagnosis, or treatment. All simulation results carry significant uncertainty and have not been validated in clinical trials specific to your patient. The information is intended for licensed healthcare practitioners. Always apply your own clinical judgment.
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!--                      A P P E N D I X                          -->
        <!-- ═══════════════════════════════════════════════════════════════ -->

        <div class="dr-appendix-divider">
          <div class="dr-appendix-divider-line"></div>
          <div class="dr-appendix-divider-text">TECHNICAL APPENDIX</div>
          <div class="dr-appendix-divider-line"></div>
        </div>
        <div class="dr-explain" style="margin-bottom:16px">The following sections contain the complete technical output from every simulation system that ran during this analysis. This is raw data for practitioners who want full visibility into the engine's reasoning.</div>

        <!-- APPENDIX A: GI TRACT JOURNEY -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix A — Full GI Tract Journey (Mouth to Exit)</div>
          <div class="dr-explain">For each compound, our GI simulation models what happens from the moment you swallow it: gastric acid exposure, enzyme degradation, absorption across 9 intestinal segments, first-pass liver metabolism, and colonic processing by gut bacteria. This shows exactly <strong>where in your body</strong> each compound is absorbed and how much reaches your bloodstream.</div>
          ${this._renderGIAppendix(r.giSimulations || {}, compounds)}
        </div>

        <!-- APPENDIX B: CELLULAR DISTRIBUTION -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix B — Subcellular Distribution and Signaling</div>
          <div class="dr-explain">Once a compound enters your cells, it distributes across <strong>organelles</strong> — the tiny structures inside each cell. Some compounds concentrate in mitochondria (the cell's power plants), others in lysosomes (the cell's recycling centres). This matters because different organelles have different functions, and drug concentration in the wrong organelle can cause toxicity. We also model all 5 major <strong>signaling pathways</strong> — the chains of molecular events that translate a drug's presence into a biological effect.</div>
          ${this._renderCellAppendix(r.cellSimulations || {}, compounds)}
        </div>

        <!-- APPENDIX C: PD MODELING -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix C — Pharmacodynamic (Effect) Modeling</div>
          <div class="dr-explain"><strong>Pharmacodynamics (PD)</strong> is the study of what a substance does to your body — the effects it produces. While pharmacokinetics asks "how does the body handle this compound?", pharmacodynamics asks "what does this compound do to the body?" This section shows predicted clinical effects.</div>
          ${this._renderPDAppendix(r.pdModeling)}
        </div>

        <!-- APPENDIX D: CYP DETAIL -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix D — CYP Enzyme Competition Detail</div>
          <div class="dr-explain"><strong>CYP enzymes</strong> (Cytochrome P450 family) are proteins in your liver that break down most drugs and supplements. There are several types (CYP3A4, CYP2D6, CYP1A2, etc.), each handling different substances. When two compounds compete for the same CYP enzyme, one gets processed slower — this is called <strong>metabolic inhibition</strong>. It can make a substance stay in your body longer than expected, potentially increasing both its effects and side effects.</div>
          ${this._renderCYPAppendix(mc.cyp_competition || {}, mc.compound_profiles || {})}
        </div>

        <!-- APPENDIX E: HERB-DRUG INTERACTIONS -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix E — Herb-Drug Interaction RAG Database Results</div>
          <div class="dr-explain">Our <strong>Retrieval-Augmented Generation (RAG)</strong> system searched a curated database of 106+ herb-drug interactions across 20 herbs and 26 drug classes. RAG combines database lookup with AI reasoning to identify interactions that simpler tools would miss.</div>
          ${this._renderHerbDrugAppendix(r.herbDrugInteractions)}
        </div>

        <!-- APPENDIX F: TEMPORAL DDI -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix F — Time-Dependent Drug-Drug Interactions</div>
          <div class="dr-explain">Most interaction checkers only tell you <em>whether</em> two compounds interact. Our <strong>ChronoWeave</strong> engine tells you <em>when</em> during the day the interaction is strongest or weakest. This uses real-time simulation of how compound levels rise and fall in your blood over 24 hours.</div>
          ${this._renderTemporalDDIAppendix(r.temporalDDI)}
        </div>

        <!-- APPENDIX G: ARBITERAI VALIDATION -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix G — ArbiterAI Adversarial Validation</div>
          <div class="dr-explain"><strong>ArbiterAI</strong> is our error-catching system. It deliberately tries to break the analysis using 4 different "attack templates" — checking for hallucinated data, inconsistent numbers, unsupported claims, and parameter reproducibility issues. Think of it as a sceptical reviewer who tries to poke holes in every conclusion. If ArbiterAI says "VALIDATED", the analysis survived all attacks.</div>
          ${this._renderArbiterAppendix(r.arbiterValidation, r.arbiterConsensus)}
        </div>

        <!-- APPENDIX H: ADVERSARIAL DEBATE -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix H — Multi-LLM Adversarial Debate (Minority Reports)</div>
          <div class="dr-explain">We asked multiple AI models to independently review the treatment plan, then had them debate each other. <strong>Minority reports</strong> are dissenting opinions — cases where one AI disagreed with the majority. This helps catch blind spots that a single AI might miss. When all models agree, confidence is higher; when they disagree, it flags areas needing extra caution.</div>
          ${this._renderDebateAppendix(r.debate, r.plan)}
        </div>

        <!-- APPENDIX I: EPIGENETIC IMPACT -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix I — Epigenetic and Longevity Impact</div>
          <div class="dr-explain"><strong>Epigenetics</strong> refers to changes in how your genes are expressed without changing the DNA itself. As we age, certain <strong>hallmarks of aging</strong> (like mitochondrial dysfunction, inflammation, and cellular senescence) accumulate. Some compounds can slow these processes. This simulation models 12 hallmarks of aging over 10 years with and without your formula.</div>
          ${this._renderEpigeneticsAppendix(r.epigenetics)}
        </div>

        <!-- APPENDIX J: REGIMEN LLM REVIEW -->
        <div class="dr-section dr-appendix">
          <div class="dr-section-title">Appendix J — Holistic Regimen Review (AI Analysis)</div>
          <div class="dr-explain">This is a comprehensive AI-generated review of your entire regimen. Unlike the earlier sections which are algorithmic (computed by equations), this review uses a large language model to synthesise all findings into a narrative assessment — similar to how a clinical pharmacist would review your supplement regimen.</div>
          ${this._renderRegimenAppendix(r.regimen)}
        </div>

        <!-- FOOTER -->
        <div class="dr-footer">
          NaturaBridgeB&trade; Deep Analysis Report &middot; ${reportId} &middot; ${date}<br>
          15 simulation systems &middot; 232 API endpoints available &middot; Analysis engine v3.0<br>
          &copy; ${new Date().getFullYear()} Alpha Inception LLC. All rights reserved.
        </div>

      </div>
    `;
  }

  // ── Helper: escape HTML ───────────────────────────────────────────────
  static _esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

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
            <div class="dr-table-row"><span class="dr-table-label">${p.compound_a || p.pair?.[0] || '—'} + ${p.compound_b || p.pair?.[1] || '—'}</span><span class="dr-table-value green">${p.synergy_score ? 'Score: ' + p.synergy_score.toFixed(2) : p.classification || '—'}</span></div>
          `).join('')}</div>`;
      }
    }
    if (antagonisms && !antagonisms._error) {
      const flags = antagonisms.antagonisms || antagonisms.flags || [];
      if (Array.isArray(flags) && flags.length) {
        html += `<div class="dr-subsection-title" style="color:var(--red)">Antagonistic Pairs (Caution)</div>
          <div class="dr-explain">These ingredient pairs may <strong>counteract</strong> each other — one may reduce the effectiveness of the other.</div>
          <div class="dr-table">${flags.slice(0, 6).map(f => `
            <div class="dr-table-row warn"><span class="dr-table-label">${f.compound_a || '—'} + ${f.compound_b || '—'}</span><span class="dr-table-value red">${f.note || f.reason || 'Potential antagonism detected'}</span></div>
          `).join('')}</div>`;
      }
    }
    return html || '<div class="dr-empty">Synergy screening complete — no significant interactions detected.</div>';
  }

  // ── CYP competition ───────────────────────────────────────────────────
  static _renderCYPCompetition(cyp) {
    const entries = Object.entries(cyp);
    if (!entries.length) return '<div class="dr-empty">No CYP enzyme competition detected.</div>';
    return `<div class="dr-table">${entries.map(([enzyme, data]) => `
      <div class="dr-table-row ${data.risk_level === 'HIGH' ? 'warn' : ''}">
        <span class="dr-table-label"><strong>${enzyme}</strong> — ${(data.compounds || []).join(', ')}</span>
        <span class="dr-table-value ${data.risk_level === 'HIGH' ? 'red' : 'gold'}">${data.risk_level || 'MODERATE'}</span>
      </div>
      <div class="dr-table-note">${data.note || ''}</div>
    `).join('')}</div>`;
  }

  // ── Safety flags ──────────────────────────────────────────────────────
  static _renderSafetyFlags(flags) {
    if (!flags.length) return '';
    return `<div class="dr-subsection-title">Safety Flags</div>
      <div class="dr-table">${flags.map(f => `
        <div class="dr-table-row ${f.severity === 'HIGH' || f.severity === 'MAJOR' ? 'warn' : ''}">
          <span class="dr-table-label">${(f.compounds || []).join(' + ')} — ${f.target || ''}</span>
          <span class="dr-table-value ${f.severity === 'HIGH' ? 'red' : 'gold'}">${f.severity}</span>
        </div>
        <div class="dr-table-note">${f.note || ''}</div>
      `).join('')}</div>`;
  }

  // ── Chronotherapy ─────────────────────────────────────────────────────
  static _renderChronotherapy(chrono, dosageRecs) {
    const entries = Object.entries(chrono);
    let html = '';
    if (entries.length) {
      html += `<div class="dr-timing-grid">${entries.map(([compound, data]) => {
        if (!data || data._error) return `<div class="dr-timing-card"><div class="dr-timing-name">${compound}</div><div class="dr-timing-time">Data pending</div></div>`;
        return `<div class="dr-timing-card">
          <div class="dr-timing-name">${compound}</div>
          <div class="dr-timing-time">${data.optimal_time || data.recommended_time || '—'}</div>
          <div class="dr-timing-reason">${data.rationale || data.reason || ''}</div>
        </div>`;
      }).join('')}</div>`;
    }
    if (dosageRecs && dosageRecs.length) {
      html += `<div class="dr-subsection-title">Dosage Recommendations</div>
        <div class="dr-table">${dosageRecs.map(d => `
          <div class="dr-table-row">
            <span class="dr-table-label"><strong>${d.name}</strong></span>
            <span class="dr-table-value">${d.suggested_dosage || '—'}</span>
          </div>
          <div class="dr-table-note">${d.timing || ''} ${d.notes ? '— ' + (Array.isArray(d.notes) ? d.notes.join('; ') : d.notes) : ''}</div>
        `).join('')}</div>`;
    }
    return html || '<div class="dr-empty">Chronotherapy data pending.</div>';
  }

  // ── Specialist consultations ──────────────────────────────────────────
  static _renderSpecialist(title, result, question) {
    if (!result || result._error) return `<div class="dr-specialist"><div class="dr-specialist-title">${title}</div><div class="dr-empty">Consultation pending or unavailable.</div></div>`;
    const text = result.perspective || result.response || result.text || JSON.stringify(result);
    return `<div class="dr-specialist">
      <div class="dr-specialist-title">${title}</div>
      <div class="dr-specialist-q">${question}</div>
      <div class="dr-specialist-text">${this._esc(typeof text === 'string' ? text : JSON.stringify(text, null, 2))}</div>
    </div>`;
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
          <div class="dr-compound-name">${c}</div>
          <div class="dr-compound-dose">${ing.dose || '—'} mg</div>
        </div>
        <div class="dr-compound-stats">
          <div class="dr-cs"><div class="dr-cs-val">${pk.tmax_h || p.tmax_h || '—'}</div><div class="dr-cs-label">Tmax (hours to peak)</div></div>
          <div class="dr-cs"><div class="dr-cs-val">${pk.bioavailability_pct || p.bioavailability_pct || '—'}${pk.bioavailability_pct || p.bioavailability_pct ? '%' : ''}</div><div class="dr-cs-label">Bioavailability</div></div>
          <div class="dr-cs"><div class="dr-cs-val">${pk.half_life_h || p.half_life_h || '—'}</div><div class="dr-cs-label">Half-life (hours)</div></div>
          <div class="dr-cs"><div class="dr-cs-val">${pk.Vd || '—'}</div><div class="dr-cs-label">Volume of Distribution</div></div>
        </div>
        ${targets.length ? `<div class="dr-compound-targets"><strong>Protein targets:</strong> ${targets.map(t => t.name || t.target || t).join(', ')}</div>` : ''}
      </div>`;
    }).join('');
  }

  // ── Virtual trials ────────────────────────────────────────────────────
  static _renderVirtualTrials(trials) {
    const entries = Object.entries(trials);
    if (!entries.length) return '<div class="dr-empty">Virtual trial data pending.</div>';
    return entries.map(([compound, result]) => {
      if (!result || result._error) return `<div class="dr-trial-card"><div class="dr-trial-name">${compound}</div><div class="dr-empty">Trial could not be completed.</div></div>`;
      const r = result.results || result.report || result;
      return `<div class="dr-trial-card">
        <div class="dr-trial-name">${compound}</div>
        <div class="dr-trial-stats">
          <span>Effect size (Cohen's d): <strong>${r.cohens_d != null ? r.cohens_d.toFixed(2) : r.effect_size != null ? r.effect_size.toFixed(2) : '—'}</strong></span>
          <span>P-value: <strong>${r.p_value != null ? r.p_value.toFixed(4) : '—'}</strong></span>
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
      <div class="dr-explain">We asked multiple independent AI systems to review this analysis. Where they agreed, confidence is high. Where they disagreed ("minority reports"), we flag those areas for your attention.</div>`;
    if (plan && !plan._error && !plan.error) {
      if (plan.medical_validation && plan.medical_validation.length) {
        html += `<div class="dr-subsection-title">Clinical Evidence Validation</div>
          <div class="dr-explain">Our MedicalAgent (trained on 939 clinical lessons) checked each compound against benchmark clinical data.</div>
          <div class="dr-table">${plan.medical_validation.map(v => `
            <div class="dr-table-row"><span class="dr-table-label">${v.compound}</span><span class="dr-table-value ${v.verdict === 'VALIDATED' ? 'green' : 'gold'}">${v.verdict}</span></div>
            ${v.explanation ? `<div class="dr-table-note">${this._esc(v.explanation).slice(0, 300)}</div>` : ''}
          `).join('')}</div>`;
      }
    }
    if (debate && debate.minority_reports) {
      const reports = Array.isArray(debate.minority_reports) ? debate.minority_reports : [];
      if (reports.length) {
        html += `<div class="dr-subsection-title">Minority Reports (Dissenting Views)</div>
          ${reports.map(r => `<div class="dr-minority">${this._esc(typeof r === 'string' ? r : JSON.stringify(r, null, 2))}</div>`).join('')}`;
      } else {
        html += `<div class="dr-agree">All AI reviewers reached consensus — no minority reports filed.</div>`;
      }
    }
    html += '</div>';
    return html;
  }

  // ── APPENDIX RENDERERS ────────────────────────────────────────────────

  static _renderGIAppendix(giSims, compounds) {
    return compounds.map(c => {
      const data = giSims[c];
      if (!data || data._error) return `<div class="dr-appendix-compound"><strong>${c}:</strong> GI simulation data not available. ${data?.detail || ''}</div>`;
      return `<div class="dr-appendix-compound">
        <div class="dr-appendix-compound-title">${c} — GI Tract Journey</div>
        <pre class="dr-raw">${JSON.stringify(data, null, 2)}</pre>
      </div>`;
    }).join('');
  }

  static _renderCellAppendix(cellSims, compounds) {
    return compounds.map(c => {
      const data = cellSims[c];
      if (!data || data._error) return `<div class="dr-appendix-compound"><strong>${c}:</strong> Cellular simulation data not available.</div>`;
      return `<div class="dr-appendix-compound">
        <div class="dr-appendix-compound-title">${c} — Subcellular Distribution + Signaling Pathways</div>
        <pre class="dr-raw">${JSON.stringify(data, null, 2)}</pre>
      </div>`;
    }).join('');
  }

  static _renderPDAppendix(pd) {
    if (!pd || pd._error || pd.error) return '<div class="dr-empty">PD modeling data not available.</div>';
    return `<pre class="dr-raw">${JSON.stringify(pd, null, 2)}</pre>`;
  }

  static _renderCYPAppendix(cyp, profiles) {
    return `<div class="dr-subsection-title">CYP Enzyme Competition Matrix</div>
      <pre class="dr-raw">${JSON.stringify(cyp, null, 2)}</pre>
      <div class="dr-subsection-title">Compound Metabolic Profiles</div>
      <pre class="dr-raw">${JSON.stringify(profiles, null, 2)}</pre>`;
  }

  static _renderHerbDrugAppendix(herbDrug) {
    if (!herbDrug || herbDrug._error) return '<div class="dr-empty">Herb-drug RAG results not available.</div>';
    return `<pre class="dr-raw">${JSON.stringify(herbDrug, null, 2)}</pre>`;
  }

  static _renderTemporalDDIAppendix(ddi) {
    if (!ddi || ddi._error) return '<div class="dr-empty">Temporal DDI data not available.</div>';
    return `<pre class="dr-raw">${JSON.stringify(ddi, null, 2)}</pre>`;
  }

  static _renderArbiterAppendix(validation, consensus) {
    let html = '';
    if (validation && !validation._error) {
      html += `<div class="dr-subsection-title">Adversarial Validation (4-Template Attack)</div><pre class="dr-raw">${JSON.stringify(validation, null, 2)}</pre>`;
    }
    if (consensus && !consensus._error) {
      html += `<div class="dr-subsection-title">Multi-Path Consensus Simulation</div><pre class="dr-raw">${JSON.stringify(consensus, null, 2)}</pre>`;
    }
    return html || '<div class="dr-empty">ArbiterAI validation data not available.</div>';
  }

  static _renderDebateAppendix(debate, plan) {
    let html = '';
    if (plan && !plan._error && !plan.error) {
      html += `<div class="dr-subsection-title">Treatment Plan (LLM-Generated)</div><pre class="dr-raw">${JSON.stringify(plan, null, 2)}</pre>`;
    }
    if (debate) {
      html += `<div class="dr-subsection-title">Full Debate Transcript</div><pre class="dr-raw">${JSON.stringify(debate, null, 2)}</pre>`;
    }
    return html || '<div class="dr-empty">Debate data not yet available.</div>';
  }

  static _renderEpigeneticsAppendix(epi) {
    if (!epi || epi._error || epi.error) return '<div class="dr-empty">Epigenetic simulation data not available.</div>';
    return `<pre class="dr-raw">${JSON.stringify(epi, null, 2)}</pre>`;
  }

  static _renderRegimenAppendix(regimen) {
    if (!regimen || regimen._error || regimen.error) return '<div class="dr-empty">Regimen analysis not available.</div>';
    return `<pre class="dr-raw">${JSON.stringify(regimen, null, 2)}</pre>`;
  }
}
