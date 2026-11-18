import Link from 'next/link';
import type { ReactNode } from 'react';
import { AuthLink, NavActions } from './LandingActions';
import styles from './landing.module.css';

/* ── Icons ──────────────────────────────────────────────────────────────────
   Font Awesome 6 Free (Solid) paths, inlined rather than pulled in as three
   npm packages. Attribution sits in the footer, as CC BY 4.0 requires.
   ────────────────────────────────────────────────────────────────────────── */

const fa = {
  dumbbell: [640, 'M96 64c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 160 0 64 0 160c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-64-32 0c-17.7 0-32-14.3-32-32l0-64c-17.7 0-32-14.3-32-32s14.3-32 32-32l0-64c0-17.7 14.3-32 32-32l32 0 0-64zm448 0l0 64 32 0c17.7 0 32 14.3 32 32l0 64c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 64c0 17.7-14.3 32-32 32l-32 0 0 64c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-160 0-64 0-160c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32zM416 224l0 64-192 0 0-64 192 0z'],
  weightHanging: [512, 'M224 96a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm122.5 32c3.5-10 5.5-20.8 5.5-32c0-53-43-96-96-96s-96 43-96 96c0 11.2 1.9 22 5.5 32L120 128c-22 0-41.2 15-46.6 36.4l-72 288c-3.6 14.3-.4 29.5 8.7 41.2S33.2 512 48 512l416 0c14.8 0 28.7-6.8 37.8-18.5s12.3-26.8 8.7-41.2l-72-288C433.2 143 414 128 392 128l-45.5 0z'],
  fire: [448, 'M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 97.7 112.7 48.6 159.3 5.4zM225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4C112 375.4 162.6 416 225.7 416z'],
  heartPulse: [512, 'M228.3 469.1L47.6 300.4c-4.2-3.9-8.2-8.1-11.9-12.4l87 0c22.6 0 43-13.6 51.7-34.5l10.5-25.2 49.3 109.5c3.8 8.5 12.1 14 21.4 14.1s17.8-5 22-13.3L320 253.7l1.7 3.4c9.5 19 28.9 31 50.1 31l104.5 0c-3.7 4.3-7.7 8.5-11.9 12.4L283.7 469.1c-7.5 7-17.4 10.9-27.7 10.9s-20.2-3.9-27.7-10.9zM503.7 240l-132 0c-3 0-5.8-1.7-7.2-4.4l-23.2-46.3c-4.1-8.1-12.4-13.3-21.5-13.3s-17.4 5.1-21.5 13.3l-41.4 82.8L205.9 158.2c-3.9-8.7-12.7-14.3-22.2-14.1s-18.1 5.9-21.8 14.8l-31.8 76.3c-1.2 3-4.2 4.9-7.4 4.9L16 240c-2.6 0-5 .4-7.3 1.1C3 225.2 0 208.2 0 190.9l0-5.8c0-69.9 50.5-129.5 119.4-141C165 36.5 211.4 51.4 244 84l12 12 12-12c32.6-32.6 79-47.5 124.6-39.9C461.5 55.6 512 115.2 512 185.1l0 5.8c0 16.9-2.8 33.5-8.3 49.1z'],
  check: [448, 'M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z'],
  arrowLeft: [448, 'M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z'],
  arrowTrendUp: [576, 'M384 160c-17.7 0-32-14.3-32-32s14.3-32 32-32l160 0c17.7 0 32 14.3 32 32l0 160c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-82.7L342.6 374.6c-12.5 12.5-32.8 12.5-45.3 0L192 269.3 54.6 406.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160c12.5-12.5 32.8-12.5 45.3 0L320 306.7 466.7 160 384 160z'],
  fileLines: [384, 'M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM112 256l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z'],
  comment: [512, 'M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4l.3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z'],
  comments: [640, 'M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.2-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9l-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z'],
  video: [576, 'M0 128C0 92.7 28.7 64 64 64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2l0 256c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1l0-17.1 0-128 0-17.1 14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z'],
  stopwatch: [448, 'M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z'],
  chartSimple: [448, 'M160 80c0-26.5 21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 352c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48l0-352zM0 272c0-26.5 21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 160c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48L0 272zM368 96l32 0c26.5 0 48 21.5 48 48l0 288c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48z'],
  gift: [512, 'M190.5 68.8L225.3 128l-1.3 0-72 0c-22.1 0-40-17.9-40-40s17.9-40 40-40l2.2 0c14.9 0 28.8 7.9 36.3 20.8zM64 88c0 14.4 3.5 28 9.6 40L32 128c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32l448 0c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l-41.6 0c6.1-12 9.6-25.6 9.6-40c0-48.6-39.4-88-88-88l-2.2 0c-31.9 0-61.5 16.9-77.7 44.4L256 85.5l-24.1-41C215.7 16.9 186.1 0 154.2 0L152 0C103.4 0 64 39.4 64 88zm336 0c0 22.1-17.9 40-40 40l-72 0-1.3 0 34.8-59.2C329.1 55.9 342.9 48 357.8 48l2.2 0c22.1 0 40 17.9 40 40zM32 288l0 176c0 26.5 21.5 48 48 48l144 0 0-224L32 288zM288 512l144 0c26.5 0 48-21.5 48-48l0-176-192 0 0 224z'],
  clipboardList: [384, 'M192 0c-41.8 0-77.4 26.7-90.5 64L64 64C28.7 64 0 92.7 0 128L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64l-37.5 0C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM72 272a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm104-16l128 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-128 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zM72 368a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm88 0c0-8.8 7.2-16 16-16l128 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-128 0c-8.8 0-16-7.2-16-16z'],
  circleInfo: [512, 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z'],
  plus: [448, 'M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z'],
  quoteRight: [448, 'M448 296c0 66.3-53.7 120-120 120l-8 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l8 0c30.9 0 56-25.1 56-56l0-8-64 0c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l64 0c35.3 0 64 28.7 64 64l0 32 0 32 0 72zm-256 0c0 66.3-53.7 120-120 120l-8 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l8 0c30.9 0 56-25.1 56-56l0-8-64 0c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l64 0c35.3 0 64 28.7 64 64l0 32 0 32 0 72z'],
} as const;

type IconName = keyof typeof fa;

function Fa({
  name,
  size = 15,
  fill = 'currentColor',
  className,
}: {
  name: IconName;
  size?: number;
  fill?: string;
  className?: string;
}) {
  const [width, d] = fa[name];
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${width} 512`}
      fill={fill}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/* A figure that must keep its written order inside RTL text. Digits and Latin
   only — an Arabic word in here lands on the wrong side of the number. */
function N({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={`${styles.ltr} ${className ?? ''}`}>{children}</span>;
}

/* ── Page data ──────────────────────────────────────────────────────────── */

const navLinks = [
  { href: '#programs', label: 'البرامج' },
  { href: '#how', label: 'كيف تبدأ' },
  { href: '#app', label: 'تطبيق المتدرب' },
  { href: '#progress', label: 'المتابعة' },
  { href: '#plans', label: 'الباقات' },
  { href: '#faq', label: 'الأسئلة' },
];

const marqueeItems = [
  'برامج جاهزة',
  'خطط غذائية مربوطة بالأهداف',
  'تسجيل يومي في دقيقة',
  'ملخص أسبوعي محسوب',
  'فيديو شرح لكل حركة',
  'عربي بالكامل',
];

/** The four programs, flat so each one can carry its own chip and icon. */
const programs = [
  {
    category: 'قوة وتضخيم',
    tone: 'magenta',
    icon: 'dumbbell',
    name: 'تضخيم كامل',
    days: 4,
    moves: 22,
    desc: 'تقسيمة دفع وسحب وأرجل على أربعة أيام، مع تدرّج أسبوعي في الأوزان.',
  },
  {
    category: 'قوة وتضخيم',
    tone: 'magenta',
    icon: 'weightHanging',
    name: 'قوة أساسية',
    days: 3,
    moves: 12,
    desc: 'ثلاث حركات مركّبة في كل يوم، تكرارات منخفضة وراحات طويلة.',
  },
  {
    category: 'تنشيف ولياقة',
    tone: 'amber',
    icon: 'fire',
    name: 'تنشيف متدرّج',
    days: 5,
    moves: 26,
    desc: 'خمسة أيام مع كارديو خفيف وخطة غذائية مربوطة بهدف السعرات.',
  },
  {
    category: 'تنشيف ولياقة',
    tone: 'amber',
    icon: 'heartPulse',
    name: 'لياقة للمبتدئين',
    days: 3,
    moves: 15,
    desc: 'بداية هادئة بثلاثة أيام، وتركيز على الأداء الصحيح قبل الوزن.',
  },
] as const;

const steps: { n: string; title: string; text: string; amber?: boolean }[] = [
  { n: '01', title: 'أنشئ حساب المتدرب', text: 'أضفه من لوحتك ببياناته الأساسية.' },
  { n: '02', title: 'طبّق جدولًا جاهزًا', text: 'اختر قالبًا من برامجك، ثم عدّل نسخته وحدها.' },
  { n: '03', title: 'حدّد أهدافه الغذائية', text: 'سعرات وماكروز وماء وخطوات، يومية وأسبوعية.' },
  {
    n: '04',
    title: 'هو يبدأ التسجيل',
    text: 'ينزّل التطبيق ويسجّل من أول يوم، وأنت تستلم الأرقام.',
    amber: true,
  },
];

const beforeItems = [
  { icon: 'fileLines', text: 'البرنامج في ملف' },
  { icon: 'comment', text: 'التغذية في رسالة' },
  { icon: 'comments', text: 'المتابعة في محادثة لا تنتهي' },
] as const;

const afterItems = [
  'البرنامج والتغذية والمتابعة في مكان واحد',
  'المتدرب يسجّل يومه في دقيقة',
  'يصلك أسبوعه أرقامًا محسوبة',
];

const appFeatures = [
  {
    icon: 'video',
    tone: 'magenta',
    title: 'فيديو لكل حركة',
    text: 'شرح الأداء الصحيح داخل التمرين نفسه.',
  },
  {
    icon: 'stopwatch',
    tone: 'amber',
    title: 'تسجيل في دقيقة',
    text: 'تمارين ووجبات وماء وخطوات.',
  },
  {
    icon: 'chartSimple',
    tone: 'magenta',
    title: 'يرى تقدّمه',
    text: 'وزنه والتزامه مقابل أهدافه.',
  },
  { icon: 'gift', tone: 'amber', title: 'مجاني دائمًا', text: 'الاشتراك على المدرب وحده.' },
] as const;

/* The phone mock's list. Illustrative, as the handoff notes. */
const todayMock = [
  { name: 'بنش برس', reps: '4×8', state: 'done' },
  { name: 'ضغط أكتاف', reps: '3×10', state: 'done' },
  { name: 'تفتيح صدر', reps: '3×12', state: 'now' },
  { name: 'تراي سبس', reps: '3×12', state: 'next' },
] as const;

/** A bar turns amber once it reaches its goal; everything else is magenta. */
const macros = [
  { label: 'بروتين', now: 165, goal: 180, unit: 'g' },
  { label: 'كارب', now: 272, goal: 280, unit: 'g' },
  { label: 'دهون', now: 75, goal: 75, unit: 'g' },
  { label: 'ماء', now: 2.8, goal: 3.5, unit: 'L' },
  { label: 'خطوات', now: 8200, goal: 9000, unit: '' },
];

const changes = [
  {
    icon: 'clipboardList',
    tone: 'magenta',
    title: 'البرامج',
    text: 'بدل أن تبني الجدول نفسه من الصفر لكل متدرب، تحفظه قالبًا وتطبّقه بضغطة، ثم تعدّل نسخته وحدها.',
  },
  {
    icon: 'stopwatch',
    tone: 'amber',
    title: 'التسجيل اليومي',
    text: 'المتدرب يفتح تطبيقه فيجد تمارين يومه ووجباته، وينهي التسجيل في أقل من دقيقة.',
  },
  {
    icon: 'chartSimple',
    tone: 'navy',
    title: 'الملخص الأسبوعي',
    text: 'تفتح الملخص فتعرف من التزم ومن يحتاج مكالمة، دون أن تجمع الأرقام من المحادثات.',
  },
] as const;

const plans = [
  {
    name: 'Starter',
    note: 'للبداية مع أول متدربين',
    price: 0,
    features: [
      <>
        حتى <N>3</N> متدربين
      </>,
      'برامج وخطط غذائية',
      'تسجيل يومي وملخص أسبوعي',
      'روابط فيديو للتمارين',
    ],
    cta: 'ابدأ مجانًا',
    ctaTone: 'ghost',
  },
  {
    name: 'Pro',
    note: 'لمدرب بقائمة متدربين كاملة',
    price: 149,
    picked: true,
    features: [
      <>
        حتى <N>30</N> متدربًا
      </>,
      'جداول جاهزة بلا حدود',
      <>
        رفع فيديوهات حتى <N>50</N> ميجابايت
      </>,
      'نسخ احتياطي يومي',
    ],
    cta: 'جرّب 14 يومًا مجانًا',
    ctaTone: 'magenta',
  },
  {
    name: 'Studio',
    note: 'لصالات وفرق التدريب',
    price: 399,
    features: [
      'متدربون بلا حدود',
      'أكثر من مدرب على نفس الحساب',
      'تصدير بيانات المتدربين',
      'دعم عبر واتساب',
    ],
    cta: 'تواصل معنا',
    ctaTone: 'amber',
  },
];

const faqs = [
  {
    q: 'هل تطبيق المتدرب مجاني؟',
    a: 'نعم، تطبيق المتدرب مجاني دائمًا. الاشتراك على المدرب وحده.',
    open: true,
  },
  {
    q: 'هل أستطيع تعديل جدول متدرب دون أن يتغيّر القالب؟',
    a: 'نعم. النسخة التي تصل المتدرب ملكه، تعدّلها دون أن تمسّ الجدول الأصلي.',
  },
  {
    q: 'ماذا يظهر إن لم أضع خطة غذائية؟',
    a: 'تبقى خانة الماكروز فارغة، لا صفرًا. والهدف الأسبوعي يُحسب دائمًا: الهدف اليومي × 7.',
  },
  {
    q: 'هل أستطيع رفع فيديوهات التمارين؟',
    a: 'في Starter تضيف روابط فيديو للتمارين، وفي Pro ترفع فيديوهات حتى 50 ميجابايت.',
  },
  { q: 'هل أستطيع تغيير الباقة لاحقًا؟', a: 'نعم، تغيّر الباقة متى شئت.' },
];

/* ── Weight chart geometry ──────────────────────────────────────────────── */
const weights = [85.9, 85.4, 84.9, 84.3, 83.8, 83.3, 82.9, 82.6];
const firstWeek = 30;
const plot = { left: 60, right: 580, top: 20, bottom: 190, min: 82, max: 86 };
const xAt = (i: number) =>
  plot.left + (i * (plot.right - plot.left)) / (weights.length - 1);
const yAt = (w: number) =>
  plot.top + ((plot.max - w) / (plot.max - plot.min)) * (plot.bottom - plot.top);
const points = weights.map((w, i) => [xAt(i), yAt(w)] as const);

/** Catmull-Rom through every point, so the line reads as a trend, not a zigzag. */
function smoothPath(pts: readonly (readonly [number, number])[]) {
  return pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y.toFixed(1)}`;
    const [x0, y0] = pts[i - 2] ?? pts[i - 1];
    const [x1, y1] = pts[i - 1];
    const [x3, y3] = pts[i + 1] ?? [x, y];
    const c1x = x1 + (x - x0) / 6;
    const c1y = y1 + (y - y0) / 6;
    const c2x = x - (x3 - x1) / 6;
    const c2y = y - (y3 - y1) / 6;
    return `${d} C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x},${y.toFixed(1)}`;
  }, '');
}

const linePath = smoothPath(points);
const areaPath = `${linePath} L${plot.right},${plot.bottom} L${plot.left},${plot.bottom} Z`;
const [firstX, firstY] = points[0];
const [lastX, lastY] = points[points.length - 1];
const gridRows = [86, 85, 84, 83, 82];

const MAGENTA = '#ED2096';
const AMBER = '#FFBE4A';
const NAVY = '#00004F';
const WHITE = '#FFFFFF';

export function Landing() {
  return (
    <div className={styles.page} id="top">
      {/* ═══ Header ═══ */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerStart}>
            <Link className={styles.logo} href="/" aria-label="WizzTrain — الرئيسية">
              <span className={styles.logoMark}>
                <Fa name="dumbbell" size={16} fill={WHITE} />
              </span>
              <span className={styles.logoText}>
                Wizz<span>Train</span>
              </span>
            </Link>
            <nav className={styles.nav} aria-label="القائمة الرئيسية">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <div className={styles.headerEnd}>
            <NavActions />
          </div>
        </div>
      </header>

      {/* ═══ Hero ═══ */}
      <section className={styles.hero}>
        <div aria-hidden="true" className={styles.heroDots} />
        <div aria-hidden="true" className={`${styles.heroBlob} ${styles.blob}`} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={`${styles.badge} ${styles.in} ${styles.d1}`}>
              <span className={`${styles.badgeDot} ${styles.pulse}`} />
              منصة عربية للمدرب الشخصي
            </span>
            <h1 className={`${styles.heroTitle} ${styles.in} ${styles.d2}`}>
              جدول تكتبه مرة،
              <br />
              <em>
                ومتدرب يسجّل <span className={styles.mark}>كل يوم</span>
              </em>
            </h1>
            <p className={`${styles.heroSub} ${styles.in} ${styles.d3}`}>
              طبّق جداولك الجاهزة على كل متدرب، واربط خطته الغذائية بأهدافه، واستلم أسبوعه
              أرقامًا محسوبة بدل رسائل.
            </p>
            <div className={`${styles.heroActions} ${styles.in} ${styles.d4}`}>
              <AuthLink
                className={`${styles.btn} ${styles.btnPrimary}`}
                label="ابدأ تجربة 14 يومًا"
                signedInLabel="افتح لوحتي"
              >
                <Fa name="arrowLeft" fill={WHITE} className={styles.arrow} />
              </AuthLink>
              <a className={`${styles.btn} ${styles.btnOutline}`} href="#programs">
                تصفّح البرامج
              </a>
            </div>
            <div className={`${styles.heroChecks} ${styles.in} ${styles.d5}`}>
              <span>
                <Fa name="check" size={14} fill={MAGENTA} />
                تطبيق المتدرب مجاني دائمًا
              </span>
              <span>
                <Fa name="check" size={14} fill={MAGENTA} />
                عربي بالكامل
              </span>
              <span>
                <Fa name="check" size={14} fill={MAGENTA} />
                غيّر الباقة متى شئت
              </span>
            </div>
          </div>

          <div className={`${styles.heroCardWrap} ${styles.in} ${styles.d3}`}>
            <div className={`${styles.chipTop} ${styles.float2} ${styles.hideSm}`}>
              <span className={styles.chipIcoAmber}>
                <Fa name="arrowTrendUp" fill={NAVY} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, color: 'var(--wz-text-muted)' }}>
                  التزام التمارين
                </span>
                <span className={`${styles.mono} ${styles.ltrEnd}`} style={{ fontSize: 15, fontWeight: 600 }}>
                  +12%
                </span>
              </span>
            </div>
            <div className={`${styles.chipBottom} ${styles.float} ${styles.hideSm}`}>
              <span className={styles.chipIcoMagenta}>
                <Fa name="check" size={14} fill={WHITE} />
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>تم تسجيل اليوم</span>
            </div>

            <div className={styles.heroCard}>
              <div className={styles.heroCardTop}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={styles.avatar}>م</span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>ملخص الأسبوع</span>
                    <span style={{ fontSize: 12, color: 'var(--wz-text-muted)' }}>
                      محسوب من تسجيلات المتدرب
                    </span>
                  </span>
                </span>
                <span className={styles.weekTag}>WEEK 37</span>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.statMagenta}>
                  <span style={{ fontSize: 13, color: 'var(--wz-magenta-darker)' }}>
                    الوزن الحالي
                  </span>
                  <span className={styles.statBig}>
                    82.6<span style={{ fontSize: 14 }}> kg</span>
                  </span>
                  <span
                    className={styles.ltrEnd}
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--wz-magenta-deep)' }}
                  >
                    −3.3 · W30
                  </span>
                </div>
                <div className={styles.statAmber}>
                  <span style={{ fontSize: 13, color: 'var(--wz-amber-ink)' }}>أيام سجّلها</span>
                  <span className={styles.statBig}>6 / 7</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--wz-amber-ink)' }}>
                    +2 عن الأسبوع الماضي
                  </span>
                </div>
              </div>

              <div className={styles.dayStrip} aria-label="أيام الأسبوع: 6 من 7 مسجّلة">
                {[MAGENTA, MAGENTA, MAGENTA, 'var(--wz-track)', MAGENTA, MAGENTA, AMBER].map(
                  (bg, i) => (
                    <span
                      key={i}
                      className={styles.pop}
                      style={{ background: bg, animationDelay: `${0.9 + i * 0.1}s` }}
                    />
                  ),
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className={styles.meterRow}>
                  <div className={styles.meterTop}>
                    <span style={{ fontWeight: 600 }}>بروتين</span>
                    <span className={styles.val}>165 / 180 g</span>
                  </div>
                  <div className={styles.track}>
                    <span className={styles.bar} style={{ width: '92%', background: MAGENTA }} />
                  </div>
                </div>
                <div className={styles.meterRow}>
                  <div className={styles.meterTop}>
                    <span style={{ fontWeight: 600 }}>التزام التمارين</span>
                    <span className={styles.val}>3 / 4</span>
                  </div>
                  <div className={styles.track}>
                    <span className={styles.bar} style={{ width: '75%', background: AMBER }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Marquee ═══ */}
      <div className={styles.marqueeWrap}>
        <div className={styles.marquee}>
          {[false, true].map((copy) => (
            <span key={String(copy)} className={styles.marqueeRun} aria-hidden={copy || undefined}>
              {marqueeItems.map((item) => (
                <span key={item} style={{ display: 'contents' }}>
                  <span>{item}</span>
                  <span aria-hidden="true" className={styles.marqueeDot} />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ Programs ═══ */}
      <section id="programs" className={`${styles.wrap} ${styles.section}`} style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
        <div className={`${styles.secHeadRow} ${styles.reveal}`}>
          <div className={styles.secHead}>
            <span className={styles.label}>01 · PROGRAMS</span>
            <h2 className={styles.h2}>قائمة البرامج</h2>
            <p className={styles.lead}>
              جداول جاهزة تحفظها مرة وتطبّقها بضغطة، مع فيديو شرح لكل حركة. النسخة التي تصل
              المتدرب ملكه، تعدّلها دون أن تمسّ الجدول الأصلي.
            </p>
          </div>
          <AuthLink className={styles.linkArrow} label="كل البرامج">
            <Fa name="arrowLeft" />
          </AuthLink>
        </div>
        <div className={`${styles.grid} ${styles.gridPrograms}`}>
          {programs.map((program) => {
            const tone = program.tone === 'amber' ? AMBER : MAGENTA;
            return (
              <article key={program.name} className={`${styles.card} ${styles.reveal}`}>
                <div className={styles.cardTop}>
                  <span
                    className={program.tone === 'amber' ? styles.chipAmber : styles.chipMagenta}
                  >
                    {program.category}
                  </span>
                  <span className={styles.cardIco} style={{ background: tone }}>
                    <Fa
                      name={program.icon}
                      size={17}
                      fill={program.tone === 'amber' ? NAVY : WHITE}
                    />
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{program.name}</h3>
                <span className={styles.cardMeta}>
                  {program.days} أيام · {program.moves} تمرينًا
                </span>
                <p className={styles.cardText}>{program.desc}</p>
                <div className={styles.intensity} aria-hidden="true">
                  {Array.from({ length: 7 }, (_, i) => (
                    <span
                      key={i}
                      style={{ background: i < program.days ? tone : 'var(--wz-track)' }}
                    />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section id="how" className={styles.bandAmber}>
        <div
          className={`${styles.wrap} ${styles.section}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 48 }}
        >
          <div className={`${styles.secHead} ${styles.reveal}`}>
            <span className={styles.label}>02 · HOW IT WORKS</span>
            <h2 className={styles.h2}>أربع خطوات، وأول متدرب جاهز</h2>
            <p className={styles.lead}>
              من إنشاء الحساب إلى أول تسجيل يومي، دون ملفات ولا رسائل متفرقة.
            </p>
          </div>
          <div className={`${styles.grid} ${styles.gridSteps}`}>
            {steps.map((step) => (
              <div
                key={step.n}
                className={`${step.amber ? styles.stepCardAmber : styles.stepCard} ${styles.reveal}`}
              >
                <span
                  className={`${styles.stepNum} ${step.amber ? styles.stepNumNavy : ''}`}
                >
                  {step.n}
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p
                  className={styles.cardText}
                  style={step.amber ? { color: '#3A2A08' } : undefined}
                >
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Why + Before/After ═══ */}
      <section
        id="story"
        className={`${styles.wrap} ${styles.section}`}
        style={{ display: 'flex', flexDirection: 'column', gap: 56 }}
      >
        <div className={styles.storyRow}>
          <div className={`${styles.storyCopy} ${styles.reveal}`}>
            <span className={styles.label}>03 · WHY</span>
            <h2 className={styles.h2}>لماذا WizzTrain</h2>
            <p>
              بدأت المنصة من شكوى يكرّرها كل مدرب: البرنامج في ملف، والتغذية في رسالة،
              والمتابعة في محادثة لا تنتهي. جمعنا الثلاثة في مكان واحد.
            </p>
            <p>
              المدرب يبني الجدول ويحدّد الأهداف، والمتدرب يفتح تطبيقه فيجد تمارين يومه ووجباته
              ويسجّل ما أنجزه. ما يصل المدرب بعدها ليس رسالة، بل أرقامًا محسوبة.
            </p>
          </div>
          <div className={`${styles.storyStats} ${styles.reveal}`}>
            <div className={`${styles.bigStat} ${styles.bigStatMagenta}`}>
              <span aria-hidden="true" className={styles.bigStatRing} />
              <span className={styles.bigStatNum}>10</span>
              <span className={styles.bigStatCap}>خطوات في تسجيل اليوم</span>
            </div>
            <div className={`${styles.bigStat} ${styles.bigStatAmber}`}>
              <span
                aria-hidden="true"
                className={`${styles.bigStatRing} ${styles.bigStatRingDark}`}
              />
              <span className={`${styles.bigStatNum} ${styles.ltrEnd}`}>1:00</span>
              <span className={styles.bigStatCap}>دقيقة واحدة لإنهائه</span>
            </div>
          </div>
        </div>

        <blockquote className={`${styles.quote} ${styles.reveal}`}>
          <Fa name="quoteRight" size={30} fill={MAGENTA} className={styles.quoteMark} />
          المتدرب لا يترك المتابعة لأنه كسول، <em>يتركها لأن التسجيل طويل.</em>
        </blockquote>

        <div className={styles.compare}>
          <div className={`${styles.before} ${styles.reveal}`}>
            <span className={styles.compareLabel}>قبل</span>
            <div className={styles.compareList}>
              {beforeItems.map((item) => (
                <div key={item.text} className={styles.beforeItem}>
                  <Fa name={item.icon} size={17} fill="#8A8AA8" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
          <div className={`${styles.compareArrow} ${styles.hideSm}`} aria-hidden="true">
            <span>
              <Fa name="arrowLeft" size={21} fill={NAVY} />
            </span>
          </div>
          <div className={`${styles.after} ${styles.reveal}`}>
            <span className={`${styles.compareLabel} ${styles.compareLabelAfter}`}>
              بعد · مع WizzTrain
            </span>
            <div className={styles.compareList}>
              {afterItems.map((text) => (
                <div key={text} className={styles.afterItem}>
                  <Fa name="check" size={17} fill="#C8177C" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Trainee app ═══ */}
      <section id="app" className={styles.appBand}>
        <div aria-hidden="true" className={`${styles.appBlob} ${styles.blob}`} />
        <div className={styles.appInner}>
          <div className={`${styles.appCopy} ${styles.reveal}`}>
            <span className={styles.label}>04 · TRAINEE APP</span>
            <h2 className={styles.h2}>
              تطبيق المتدرب:
              <br />
              يومه كله في شاشة واحدة
            </h2>
            <p className={styles.lead}>
              يفتح التطبيق فيجد تمارين يومه ووجباته، يضغط على ما أنجزه، وينتهي.
            </p>
            <div className={styles.appFeatures}>
              {appFeatures.map((feature) => (
                <div key={feature.title} className={styles.appFeature}>
                  <span
                    className={styles.appFeatureIco}
                    style={{ background: feature.tone === 'amber' ? AMBER : MAGENTA }}
                  >
                    <Fa
                      name={feature.icon}
                      fill={feature.tone === 'amber' ? NAVY : WHITE}
                    />
                  </span>
                  <span className={styles.appFeatureText}>
                    <b>{feature.title}</b>
                    <span>{feature.text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${styles.phoneWrap} ${styles.reveal}`}>
            <div className={`${styles.phone} ${styles.float}`}>
              <div aria-hidden="true" className={styles.phoneNotch} />
              <div className={styles.phoneHead}>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, color: 'var(--wz-text-muted)' }}>تمارين اليوم</span>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>دفع · 4 تمارين</span>
                </span>
                <span className={styles.phoneCount}>2/4</span>
              </div>
              <div className={styles.phoneTrack}>
                <span className={styles.bar} style={{ width: '50%' }} />
              </div>
              <div className={styles.phoneList}>
                {todayMock.map((move) => (
                  <div
                    key={move.name}
                    className={`${styles.phoneRow} ${
                      move.state === 'now'
                        ? styles.phoneRowNow
                        : move.state === 'next'
                          ? styles.phoneRowNext
                          : ''
                    }`}
                  >
                    {move.state === 'done' ? (
                      <span className={styles.phoneTick}>
                        <Fa name="check" size={11} fill={WHITE} />
                      </span>
                    ) : move.state === 'now' ? (
                      <span className={`${styles.phoneTickNow} ${styles.pulse}`} />
                    ) : (
                      <span className={styles.phoneTickNext} />
                    )}
                    <span
                      className={move.state === 'done' ? styles.phoneName : styles.phoneNameNow}
                      style={move.state === 'next' ? { fontWeight: 600 } : undefined}
                    >
                      {move.name}
                    </span>
                    <span className={styles.phoneReps}>{move.reps}</span>
                  </div>
                ))}
              </div>
              <div className={styles.phoneTiles}>
                <div className={styles.phoneTileAmber}>
                  <span style={{ fontSize: 11, color: 'var(--wz-amber-ink)' }}>الوجبات</span>
                  <b>2 / 4</b>
                </div>
                <div className={styles.phoneTileMagenta}>
                  <span style={{ fontSize: 11, color: 'var(--wz-magenta-darker)' }}>ماء</span>
                  <b className={styles.ltrEnd}>2.8 L</b>
                </div>
              </div>
              <span className={styles.phoneCta}>سجّل اليوم</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Progress ═══ */}
      <section
        id="progress"
        className={`${styles.wrap} ${styles.section}`}
        style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
      >
        <div className={`${styles.secHead} ${styles.reveal}`}>
          <span className={styles.label}>05 · PROGRESS</span>
          <h2 className={styles.h2}>أسبوع المتدرب في شاشة</h2>
          <p className={styles.lead}>
            محسوب لحظيًا من تسجيلاته، دون تقارير تجهّزها ولا جداول تحدّثها بيدك.
          </p>
        </div>

        <div className={`${styles.panel} ${styles.reveal}`}>
          <div className={styles.panelChart}>
            <div className={styles.panelChartHead}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>تطوّر الوزن · آخر 8 أسابيع</span>
              <span className={`${styles.mono} ${styles.ltr}`} style={{ fontSize: 13, color: 'var(--wz-text-muted)' }}>
                {weights[0]} → {weights[weights.length - 1]} kg
              </span>
            </div>
            <div className={styles.chartFrame}>
              <svg
                viewBox="0 0 620 230"
                className={styles.chart}
                role="img"
                aria-label={`منحنى الوزن من ${weights[0]} إلى ${weights[weights.length - 1]} كجم بين الأسبوع ${firstWeek} و${firstWeek + weights.length - 1}`}
              >
                <g stroke="#EFE4D2" strokeWidth="1">
                  {gridRows.map((w) => (
                    <line key={w} x1={plot.left - 20} y1={yAt(w)} x2={600} y2={yAt(w)} />
                  ))}
                </g>
                <g fill="#55557F" fontSize="11" textAnchor="end">
                  {gridRows.map((w) => (
                    <text key={w} x={plot.left - 30} y={yAt(w) + 4}>
                      {w}
                    </text>
                  ))}
                </g>
                <g fill="#55557F" fontSize="11" textAnchor="middle">
                  {weights.map((_, i) => (
                    <text key={i} x={xAt(i)} y={215}>
                      {firstWeek + i}
                    </text>
                  ))}
                </g>
                <path className={styles.area} d={areaPath} fill={MAGENTA} fillOpacity="0.09" />
                <path
                  className={styles.line}
                  pathLength={1}
                  d={linePath}
                  fill="none"
                  stroke={MAGENTA}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={firstX} cy={firstY} r="5" fill={WHITE} stroke={MAGENTA} strokeWidth="2.5" />
                <circle
                  className={styles.area}
                  cx={lastX}
                  cy={lastY}
                  r="8"
                  fill={AMBER}
                  stroke={NAVY}
                  strokeWidth="2"
                />
                <text x={firstX + 12} y={firstY - 6} fontSize="12" fontWeight="600" fill={NAVY}>
                  {weights[0]}
                </text>
                <text
                  className={styles.area}
                  x={lastX - 14}
                  y={lastY - 14}
                  fontSize="12"
                  fontWeight="600"
                  fill={NAVY}
                  textAnchor="end"
                >
                  {weights[weights.length - 1]}
                </text>
              </svg>
            </div>
          </div>

          <div className={styles.panelSide}>
            <div className={styles.kpis}>
              <div className={`${styles.kpi} ${styles.kpiMagenta}`}>
                <span style={{ fontSize: 12, color: 'var(--wz-magenta-darker)' }}>الوزن الحالي</span>
                <b>82.6</b>
                <span className={styles.ltrEnd} style={{ fontSize: 11, color: 'var(--wz-magenta-darker)' }}>
                  −3.3 · W30
                </span>
              </div>
              <div className={`${styles.kpi} ${styles.kpiAmber}`}>
                <span style={{ fontSize: 12, color: 'var(--wz-amber-ink)' }}>أيام سجّلها</span>
                <b>6 / 7</b>
                <span style={{ fontSize: 11, color: 'var(--wz-amber-ink)' }}>+2 يوم</span>
              </div>
              <div className={`${styles.kpi} ${styles.kpiGrey}`}>
                <span style={{ fontSize: 12, color: 'var(--wz-text-2)' }}>التزام التمارين</span>
                <b>3 / 4</b>
                <span className={styles.ltrEnd} style={{ fontSize: 11, color: 'var(--wz-text-2)' }}>
                  +12%
                </span>
              </div>
            </div>

            <span style={{ fontSize: 15, fontWeight: 700, paddingTop: 6 }}>
              الماكروز مقابل الهدف
            </span>
            {macros.map((macro) => {
              const pct = Math.min(100, Math.round((macro.now / macro.goal) * 100));
              const reached = macro.now >= macro.goal;
              return (
                <div key={macro.label} className={styles.meterRow}>
                  <div className={styles.meterTop}>
                    <span>
                      {macro.label}{' '}
                      {reached && <span className={styles.chipDone}>تحقّق</span>}
                    </span>
                    <span className={styles.val}>
                      {macro.now.toLocaleString('en-US')} / {macro.goal.toLocaleString('en-US')}{' '}
                      {macro.unit}
                    </span>
                  </div>
                  <div className={styles.track}>
                    <span
                      className={styles.bar}
                      style={{ width: `${pct}%`, background: reached ? AMBER : MAGENTA }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className={styles.note}>
          <Fa name="circleInfo" size={14} fill="#C8177C" />
          الهدف الأسبوعي = الهدف اليومي × 7. وإن لم توجد خطة غذائية تبقى الخانة فارغة، لا صفرًا.
        </p>
      </section>

      {/* ═══ Coach day ═══ */}
      <section className={styles.bandAmber}>
        <div
          className={`${styles.wrap} ${styles.section}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
        >
          <div className={`${styles.secHead} ${styles.reveal}`}>
            <span className={styles.label}>06 · COACH DAY</span>
            <h2 className={styles.h2}>ما يتغيّر في يوم المدرب</h2>
            <p className={styles.lead}>ثلاث مهام كانت تأخذ وقته، وكيف تبدو الآن.</p>
          </div>
          <div className={`${styles.grid} ${styles.gridWide}`}>
            {changes.map((change) => (
              <div
                key={change.title}
                className={`${styles.coachCard} ${styles.card} ${styles.reveal}`}
              >
                <span
                  className={`${styles.coachIco} ${styles.cardIco}`}
                  style={{
                    background:
                      change.tone === 'amber' ? AMBER : change.tone === 'navy' ? NAVY : MAGENTA,
                  }}
                >
                  <Fa
                    name={change.icon}
                    size={21}
                    fill={change.tone === 'amber' ? NAVY : change.tone === 'navy' ? AMBER : WHITE}
                  />
                </span>
                <h3 className={styles.cardTitle}>{change.title}</h3>
                <p className={styles.coachText}>{change.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Plans ═══ */}
      <section
        id="plans"
        className={`${styles.wrap} ${styles.section}`}
        style={{ display: 'flex', flexDirection: 'column', gap: 44 }}
      >
        <div className={`${styles.secHead} ${styles.secHeadCenter} ${styles.reveal}`}>
          <span className={styles.label}>07 · PLANS</span>
          <h2 className={styles.h2}>الباقات</h2>
          <p className={styles.lead}>
            تطبيق المتدرب مجاني دائمًا. الاشتراك على المدرب وحده، وتغيّر الباقة متى شئت.
          </p>
        </div>
        <div className={`${styles.grid} ${styles.gridWide}`} style={{ alignItems: 'stretch' }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`${styles.plan} ${styles.reveal} ${
                plan.picked ? styles.planPicked : styles.card
              }`}
            >
              {plan.picked && <div aria-hidden="true" className={styles.planGlow} />}
              <div className={styles.planHead}>
                <span
                  className={`${styles.planName} ${plan.picked ? styles.planNamePicked : ''}`}
                >
                  {plan.name}
                </span>
                <span className={styles.planNote}>{plan.note}</span>
              </div>
              <div className={styles.planPrice}>
                <b>{plan.price}</b>
                <span>ريال شهريًا</span>
              </div>
              <ul className={styles.planList}>
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <Fa name="check" fill={MAGENTA} />
                    {feature}
                  </li>
                ))}
              </ul>
              <AuthLink
                className={`${styles.btn} ${styles.btnPlan} ${
                  plan.ctaTone === 'magenta'
                    ? styles.btnPlanMagenta
                    : plan.ctaTone === 'amber'
                      ? styles.btnPlanAmber
                      : styles.btnPlanGhost
                }`}
                label={plan.cta}
                signedInLabel="افتح لوحتي"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" style={{ background: '#FFFFFF' }}>
        <div className={styles.faqInner}>
          <div className={`${styles.faqIntro} ${styles.reveal}`}>
            <span className={styles.label}>08 · FAQ</span>
            <h2 className={styles.h2}>أسئلة تتكرر</h2>
            <p className={styles.lead}>ما يسأله المدربون قبل أن يضيفوا أول متدرب.</p>
          </div>
          <div className={styles.faqList}>
            {faqs.map((item) => (
              <details
                key={item.q}
                className={`${styles.faq} ${styles.reveal}`}
                open={item.open}
              >
                <summary>
                  {item.q}
                  <span className={styles.plus} aria-hidden="true">
                    <Fa name="plus" size={13} />
                  </span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="start" className={styles.ctaSection}>
        <div className={`${styles.ctaBand} ${styles.reveal}`}>
          <div aria-hidden="true" className={`${styles.ctaBlob} ${styles.blob}`} />
          <div aria-hidden="true" className={styles.ctaRing} />
          <div className={styles.ctaCopy}>
            <h2>أول متدرب في ربع ساعة</h2>
            <p>
              أنشئ حسابه، طبّق عليه جدولًا جاهزًا، وحدّد أهدافه الغذائية. هو ينزّل التطبيق
              ويبدأ التسجيل من أول يوم.
            </p>
          </div>
          <AuthLink
            className={`${styles.btn} ${styles.btnCta}`}
            label="ابدأ الآن مجانًا"
            signedInLabel="افتح لوحتي"
          >
            <Fa name="arrowLeft" fill={NAVY} className={styles.arrow} />
          </AuthLink>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className={styles.footer}>
        <div className={styles.footInner}>
          <div className={styles.footCols}>
            <div className={styles.footBrand}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className={styles.logoMark}
                  style={{ width: 34, height: 34, borderRadius: 10, boxShadow: 'none' }}
                >
                  <Fa name="dumbbell" fill={WHITE} />
                </span>
                <span className={styles.logoText} style={{ fontSize: 20 }}>
                  Wizz<span>Train</span>
                </span>
              </span>
              <span className={styles.footTagline}>منصة إدارة التدريب الشخصي · عربي بالكامل</span>
            </div>
            <nav className={styles.footNav} aria-label="روابط المنتج">
              <b>المنتج</b>
              <a href="#programs">البرامج</a>
              <a href="#app">تطبيق المتدرب</a>
              <a href="#progress">المتابعة</a>
              <a href="#plans">الباقات</a>
            </nav>
            <nav className={styles.footNav} aria-label="روابط الحساب">
              <b>الحساب</b>
              <Link href="/login">تسجيل دخول</Link>
              <a href="#start">ابدأ مجانًا</a>
              <a href="#faq">الأسئلة الشائعة</a>
            </nav>
          </div>
          <div className={styles.footBar} aria-hidden="true">
            <span />
            <span />
          </div>
          <span className={styles.credits}>
            الأيقونات من{' '}
            <a href="https://fontawesome.com/" target="_blank" rel="noreferrer noopener">
              Font Awesome Free
            </a>{' '}
            — رخصة{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer noopener"
            >
              CC BY 4.0
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
