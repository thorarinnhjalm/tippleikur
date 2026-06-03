// Vercel serverless function - keyrir á 5 mínútna fresti
// Sækir niðurstöður frá ESPN og skrifar í Supabase

const SUPABASE_URL      = 'https://xfbdylbwrxanesjesfsp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYmR5bGJ3cnhhbmVzamVzZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTQ1NDAsImV4cCI6MjA5NjA3MDU0MH0.eZHu6UCXt5ooEXQXTophn25YKgF0TTlrfgLkHAiGkbY';

// ESPN enska nöfn → íslenska nöfn í appinu
const EN_TO_IS = {
  'Mexico': 'Mexíkó',
  'Jamaica': 'Jamaíka',
  'Poland': 'Pólland',
  'Australia': 'Ástralía',
  'United States': 'BNA',
  'USA': 'BNA',
  'Panama': 'Panama',
  'Morocco': 'Marokkó',
  'Japan': 'Japan',
  'Canada': 'Kanada',
  'Honduras': 'Hondúras',
  'Portugal': 'Portúgal',
  'South Korea': 'Suður-Kórea',
  'Korea Republic': 'Suður-Kórea',
  'Argentina': 'Argentína',
  'Bolivia': 'Bólivía',
  'Nigeria': 'Nígería',
  'Hungary': 'Ungverjaland',
  'Brazil': 'Brasilía',
  'Trinidad & Tobago': 'Trínidad og Tóbagó',
  'Trinidad and Tobago': 'Trínidad og Tóbagó',
  'Denmark': 'Danmörk',
  'IR Iran': 'Íran',
  'Iran': 'Íran',
  'Colombia': 'Kólumbía',
  'Costa Rica': 'Kostaríka',
  'Spain': 'Spánn',
  'Algeria': 'Alsír',
  'Uruguay': 'Úrúgvæ',
  'El Salvador': 'El Salvador',
  'England': 'England',
  'Senegal': 'Senegal',
  'Ecuador': 'Ekvador',
  'New Zealand': 'Nýja-Sjáland',
  'France': 'Frakkland',
  'Saudi Arabia': 'Sádi-Arabía',
  'Venezuela': 'Venesúela',
  'Uzbekistan': 'Úsbekistan',
  'Germany': 'Þýskaland',
  'Cameroon': 'Kamerún',
  'Chile': 'Síle',
  'Indonesia': 'Indónesía',
  'Netherlands': 'Holland',
  "Côte d'Ivoire": 'Fílabeinsströndin',
  'Ivory Coast': 'Fílabeinsströndin',
  'Paraguay': 'Paragvæ',
  'Oman': 'Óman',
  'Switzerland': 'Sviss',
  'Tunisia': 'Túnis',
  'Peru': 'Perú',
  'Serbia': 'Serbía',
  'Belgium': 'Belgía',
  'Ghana': 'Gana',
};

const ALL_MATCHES = [
  {id:'A1', home:'Mexíkó', away:'Jamaíka'}, {id:'A2', home:'Pólland', away:'Ástralía'},
  {id:'A3', home:'Mexíkó', away:'Pólland'}, {id:'A4', home:'Jamaíka', away:'Ástralía'},
  {id:'A5', home:'Ástralía', away:'Mexíkó'}, {id:'A6', home:'Jamaíka', away:'Pólland'},
  {id:'B1', home:'BNA', away:'Panama'}, {id:'B2', home:'Marokkó', away:'Japan'},
  {id:'B3', home:'BNA', away:'Marokkó'}, {id:'B4', home:'Panama', away:'Japan'},
  {id:'B5', home:'Japan', away:'BNA'}, {id:'B6', home:'Panama', away:'Marokkó'},
  {id:'C1', home:'Kanada', away:'Hondúras'}, {id:'C2', home:'Portúgal', away:'Suður-Kórea'},
  {id:'C3', home:'Kanada', away:'Portúgal'}, {id:'C4', home:'Hondúras', away:'Suður-Kórea'},
  {id:'C5', home:'Suður-Kórea', away:'Kanada'}, {id:'C6', home:'Hondúras', away:'Portúgal'},
  {id:'D1', home:'Argentína', away:'Bólivía'}, {id:'D2', home:'Nígería', away:'Ungverjaland'},
  {id:'D3', home:'Argentína', away:'Nígería'}, {id:'D4', home:'Bólivía', away:'Ungverjaland'},
  {id:'D5', home:'Ungverjaland', away:'Argentína'}, {id:'D6', home:'Bólivía', away:'Nígería'},
  {id:'E1', home:'Brasilía', away:'Trínidad og Tóbagó'}, {id:'E2', home:'Danmörk', away:'Íran'},
  {id:'E3', home:'Brasilía', away:'Danmörk'}, {id:'E4', home:'Trínidad og Tóbagó', away:'Íran'},
  {id:'E5', home:'Íran', away:'Brasilía'}, {id:'E6', home:'Trínidad og Tóbagó', away:'Danmörk'},
  {id:'F1', home:'Kólumbía', away:'Kostaríka'}, {id:'F2', home:'Spánn', away:'Alsír'},
  {id:'F3', home:'Kólumbía', away:'Spánn'}, {id:'F4', home:'Kostaríka', away:'Alsír'},
  {id:'F5', home:'Alsír', away:'Kólumbía'}, {id:'F6', home:'Kostaríka', away:'Spánn'},
  {id:'G1', home:'Úrúgvæ', away:'El Salvador'}, {id:'G2', home:'England', away:'Senegal'},
  {id:'G3', home:'Úrúgvæ', away:'England'}, {id:'G4', home:'El Salvador', away:'Senegal'},
  {id:'G5', home:'Senegal', away:'Úrúgvæ'}, {id:'G6', home:'El Salvador', away:'England'},
  {id:'H1', home:'Ekvador', away:'Nýja-Sjáland'}, {id:'H2', home:'Frakkland', away:'Sádi-Arabía'},
  {id:'H3', home:'Ekvador', away:'Frakkland'}, {id:'H4', home:'Nýja-Sjáland', away:'Sádi-Arabía'},
  {id:'H5', home:'Sádi-Arabía', away:'Ekvador'}, {id:'H6', home:'Nýja-Sjáland', away:'Frakkland'},
  {id:'I1', home:'Venesúela', away:'Úsbekistan'}, {id:'I2', home:'Þýskaland', away:'Kamerún'},
  {id:'I3', home:'Venesúela', away:'Þýskaland'}, {id:'I4', home:'Úsbekistan', away:'Kamerún'},
  {id:'I5', home:'Kamerún', away:'Venesúela'}, {id:'I6', home:'Úsbekistan', away:'Þýskaland'},
  {id:'J1', home:'Síle', away:'Indónesía'}, {id:'J2', home:'Holland', away:'Fílabeinsströndin'},
  {id:'J3', home:'Síle', away:'Holland'}, {id:'J4', home:'Indónesía', away:'Fílabeinsströndin'},
  {id:'J5', home:'Fílabeinsströndin', away:'Síle'}, {id:'J6', home:'Indónesía', away:'Holland'},
  {id:'K1', home:'Paragvæ', away:'Óman'}, {id:'K2', home:'Sviss', away:'Túnis'},
  {id:'K3', home:'Paragvæ', away:'Sviss'}, {id:'K4', home:'Óman', away:'Túnis'},
  {id:'K5', home:'Túnis', away:'Paragvæ'}, {id:'K6', home:'Óman', away:'Sviss'},
  {id:'L1', home:'Perú', away:'Serbía'}, {id:'L2', home:'Belgía', away:'Gana'},
  {id:'L3', home:'Perú', away:'Belgía'}, {id:'L4', home:'Serbía', away:'Gana'},
  {id:'L5', home:'Gana', away:'Perú'}, {id:'L6', home:'Serbía', away:'Belgía'},
  // Úrslitaleikir (liðin eru TBD þar til þeir eru þekktir)
  {id:'R1', home:'TBD', away:'TBD'}, {id:'R2', home:'TBD', away:'TBD'},
  {id:'R3', home:'TBD', away:'TBD'}, {id:'R4', home:'TBD', away:'TBD'},
  {id:'R5', home:'TBD', away:'TBD'}, {id:'R6', home:'TBD', away:'TBD'},
  {id:'R7', home:'TBD', away:'TBD'}, {id:'R8', home:'TBD', away:'TBD'},
  {id:'R9', home:'TBD', away:'TBD'}, {id:'R10', home:'TBD', away:'TBD'},
  {id:'R11', home:'TBD', away:'TBD'}, {id:'R12', home:'TBD', away:'TBD'},
  {id:'R13', home:'TBD', away:'TBD'}, {id:'R14', home:'TBD', away:'TBD'},
  {id:'R15', home:'TBD', away:'TBD'}, {id:'R16', home:'TBD', away:'TBD'},
  {id:'QF1', home:'TBD', away:'TBD'}, {id:'QF2', home:'TBD', away:'TBD'},
  {id:'QF3', home:'TBD', away:'TBD'}, {id:'QF4', home:'TBD', away:'TBD'},
  {id:'QF5', home:'TBD', away:'TBD'}, {id:'QF6', home:'TBD', away:'TBD'},
  {id:'QF7', home:'TBD', away:'TBD'}, {id:'QF8', home:'TBD', away:'TBD'},
  {id:'SF1', home:'TBD', away:'TBD'}, {id:'SF2', home:'TBD', away:'TBD'},
  {id:'SF3', home:'TBD', away:'TBD'}, {id:'SF4', home:'TBD', away:'TBD'},
  {id:'3RD', home:'TBD', away:'TBD'}, {id:'FIN', home:'TBD', away:'TBD'},
];

function isName(team, isName) {
  if (!team) return false;
  return (
    EN_TO_IS[team.displayName] === isName ||
    EN_TO_IS[team.shortDisplayName] === isName ||
    EN_TO_IS[team.name] === isName ||
    EN_TO_IS[team.abbreviation] === isName
  );
}

async function sbUpsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase ${table}: ${res.status} ${txt}`);
  }
}

async function fetchDay(dateStr) {
  // dateStr: YYYYMMDD
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.events || [];
}

export default async function handler(req, res) {
  const today = new Date();
  const dates = [];
  // Sækjum leiki 2 dagar aftur og 1 dag fram á við
  for (let i = -2; i <= 1; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
  }

  let updatedResults = 0;
  let updatedTeams = 0;
  const errors = [];

  for (const date of dates) {
    try {
      const events = await fetchDay(date);

      for (const event of events) {
        const comp = event.competitions?.[0];
        if (!comp) continue;

        const homeComp = comp.competitors?.find(c => c.homeAway === 'home');
        const awayComp = comp.competitors?.find(c => c.homeAway === 'away');
        if (!homeComp || !awayComp) continue;

        const homeTeam = homeComp.team;
        const awayTeam = awayComp.team;

        const homeName = EN_TO_IS[homeTeam?.displayName] || EN_TO_IS[homeTeam?.shortDisplayName] || EN_TO_IS[homeTeam?.name];
        const awayName = EN_TO_IS[awayTeam?.displayName] || EN_TO_IS[awayTeam?.shortDisplayName] || EN_TO_IS[awayTeam?.name];

        // Uppfærum knockout liðanöfn þegar þau eru þekkt
        if (homeName && awayName) {
          const koMatch = ALL_MATCHES.find(m =>
            m.home === 'TBD' && m.away === 'TBD' &&
            ['R','QF','SF','3RD','FIN'].some(p => m.id.startsWith(p))
          );
          // Leita að leik með þessum nöfnum (group stage eða þekkt knockout)
          const knownMatch = ALL_MATCHES.find(m =>
            m.home === homeName && m.away === awayName
          );

          // Ef þetta er úrslit leikur sem við þekkjum ekki enn
          if (!knownMatch && homeName && awayName) {
            // Prófum að finna eftir ESPN event id í knockout_teams
            // (þetta þarf meiri vinna - einfaldlega geymum við ESPNs id → okkar id mapping)
          }

          // Uppfærum niðurstöður ef leikur er lokinn
          if (comp.status?.type?.completed && knownMatch) {
            const homeScore = parseInt(homeComp.score ?? '0');
            const awayScore = parseInt(awayComp.score ?? '0');
            let result;
            if (homeScore > awayScore) result = '1';
            else if (homeScore === awayScore) result = 'X';
            else result = '2';

            await sbUpsert('results', {
              match_id: knownMatch.id,
              result,
              updated_at: new Date().toISOString(),
            });
            updatedResults++;
          }
        }
      }
    } catch (e) {
      errors.push({ date, error: e.message });
      console.error(`Villa við ${date}:`, e);
    }
  }

  return res.status(200).json({
    ok: true,
    updatedResults,
    updatedTeams,
    dates,
    errors,
    timestamp: new Date().toISOString(),
  });
}
