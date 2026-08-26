/**
 * 대화 질문 문구 (PRD 21.11)
 *
 * ── 배열의 각 원소가 말풍선 하나입니다 ──
 *
 * 전에는 원소 하나가 한 줄이었고 배열 전체가 말풍선 하나였습니다.
 * 그러면 세 문장을 말할 때 말풍선이 길어져 읽기 부담이 생깁니다.
 * 순차로 뜨는 말풍선 세 개가 대화에 가깝습니다.
 *
 *   ['안녕하세요', '어떤 시험 준비하세요?']   말풍선 2개
 *
 * 한 말풍선 안에서 줄을 바꿔야 하면 원소 안에 \n을 넣습니다.
 *
 *   ['태어난 시간도 아세요?\n모르셔도 결과는 나와요.']   말풍선 1개, 2줄
 *
 * 어느 쪽으로 쓸지는 의미로 가릅니다. 질문과 그 질문에 딸린 안내는
 * 한 말풍선에, 성격이 다른 말은 따로 띄웁니다.
 */

export type ChatScript = string[]

/** 공통 12개 */
export const COMMON_SCRIPTS = {
  /**
   * 첫 인사. 말풍선 세 개로 나눕니다.
   *
   * 한 말풍선에 세 문장이 들어가면 길어 보입니다. 순차로 뜨면 사람이
   * 말을 건네는 느낌이 납니다.
   */
  category: [
    '안녕하세요, 여러분의 합격을 응원하는 합격이예요.',
    '꼭 합격하시길 바라며,\n시험 보는 날의 운을 봐드릴게요.',
    '어떤 시험 준비하세요?',
  ],

  /** 하위 그룹 (자격증 · 어학) */
  subGroup: ['자격증이신가요, 어학이신가요?'],

  /** 시험명. 대분류별 공감 문구는 CATEGORY_INTRO를 씁니다 */
  examName: ['어떤 시험이에요?'],

  /** 시험 기간 (대학교 시험) */
  examPeriod: ['시험이 며칠 동안 이어져요?'],

  /** 시험명 직접 입력 */
  examNameFree: ['시험 이름을 알려주세요.'],

  /** 방식 확인 */
  examType: ['필기 시험 맞으시죠?'],

  /** 시험 날짜 */
  examDate: ['시험 날짜가 언제예요?'],

  /** 시작 시간 */
  startTime: ['몇 시에 시작해요?'],

  /**
   * 생년월일 — 양력 · 음력 선택 (FIX_3 [3]-2).
   *
   * 나이가 있는 분들은 생일을 음력으로 알고 있습니다. 묻지 않고 양력으로
   * 받으면 한 달 가까이 어긋난 사주가 나옵니다.
   */
  birthCalendar: ['이제 사주와 그날의 기운 흐름을 볼게요.\n생년월일이 어떻게 되세요?'],

  /** 윤달 확인. 음력을 고른 경우에만 묻습니다 (FIX_3 [3]-2) */
  birthLeapMonth: ['윤달이신가요?'],

  /** 생년월일 숫자 입력 */
  birthDate: ['생년월일을 숫자로 적어주세요.'],

  /**
   * 음력을 양력으로 바꿔 확인시킵니다. {date} 치환 (FIX_3 [3]-2).
   *
   * 변환 결과를 보여주지 않으면 사용자는 자기가 적은 음력 날짜로 사주를
   * 본다고 생각합니다. 나중에 결과에 뜬 양력 날짜를 보고 오류로 오해합니다.
   */
  birthConfirm: ['양력으로 {date}이시네요.\n이 날짜로 봐드릴게요.'],

  /** 태어난 시간을 아는지 (FIX_3 [3]-3) */
  birthTimeKnown: ['태어난 시간도 아세요?\n모르셔도 결과는 나와요.'],

  /** 태어난 시간 */
  birthTime: ['몇 시쯤 태어나셨어요?'],

  /** 이름 */
  name: ['결과에 이름을 넣어드릴까요?'],

  /** 완료. {name} 치환 */
  done: ['다 됐어요!', '{name}님 결과를 보여드릴게요.'],
} as const satisfies Record<string, ChatScript>

/**
 * 대분류별 공감 문구 (PRD 21.11).
 *
 * 전에는 "{category}시군요!" 한 줄이었습니다. "공무원시군요"처럼 조사가
 * 어색해지는 경우가 있고, 무엇보다 고른 것을 되읊는 것뿐이라 아무것도
 * 더해주지 않습니다.
 *
 * 각 분류가 어떤 시간을 보내고 있는지 한 줄 알아주고 다음 질문으로
 * 갑니다. 두 문장을 넘기지 않습니다. 길어지면 위로가 아니라 서론이 됩니다.
 *
 * 자격증 · 어학은 여기서 공감하지 않습니다. 하위 그룹을 먼저 물어야 해서
 * 말풍선이 하나 더 끼면 늘어집니다.
 */
export const CATEGORY_INTRO: Record<string, ChatScript> = {
  suneung: ['수능 준비하시는군요.\n그동안 고생 많으셨죠?', '어떤 시험이에요?'],
  gov: ['공무원 시험 준비하시는군요.\n긴 싸움이라 힘드시죠?', '어떤 시험이에요?'],
  'cert-lang': ['어떤 시험이에요?'],
  'corp-written': [
    '기업 필기 준비하시는군요.\n인적성은 준비가 까다롭죠.',
    '어떤 시험이에요?',
  ],
  'corp-interview': [
    '네! 기업 면접을 앞두고 있군요.\n많이 긴장되시죠?',
    '어떤 시험이에요?',
  ],
  grad: [
    '편입이나 대학원 준비하시는군요.\n쉽지 않은 길 택하셨네요.',
    '어떤 시험이에요?',
  ],
  school: ['학교 시험이시군요.\n시험 기간이 제일 정신없죠.', '어떤 시험이에요?'],
  promo: [
    '승진 시험 준비하시는군요.\n일하면서 준비하시느라 힘드시겠어요.',
    '어떤 시험이에요?',
  ],
  audition: [
    '오디션 준비하시는군요.\n무대에 서기까지가 제일 떨리죠.',
    '어떤 오디션이에요?',
  ],
  etc: ['어떤 시험인지 알려주시겠어요?'],
}

/** 이름을 건너뛴 경우의 완료 문구 (PRD 21.10) */
export const DONE_WITHOUT_NAME: ChatScript = [
  '다 됐어요!',
  '결과를 보여드릴게요.',
]

/** 면접 전용 6개 */
export const INTERVIEW_SCRIPTS = {
  /**
   * 기업 규모.
   *
   * 지금은 쓰지 않습니다 (PRD 10.8). 되살릴 때를 위해 문구만 남깁니다.
   */
  companyScale: ['어떤 회사예요?'],

  /** 일의 성격 */
  workType: ['어떤 업무 성격에 가까운지 물어봐도 될까요?'],

  /**
   * 직무명.
   *
   * 예시를 "반도체 공정기술"에서 "영업관리"로 바꿨습니다. 반도체 공정기술은
   * 특정 업계에 치우쳐 있어, 그쪽이 아닌 사람은 무엇을 적으라는 건지
   * 감이 안 옵니다.
   */
  jobTitle: ['직무 이름도 알려주시겠어요?\n영업관리처럼 적어주시면 돼요.'],

  /** 면접 날짜 */
  examDate: ['면접 날짜가 언제예요?'],

  /** 면접 시간 */
  startTime: ['몇 시에 면접이에요?'],

  /** 완료 */
  done: ['다 됐어요!', '면접운을 보여드릴게요.'],
} as const satisfies Record<string, ChatScript>

/** 유료 추가 입력 (면접) 3개 */
export const PAID_SCRIPTS = {
  /** 기업명 */
  companyName: ['어느 기업 면접이에요?'],

  /** 직무 확인 (무료에서 입력한 경우). {jobTitle} 치환 */
  jobConfirm: ['직무는 {jobTitle} 맞으시죠?'],

  /** 직무 입력 (무료에서 건너뛴 경우) */
  jobInput: ['직무 이름을 알려주세요.'],
} as const satisfies Record<string, ChatScript>

/**
 * 리포트 생성 중 문구 (PRD 14.11, 21.11)
 *
 * 실측 소요가 필기 144초, 면접 173초라 간격을 방식마다 다르게 둡니다.
 * 문구 9개면 간격이 8번이므로 8 × 18 = 144초, 8 × 20 = 160초입니다.
 *
 * 면접은 실측 173초라 문구가 13초쯤 먼저 동납니다. 간격을 더 늘리지 않는
 * 이유는 명식과 오행 분포 카드가 초반 20초·40초 안에 나와야 하기 때문입니다
 * (PRD 21.11). 남는 시간은 마지막 문구를 유지해 채웁니다.
 *
 * 처음에는 목표 소요(필기 90초, 면접 130초)에 맞췄는데, 섹션 하한 미달을
 * 없애려고 effort를 medium으로 올리면서 실제 소요가 늘었습니다. 문구가
 * 먼저 동나면 사용자는 마지막 문구를 한참 보고 있게 됩니다.
 *
 * 절대 시각을 하나하나 적지 않고 간격만 둡니다. 목표 소요가 바뀌면
 * 간격 하나만 고치면 됩니다.
 *
 * 마지막 문구 이후에도 끝나지 않으면 그 문구를 유지합니다.
 * 완료되면 남은 문구를 건너뛰고 즉시 결과로 넘어갑니다.
 */
export interface GeneratingStep {
  text: string
  /**
   * 문구 뒤에 붙일 계산 결과 카드.
   * 명식과 오행 분포는 코드가 즉시 산출하므로 AI를 기다리는 동안 이미 값이
   * 있습니다. 2번과 3번 문구 뒤에 붙여 초반 20-40초를 실물로 채웁니다.
   */
  card?: 'saju' | 'elements'
}

/** 방식별 문구 간격 (초) — PRD 21.11 */
export const GENERATING_INTERVAL_SEC: Record<'필기' | '면접', number> = {
  필기: 18,
  면접: 20,
}

export const GENERATING_STEPS: Record<'필기' | '면접', readonly GeneratingStep[]> = {
  필기: [
    { text: '잠깐만요, 사주를 보고 있어요' },
    { text: '{name}님 명식이 나왔어요', card: 'saju' },
    { text: '오행 분포를 계산하는 중이에요', card: 'elements' },
    { text: '{examDate} 기운을 보고 있어요' },
    { text: '시험 전 7일 흐름을 정리하는 중이에요' },
    { text: '{exam} 정보를 확인하는 중이에요' },
    { text: '남은 기간 배분을 계산하는 중이에요' },
    { text: '거의 다 됐어요' },
    { text: '마무리하는 중이에요' },
  ],
  면접: [
    { text: '잠깐만요, 사주를 보고 있어요' },
    { text: '{name}님 명식이 나왔어요', card: 'saju' },
    { text: '오행 분포를 계산하는 중이에요', card: 'elements' },
    { text: '{company} 설립일을 확인하는 중이에요' },
    { text: '기업 사주를 계산하는 중이에요' },
    { text: '{name}님과의 궁합을 보고 있어요' },
    { text: '{jobTitle} 직무를 살펴보는 중이에요' },
    { text: '거의 다 됐어요' },
    { text: '마무리하는 중이에요' },
  ],
}

/** 이 방식의 문구가 다 지나가는 데 걸리는 시간 (초) */
export function generatingSpanSec(type: '필기' | '면접'): number {
  return (GENERATING_STEPS[type].length - 1) * GENERATING_INTERVAL_SEC[type]
}

/**
 * 생성 중 안내 문구 (PRD 14.12).
 *
 * 이 문구가 없으면 사용자가 나가면 결제 금액을 잃는다고 생각해 억지로
 * 기다립니다. 실제로는 서버가 끝까지 만들어 저장합니다.
 */
export const GENERATING_NOTICE: Record<'필기' | '면접', string[]> = {
  필기: [
    '약 2분 30초 정도 걸려요.',
    '이 화면을 닫으셔도 완성되면 계속 볼 수 있어요.',
  ],
  면접: [
    '약 3분 정도 걸려요.',
    '이 화면을 닫으셔도 완성되면 계속 볼 수 있어요.',
  ],
}

export interface GeneratingVars {
  name?: string | null
  /** 예: '9월 12일' */
  examDate?: string | null
  exam?: string | null
  company?: string | null
  jobTitle?: string | null
}

/**
 * 생성 중 문구의 자리표시자를 채웁니다.
 *
 * 이름을 건너뛴 사람에게 "님"만 남으면 어색하므로 조사까지 함께 지웁니다.
 * 나머지는 값이 없을 때 일반 명사로 대체합니다.
 */
export function fillGenerating(text: string, vars: GeneratingVars): string {
  const out = vars.name
    ? text.replace(/\{name\}/g, vars.name)
    : text.replace(/\{name\}님(과의)?\s*/g, '')

  return out
    .replace(/\{examDate\}/g, vars.examDate || '시험일')
    .replace(/\{exam\}/g, vars.exam || '시험')
    .replace(/\{company\}/g, vars.company || '기업')
    .replace(/\{jobTitle\}/g, vars.jobTitle || '지원하신')
}

/**
 * 대기 화면 상한 (밀리초).
 *
 * 넘어가면 실패 화면(PRD 14.13)으로 바꿔 사용자가 직접 다시 누르게 합니다.
 *
 * PRD 14.11이 정한 240초입니다. 목표 소요가 필기 90초, 면접 130초인데
 * 검색이 느린 날이나 AI 응답이 지연되는 경우가 있어 여유를 둡니다.
 * Vercel 함수 상한은 300초라 서버가 먼저 끊기지 않습니다 (PRD 15.1).
 *
 * 이 값을 넘겨도 서버는 계속 돌아 저장을 마칩니다. 사용자가 나중에 다시
 * 들어오면 완성된 리포트를 봅니다 (PRD 14.12).
 */
export const GENERATING_TIMEOUT_MS = 240_000

/** 문구 총 개수 확인용 (PRD 21.11 기준 39개) */
export const SCRIPT_COUNT =
  Object.keys(COMMON_SCRIPTS).length +
  Object.keys(INTERVIEW_SCRIPTS).length +
  Object.keys(PAID_SCRIPTS).length +
  GENERATING_STEPS.필기.length +
  GENERATING_STEPS.면접.length
