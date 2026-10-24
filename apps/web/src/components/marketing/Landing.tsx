import { Playfair_Display_SC } from 'next/font/google';
import Link from 'next/link';
import { AuthLink, NavActions } from './LandingActions';
import { LandingMotion } from './LandingMotion';
import styles from './landing.module.css';

// The Arabic serif, the body sans and the numeral face are loaded once in
// the root layout; only the Latin display face is particular to this page.
const playfair = Playfair_Display_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

function Star() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 2 3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8L12 2Z" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="m4 13 5 5 11-11" />
    </svg>
  );
}

function Clock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function Globe() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
    </svg>
  );
}

function Dumbbell({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 9v6M7 5v14M17 5v14M21 9v6M7 12h10" />
    </svg>
  );
}

function Bars({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 20V11M10 20V4M16 20v-8M22 20H2" />
    </svg>
  );
}

function Plate({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function Play({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9.5 5 2.5-5 2.5v-5Z" />
    </svg>
  );
}

const courses = [
  {
    title: 'قوة وتضخيم',
    items: [
      {
        name: 'تضخيم كامل',
        desc: 'تقسيمة دفع وسحب وأرجل على أربعة أيام، مع تدرّج أسبوعي في الأوزان.',
        price: '4 أيام',
        moves: 22,
      },
      {
        name: 'قوة أساسية',
        desc: 'ثلاث حركات مركّبة في كل يوم، تكرارات منخفضة وراحات طويلة.',
        price: '3 أيام',
        moves: 12,
      },
    ],
  },
  {
    title: 'تنشيف ولياقة',
    items: [
      {
        name: 'تنشيف متدرّج',
        desc: 'خمسة أيام مع كارديو خفيف وخطة غذائية مربوطة بهدف السعرات.',
        price: '5 أيام',
        moves: 26,
      },
      {
        name: 'لياقة للمبتدئين',
        desc: 'بداية هادئة بثلاثة أيام، وتركيز على الأداء الصحيح قبل الوزن.',
        price: '3 أيام',
        moves: 15,
      },
    ],
  },
];

const voices = [
  {
    quote:
      'كنت أبني نفس البرنامج من الصفر لكل متدرب. الحين عندي أربع جداول جاهزة وأطبّقها بضغطة.',
    initials: 'ع.س',
    name: 'عبدالله السالم',
    role: 'تضخيم وقوة · الرياض',
  },
  {
    quote:
      'أهم شي إن المتدربة تسجّل بجد. لما صار التسجيل أقل من دقيقة، الالتزام طلع من ٤٠٪ لـ ٨٥٪.',
    initials: 'ر.ق',
    name: 'ريم القحطاني',
    role: 'تنشيف وتغذية · جدة',
  },
  {
    quote: 'الملخص الأسبوعي يوفّر عليّ نص ساعة لكل متدرب. أفتح الشاشة وأعرف مين يحتاج مكالمة.',
    initials: 'م.ش',
    name: 'ماجد الشمري',
    role: 'لياقة عامة · الدمام',
  },
];

const macros = [
  { label: 'بروتين', now: 165, goal: 180, unit: 'g', pct: 92 },
  { label: 'كارب', now: 272, goal: 280, unit: 'g', pct: 97 },
  { label: 'دهون', now: 75, goal: 75, unit: 'g', pct: 100, hit: true },
  { label: 'ماء', now: 2.8, goal: 3.5, unit: 'L', pct: 80 },
  { label: 'خطوات', now: 8200, goal: 9000, unit: '', pct: 91 },
];

export function Landing() {
  return (
    <div className={`${styles.page} ${playfair.variable}`}>
      {/* Without scripting nothing flips the blocks to "shown", so undo the
          resting state outright. */}
      <noscript>
        <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
      </noscript>
      <LandingMotion />

      <header className={styles.header}>
        <div className={styles.wrap}>
          <div className={styles.navBar}>
            <Link className={styles.logo} href="/">
              Wizz<span>Train</span>
            </Link>
            <a className={styles.navAnchor} href="#programs">
              البرامج
            </a>
            <a className={styles.navAnchor} href="#story">
              لماذا نحن
            </a>
            <a className={styles.navAnchor} href="#progress">
              المتابعة
            </a>
            <a className={styles.navAnchor} href="#plans">
              الباقات
            </a>
            <NavActions />
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className={styles.hero} id="top">
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <span className={styles.tag} data-reveal="hidden">
              <Star /> تدريب شخصي مُدار بالكامل
            </span>
            <h1 className={styles.heroTitle} data-reveal="hidden">
              برنامج مكتوب بعناية،
              <br />
              <span className={styles.hl}>ومتابعة لا تنقطع</span>
            </h1>
            <p className={styles.heroSub} data-reveal="hidden">
              جداول تبنيها مرة وتستخدمها مع كل متدرب، وخطة غذائية مربوطة بأهدافه، وتسجيل
              يومي يُنهيه في أقل من دقيقة.
            </p>
            <div className={styles.heroCta} data-reveal="hidden">
              <AuthLink
                className={`${styles.btn} ${styles.btnPrimary}`}
                label="ابدأ ١٤ يوم مجانًا"
                signedInLabel="افتح لوحتي"
              />
              <a className={`${styles.btn} ${styles.btnOutline}`} href="#programs">
                تصفّح البرامج
              </a>
            </div>
            <div className={styles.heroMeta} data-reveal="hidden">
              <span>
                <Clock /> جاهز خلال ربع ساعة
              </span>
              <span>
                <Globe /> عربي بالكامل · من اليمين لليسار
              </span>
            </div>
          </div>

          <div className={styles.collage} data-reveal="hidden">
            <div className={styles.tile}>
              <Dumbbell size={40} />
            </div>
            <div className={`${styles.tile} ${styles.tileTall}`}>
              <Plate size={40} />
            </div>
            <div className={`${styles.tile} ${styles.tileTall}`}>
              <Bars size={40} />
            </div>
            <div className={styles.tile}>
              <Play size={40} />
            </div>
            <div className={styles.collageBadge}>
              <b>42s</b>
              <span>متوسط زمن التسجيل</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Programs, laid out as a bill of fare ───────────────────────── */}
      <section className={`${styles.section} ${styles.warm}`} id="programs">
        <div className={styles.wrap}>
          <div className={styles.secHead} data-reveal="hidden">
            <div className={styles.ornament} aria-hidden="true">
              <Star />
            </div>
            <h2>قائمة البرامج</h2>
            <p>
              جداول جاهزة تحفظها مرة وتطبّقها بضغطة. النسخة التي تصل المتدرب ملكه، تعدّلها
              دون أن تمسّ الجدول الأصلي.
            </p>
          </div>

          {courses.map((course, courseIndex) => (
            <div key={course.title} data-reveal="hidden">
              <h3 className={`${styles.course} ${courseIndex > 0 ? styles.courseNext : ''}`}>
                {course.title}
              </h3>
              <div className={styles.menuGrid}>
                {course.items.map((item) => (
                  <article className={styles.item} key={item.name}>
                    <span className={styles.thumb} aria-hidden="true">
                      <Dumbbell />
                    </span>
                    <div className={styles.itemBody}>
                      <div className={styles.itemTop}>
                        <span className={styles.itemName}>{item.name}</span>
                        <span className={styles.itemPrice}>{item.price}</span>
                      </div>
                      <p className={styles.itemDesc}>{item.desc}</p>
                      <p className={styles.itemDesc}>
                        <span className={styles.n}>{item.moves}</span> تمرينًا · فيديو شرح لكل
                        حركة
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Story ──────────────────────────────────────────────────────── */}
      <section className={styles.section} id="story">
        <div className={`${styles.wrap} ${styles.story}`}>
          <div className={styles.storyArt} data-reveal="hidden">
            <div className={styles.storyFrame} aria-hidden="true">
              <Bars size={64} />
            </div>
            <blockquote className={styles.quoteCard}>
              <span className={styles.quoteMark} aria-hidden="true">
                &ldquo;
              </span>
              <p>
                المتدرب لا يترك المتابعة لأنه كسول، يتركها لأن التسجيل طويل. قصّرناه إلى عشر
                خطوات ودقيقة واحدة.
              </p>
              <cite>— فريق WizzTrain</cite>
            </blockquote>
          </div>

          <div className={styles.storyText} data-reveal="hidden">
            <h2>لماذا WizzTrain</h2>
            <p>
              بدأت المنصة من شكوى يكرّرها كل مدرب: البرنامج في ملف، والتغذية في رسالة،
              والمتابعة في محادثة لا تنتهي. جمعنا الثلاثة في مكان واحد.
            </p>
            <p>
              المدرب يبني الجدول ويحدّد الأهداف، والمتدرب يفتح تطبيقه فيجد تمارين يومه
              ووجباته ويسجّل ما أنجزه. ما يصل المدرب بعدها ليس رسالة، بل أرقامًا محسوبة.
            </p>

            <div className={styles.storyStats}>
              <div className={styles.storyStat}>
                <b className={styles.n}>53+</b>
                <span>مدرب نشط</span>
              </div>
              <div className={styles.storyStat}>
                <b className={styles.n}>1,240</b>
                <span>متدرب</span>
              </div>
              <div className={styles.storyStat}>
                <b className={styles.n}>86%</b>
                <span>التزام أسبوعي</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tracking, on the one dark band ─────────────────────────────── */}
      <section className={`${styles.section} ${styles.dark}`} id="progress">
        <div className={styles.wrap}>
          <div className={styles.secHead} data-reveal="hidden">
            <div className={styles.ornament} aria-hidden="true">
              <Star />
            </div>
            <h2>أسبوع المتدرب في شاشة</h2>
            <p>محسوب لحظيًا من تسجيلاته، دون تقارير تجهّزها ولا جداول تحدّثها بيدك.</p>
          </div>

          <div className={styles.demo}>
            <div className={styles.panel} data-reveal="hidden">
              <h3>
                تطوّر الوزن — آخر <span className={styles.n}>8</span> أسابيع
              </h3>
              <div className={styles.chartWrap}>
                {/* One series, named by the heading, so no legend. */}
                <svg
                  viewBox="0 0 640 250"
                  className={styles.chart}
                  role="img"
                  aria-label="تطوّر الوزن عبر ثمانية أسابيع من 85.9 إلى 82.6 كيلوجرام"
                >
                  <defs>
                    <linearGradient id="weightFade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g stroke="#e8ddd4" strokeWidth="1">
                    <line x1="46" y1="30" x2="620" y2="30" />
                    <line x1="46" y1="85" x2="620" y2="85" />
                    <line x1="46" y1="140" x2="620" y2="140" />
                    <line x1="46" y1="195" x2="620" y2="195" />
                  </g>
                  <path
                    d="M46,44 128,62 210,80 292,106 374,122 456,144 538,164 620,182 L620,195 L46,195 Z"
                    fill="url(#weightFade)"
                  />
                  <polyline
                    points="46,44 128,62 210,80 292,106 374,122 456,144 538,164 620,182"
                    fill="none"
                    stroke="#ff6b35"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <g fill="#fffaf0" stroke="#ff6b35" strokeWidth="3">
                    <circle cx="46" cy="44" r="5" />
                    <circle cx="128" cy="62" r="5" />
                    <circle cx="210" cy="80" r="5" />
                    <circle cx="292" cy="106" r="5" />
                    <circle cx="374" cy="122" r="5" />
                    <circle cx="456" cy="144" r="5" />
                    <circle cx="538" cy="164" r="5" />
                  </g>
                  <circle cx="620" cy="182" r="7" fill="#ff6b35" />
                  <g
                    fill="#6b5344"
                    fontFamily="var(--font-karla), sans-serif"
                    fontWeight="700"
                    fontSize="15"
                    textAnchor="middle"
                  >
                    <text x="46" y="28">
                      85.9
                    </text>
                    <text x="292" y="96">
                      84.3
                    </text>
                    <text x="620" y="167">
                      82.6
                    </text>
                  </g>
                  <g
                    fill="#8b7361"
                    fontFamily="var(--font-karla), sans-serif"
                    fontWeight="600"
                    fontSize="14"
                    textAnchor="middle"
                  >
                    <text x="46" y="228">
                      W30
                    </text>
                    <text x="210" y="228">
                      W32
                    </text>
                    <text x="374" y="228">
                      W34
                    </text>
                    <text x="538" y="228">
                      W36
                    </text>
                    <text x="620" y="228">
                      W37
                    </text>
                  </g>
                </svg>
              </div>

              <div className={styles.kpis}>
                <div className={styles.kpi}>
                  <span>متوسط الوزن</span>
                  <b className={styles.n}>82.6</b>
                  <em>↓ 3.3 كجم</em>
                </div>
                <div className={styles.kpi}>
                  <span>أيام سجّلها</span>
                  <b className={styles.n}>6 / 7</b>
                  <em>↑ يومان</em>
                </div>
                <div className={styles.kpi}>
                  <span>التزام التمارين</span>
                  <b className={styles.n}>3 / 4</b>
                  <em>↑ 12%</em>
                </div>
              </div>
            </div>

            <div className={styles.panel} data-reveal="hidden">
              <h3>الماكروز مقابل الهدف</h3>
              <div className={styles.meters}>
                {macros.map((macro) => (
                  <div key={macro.label}>
                    <div className={styles.meterLabel}>
                      <span>
                        {macro.label}{' '}
                        {macro.hit ? <span className={styles.hitTag}>✓ تحقّق</span> : null}
                      </span>
                      <span className={`${styles.v} ${styles.n}`}>
                        {macro.now.toLocaleString('en-US')} /{' '}
                        {macro.goal.toLocaleString('en-US')} {macro.unit}
                      </span>
                    </div>
                    <div
                      className={styles.bar}
                      role="meter"
                      aria-valuenow={macro.now}
                      aria-valuemin={0}
                      aria-valuemax={macro.goal}
                      aria-label={macro.hit ? `${macro.label}، تحقّق الهدف` : macro.label}
                    >
                      <i
                        className={macro.hit ? styles.barHit : undefined}
                        style={{ width: `${macro.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.note}>
                الهدف الأسبوعي = الهدف اليومي × <span className={styles.n}>7</span>. وإن لم
                توجد خطة غذائية تبقى الخانة فارغة، لا صفرًا.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Voices ─────────────────────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.warm}`}>
        <div className={styles.wrap}>
          <div className={styles.secHead} data-reveal="hidden">
            <div className={styles.ornament} aria-hidden="true">
              <Star />
            </div>
            <h2>ماذا يقول المدربون</h2>
            <p>ثلاثة مدربين يفتحون المنصة كل يوم، وهذه أرقامهم كما هي.</p>
          </div>

          <div className={styles.grid3}>
            {voices.map((voice) => (
              <article className={styles.voice} key={voice.name} data-reveal="hidden">
                <p>«{voice.quote}»</p>
                <div className={styles.voiceWho}>
                  <span className={styles.voiceFace} aria-hidden="true">
                    {voice.initials}
                  </span>
                  <span>
                    <span className={styles.voiceName}>{voice.name}</span>
                    <br />
                    <span className={styles.voiceRole}>{voice.role}</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ──────────────────────────────────────────────────────── */}
      <section className={styles.section} id="plans">
        <div className={styles.wrap}>
          <div className={styles.secHead} data-reveal="hidden">
            <div className={styles.ornament} aria-hidden="true">
              <Star />
            </div>
            <h2>الباقات</h2>
            <p>
              تطبيق المتدرب مجاني دائمًا. الاشتراك على المدرب وحده، وتغيّر الباقة متى شئت.
            </p>
          </div>

          <div className={styles.grid3}>
            <div className={styles.plan} data-reveal="hidden">
              <div className={styles.planName}>Starter</div>
              <p className={styles.planNote}>للبداية مع أول متدربين</p>
              <div className={styles.planPrice}>
                <b className={styles.n}>0</b>
                <span>ريال / شهريًا</span>
              </div>
              <ul className={styles.planList}>
                <li>
                  <Check /> حتى <span className={styles.n}>3</span> متدربين
                </li>
                <li>
                  <Check /> برامج وخطط غذائية
                </li>
                <li>
                  <Check /> تسجيل يومي وملخص أسبوعي
                </li>
                <li>
                  <Check /> روابط فيديو للتمارين
                </li>
              </ul>
              <AuthLink
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnBlock}`}
                label="ابدأ مجانًا"
                signedInLabel="افتح لوحتي"
              />
            </div>

            <div className={`${styles.plan} ${styles.planPicked}`} data-reveal="hidden">
              <div className={styles.planName}>Pro</div>
              <p className={styles.planNote}>الأكثر اختيارًا بين المدربين</p>
              <div className={styles.planPrice}>
                <b className={styles.n}>149</b>
                <span>ريال / شهريًا</span>
              </div>
              <ul className={styles.planList}>
                <li>
                  <Check /> حتى <span className={styles.n}>30</span> متدربًا
                </li>
                <li>
                  <Check /> جداول جاهزة بلا حدود
                </li>
                <li>
                  <Check /> رفع فيديوهات حتى <span className={styles.n}>50</span> ميجابايت
                </li>
                <li>
                  <Check /> نسخ احتياطي يومي
                </li>
              </ul>
              <AuthLink
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
                label="جرّب ١٤ يوم مجانًا"
                signedInLabel="افتح لوحتي"
              />
            </div>

            <div className={styles.plan} data-reveal="hidden">
              <div className={styles.planName}>Studio</div>
              <p className={styles.planNote}>لصالات وفرق التدريب</p>
              <div className={styles.planPrice}>
                <b className={styles.n}>399</b>
                <span>ريال / شهريًا</span>
              </div>
              <ul className={styles.planList}>
                <li>
                  <Check /> متدربون بلا حدود
                </li>
                <li>
                  <Check /> أكثر من مدرب على نفس الحساب
                </li>
                <li>
                  <Check /> تصدير بيانات المتدربين
                </li>
                <li>
                  <Check /> دعم عبر واتساب
                </li>
              </ul>
              <AuthLink
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnBlock}`}
                label="تواصل معنا"
                signedInLabel="افتح لوحتي"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className={styles.dark} id="start">
        <div className={styles.wrap}>
          <div className={styles.final} data-reveal="hidden">
            <div className={styles.ornament} aria-hidden="true">
              <Star />
            </div>
            <h2>أول متدرب في ربع ساعة</h2>
            <p>
              أنشئ حسابه، طبّق عليه جدولًا جاهزًا، وحدّد أهدافه الغذائية. هو ينزّل التطبيق
              ويبدأ التسجيل من أول يوم.
            </p>
            <AuthLink
              className={`${styles.btn} ${styles.btnCream}`}
              label="ابدأ الآن مجانًا"
              signedInLabel="افتح لوحتي"
            />
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.foot}`}>
          <Link className={styles.logo} href="/">
            Wizz<span>Train</span>
          </Link>
          <span>منصة إدارة التدريب الشخصي · عربي بالكامل</span>
        </div>
      </footer>
    </div>
  );
}
