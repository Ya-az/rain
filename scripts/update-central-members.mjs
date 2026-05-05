// Update Central team docs in Firestore with coach + member data.
// Match teams by normalized name (region = Central). Reports unmatched.
//
// Run with:  node scripts/update-central-members.mjs [--dry]

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry');

const cfgSrc = readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');
const m = cfgSrc.match(/firebaseConfig\s*=\s*(\{[\s\S]*?\});/);
const firebaseConfig = eval('(' + m[1] + ')');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
await signInAnonymously(getAuth(app));

// ── Roster from user. Each entry: [name, coach|null, [members...]]
//    null coach or [] members → leave as-is on the team (coach='—', members=[]).
const ROSTER = [
  ['Dash Bots', 'باسل يحيى المرهون', ['آلاء يحيى المرهون', 'ديم دخيل المطيري']],
  ['BTG020', 'هند عبدالله الشتوي', ['رتاج الحميدي الحربي', 'صبا عبدالمحسن النويصر', 'ريتاج ابراهيم التويجري']],
  ['Falcons', 'بدر ظافر الأسمري', ['عمار ياسر الأسمري', 'حسن عبدالله الأسمري', 'ياسر الحميدي السبيعي', 'يوسف فهد العتيبي']],
  ['فالكون', 'افراح عامر المطيري', ['وديم صالح الجلعود', 'دانا ماجد اليحيى', 'سندس غرم القحطاني']],
  ['Digital Stars', 'د. ابتهال أحمد العبلاني', ['مروة عبدالله سبعي', 'دانا محمد العنزي', 'جنى علي آل زيدان', 'ريفال منصور العصيمي']],
  ['CodeStorm', 'سليمان علي الزعبي', ['فارس فهد الحسين', 'جود احمد عمارنه', 'ريان مروان قاضي', 'عمر زياد الحصين']],
  ['Noble coders', 'نهى عبدالله المساعد', ['شوق سعد العتيبي', 'حورية بطي العتيبي', 'ساره ناصر الحمالي', 'ألين سعيد الغامدي']],
  ['Mayasin Robot', 'يوسف سباعنه', ['خالد تركي آل سعود', 'ابراهيم سليمان الزويد', 'فيصل عثمان القاسم', 'صالح ممدوح التميمي']],
  ['Vision', 'نوره فرحان الشمري', ['عبدالرحمن بدر السبيعي', 'ريما خليل الفارس', 'حصة طارق البليهد', 'مزون سالم اشرف']],
  ['Al-Namothajiyah Eagles', 'مصطفى اسماعيل امين', ['عبدالعزيز عليان العنزي', 'عبدالله فواز العيبان']],
  ['Atyab future', 'عبد الرحمن بن عادل حسن', ['صالح أحمد الحمود', 'عبد الله محمد العميم', 'عبد الوهاب عبد العزيز الحبيشي']],
  ['Youth Dreams', 'محمد العايد', ['محمد ثامر فهد الحارثي', 'ياسر منيف المطيري', 'كرم  مهند العطار']],
  ['YouthDreams', 'محمد العايد', ['محمد ثامر فهد الحارثي', 'ياسر منيف المطيري', 'كرم  مهند العطار']],
  ['TNIS infinity', 'أميرة محمد إسماعيل عبدالقادر', ['دينا محمد عبدالله الخليفة', 'يارا صالح ناصر الزغيبي', 'رنا نبيل فضي الحربي', 'دانية مصطفى المشهدي']],
  ['The system league', 'وئام عباس', ['ديالا سعد عسيري', 'قوت عبدالكريم المطيري', 'اميرة ذيب القحطاني', 'الجوهرة حسن الشهري']],
  ['TNISArid', 'محمد حسن الجعفيل', ['مشعل محمد الشريف', 'محمد عبدلله عمري', 'نواف عبدلله الجذلاني', 'سليمان عبدلله العمرو']],
  ['RNS National', 'أحمد حامد العوضي', ['نواف محمد  علي الضويلع', 'زياد مازن سليمان الصغير']],
  ['النبلاء', 'سارة محمد آل سليمان', ['نجد فيصل الحارثي', 'جنى فيصل العتيبي', 'طرفة ابراهيم بن هزاع', 'شوق هلال آل داود']],
  ['Kingdom Innovators', 'Marouaa Yakhlef', ['Ghalia Bakhsh', 'Zehra Tashkandi', 'Muneera Alfadhel', 'Majida Al sheikh']],
  ['ابطال التربية', 'هيفاء محمد القحطاني', ['جنى عبدالعزيز باوزير', 'جنى عبدالله المعثم', 'جوري عزيز الخثعمي']],
  ['TNIS The Falcons Team', 'بدر ظافر الأسمري', ['عمار ياسر الأسمري', 'حسن عبدالله الأسمري', 'ياسر الحميدي السبيعي', 'يوسف فهد العتيبي']],
  ['AlFaris Robo Knights', 'هبة الله اخلاصي', ['علي حسان حلاوي', 'احمد بن ابراهيم اليحيى', 'عبدالرحمن بن ابراهيم اليحيى', 'آدم ابراهيم جرادي']],
  ['RNS Tech Stars', 'أحمد حامد العوضي', ['خالد يوسف العقيل', 'حمد عبدالرحمن حمد بن خصيب', 'أنمار عماد عبدالرزاق خوجه']],
  ['فريق الروبوت الآلي', 'سارة زيد القحطاني', ['ريهام بدر المالكي', 'شادن مانع القحطاني', 'لجين فداع الشمري', 'موضي فهد الدحام']],
  ['مبتكرات الغد', 'أروى حسن حُمدي', ['نورة عبدالله التركي', 'غاليه مشاري الشارخ', 'نورة عمر الحسيني']],
  ['RNS-TECHNOBOTS', 'QAYS BOUJNAH', ['فهد ناصر العقيل', 'عبد الرحمن انديجاني', 'خالد سعيد السبيعي', 'ميار خالد رمضان']],
  ['RoboAlGhad', 'سجى هلال ال هليل', ['هيفاء طارق السويلم', 'رسيل محمد القحطاني', 'ريما محمد الشهري']],
  ['عبد الله بن أبي أوفى', 'عبدالله بن سالم البقمي', ['سعود محمد نغيمش العنزي', 'صالح مبارك حسن الدوسري']],
  ['ربورت الإبداع', 'نجاح المطيري', ['الجوهرة عبدالله العثمان', 'ساره عبدالله العثمان', 'صبا عبدالله العصيمي', 'ريتال عبداللطيف العقيفي']],
  ['Thunder', 'نور ماهر فارس', ['شوق فيصل العتيبي', 'جودي عبدالرحمن الثبيتي', 'هيفاء نايف الماضي']],
  ['قد التحدي', 'خزنه الرويس', ['غيداء محمد العتيبي', 'دانيه احمد الجهني', 'ايلاف مازن النخلي', 'شهد ناصر الهويسين']],
  ['طويق', 'نايف موسى معشي', ['خالد سليمان الحربي', 'عبد الرحمن منصور السليماني', 'هادي محمد عاتي', 'سالم محمد القحطاني']],
  ['Dash-19', 'احلام ابراهيم المسلماني', ['لمى مقرن المقرن', 'جودي محمد الجارالله', 'ريوف عبدالعزيز الحمود']],
  ['فريق أبطال زينب بنت عمر', 'أحلام محمد القحطاني', ['حور وحيد الزهراني', 'بيسان سعيد الغامدي', 'وجود صلاح البيشي', 'ديما ناصر القحطاني']],
  ['الاسطورة', 'مها علي النملة', ['ليان فهد الشهري', 'حصه محمد  آل خليفه', 'غزل بنت فهد ب العنزي', 'ساره عبدالرحمن السلطان']],
  ['Vision Makers', 'نوره فرحان الشمري', ['عبدالرحمن بدر السبيعي', 'ريما خليل الفارس', 'حصة طارق البليهد', 'مزون سالم اشرف']],
  ['فريق ريادة الأعمال للبنات', 'شيخة مطلق عبدالله المطلق', ['نايفه الحميدي', 'ديالا القصير', 'ريلام ابو حميد', 'ترف المطيري']],
  ['العباقرة', 'محمد احمد الغامدي', ['قصي احمد الاشقر', 'نجم الدين اسامه']],
  ['Kingdom Code', 'مروءة "محمد مهدي" يخلف', ['Yasmeen Turabulsi', 'Joanna Banabella', 'Latifa Alsheikh', 'Salma Alnaser']],
  ['Mayasin Robo', 'يوسف سباعنه', ['خالد تركي آل سعود', 'ابراهيم سليمان الزويد', 'فيصل عثمان القاسم', 'صالح ممدوح التميمي']],
  ['فريق المسار الذكي', 'سوسن خالد الهويشل', ['لمى سلطان الحارثي', 'فخر سلطان العتيبي', 'فاطمة سعد الدوسري', 'ترف هادي الدوسري']],
  ['فريق الأفق', 'نهى محمد الصالح', ['ريما محمد المشاري', 'علياء بدر الشيحة', 'دارين مطلق العتيبي', 'غناة عبدالله البديعة']],
  ['Tuwaiq Falcons', 'نواف كمال مسفر المالكي', ['محمد مازن الشريف', 'رائد سعود العتيبي', 'فيصل خالد الشهراني', 'محمد عبدالعزيز الراشد']],
  ['Nobala programmers', 'ميادة فهد عبدالله المريشد', ['دانه عبدالله البريك', 'ريماس علي الغامدي', 'لجين عبداللطيف الماص', 'ديما حمد ال حمدان']],
  ['viperX', 'هالة عبد الفتاح ابوقياص', ['رواء ممدوح الحريري', 'جويرية اسامه الحرفوش']],
  ['رواد الابتكار', 'بسمة هشام كامل', ['ريف أحمد العامر', 'دانة جعفر الزهراني', 'دانة بدر القحطاني', 'نورة بدر القحطاني']],
  ['The Next Step (256)', 'وجدان متعب العتيبي', ['داليا سالم الشهري', 'هناء عبدالله الشهراني']],
  ['The Next Step (257)', 'وجدان متعب العتيبي', ['داليا سالم الشهري', 'هناء عبدالله الشهراني']],
  ['AlFaris Olympians', 'هبة نهاد اخلاصي', ['دانه نهار إبراهيم الأحمدي', 'راية مهند حسن أبوحسين', 'ريما عبدالعزيز السواح', 'تالا احمد عبد سمور']],
  // Stars of knowledge — admin name is "Stars of knowledge - مياسين" (canonical t_central_224)
  ['Stars of knowledge - مياسين', null, []],
  // Renamed canonical t_central_225 from "اااا" → "1111"
  ['1111', null, []],
];

const norm = (s) => (s || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

const teamsSnap = await getDocs(collection(db, 'teams'));
const central = teamsSnap.docs
  .map(d => d.data())
  .filter(t => t.region === 'Central');
const byName = new Map();
for (const t of central) {
  const k = norm(t.name);
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(t);
}

const updates = [];
const unmatched = [];
const ambiguous = [];

for (const [name, coachName, memberNames] of ROSTER) {
  const matches = byName.get(norm(name)) || [];
  if (matches.length === 0) { unmatched.push(name); continue; }
  if (matches.length > 1) ambiguous.push(`${name} → ${matches.map(t => t.id).join(', ')}`);
  // Apply update to ALL matches with the same name (covers same team in two
  // categories — they share the same team doc anyway, but if multiple docs
  // exist we update them all to keep things consistent).
  for (const team of matches) {
    const members = memberNames.map((memberName, i) => ({
      id: `m_${team.id}_${i + 1}`,
      name: memberName,
      // Preserve existing presence if a member with the same name already exists.
      present: (team.members || []).find(em => norm(em.name) === norm(memberName))?.present || false,
    }));
    const coach = {
      name: coachName || team.coach?.name || '—',
      present: team.coach?.present || false,
    };
    updates.push({ id: team.id, patch: { coach, members } });
  }
}

console.log(`Roster entries: ${ROSTER.length}`);
console.log(`Will update: ${updates.length} team doc(s)`);
if (ambiguous.length) console.log(`Ambiguous (updated all): ${ambiguous.length}\n  - ${ambiguous.join('\n  - ')}`);
if (unmatched.length) console.log(`UNMATCHED (skipped): ${unmatched.length}\n  - ${unmatched.join('\n  - ')}`);

if (DRY) { console.log('\n[dry-run] no writes performed.'); process.exit(0); }

// Write in chunks of 400 to stay under Firestore's 500-op batch limit.
let i = 0;
while (i < updates.length) {
  const batch = writeBatch(db);
  const chunk = updates.slice(i, i + 400);
  for (const u of chunk) batch.set(doc(db, 'teams', u.id), u.patch, { merge: true });
  await batch.commit();
  i += chunk.length;
}
console.log('✓ committed.');
process.exit(0);
