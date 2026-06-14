import {
  Award,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  HelpCircle,
  Medal,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "./lib/utils";

const AUTH_REQUIRED = import.meta.env.PROD && import.meta.env.VITE_REQUIRE_AUTH !== "false";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let googleScriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

const navItems = [
  ["ranking", "ランキング"],
  ["schedule", "スケジュール"],
  ["evaluation", "評価されること"],
  ["decision", "順位の決め方"],
  ["awards", "もらえる賞"],
  ["faq", "よくある質問"],
];

const periods = {
  upper: {
    label: "上半期",
    range: "1月〜6月",
    rows: [
      ["7月の前半", "集計と投票", "売上・出勤・評価の合計を出して、投票を集めます"],
      ["7月の後半", "順位の決定", "ランキングや特別賞が決まります"],
      ["8月の前半", "最終チェック", "表彰式に向けて、必要なことを確認します"],
      ["8月の後半", "表彰式", "上半期の表彰式を開きます"],
    ],
  },
  lower: {
    label: "下半期",
    range: "7月〜12月",
    rows: [
      ["1月の前半", "集計と投票", "売上・出勤・評価の合計を出して、投票を集めます"],
      ["1月の後半", "順位の決定", "ランキングや特別賞が決まります"],
      ["2月の前半", "最終チェック", "表彰式に向けて、必要なことを確認します"],
      ["2月の後半", "表彰式", "下半期の表彰式を開きます"],
    ],
  },
};

const rankingNotes = [
  ["グループ総合ランキング", "半期の合計ポイントで順位を出します。このページで見られるように準備中です。"],
  ["店舗別ランキング", "メインのお店を基準に出します。ほかのお店に出勤した分も合わせて計算します。"],
];

const groupRankingCastNames = [
  "一ノ瀬のあ",
  "雅楽代みい",
  "恵方まき",
  "御伽めあ",
  "ぎゃるちぃ",
  "九嬢らいと",
  "こあ",
  "国宝れなち",
  "最弱のれむ",
  "櫻うる",
  "さばち",
  "式波惡",
  "樹理穴dis子",
  "瀬戸にゃ",
  "てぃらの",
  "ナツナツナツ",
  "にゃる",
  "ネコノメ",
  "ネコ屋敷",
  "猫白まりん",
  "白桃みるあ",
  "バリン",
  "星宮きゅあ",
  "観月ヱミ",
  "夢幻たろ",
  "桃川ももな",
  "雪印ふう",
  "りたぽちゃぴぱお",
  "りつ",
  "るいるい",
];

const attendanceRows = [
  ["当欠・2%当欠", "当日欠勤、または2%当欠にあたる休み方をしたとき", "-100,000pt", "minus"],
  ["遅刻・早退", "遅刻、または早退したとき", "-50,000pt", "minus"],
  ["代打", "代打出勤をしたとき", "+15,000pt", "plus"],
  ["皆勤賞", "月20日以上出勤＋遅刻・欠勤・早退なし", "+300,000pt", "plus"],
  ["15日以上出勤", "月15日以上出勤。皆勤賞と両方もらえます", "+100,000pt", "plus"],
];

const evaluationNotes = [
  ["売上", "売上小計は、1円＝1ptとして合計ポイントに反映します。"],
  ["役職", "役職についている人は、加点の対象になります。"],
  ["会議・イベント", "指定の会議やイベント、撮影などに参加すると、加点の対象になることがあります。"],
  ["投票", "みんなの投票も評価に入ります。投票は、キャストとバックヤードのスタッフも対象です。"],
];

const decisionRows = [
  ["グループ総合・店舗別ランキング", "合計ポイント", "出勤日数"],
  ["皆勤賞", "皆勤条件", "出勤日数"],
  ["アプリ賞", "アプリDL数", "推し登録数"],
  ["UGC賞", "口コミ・投稿数", "Google口コミ数"],
  ["TikTok賞", "採用本数", "申請本数"],
];

const eligibilityNote = "契約終了が決まっている、または契約が即時終了した場合は受賞対象外となり、次点の人が繰り上げになります。";

const awardSections = [
  {
    title: "グループ総合ランキング",
    icon: Trophy,
    rows: [
      ["1位", "賞金100万円", "オーナーズチケット4枚、トロフィー、賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
      ["2位", "賞金20万円", "オーナーズチケット2枚、トロフィー、賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
      ["3位", "賞金10万円", "オーナーズチケット1枚、トロフィー、賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
      ["4位", "賞金5万円", "トロフィー、賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
      ["5位", "賞金3万円", "トロフィー、賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
      ["6位", "25,000ローズ", "賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
      ["7位", "20,000ローズ", "賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
      ["8位", "15,000ローズ", "賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
      ["9位", "10,000ローズ", "賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
      ["10位", "5,000ローズ", "賞状、映像、ロズリン特集、屋外広告（ドンキなど）"],
    ],
  },
  {
    title: "店舗別ランキング",
    icon: Building2,
    rows: [
      ["1位", "25,000ローズ", "トロフィー、賞状、映像、ロズリン特集、メディア掲載"],
      ["2位", "20,000ローズ", "賞状、映像、ロズリン特集、メディア掲載"],
      ["3位", "15,000ローズ", "賞状、映像、ロズリン特集、メディア掲載"],
      ["4位", "10,000ローズ", "賞状、映像、ロズリン特集、メディア掲載"],
      ["5位", "5,000ローズ", "賞状、映像、ロズリン特集、メディア掲載"],
    ],
  },
  {
    title: "特別賞",
    icon: Medal,
    rows: [
      ["皆勤賞", "賞金10万円", "皆勤の条件を満たした人の中で、出勤した日数が一番多い人"],
      ["アプリ賞", "賞金5万円", "アプリのダウンロード数。同じ数のときは推し登録の数で決めます"],
      ["UGC賞", "賞金5万円", "対象の口コミ・投稿の数。同じ数のときはGoogle口コミの数で決めます"],
      ["TikTok賞", "賞金5万円", "採用された本数。同じ数のときはフォーム申請の本数で決めます"],
    ],
  },
];

const faqRows = [
  ["同じポイントの人が何人かいたら？", "賞ごとに決めている「同点のときに見るところ」で順位や受賞者を決めます。"],
  ["オーナーズチケットって何？", "グループ総合ランキングの1〜3位の人がもらえるチケットです。10枚集めると、自分のお店をオープンできる権利にチャレンジできます。ただし、必ず運営の審査があるので、10枚集めたら無条件にオープンできるわけではありません。"],
  ["今のランキングは見られる？", "グループ総合ランキングと店舗別ランキングをこのページで見られるように準備中です。できあがったらここで見られるようにします。"],
  ["店舗別ランキングはどう計算するの？", "メインのお店を基準にして、ほかのお店に出勤した分も合わせて計算します。"],
  ["ポイントがマイナスになることはある？", "あります。減点で合計がマイナスになっても、その数字がそのまま最終ポイントになります。"],
  ["いくつも賞をもらえる？", "もらえます。1人で複数の賞を受け取ってOKです。"],
];

function Tag({ children, tone = "default" }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded border px-2 py-1 text-xs font-bold",
        tone === "primary" && "border-teal-200 bg-teal-50 text-teal-800",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "plus" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "minus" && "border-red-200 bg-red-50 text-red-700",
        tone === "default" && "border-slate-200 bg-white text-slate-700",
      )}
    >
      {children}
    </span>
  );
}

function SectionTitle({ id, icon: Icon, label, title, lead }) {
  return (
    <div id={id} className="scroll-mt-24 border-t border-slate-200 pt-6 sm:scroll-mt-28 sm:pt-8">
      <div className="mb-3 flex items-start gap-3 sm:mb-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-teal-700 text-white sm:h-9 sm:w-9">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="hidden text-xs font-bold uppercase tracking-wider text-teal-700 sm:block">{label}</p>
          <h2 className="mt-1 text-lg font-bold leading-tight text-slate-950 sm:text-xl">{title}</h2>
          {lead ? <p className="mt-2 text-sm leading-6 text-slate-600">{lead}</p> : null}
        </div>
      </div>
    </div>
  );
}

function JumpNav() {
  const jumpTo = (event) => {
    const id = event.target.value;
    if (id) window.location.hash = id;
  };

  return (
    <nav className="sticky top-12 z-30 border-b border-slate-200 bg-white sm:top-14">
      <div className="mx-auto max-w-5xl px-4 py-2">
        <label className="relative block md:hidden">
          <span className="sr-only">表示する項目</span>
          <select
            className="h-10 w-full appearance-none rounded border border-slate-300 bg-white px-3 pr-9 text-sm font-bold text-slate-800"
            defaultValue=""
            onChange={jumpTo}
          >
            <option value="" disabled>
              見たい項目を選ぶ
            </option>
            {navItems.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        </label>

        <div className="hidden gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex">
          {navItems.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-teal-800">
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function DenseTable({ headers, rows, getTone, mobileHeaders = headers }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-bold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.join("-")} className="align-top">
                {row.slice(0, headers.length).map((cell, index) => (
                  <td key={`${row[0]}-${index}`} className={cn("px-4 py-3", index === 0 && "font-bold", index > 0 && "text-slate-600")}>
                    {getTone && index === headers.length - 1 ? <Tag tone={getTone(row)}>{cell}</Tag> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white sm:hidden">
        {rows.map((row) => (
          <div key={row.join("-")} className="border-b border-slate-200 p-3 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold">{row[0]}</p>
              {getTone ? <Tag tone={getTone(row)}>{row[headers.length - 1]}</Tag> : null}
            </div>
            <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-600">
              {mobileHeaders.slice(1).map((header, index) => {
                const value = row[index + 1];
                if (getTone && index + 1 === headers.length - 1) return null;
                return (
                  <p key={header}>
                    <span className="font-bold text-slate-950">{header}: </span>
                    {value}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CastNameList({ names }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm font-bold text-slate-950 sm:grid-cols-3">
      {names.map((name) => (
        <p key={name} className="min-w-0 border-b border-slate-100 pb-2 leading-5">
          {name}
        </p>
      ))}
    </div>
  );
}

function MobileAwardSection({ section }) {
  const Icon = section.icon;

  return (
    <details className="rounded-lg border border-slate-200 bg-white" open={section.title === "グループ総合ランキング"}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span className="flex items-center gap-2 text-sm font-bold">
          <Icon className="h-4 w-4 text-teal-800" aria-hidden="true" />
          {section.title}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
      </summary>
      <div className="grid gap-2 border-t border-slate-200 p-3">
        {section.rows.map(([rank, reward, detail]) => (
          <div key={`${section.title}-${rank}`} className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <Tag tone="warning">{rank}</Tag>
              <p className="text-sm font-bold text-slate-950">{reward}</p>
            </div>
            <p className="text-xs leading-5 text-slate-600">{detail}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

function MobileScheduleList({ rows }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white sm:hidden">
      {rows.map(([date, title, body]) => (
        <div key={`${date}-${title}`} className="border-b border-slate-200 p-3 last:border-b-0">
          <p className="text-sm font-bold text-slate-950">{date}</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
        </div>
      ))}
    </div>
  );
}

function LoginScreen({ authError }) {
  const messages = {
    denied: "このGoogleアカウントは閲覧対象に含まれていません。",
    invalid: "ログイン状態の確認に失敗しました。もう一度ログインしてください。",
    error: "ログイン処理中にエラーが発生しました。",
  };
  const buttonRef = useRef(null);
  const [message, setMessage] = useState(authError ? messages[authError] || messages.error : "");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function setupGoogleLogin() {
      try {
        const configResponse = await fetch("/api/auth/config");
        const config = await configResponse.json();
        if (!config.clientId) throw new Error("GOOGLE_CLIENT_ID is not set");

        await loadGoogleScript();
        if (cancelled || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: async ({ credential }) => {
            setMessage("");

            const response = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ credential }),
            });

            if (response.ok) {
              window.location.replace("/");
              return;
            }

            setMessage(response.status === 403 ? messages.denied : messages.invalid);
          },
        });

        const buttonWidth = Math.min(320, buttonRef.current.offsetWidth || 320);
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: buttonWidth,
        });
        setIsReady(true);
      } catch {
        if (!cancelled) setMessage("ログイン設定を確認できませんでした。");
      }
    }

    setupGoogleLogin();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-teal-900">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-teal-700 text-xs text-white">AW</span>
          キャスト表彰制度
        </div>
        <h1 className="text-xl font-bold">Googleログインが必要です</h1>
        {message ? (
          <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
            {message}
          </p>
        ) : null}
        <div className="mt-4 flex min-h-11 justify-center" ref={buttonRef} />
        {!isReady ? <p className="mt-3 text-center text-xs font-semibold text-slate-500">ログインボタンを準備しています</p> : null}
      </div>
    </div>
  );
}

function AuthGate({ children }) {
  const [state, setState] = useState(AUTH_REQUIRED ? "loading" : "ready");
  const authError = new URLSearchParams(window.location.search).get("auth");

  useEffect(() => {
    if (!AUTH_REQUIRED) return;

    fetch("/api/me", { credentials: "include" })
      .then((response) => {
        setState(response.ok ? "ready" : "login");
      })
      .catch(() => setState("login"));
  }, []);

  if (state === "ready") return children;
  if (state === "login") return <LoginScreen authError={authError} />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-slate-600">
      ログイン状態を確認しています
    </div>
  );
}

function RulesPage() {
  const [period, setPeriod] = useState("upper");
  const activePeriod = periods[period];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-3 px-4 sm:h-14">
          <a href="#ranking" className="flex items-center gap-2 text-sm font-bold text-teal-900">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-teal-700 text-xs text-white">AW</span>
            キャスト表彰制度
          </a>
          <span className="hidden sm:inline-flex">
            <Tag>更新日 2026-06-14</Tag>
          </span>
          <span className="sm:hidden">
            <Tag>6/14更新</Tag>
          </span>
        </div>
      </header>

      <JumpNav />

      <main className="mx-auto max-w-5xl px-4 pb-10">
        <SectionTitle
          id="ranking"
          icon={Trophy}
          label="Ranking"
          title="今のランキング"
        />
        <div className="grid gap-3 md:grid-cols-2">
          {rankingNotes.map(([title, body]) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-bold">{title}</p>
                <Tag tone={title === "グループ総合ランキング" ? "primary" : "warning"}>
                  {title === "グループ総合ランキング" ? "TOP30" : "準備中"}
                </Tag>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {title === "グループ総合ランキング"
                  ? "50音順/売上・勤怠のみ反映、投票・貢献度反映の後、順位が変わる可能性があります。"
                  : body}
              </p>
              {title === "グループ総合ランキング" ? <CastNameList names={groupRankingCastNames} /> : null}
            </div>
          ))}
        </div>

        <SectionTitle id="schedule" icon={CalendarDays} label="Schedule" title="対象期間とスケジュール" />
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-200 pb-3 sm:mb-4 sm:pb-4">
            <p className="text-sm font-bold text-slate-800">
              {activePeriod.label} <span className="text-slate-500">/ {activePeriod.range}</span>
            </p>
            <div className="flex shrink-0 gap-2">
              {Object.entries(periods).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "h-9 rounded border px-3 text-sm font-bold",
                    period === key ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                  onClick={() => setPeriod(key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <MobileScheduleList rows={activePeriod.rows} />
          <div className="hidden sm:block">
            <DenseTable headers={["時期", "内容", "くわしく"]} rows={activePeriod.rows} />
          </div>
        </div>

        <SectionTitle
          id="evaluation"
          icon={ClipboardCheck}
          label="Evaluation"
          title="何が評価される？"
        />
        <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm leading-6 text-teal-950">
          売上小計をベースに、各項目で増減します。
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-700">勤怠ポイント</h3>
            <DenseTable headers={["項目", "条件", "ポイント"]} rows={attendanceRows} getTone={(row) => row[3]} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-700">その他の評価対象</h3>
            <div className="grid gap-2">
              {evaluationNotes.map(([title, body]) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SectionTitle
          id="decision"
          icon={ShieldCheck}
          label="Decision"
          title="順位の決め方"
        />
        <DenseTable headers={["賞", "評価基準", "同点時"]} rows={decisionRows} />
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
          {eligibilityNote}
        </div>

        <SectionTitle
          id="awards"
          icon={Award}
          label="Awards"
          title="もらえる賞"
        />
        <div className="grid gap-3 sm:hidden">
          {awardSections.map((section) => (
            <MobileAwardSection key={section.title} section={section} />
          ))}
        </div>

        <div className="hidden gap-4 sm:grid">
          {awardSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-teal-800" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-slate-800">{section.title}</h3>
                </div>
                <DenseTable headers={["順位・賞", "内容", "特典"]} rows={section.rows} />
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
          <p className="text-sm font-bold text-teal-900">オーナーズチケットについて</p>
          <p className="mt-1 text-sm leading-6 text-teal-900">
            グループ総合ランキングの1〜3位の人がもらえるチケットです。10枚集めると、自分のお店をオープンできる権利にチャレンジできます。ただし、必ず運営の審査があるので、10枚集めたら無条件でオープンできるわけではありません。
          </p>
        </div>

        <SectionTitle id="faq" icon={HelpCircle} label="FAQ" title="よくある質問" />
        <div className="grid gap-2">
          {faqRows.map(([question, answer]) => (
            <details key={question} className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-bold text-slate-950">{question}</summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
            </details>
          ))}
        </div>

      </main>
    </div>
  );
}

function App() {
  return (
    <AuthGate>
      <RulesPage />
    </AuthGate>
  );
}

export default App;
