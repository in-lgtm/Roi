// ==================== CONFIG / STATE / HELPERS ====================
const CONFIG = { years: 25, defaultSelfConsumptionCap: 0.35 };
const LOCALES = { en: 'en-US', fr: 'fr-FR', de: 'de-DE', lb: 'de-LU' };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let currentLanguage = 'en';
let formulaLanguage = 'en'; // language used ONLY for the formula explanation content
let compareMode = false;
let competitorVisible = false;
let cashFlowChart = null;
let lastStatus = { key: 'statusSolo', err: false, name: '' };

const $ = id => document.getElementById(id);
const num = id => parseFloat($(id).value) || 0;
function capFraction(id) {
  const el = $(id);
  const v = el ? parseFloat(el.value) : NaN;
  if (!isFinite(v) || v < 0) return CONFIG.defaultSelfConsumptionCap;
  return Math.min(v, 100) / 100;
}
const fmt = (v, d = 2) => {
  const n = Number(v) || 0;
  return n.toLocaleString(LOCALES[currentLanguage], { minimumFractionDigits: d, maximumFractionDigits: d });
};
const eur = (v, d = 2) => `€ ${fmt(v, d)}`;
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// ==================== TRANSLATIONS ====================
const translations = {
en: {
  title: 'Solar PV ROI Calculator',
  subtitle: 'Calculate your solar investment returns and visualize your 25-year cash flow',
  investmentDetails: 'Investment & System Details',
  installationCostMode: 'Installation Cost Mode', grossAmount: 'Gross Amount (€)', capacityUnitRate: 'Capacity × Unit Rate',
  subsidiesMode: 'Subsidies Mode', subsidiesAmount: 'Subsidy Amount (€)', subsidiesRate: 'Subsidy Rate (€/kWp)',
  grossCost: 'Gross Installation Cost (€)', capacity: 'System Capacity (kWp)', unitRate: 'Unit Rate (€/kWp)',
  annualProduction: 'Estimated Annual Solar Production kWh/year', annualConsumption: 'Annual Consumption kWh/year',
  buyingPrice: 'Electricity Buying Price (€/kWh)', sellingPrice: 'Electricity Selling Price / Feed-In Tariff (€/kWh)',
  selfConsumptionCap: 'Self-Consumption Cap (%)', compSelfConsumptionCap: 'Competitor Self-Consumption Cap (%)',
  netUpfrontCostLabel: 'Net Upfront Cost', annualSavingsLabel: 'Annual Savings', paybackPeriodLabel: 'Payback Period', netProfit25Label: '25-Year Net Profit',
  downloadReport: '📄 Download PDF Report', cashFlowChart: '25-Year Cumulative Cash Flow',
  addCompetitor: '➕ Add Competitor / Benchmark Offer', hideCompetitor: '🚫 Hide Competitor / Benchmark Offer',
  addComparison: 'Add Competitor Comparison', removeComparison: 'Remove Competitor Comparison',
  statusIncomplete: 'Enter the main inputs to view the Solar Clip ROI curve.',
  statusNeedCompetitor: 'Enter the competitor offer details to compare it with Solar Clip.',
  statusComparisonOn: 'Comparison chart generated for Solar Clip vs {name}.',
  statusComparisonOff: 'Competitor comparison removed.',
  statusSolo: 'Solar Clip ROI curve is shown. Add competitor comparison when needed.',
  yearsAxis: 'Years', cashFlowAxis: 'Cash Flow (€)', legendSolo: 'Solar Clip Cumulative Cash Flow (€)',
  yearsShort: 'years', never: 'Never', perYearShort: '/year',
  detailTitle: 'Year', detailAnnual: 'saved this year', detailDelta: 'vs competitor',
  compLabel: 'Comparison Label', compGrossCost: 'Competitor Gross Installation Cost (€)', compSubsidy: 'Competitor Subsidy Amount (€)',
  compProduction: 'Competitor Annual Solar Production kWh/year', compConsumption: 'Competitor Annual Consumption kWh/year',
  compBuying: 'Competitor Electricity Buying Price (€/kWh)', compSelling: 'Competitor Electricity Selling Price / Feed-In Tariff (€/kWh)',
  tipProduction: 'Expected yearly generation. Rule of thumb: capacity (kWp) × ~900–1,100 kWh in Luxembourg.',
  tipConsumption: 'Total electricity used per year (see your bill).',
  tipBuying: 'Price you pay per kWh drawn from the grid.', tipSelling: 'Price you receive per kWh exported to the grid.',
  tipGross: 'Total price of the installation before subsidies.', tipSubsidy: 'Total public subsidies deducted from the gross price.',
  report: 'Solar PV ROI Report', generated: 'Generated', investmentSummary: 'Investment Summary', financialResults: 'Financial Results',
  investmentAnalysis: 'Investment Analysis', breakevenPoint: 'Breakeven Point',
  breakevenText: 'Your investment will break even in approximately', yearsTail: 'After this point, you will start generating net positive returns.',
  neverBreakeven: 'Your annual savings are insufficient to achieve a breakeven point with the current parameters.',
  outlookYears: '25-Year Outlook', outlookText: 'Over 25 years, your solar system will generate', inTotalSavings: 'in total savings. After deducting the net upfront cost of',
  yourNetProfit: ', your net profit will be', averageReturn: 'This represents an average annual return of', roi: 'and a return on investment of', roiPeriod: 'over the 25-year period.',
  selfConsumption: 'Self-Consumption', selfConsumptionText: 'Your system will produce', kwhAnnually: 'kWh annually, with', consumed: 'consumed directly, saving',
  perYear: 'per year. The remaining', willBeExported: 'will be exported to the grid for',
  grossInstallation: 'Gross Installation Cost', subsidies: 'Subsidies', netUpfrontCost: 'Net Upfront Cost',
  annualSolarProduction: 'Annual Solar Production', annualHouseholdConsumption: 'Annual Consumption',
  selfConsumedSolar: 'Self-Consumed Solar', exportedSolar: 'Exported Solar', buyingPriceLabel: 'Buying Price', sellingPriceLabel: 'Selling Price', netProfit: '25-Year Net Profit',
  contactInfo: 'Contact Information', aboutApp: 'About This Tool',
  aboutText: 'A free solar ROI calculator to help you evaluate the financial benefits of installing a solar PV system.',
  disclaimer: 'Disclaimer', disclaimerText: 'This calculator provides estimates for informational purposes only. Consult with a professional for accurate project assessment.',
  copyright: '© 2026 Solar PV ROI Calculator. All rights reserved.'
  ,applyLanguageToUI: 'Apply selected language to UI'
  ,formula_netUpfront: 'Net Upfront Cost = Gross Installation Cost − Subsidies'
  ,formula_selfConsumed: 'Self‑Consumed Solar Energy = min(Annual Solar Production, {cap}% of Annual Consumption)'
  ,formula_exported: 'Exported Solar Energy = Annual Solar Production − Self‑Consumed Solar Energy'
  ,formula_annualSavings: 'Annual Savings = (Self‑Consumed Solar Energy × Buying Price) + (Exported Solar Energy × Selling Price)'
  ,formula_payback: 'Payback Period = Net Upfront Cost / Annual Savings'
  ,formula_netProfit25: '25‑Year Net Profit = (Annual Savings × 25) − Net Upfront Cost'
  ,assump_buyingPrice: 'Price you pay per kWh drawn from the grid.'
  ,assump_production: 'Expected yearly generation. Rule of thumb: capacity (kWp) × ~900–1,100 kWh in Luxembourg.'
  ,assump_gross: 'Total price of the installation before subsidies.'
  ,assump_subsidies: 'Total public subsidies deducted from the gross price.'
  ,showFormula: 'Show Formula'
  ,hideFormula: 'Hide Formula'
  ,hint_grossCost: 'Total price of the installation before subsidies.'
  ,hint_capacity: 'The system’s power rating in kilowatt-peak (kWp).'
  ,hint_unitRate: 'Installation price per kWp of capacity.'
  ,hint_subsidiesAmount: 'Total public subsidies deducted from the gross price.'
  ,hint_subsidiesRate: 'Subsidy amount per kWp of installed capacity.'
  ,hint_annualProduction: 'Expected yearly generation. Rule of thumb: capacity (kWp) × ~900–1,100 kWh in Luxembourg.'
  ,hint_annualConsumption: 'Total electricity used per year (see your bill).'
  ,hint_buyingPrice: 'Price you pay per kWh drawn from the grid.'
  ,hint_sellingPrice: 'Price you receive per kWh exported to the grid.'
  ,hint_selfConsumptionCap: 'Maximum share of your consumption that solar can cover directly (default 35%).'
  ,hint_compSelfConsumptionCap: 'Maximum share of consumption solar can cover directly for this offer (default 35%).'
},
fr: {
  title: 'Calculatrice ROI Solaire PV',
  subtitle: 'Calculez votre retour sur investissement solaire et visualisez vos flux de trésorerie sur 25 ans',
  investmentDetails: 'Détails de l’investissement et du système',
  installationCostMode: 'Mode de coût d’installation', grossAmount: 'Montant brut (€)', capacityUnitRate: 'Capacité × Taux unitaire',
  subsidiesMode: 'Mode des subventions', subsidiesAmount: 'Montant de la subvention (€)', subsidiesRate: 'Taux de subvention (€/kWc)',
  grossCost: 'Coût d’installation brut (€)', capacity: 'Capacité du système (kWc)', unitRate: 'Taux unitaire (€/kWc)',
  annualProduction: 'Production solaire annuelle estimée kWh/year', annualConsumption: 'Consommation annuelle kWh/year',
  buyingPrice: 'Prix d’achat de l’électricité (€/kWh)', sellingPrice: 'Prix de vente / Tarif d’injection (€/kWh)',
  selfConsumptionCap: 'Plafond d’autoconsommation (%)', compSelfConsumptionCap: 'Plafond d’autoconsommation du concurrent (%)',
  netUpfrontCostLabel: 'Coût net initial', annualSavingsLabel: 'Économies annuelles', paybackPeriodLabel: 'Période d’amortissement', netProfit25Label: 'Bénéfice net sur 25 ans',
  downloadReport: '📄 Télécharger le rapport PDF', cashFlowChart: 'Flux de trésorerie cumulatif sur 25 ans',
  addCompetitor: '➕ Ajouter une offre concurrent / référence', hideCompetitor: '🚫 Masquer l’offre concurrent',
  addComparison: 'Ajouter la comparaison concurrent', removeComparison: 'Retirer la comparaison concurrent',
  statusIncomplete: 'Saisissez les paramètres principaux pour afficher la courbe ROI de Solar Clip.',
  statusNeedCompetitor: 'Saisissez les détails de l’offre concurrent pour la comparer à Solar Clip.',
  statusComparisonOn: 'Graphique comparatif généré pour Solar Clip vs {name}.',
  statusComparisonOff: 'Comparaison concurrent retirée.',
  statusSolo: 'Courbe ROI Solar Clip affichée. Ajoutez une comparaison si nécessaire.',
  yearsAxis: 'Années', cashFlowAxis: 'Trésorerie (€)', legendSolo: 'Flux de trésorerie cumulé Solar Clip (€)',
  yearsShort: 'ans', never: 'Jamais', perYearShort: '/an',
  detailTitle: 'Année', detailAnnual: 'économisés cette année', detailDelta: 'vs concurrent',
  compLabel: 'Libellé de comparaison', compGrossCost: 'Coût d’installation brut du concurrent (€)', compSubsidy: 'Montant de subvention du concurrent (€)',
  compProduction: 'Production solaire annuelle du concurrent kWh/year', compConsumption: 'Consommation annuelle du concurrent kWh/year',
  compBuying: 'Prix d’achat de l’électricité du concurrent (€/kWh)', compSelling: 'Prix de vente / tarif d’injection du concurrent (€/kWh)',
  tipProduction: 'Production annuelle attendue. Ordre de grandeur : capacité (kWc) × ~900–1 100 kWh.',
  tipConsumption: 'Électricité totale consommée par an (voir votre facture).',
  tipBuying: 'Prix payé par kWh soutiré du réseau.', tipSelling: 'Prix reçu par kWh injecté dans le réseau.',
  tipGross: 'Prix total de l’installation avant subventions.', tipSubsidy: 'Total des subventions publiques déduites du prix brut.',
  report: 'Rapport ROI Solaire', generated: 'Généré', investmentSummary: 'Résumé de l’investissement', financialResults: 'Résultats financiers',
  investmentAnalysis: 'Analyse d’investissement', breakevenPoint: 'Point d’équilibre',
  breakevenText: 'Votre investissement atteindra l’équilibre dans environ', yearsTail: 'Après ce point, vous commencerez à générer des rendements nets positifs.',
  neverBreakeven: 'Vos économies annuelles sont insuffisantes pour atteindre un point d’équilibre avec les paramètres actuels.',
  outlookYears: 'Perspectives sur 25 ans', outlookText: 'Sur 25 ans, votre système solaire générera', inTotalSavings: 'en économies totales. Après déduction du coût net initial de',
  yourNetProfit: ', votre bénéfice net sera', averageReturn: 'Cela représente un rendement annuel moyen de', roi: 'et un retour sur investissement de', roiPeriod: 'sur la période de 25 ans.',
  selfConsumption: 'Autoconsommation', selfConsumptionText: 'Votre système produira', kwhAnnually: 'kWh par an, avec', consumed: 'consommés directement, ce qui vous fera économiser',
  perYear: 'par an. Le reste', willBeExported: 'sera exporté au réseau pour',
  grossInstallation: 'Coût d’installation brut', subsidies: 'Subventions', netUpfrontCost: 'Coût net initial',
  annualSolarProduction: 'Production solaire annuelle', annualHouseholdConsumption: 'Consommation annuelle',
  selfConsumedSolar: 'Énergie solaire autoconsommée', exportedSolar: 'Énergie solaire exportée', buyingPriceLabel: 'Prix d’achat', sellingPriceLabel: 'Prix de vente', netProfit: 'Bénéfice net sur 25 ans',
  contactInfo: 'Coordonnées', aboutApp: 'À propos de cet outil',
  aboutText: 'Un calculateur ROI solaire gratuit pour vous aider à évaluer les avantages financiers de l’installation d’un système PV solaire.',
  disclaimer: 'Avertissement', disclaimerText: 'Ce calculateur fournit des estimations à titre informatif uniquement. Consultez un professionnel pour une évaluation précise du projet.',
  copyright: '© 2026 Calculatrice ROI Solaire PV. Tous droits réservés.'
  ,applyLanguageToUI: 'Appliquer la langue sélectionnée à l’interface'
  ,formula_netUpfront: 'Coût net initial = Coût d’installation brut − Subventions'
  ,formula_selfConsumed: 'Énergie solaire autoconsommée = min(Production solaire annuelle, {cap}% de la consommation annuelle)'
  ,formula_exported: 'Énergie solaire exportée = Production solaire annuelle − Énergie solaire autoconsommée'
  ,formula_annualSavings: 'Économies annuelles = (Énergie autoconsommée × Prix d’achat) + (Énergie exportée × Prix de vente)'
  ,formula_payback: 'Période d’amortissement = Coût net initial / Économies annuelles'
  ,formula_netProfit25: 'Bénéfice net sur 25 ans = (Économies annuelles × 25) − Coût net initial'
  ,assump_buyingPrice: 'Prix que vous payez par kWh soutiré du réseau.'
  ,assump_production: 'Production annuelle attendue. Règle: capacité (kWp) × ~900–1 100 kWh.'
  ,assump_gross: 'Prix total de l’installation avant subventions.'
  ,assump_subsidies: 'Total des subventions publiques déduites du prix brut.'
  ,showFormula: 'Afficher la formule'
  ,hideFormula: 'Masquer la formule'
  ,hint_grossCost: 'Prix total de l’installation avant subventions.'
  ,hint_capacity: 'Puissance nominale du système en kilowatt-crête (kWc).'
  ,hint_unitRate: 'Prix d’installation par kWc de capacité.'
  ,hint_subsidiesAmount: 'Total des subventions publiques déduites du prix brut.'
  ,hint_subsidiesRate: 'Montant de la subvention par kWc de capacité installée.'
  ,hint_annualProduction: 'Production annuelle attendue. Ordre de grandeur : capacité (kWc) × ~900–1 100 kWh.'
  ,hint_annualConsumption: 'Électricité totale consommée par an (voir votre facture).'
  ,hint_buyingPrice: 'Prix payé par kWh soutiré du réseau.'
  ,hint_sellingPrice: 'Prix reçu par kWh injecté dans le réseau.'
  ,hint_selfConsumptionCap: 'Part maximale de votre consommation que le solaire peut couvrir directement (35 % par défaut).'
  ,hint_compSelfConsumptionCap: 'Part maximale de la consommation que le solaire peut couvrir directement pour cette offre (35 % par défaut).'
},
de: {
  title: 'Solaranlage ROI-Rechner',
  subtitle: 'Berechnen Sie Ihre Solaranlagen-Rentabilität und visualisieren Sie Ihren 25-jährigen Cashflow',
  investmentDetails: 'Investitions- & Systemdetails',
  installationCostMode: 'Installationskostenmodus', grossAmount: 'Bruttobetrag (€)', capacityUnitRate: 'Kapazität × Einheitssatz',
  subsidiesMode: 'Subventionsmodus', subsidiesAmount: 'Subventionsbetrag (€)', subsidiesRate: 'Subventionssatz (€/kWp)',
  grossCost: 'Brutto-Installationskosten (€)', capacity: 'Systemkapazität (kWp)', unitRate: 'Einheitssatz (€/kWp)',
  annualProduction: 'Geschätzte jährliche Solarproduktion kWh/year', annualConsumption: 'Jährlicher Verbrauch kWh/year',
  buyingPrice: 'Stromkaufspreis (€/kWh)', sellingPrice: 'Stromverkaufspreis / Einspeisevergütung (€/kWh)',
  selfConsumptionCap: 'Eigenverbrauchsdeckel (%)', compSelfConsumptionCap: 'Eigenverbrauchsdeckel des Wettbewerbers (%)',
  netUpfrontCostLabel: 'Netto-Anfangskosten', annualSavingsLabel: 'Jährliche Ersparnis', paybackPeriodLabel: 'Amortisationszeitraum', netProfit25Label: 'Nettogewinn 25 Jahre',
  downloadReport: '📄 PDF-Bericht herunterladen', cashFlowChart: '25-jähriger kumulativer Cashflow',
  addCompetitor: '➕ Wettbewerbs-/Referenzangebot hinzufügen', hideCompetitor: '🚫 Wettbewerbsangebot ausblenden',
  addComparison: 'Wettbewerbsvergleich hinzufügen', removeComparison: 'Wettbewerbsvergleich entfernen',
  statusIncomplete: 'Füllen Sie die Haupteingaben aus, um die Solar-Clip-ROI-Kurve zu sehen.',
  statusNeedCompetitor: 'Geben Sie die Wettbewerbsdetails ein, um sie mit Solar Clip zu vergleichen.',
  statusComparisonOn: 'Vergleichsdiagramm für Solar Clip vs. {name} erstellt.',
  statusComparisonOff: 'Wettbewerbsvergleich entfernt.',
  statusSolo: 'Solar-Clip-ROI-Kurve wird angezeigt. Bei Bedarf Vergleich hinzufügen.',
  yearsAxis: 'Jahre', cashFlowAxis: 'Cashflow (€)', legendSolo: 'Kumulativer Solar-Clip-Cashflow (€)',
  yearsShort: 'Jahre', never: 'Nie', perYearShort: '/Jahr',
  detailTitle: 'Jahr', detailAnnual: 'in diesem Jahr gespart', detailDelta: 'ggü. Wettbewerb',
  compLabel: 'Vergleichsbezeichnung', compGrossCost: 'Brutto-Installationskosten des Wettbewerbers (€)', compSubsidy: 'Subventionsbetrag des Wettbewerbers (€)',
  compProduction: 'Jährliche Solarproduktion des Wettbewerbers kWh/year', compConsumption: 'Jährlicher Verbrauch des Wettbewerbers kWh/year',
  compBuying: 'Stromkaufspreis des Wettbewerbers (€/kWh)', compSelling: 'Stromverkaufspreis / Einspeisevergütung des Wettbewerbers (€/kWh)',
  tipProduction: 'Erwartete Jahresproduktion. Faustregel: Kapazität (kWp) × ~900–1.100 kWh.',
  tipConsumption: 'Jährlicher Stromverbrauch (siehe Rechnung).',
  tipBuying: 'Preis, den Sie pro kWh aus dem Netz zahlen.', tipSelling: 'Preis, den Sie pro eingespeister kWh erhalten.',
  tipGross: 'Gesamtpreis der Installation vor Subventionen.', tipSubsidy: 'Summe der öffentlichen Förderungen, die vom Bruttopreis abgezogen werden.',
  report: 'Solaranlage-ROI-Bericht', generated: 'Generiert', investmentSummary: 'Investitionsübersicht', financialResults: 'Finanzergebnisse',
  investmentAnalysis: 'Investitionsanalyse', breakevenPoint: 'Amortisationspunkt',
  breakevenText: 'Ihre Investition amortisiert sich in etwa', yearsTail: 'Danach erzielen Sie positive Nettorenditen.',
  neverBreakeven: 'Ihre jährlichen Ersparnisse reichen nicht aus, um mit den aktuellen Parametern einen Amortisationspunkt zu erreichen.',
  outlookYears: '25-Jahres-Ausblick', outlookText: 'In 25 Jahren wird Ihre Solaranlage', inTotalSavings: 'Gesamtersparnis generieren. Nach Abzug der Netto-Anfangskosten von',
  yourNetProfit: ', beträgt Ihr Nettogewinn', averageReturn: 'Dies stellt eine durchschnittliche jährliche Rendite von', roi: 'und eine Kapitalrendite von', roiPeriod: 'über den 25-Jahres-Zeitraum dar.',
  selfConsumption: 'Eigenverbrauch', selfConsumptionText: 'Ihre Anlage erzeugt', kwhAnnually: 'kWh pro Jahr, mit', consumed: 'direkt verbraucht, was',
  perYear: 'pro Jahr spart. Der Rest', willBeExported: 'wird ins Netz gespeist für',
  grossInstallation: 'Brutto-Installationskosten', subsidies: 'Subventionen', netUpfrontCost: 'Netto-Anfangskosten',
  annualSolarProduction: 'Jährliche Solarproduktion', annualHouseholdConsumption: 'Jährlicher Verbrauch',
  selfConsumedSolar: 'Eigenverbrauchte Solarenergie', exportedSolar: 'Exportierte Solarenergie', buyingPriceLabel: 'Kaufpreis', sellingPriceLabel: 'Verkaufspreis', netProfit: 'Nettogewinn 25 Jahre',
  contactInfo: 'Kontaktinformation', aboutApp: 'Über dieses Tool',
  aboutText: 'Ein kostenloser Solar-ROI-Rechner, um die finanziellen Vorteile einer Solarphotovoltaikanlage zu bewerten.',
  disclaimer: 'Haftungsausschluss', disclaimerText: 'Dieser Rechner bietet Schätzungen nur zu Informationszwecken. Konsultieren Sie einen Fachmann für eine genaue Projektbewertung.',
  copyright: '© 2026 Solaranlage ROI-Rechner. Alle Rechte vorbehalten.'
  ,applyLanguageToUI: 'Ausgewählte Sprache auf die Oberfläche anwenden'
  ,formula_netUpfront: 'Netto‑Anfangskosten = Brutto‑Installationskosten − Subventionen'
  ,formula_selfConsumed: 'Eigenverbrauchte Solarenergie = min(Jährliche Solarproduktion, {cap}% des jährlichen Verbrauchs)'
  ,formula_exported: 'Exportierte Solarenergie = Jährliche Solarproduktion − Eigenverbrauchte Solarenergie'
  ,formula_annualSavings: 'Jährliche Ersparnis = (Eigenverbrauchte Solarenergie × Kaufpreis) + (Exportierte Solarenergie × Verkaufspreis)'
  ,formula_payback: 'Amortisationszeitraum = Netto‑Anfangskosten / Jährliche Ersparnis'
  ,formula_netProfit25: 'Nettogewinn (25 Jahre) = (Jährliche Ersparnis × 25) − Netto‑Anfangskosten'
  ,assump_buyingPrice: 'Preis, den Sie pro kWh aus dem Netz zahlen.'
  ,assump_production: 'Erwartete Jahresproduktion. Faustregel: Kapazität (kWp) × ~900–1.100 kWh.'
  ,assump_gross: 'Gesamtpreis der Installation vor Subventionen.'
  ,assump_subsidies: 'Summe der öffentlichen Förderungen, die vom Bruttopreis abgezogen werden.'
  ,showFormula: 'Formel anzeigen'
  ,hideFormula: 'Formel ausblenden'
  ,hint_grossCost: 'Gesamtpreis der Installation vor Subventionen.'
  ,hint_capacity: 'Nennleistung der Anlage in Kilowatt-Peak (kWp).'
  ,hint_unitRate: 'Installationspreis pro kWp Kapazität.'
  ,hint_subsidiesAmount: 'Summe der öffentlichen Förderungen, die vom Bruttopreis abgezogen werden.'
  ,hint_subsidiesRate: 'Subventionsbetrag pro kWp installierter Kapazität.'
  ,hint_annualProduction: 'Erwartete Jahresproduktion. Faustregel: Kapazität (kWp) × ~900–1.100 kWh.'
  ,hint_annualConsumption: 'Jährlicher Stromverbrauch (siehe Rechnung).'
  ,hint_buyingPrice: 'Preis, den Sie pro kWh aus dem Netz zahlen.'
  ,hint_sellingPrice: 'Preis, den Sie pro eingespeister kWh erhalten.'
  ,hint_selfConsumptionCap: 'Maximaler Anteil Ihres Verbrauchs, den Solar direkt decken kann (Standard 35 %).'
  ,hint_compSelfConsumptionCap: 'Maximaler Anteil des Verbrauchs, den Solar für dieses Angebot direkt decken kann (Standard 35 %).'
},
lb: {
  title: 'Solar PV ROI Kalkulator',
  subtitle: 'Berechent Är Sonneninvestitioun an visualiséiert Är 25-Joer Cashflow',
  investmentDetails: 'Investitiouns- & Systemdetailer',
  installationCostMode: 'Installatiounskäscht Modus', grossAmount: 'Brutto Betrag (€)', capacityUnitRate: 'Kapazitéit × Eenheetsquote',
  subsidiesMode: 'Subventiounsmodus', subsidiesAmount: 'Subventioun Betrag (€)', subsidiesRate: 'Subventioun Quote (€/kWp)',
  grossCost: 'Brutto Installatiounskäscht (€)', capacity: 'System Kapazitéit (kWp)', unitRate: 'Eenheetsquote (€/kWp)',
  annualProduction: 'Geschätzt jäerlech Sonnenproduktioun kWh/year', annualConsumption: 'Jährleche Verbrauch kWh/year',
  buyingPrice: 'Stroumkaafpräis (€/kWh)', sellingPrice: 'Stroumverkafpräis / Auspeisungsvergütung (€/kWh)',
  selfConsumptionCap: 'Eegeverbrauchsdeckel (%)', compSelfConsumptionCap: 'Eegeverbrauchsdeckel vum Wettbewerber (%)',
  netUpfrontCostLabel: 'Netto Ufankskäscht', annualSavingsLabel: 'Jährlech Erspuernis', paybackPeriodLabel: 'Amortisatiounsdauer', netProfit25Label: 'Netto Gewënn 25 Joer',
  downloadReport: '📄 PDF Bericht eroflueden', cashFlowChart: '25-Joer kumulative Cashflow',
  addCompetitor: '➕ Wettbewerbs-/Referenzoffer bäifügen', hideCompetitor: '🚫 Wettbewerbsoffer ausblenden',
  addComparison: 'Wettbewerbsvergläich bäifügen', removeComparison: 'Wettbewerbsvergläich ewechhuelen',
  statusIncomplete: 'Fëllt d’Haaptinputen aus fir d’Solar-Clip-ROI-Kurv ze gesinn.',
  statusNeedCompetitor: 'Gitt d’Detailer vum Wettbewerber an fir e mat Solar Clip ze vergläichen.',
  statusComparisonOn: 'Vergläichsdiagramm fir Solar Clip vs. {name} erstallt.',
  statusComparisonOff: 'Wettbewerbsvergläich ewechgeholl.',
  statusSolo: 'Solar-Clip-ROI-Kurv gëtt ugewisen. Bei Bedarf Vergläich bäifügen.',
  yearsAxis: 'Joer', cashFlowAxis: 'Cashflow (€)', legendSolo: 'Kumulative Solar-Clip-Cashflow (€)',
  yearsShort: 'Joer', never: 'Ni', perYearShort: '/Joer',
  detailTitle: 'Joer', detailAnnual: 'dëst Joer gespuert', detailDelta: 'vs. Wettbewerber',
  compLabel: 'Vergläichsbezeechnung', compGrossCost: 'Brutto Installatiounskäschte vum Wettbewerber (€)', compSubsidy: 'Subventiounsbetrag vum Wettbewerber (€)',
  compProduction: 'Jährlech Sonnenproduktioun vum Wettbewerber kWh/year', compConsumption: 'Jährleche Verbrauch vum Wettbewerber kWh/year',
  compBuying: 'Stroumkaafpräis vum Wettbewerber (€/kWh)', compSelling: 'Stroumverkafpräis / Auspeisungsvergütung vum Wettbewerber (€/kWh)',
  tipProduction: 'Erwaarte Joresproduktioun. Fauschtregel: Kapazitéit (kWp) × ~900–1.100 kWh.',
  tipConsumption: 'Jährleche Stroumverbrauch (kuckt Är Rechnung).',
  tipBuying: 'Präis deen Dir pro kWh aus dem Netz bezuelt.', tipSelling: 'Präis deen Dir pro agespeister kWh kritt.',
  tipGross: 'Gesamtpräis vun der Installatioun viru Subventiounen.', tipSubsidy: 'Total vun den ëffentleche Subventiounen, déi vum Bruttopräis ofgezunn ginn.',
  report: 'Solar PV ROI Bericht', generated: 'Generéiert', investmentSummary: 'Investitiounsresumé', financialResults: 'Finanziell Resultater',
  investmentAnalysis: 'Investitiounsanalys', breakevenPoint: 'Amortisatiounspunkt',
  breakevenText: 'Är Investitioun amortiséiert sech an ongeféier', yearsTail: 'Duerno erzielt Dir positiv Netto Renditen.',
  neverBreakeven: 'Är järlech Erspuernis ass net genuch fir mat den aktuelle Parameteren en Amortisatiounspunkt ze erreechen.',
  outlookYears: '25-Joer Ausbléck', outlookText: 'An 25 Joer wärt Är Sonnenanlag', inTotalSavings: 'Gesamterspuernis generéieren. Nom Ofzug vun den Netto Ufankskäschte vu',
  yourNetProfit: ', ass Äre Netto Gewënn', averageReturn: 'Dëst stellt eng duerchschnëttlech järlech Rendite vu', roi: 'an eng Kapitalrendite vu', roiPeriod: 'iwwer den 25-Joer Zäitraum dar.',
  selfConsumption: 'Eegeverbrauch', selfConsumptionText: 'Är Anlag produzéiert', kwhAnnually: 'kWh pro Joer, mat', consumed: 'direkt verbraucht, wat',
  perYear: 'pro Joer spuert. De Rescht', willBeExported: 'gëtt an d’Netz agespeist fir',
  grossInstallation: 'Brutto Installatiounskäscht', subsidies: 'Subventiounen', netUpfrontCost: 'Netto Ufankskäscht',
  annualSolarProduction: 'Jährlech Sonnenproduktioun', annualHouseholdConsumption: 'Jährleche Verbrauch',
  selfConsumedSolar: 'Eegeverbrauchte Sonnenenergie', exportedSolar: 'Exportéiert Sonnenenergie', buyingPriceLabel: 'Kaafpräis', sellingPriceLabel: 'Verkafpräis', netProfit: 'Netto Gewënn 25 Joer',
  contactInfo: 'Kontaktinformatiounen', aboutApp: 'Iwwer dëse Kalkulator',
  aboutText: 'E gratis Solar ROI Kalkulator fir Iech ze hëllefen, d’finanziell Virdeeler vun enger Solaranlag ze evaluéieren.',
  disclaimer: 'Haftungsausschloss', disclaimerText: 'Dëse Kalkulator bitt Schätzungen nëmmen fir Informatiounszwecker. Consultéiert e Professionnel fir eng exakt Projektbewäertung.',
  copyright: '© 2026 Solar ROI Kalkulator. All Rechter reservéiert.'
  ,applyLanguageToUI: 'Wielt Sprooch op d’UI uwenden'
  ,formula_netUpfront: 'Netto Ufankskäschte = Brutto Installatiounskäschte − Subventiounen'
  ,formula_selfConsumed: 'Eegeverbrauchte Sonnenenergie = min(Jährlech Sonnenproduktioun, {cap}% vum jährleche Konsum)'
  ,formula_exported: 'Exportéiert Sonnenenergie = Jährlech Sonnenproduktioun − Eegeverbrauchte Sonnenenergie'
  ,formula_annualSavings: 'Jährlech Erspuernis = (Eegeverbrauchte Sonnenenergie × Kaafpräis) + (Exportéiert Sonnenenergie × Verkafspreis)'
  ,formula_payback: 'Amortisatiounsdauer = Netto Ufankskäschte / Jährlech Erspuernis'
  ,formula_netProfit25: 'Netto Gewënn (25 Joer) = (Jährlech Erspuernis × 25) − Netto Ufankskäschte'
  ,assump_buyingPrice: 'Präis deen Dir pro kWh aus dem Netz bezuelt.'
  ,assump_production: 'Erwaarte jäerlech Produktioun. Fauschtregel: Kapazitéit (kWp) × ~900–1.100 kWh.'
  ,assump_gross: 'Gesamtpräis vun der Installatioun viru Subventiounen.'
  ,assump_subsidies: 'Total vun den ëffentleche Subventiounen, déi vum Bruttopräis ofgezunn ginn.'
  ,showFormula: 'Formel weisen'
  ,hideFormula: 'Formel verstoppen'
  ,hint_grossCost: 'Gesamtpräis vun der Installatioun viru Subventiounen.'
  ,hint_capacity: 'Nennleeschtung vun der Anlag a Kilowatt-Peak (kWp).'
  ,hint_unitRate: 'Installatiounspräis pro kWp Kapazitéit.'
  ,hint_subsidiesAmount: 'Total vun den ëffentleche Subventiounen, déi vum Bruttopräis ofgezunn ginn.'
  ,hint_subsidiesRate: 'Subventiounsbetrag pro kWp installéiert Kapazitéit.'
  ,hint_annualProduction: 'Erwaarte Joresproduktioun. Fauschtregel: Kapazitéit (kWp) × ~900–1.100 kWh.'
  ,hint_annualConsumption: 'Jährleche Stroumverbrauch (kuckt Är Rechnung).'
  ,hint_buyingPrice: 'Präis deen Dir pro kWh aus dem Netz bezuelt.'
  ,hint_sellingPrice: 'Präis deen Dir pro agespeister kWh kritt.'
  ,hint_selfConsumptionCap: 'Maximalen Undeel vun Ärem Verbrauch, deen d’Solar direkt ofdecke kann (Standard 35 %).'
  ,hint_compSelfConsumptionCap: 'Maximalen Undeel vum Verbrauch, deen d’Solar fir dëst Offer direkt ofdecke kann (Standard 35 %).'
}
};

function t(key) { return translations[currentLanguage][key] || translations.en[key]; }

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  initSliders();
  setupLanguageButtons();
  updatePageLanguage(); // sets all labels, tooltips, dynamic buttons + first calculation
  updateFormulaText(); // initialize formula section in default/formula language
});

// ==================== LANGUAGE ====================
function setupLanguageButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      // When a language is selected, apply it to the whole UI and formula
      formulaLanguage = this.dataset.lang;
      currentLanguage = this.dataset.lang;
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.documentElement.lang = currentLanguage;
      updatePageLanguage();
      updateFormulaText();
    });
  });
}


function updatePageLanguage() {
  document.querySelector('h1').textContent = `☀️ ${t('title')}`;
  document.querySelectorAll('[data-key]').forEach(el => { el.textContent = t(el.dataset.key); });
  document.querySelectorAll('[data-label-key]').forEach(el => { el.textContent = t(el.dataset.labelKey); });
  document.querySelectorAll('.tip').forEach(el => { el.title = t(el.dataset.tipKey); el.setAttribute('aria-label', t(el.dataset.tipKey)); });
  // update dynamic buttons
  refreshDynamicTexts();
  const dl = $('downloadBtn'); if (dl) dl.innerHTML = t('downloadReport');
  updateFormulaToggleText();
  showChartStatus(lastStatus.key, lastStatus.err, lastStatus.name);
  calculateAndDisplay();
}

function updateFormulaToggleText() {
  const btn = $('toggleFormulaBtn'); const section = $('formulaExplanation'); if (!btn) return;
  const visible = section && section.style.display === 'block';
  btn.innerHTML = '📊 ' + (visible ? t('hideFormula') : t('showFormula'));
}

// Update ONLY the formula explanation area according to `formulaLanguage`.
function updateFormulaText() {
  const lang = formulaLanguage || 'en';
  const tr = translations[lang] || translations.en;
  const section = $('formulaExplanation'); if (!section) return;
  const capPct = fmt((parseFloat($('selfConsumptionCap')?.value) || (CONFIG.defaultSelfConsumptionCap * 100)), 0);
  const selfConsumedLine = (tr['formula_selfConsumed'] || '').replace('{cap}', capPct);
  section.innerHTML = `
    <h3>${tr['title'] || translations.en.title} — ${tr['investmentDetails'] || translations.en.investmentDetails}</h3>
    <div class="formula-section">
      <h4>${tr['detailTitle'] || 'Formulas'}</h4>
      <ul>
        <li>${tr['formula_netUpfront']}</li>
        <li>${selfConsumedLine}</li>
        <li>${tr['formula_exported']}</li>
        <li>${tr['formula_annualSavings']}</li>
      </ul>
      <h4>${tr['paybackPeriodLabel'] || 'Payback Period'}</h4>
      <ul>
        <li>${tr['formula_payback']}</li>
        <li>${tr['formula_netProfit25']}</li>
      </ul>
      <h4>${tr['assumptions'] || 'Assumptions'}</h4>
      <ul>
        <li>${tr['assump_buyingPrice']}</li>
        <li>${tr['assump_production']}</li>
        <li>${tr['assump_gross']}</li>
        <li>${tr['assump_subsidies']}</li>
      </ul>
    </div>`;
}
function refreshDynamicTexts() {
  const tg = $('toggleCompetitorBtn');
  if (tg) tg.innerHTML = competitorVisible ? '➖ ' + t('hideCompetitor') : '➕ ' + t('addCompetitor');
  const sc = $('showChartBtn');
  if (sc) sc.innerHTML = compareMode ? '➖ ' + t('removeComparison') : '➕ ' + t('addComparison');
}
function showChartStatus(key, err = false, name = '') {
  lastStatus = { key, err, name };
  const el = $('chartStatus'); if (!el) return;
  el.textContent = t(key).replace('{name}', name || '');
  el.classList.toggle('error', !!err);
}

// ==================== SLIDERS ====================
function initSliders() {
  document.querySelectorAll('input[type="range"][data-for]').forEach(sl => {
    const inp = $(sl.dataset.for); if (!inp) return;
    const sync = () => { sl.value = Math.min(Math.max(inp.value || sl.min, sl.min), sl.max); };
    sync();
    sl.addEventListener('input', () => { inp.value = sl.value; debouncedCalc(); });
    inp.addEventListener('input', sync);
  });
}
const debouncedCalc = debounce(calculateAndDisplay, 120);

// ==================== EVENTS ====================
function initializeEventListeners() {
  document.querySelectorAll('button[data-mode]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('button[data-mode]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      $('grossCostInputs').style.display = this.dataset.mode === 'gross' ? 'block' : 'none';
      $('capacityCostInputs').style.display = this.dataset.mode === 'capacity' ? 'block' : 'none';
      calculateAndDisplay();
    });
  });
  document.querySelectorAll('button[data-subsidy-mode]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('button[data-subsidy-mode]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      $('subsidyGrossInputs').style.display = this.dataset.subsidyMode === 'gross' ? 'block' : 'none';
      $('subsidyCapacityInputs').style.display = this.dataset.subsidyMode === 'capacity' ? 'block' : 'none';
      calculateAndDisplay();
    });
  });
  document.querySelectorAll('input[type="number"], input[type="text"]').forEach(inp => {
    inp.addEventListener('input', debouncedCalc);
    inp.addEventListener('change', calculateAndDisplay);
  });
  // Toggle formula explanation section
  $('toggleFormulaBtn').addEventListener('click', function() {
    const section = $('formulaExplanation');
    const isVisible = section.style.display === 'block';
    section.style.display = isVisible ? 'none' : 'block';
    this.classList.toggle('active', isVisible);
    updateFormulaToggleText();
  });

  // Competitor section toggle (prefills similar default values when opened)
  $('toggleCompetitorBtn').addEventListener('click', function () {
    competitorVisible = !competitorVisible;
    $('competitorOfferSection').style.display = competitorVisible ? 'block' : 'none';
    this.classList.toggle('active', competitorVisible);
    this.setAttribute('aria-expanded', String(competitorVisible));
    if (competitorVisible) prefillCompetitor();
    if (!competitorVisible) compareMode = false;
    refreshDynamicTexts();
    calculateAndDisplay();
  });
  // Chart comparison button (label flips Add ↔ Remove based on compareMode)
  $('showChartBtn').addEventListener('click', () => {
    const roi = calculateROI();
    if (!isChartInputReady(roi)) { showChartStatus('statusIncomplete', true); return; }
    if (compareMode) {                                  // comparing → REMOVE
      compareMode = false;
      refreshDynamicTexts();
      calculateAndDisplay();
      showChartStatus('statusComparisonOff');
      return;
    }
    prefillCompetitor();                                // defaults similar to main offer
    const c = calculateCompetitorROI();
    if (!c.isReady) { showChartStatus('statusNeedCompetitor', true); return; }
    compareMode = true; competitorVisible = true;
    $('competitorOfferSection').style.display = 'block';
    $('toggleCompetitorBtn').classList.add('active');
    $('toggleCompetitorBtn').setAttribute('aria-expanded', 'true');
    refreshDynamicTexts();
    calculateAndDisplay();
  });
  $('downloadBtn').addEventListener('click', downloadPDFReport);
}

// Prefill competitor fields with values similar to the main offer (only empty/zero fields, so edits are never lost)
function prefillCompetitor() {
  const defaults = [
    ['competitorGrossCost',         getGrossCost()],
    ['competitorSubsidy',           getSubsidies()],
    ['competitorAnnualProduction',  num('annualProduction')],
    ['competitorAnnualConsumption', num('annualConsumption')],
    ['competitorBuyingPrice',       num('buyingPrice')],
    ['competitorSellingPrice',      num('sellingPrice')],
    ['competitorSelfConsumptionCap', num('selfConsumptionCap') || 35]
  ];
  defaults.forEach(([id, val]) => {
    const el = $(id);
    if (el && (!el.value || parseFloat(el.value) === 0)) el.value = val;
  });
  const name = $('competitorName');
  if (name && !name.value.trim()) name.value = 'Competitor Offer';
}

// ==================== CALCULATIONS ====================
function isChartInputReady(roi) {
  return (roi.grossCost > 0 || num('capacity') > 0) && num('annualProduction') > 0 &&
         num('annualConsumption') > 0 && num('buyingPrice') > 0 && num('sellingPrice') > 0;
}
function getGrossCost() {
  const mode = document.querySelector('button[data-mode].active').dataset.mode;
  return mode === 'gross' ? num('grossCost') : num('capacity') * num('unitRate');
}
function getSubsidies() {
  const mode = document.querySelector('button[data-subsidy-mode].active').dataset.subsidyMode;
  return mode === 'gross' ? num('subsidyGross') : num('capacity') * num('subsidyRate');
}
function coreCalc(grossCost, subsidies, annualProduction, annualConsumption, buyingPrice, sellingPrice, selfConsumptionCap) {
  const cap = isFinite(selfConsumptionCap) ? selfConsumptionCap : CONFIG.defaultSelfConsumptionCap;
  const netUpfrontCost = grossCost - subsidies;
  const selfConsumedSolar = Math.min(annualProduction, annualConsumption * cap);
  const exportedSolar = Math.max(0, annualProduction - selfConsumedSolar);
  const annualSavings = (selfConsumedSolar * buyingPrice) + (exportedSolar * sellingPrice);
  const paybackPeriod = annualSavings > 0 ? netUpfrontCost / annualSavings : Infinity;
  const netProfit25 = (annualSavings * CONFIG.years) - netUpfrontCost;
  return { grossCost, subsidies, netUpfrontCost, annualProduction, annualConsumption, selfConsumptionCap: cap, selfConsumedSolar, exportedSolar, annualSavings, paybackPeriod, netProfit25, buyingPrice, sellingPrice };
}
function calculateROI() {
  return coreCalc(getGrossCost(), getSubsidies(), num('annualProduction'), num('annualConsumption'), num('buyingPrice'), num('sellingPrice'), capFraction('selfConsumptionCap'));
}
function calculateCompetitorROI() {
  const r = coreCalc(num('competitorGrossCost'), num('competitorSubsidy'), num('competitorAnnualProduction'),
                     num('competitorAnnualConsumption'), num('competitorBuyingPrice'), num('competitorSellingPrice'),
                     capFraction('competitorSelfConsumptionCap'));
  r.name = $('competitorName').value.trim() || 'Competitor Offer';
  r.isReady = r.grossCost > 0 || r.annualProduction > 0 || r.annualConsumption > 0 || r.buyingPrice > 0 || r.sellingPrice > 0;
  return r;
}

// ==================== DISPLAY ====================
function animateValue(el, target, format) {
  if (reduceMotion || !isFinite(target)) { el.textContent = format(target); el._v = target; return; }
  const from = el._v ?? 0, t0 = performance.now(), dur = 450;
  cancelAnimationFrame(el._raf);
  const step = now => {
    const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = format(from + (target - from) * e);
    if (p < 1) el._raf = requestAnimationFrame(step); else el._v = target;
  };
  el._raf = requestAnimationFrame(step);
}
function setQuality(id, q) { const card = $(id).closest('.card'); if (card) card.dataset.quality = q; }

function calculateAndDisplay() {
  updateFormulaText();
  const roi = calculateROI();
  animateValue($('netUpfrontCost'), roi.netUpfrontCost, v => eur(v));
  animateValue($('annualSavings'), roi.annualSavings, v => `${eur(v, 2)} ${t('perYearShort')}`);
  const pb = $('paybackPeriod');
  if (!isFinite(roi.paybackPeriod)) { pb.textContent = t('never'); pb._v = 0; setQuality('paybackPeriod', 'poor'); }
  else {
    animateValue(pb, roi.paybackPeriod, v => `${fmt(v, 2)} ${t('yearsShort')}`);
    setQuality('paybackPeriod', roi.paybackPeriod <= 8 ? 'good' : roi.paybackPeriod <= 13 ? 'ok' : 'poor');
  }
  animateValue($('netProfit25'), roi.netProfit25, v => eur(v));
  setQuality('netProfit25', roi.netProfit25 > 0 ? 'good' : 'poor');

  if (!isChartInputReady(roi)) { showChartStatus('statusIncomplete', true); return; }
  if (compareMode && competitorVisible) {
    const c = calculateCompetitorROI();
    if (!c.isReady) { showChartStatus('statusNeedCompetitor', true); return; }
    refreshChart(roi, c, true);
    showChartStatus('statusComparisonOn', false, c.name);
  } else {
    refreshChart(roi, null, false);
    showChartStatus('statusSolo');
  }
}

// ==================== CHART ====================
const breakevenPlugin = {
  id: 'breakevenLine',
  afterDraw(chart) {
    const year = chart.options.plugins.breakevenLine?.year;
    if (!isFinite(year) || year < 0 || year > CONFIG.years) return;
    const { ctx, chartArea, scales } = chart;
    const lo = Math.floor(year), hi = Math.ceil(year);
    const x = scales.x.getPixelForValue(lo) + (scales.x.getPixelForValue(hi) - scales.x.getPixelForValue(lo)) * (year - lo);
    ctx.save();
    ctx.strokeStyle = '#16a34a'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke();
    ctx.fillStyle = '#16a34a'; ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillText(`⚡ ${t('breakevenPoint')}: ${year.toFixed(1)}`, Math.min(x + 6, chartArea.right - 120), chartArea.top + 14);
    ctx.restore();
  }
};

function series(savings, upfront) {
  const d = [-upfront];
  for (let y = 1; y <= CONFIG.years; y++) d.push(savings * y - upfront);
  return d;
}
function buildConfig(roi, competitorRoi, showComparison, exportMode = false) {
  const mk = (label, data, color, fill) => ({
    label, data, borderColor: color, backgroundColor: fill || 'transparent',
    borderWidth: 3, fill: !!fill, tension: 0.4,
    pointRadius: exportMode ? 0 : 4, pointBackgroundColor: color, pointBorderColor: '#fff',
    pointBorderWidth: 2, pointHoverRadius: 7
  });
  const datasets = (showComparison && competitorRoi)
    ? [mk('Solar Clip', series(roi.annualSavings, roi.netUpfrontCost), '#bf1124'),
       mk(competitorRoi.name, series(competitorRoi.annualSavings, competitorRoi.netUpfrontCost), '#2563eb')]
    : [mk(t('legendSolo'), series(roi.annualSavings, roi.netUpfrontCost), '#bf1124', 'rgba(191,17,36,0.1)')];
  return {
    type: 'line',
    data: { labels: Array.from({ length: CONFIG.years + 1 }, (_, i) => i), datasets },
    options: {
      responsive: !exportMode, maintainAspectRatio: false,
      animation: exportMode ? false : { duration: 300 },
      onClick: exportMode ? undefined : (e, els) => { if (els.length) showYearDetail(e.chart, els[0].index); },
      plugins: {
        breakevenLine: { year: roi.paybackPeriod },
        legend: { labels: { font: { size: 13, weight: 'bold' }, color: '#333', padding: 12 } },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${eur(c.parsed.y)}` } }
      },
      scales: {
        x: { title: { display: true, text: t('yearsAxis'), font: { size: 13, weight: 'bold' }, color: '#333' }, ticks: { color: '#666' }, grid: { color: 'rgba(0,0,0,0.05)' } },
        y: { title: { display: true, text: t('cashFlowAxis'), font: { size: 13, weight: 'bold' }, color: '#333' }, ticks: { color: '#666', callback: v => eur(v) }, grid: { color: 'rgba(0,0,0,0.05)' } }
      }
    },
    plugins: [breakevenPlugin]
  };
}
function refreshChart(roi, comp, show) {
  const canvas = $('cashFlowChart'); if (!canvas) return;
  if (!cashFlowChart) {
    cashFlowChart = new Chart(canvas.getContext('2d'), buildConfig(roi, comp, show));
  } else {
    const cfg = buildConfig(roi, comp, show);
    cashFlowChart.data = cfg.data; // in-place update, no destroy/recreate
    cashFlowChart.options.plugins.breakevenLine.year = roi.paybackPeriod;
    cashFlowChart.options.scales.x.title.text = t('yearsAxis');
    cashFlowChart.options.scales.y.title.text = t('cashFlowAxis');
    cashFlowChart.update();
  }
}
function showYearDetail(chart, idx) {
  const d0 = chart.data.datasets[0].data;
  const cum = d0[idx], annual = idx > 0 ? d0[idx] - d0[idx - 1] : 0;
  let html = `<strong>${t('detailTitle')} ${idx}:</strong> ${eur(cum)} · ${eur(annual)} ${t('detailAnnual')}`;
  if (chart.data.datasets[1]) html += ` · ${t('detailDelta')}: ${eur(d0[idx] - chart.data.datasets[1].data[idx])}`;
  const el = $('yearDetail');
  el.innerHTML = html; el.classList.add('visible');
}
function renderChartImage(roi, comp, show) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600; canvas.height = 900;
  const chart = new Chart(canvas.getContext('2d'), buildConfig(roi, comp, show, true));
  const url = canvas.toDataURL('image/png');
  chart.destroy();
  return url;
}

// ==================== PDF ====================
function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
async function downloadPDFReport() {
  try {
    const { jsPDF } = window.jspdf;
    const roi = calculateROI();
    const competitorRoi = calculateCompetitorROI();
    const includeCompetitor = competitorVisible && compareMode && competitorRoi.isReady;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 15;
    const logoImg = await loadImage('SolarClip-Lightweight-Solutions_rgb_color.png');
    if (logoImg) {
      const w = 35, h = w * (logoImg.height / logoImg.width);
      pdf.addImage(logoImg, 'PNG', (pageWidth - w) / 2, yPos, w, h);
      yPos += h + 8;
    }
    addReportContent(pdf, roi, competitorRoi, includeCompetitor, yPos, pageWidth, pageHeight);
  } catch (error) {
    console.error('PDF error:', error);
    alert('Error generating PDF: ' + error.message);
  }
}
function addReportContent(pdf, roi, competitorRoi, includeCompetitor, startY, pageWidth, pageHeight) {
  let yPos = startY;
  const row = (a, b) => { pdf.text(a, 20, yPos); pdf.text(b, 150, yPos, { align: 'right' }); yPos += 6; };
  const section = title => { pdf.setFontSize(12); pdf.setFont(undefined, 'bold'); pdf.setTextColor(50, 50, 50); pdf.text(title, 15, yPos); yPos += 8; pdf.setFontSize(9); pdf.setFont(undefined, 'normal'); };

  pdf.setFontSize(20); pdf.setFont(undefined, 'bold'); pdf.setTextColor(220, 20, 60);
  pdf.text(t('report'), pageWidth / 2, yPos, { align: 'center' }); yPos += 10;
  pdf.setFontSize(10); pdf.setFont(undefined, 'normal'); pdf.setTextColor(100, 100, 100);
  pdf.text(`${t('generated')}: ${new Date().toLocaleDateString(LOCALES[currentLanguage], { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPos, { align: 'center' }); yPos += 12;

  section(t('investmentSummary'));
  [[t('grossInstallation'), eur(roi.grossCost, 2)], [t('subsidies'), eur(roi.subsidies, 2)], [t('netUpfrontCost'), eur(roi.netUpfrontCost, 2)],
   [t('annualSolarProduction'), `${fmt(roi.annualProduction, 2)} kWh/year`], [t('annualHouseholdConsumption'), `${fmt(roi.annualConsumption, 2)} kWh/year`],
   [t('selfConsumedSolar'), `${fmt(roi.selfConsumedSolar, 2)} kWh/year`], [t('exportedSolar'), `${fmt(roi.exportedSolar, 2)} kWh/year`]].forEach(r => row(r[0], r[1]));
  yPos += 5;

  section(t('financialResults'));
  [[t('buyingPriceLabel'), `€ ${fmt(roi.buyingPrice, 2)} /kWh`], [t('sellingPriceLabel'), `€ ${fmt(roi.sellingPrice, 2)} /kWh`],
   [t('annualSavingsLabel'), eur(roi.annualSavings, 2)],
   [t('paybackPeriodLabel'), isFinite(roi.paybackPeriod) ? `${fmt(roi.paybackPeriod, 2)} ${t('yearsShort')}` : t('never')],
   [t('netProfit'), eur(roi.netProfit25, 2)]].forEach(r => row(r[0], r[1]));
  yPos += 8;

  section(t('investmentAnalysis'));
  pdf.setTextColor(70, 70, 70);
  const be = isFinite(roi.paybackPeriod)
    ? `${t('breakevenPoint')}: ${t('breakevenText')} ${roi.paybackPeriod.toFixed(1)} ${t('yearsShort')}. ${t('yearsTail')}`
    : `${t('breakevenPoint')}: ${t('neverBreakeven')}`;
  let lines = pdf.splitTextToSize(be, pageWidth - 30);
  pdf.text(lines, 15, yPos); yPos += lines.length * 5 + 3;

  const roiPct = roi.netUpfrontCost > 0 ? `${((roi.netProfit25 / roi.netUpfrontCost) * 100).toFixed(1)}%` : '—';
  const an = `${t('outlookYears')}: ${t('outlookText')} ${eur(roi.annualSavings * CONFIG.years)} ${t('inTotalSavings')} ${eur(roi.netUpfrontCost)}${t('yourNetProfit')} ${eur(roi.netProfit25)}. ${t('averageReturn')} ${eur(roi.annualSavings, 2)} ${t('roi')} ${roiPct} ${t('roiPeriod')}`;
  lines = pdf.splitTextToSize(an, pageWidth - 30);
  pdf.text(lines, 15, yPos); yPos += lines.length * 5 + 3;

  if (includeCompetitor) {
    section(`Solar Clip vs ${competitorRoi.name}`);
    pdf.setTextColor(70, 70, 70);
    const pb = r => isFinite(r.paybackPeriod) ? `${r.paybackPeriod.toFixed(1)} ${t('yearsShort')}` : t('never');
    [[`Solar Clip — ${t('annualSavingsLabel')}`, eur(roi.annualSavings, 2)], [`${competitorRoi.name} — ${t('annualSavingsLabel')}`, eur(competitorRoi.annualSavings, 2)],
     [`Solar Clip — ${t('netProfit')}`, eur(roi.netProfit25, 2)], [`${competitorRoi.name} — ${t('netProfit')}`, eur(competitorRoi.netProfit25, 2)],
     [`Solar Clip — ${t('paybackPeriodLabel')}`, pb(roi)], [`${competitorRoi.name} — ${t('paybackPeriodLabel')}`, pb(competitorRoi)]].forEach(r => row(r[0], r[1]));
    yPos += 5;
  }

  const rate = roi.annualProduction > 0 ? ((roi.selfConsumedSolar / roi.annualProduction) * 100).toFixed(1) : '0.0';
  const ct = `${t('selfConsumption')}: ${t('selfConsumptionText')} ${fmt(roi.annualProduction, 2)} ${t('kwhAnnually')} ${rate}% (${fmt(roi.selfConsumedSolar, 2)} kWh/year) ${t('consumed')} ${eur(roi.selfConsumedSolar * roi.buyingPrice, 2)} ${t('perYear')} ${(100 - rate).toFixed(1)}% ${t('willBeExported')} ${eur(roi.exportedSolar * roi.sellingPrice, 2)}.`;
  lines = pdf.splitTextToSize(ct, pageWidth - 30);
  pdf.text(lines, 15, yPos); yPos += lines.length * 5 + 8;

  pdf.setDrawColor(220, 20, 60); pdf.setLineWidth(0.5); pdf.line(15, yPos, pageWidth - 15, yPos); yPos += 8;
  pdf.setFontSize(11); pdf.setFont(undefined, 'bold'); pdf.setTextColor(220, 20, 60);
  pdf.text(t('contactInfo'), 15, yPos); yPos += 6;
  pdf.setFontSize(9); pdf.setFont(undefined, 'normal'); pdf.setTextColor(100, 100, 100);
  pdf.text('Email: info@clearnanotech.com', 20, yPos); yPos += 8;
  pdf.setFont(undefined, 'bold'); pdf.setTextColor(50, 50, 50);
  pdf.text(pdf.splitTextToSize(`${t('disclaimer')}: ${t('disclaimerText')}`, pageWidth - 30), 15, yPos);

  // Page 2: chart rendered offscreen at high resolution (no on-screen jump)
  pdf.addPage();
  pdf.setFontSize(14); pdf.setFont(undefined, 'bold'); pdf.setTextColor(220, 20, 60);
  pdf.text(t('cashFlowChart'), 15, 15);
  try {
    const imgData = renderChartImage(roi, includeCompetitor ? competitorRoi : null, includeCompetitor);
    const w = pageWidth - 30, h = Math.min(pageHeight * 0.78, (900 / 1600) * w);
    pdf.addImage(imgData, 'PNG', 15, 25, w, h);
  } catch (err) { console.error('Chart capture error:', err); }
  pdf.save(`Solar-ROI-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}