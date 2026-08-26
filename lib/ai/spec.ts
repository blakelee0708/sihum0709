/**
 * 리포트 섹션 정의 (PRD 8.3, 8.4, 8.5, 8.8)
 *
 * 구간 판정과 구성 선택은 코드가 합니다.
 * AI가 D-day를 보고 알아서 판단하게 두면 구성이 흔들립니다 (PRD 8.8).
 *
 * 필기 14섹션 / 면접 15섹션이며, 섹션마다 최소 글자 수와 근거로 쓸 계산값을
 * 함께 적어 둡니다. 둘 다 프롬프트에 그대로 들어갑니다.
 */

import type { ExamType } from '../saju/constants'
import type { ReportDdayRange } from '../saju/fortune'

export type ReportType = '필기' | '면접'

export type SectionSource =
  | 'calc'
  | 'calc+ai'
  | 'ai'
  | 'ai+search'
  | 'fragment+ai'
  | 'calc+fragment+ai'

export interface SectionSpec {
  key: string
  title: string
  source: SectionSource
  /** AI에 줄 지시 한 줄 */
  brief?: string
  /**
   * 이 섹션에 요구하는 최소 글자 수 (PRD 8.3, 8.4).
   *
   * 문장 수로 지시하면("5-6문장") 모델이 짧은 문장으로 개수만 채웁니다.
   * 실측 분량이 목표의 60%에 그친 원인이 여기 있어 글자 수로 바꿨습니다.
   */
  minChars: number
  /**
   * 근거로 쓸 계산값 (PRD 8.5).
   *
   * 프롬프트에 섹션마다 붙습니다. 근거 없이 일반론을 쓰면 다른 사주
   * 서비스와 구분되지 않습니다.
   */
  basis: string
  /** 최상단 강조 배치 (PRD 8.8 D-DAY) */
  highlight?: boolean
}

export interface ReportSpec {
  type: ReportType
  ddayRange: ReportDdayRange
  /** 화면 상단 제목 */
  title: string
  sections: SectionSpec[]
}

// ─── 공통 섹션 ───

/**
 * 명식과 오행 분포는 표와 막대로 그립니다. 그림만 두면 무료 결과와 다를 것이
 * 없어 짧은 해설을 붙입니다. 해석 본론은 섹션 2, 3이 맡습니다.
 */
const SAJU: SectionSpec = {
  key: 'saju',
  title: '내 사주 명식과 오행 분포',
  source: 'calc+ai',
  brief:
    '표와 막대는 화면이 그립니다. 여덟 글자가 각각 무엇을 뜻하는지, 강한 오행과 약한 오행의 점수 차가 어느 정도인지 읽는 법을 씁니다. 학습·답변 유형 해석은 다음 섹션이 맡으므로 여기서 하지 않습니다.',
  minChars: 250,
  basis: '8글자 오행 분포, 일간',
}

const CALENDAR = (year: number, word: string): SectionSpec => ({
  key: 'calendar',
  title: `${year}년 ${word}운 캘린더`,
  source: 'calc+ai',
  brief:
    'monthFlow의 월별 점수를 근거로 한 해의 흐름을 씁니다. 점수가 높은 달과 낮은 달을 짚고, 낮은 달에는 반드시 대응 행동을 붙입니다. 재료에 없는 달의 점수를 만들지 않습니다.',
  minChars: 300,
  basis: '월지 오행 × 일간',
})

/** 섹션 10 — 무료 카드 7에서 유료로 이관된 항목입니다 (PRD 3.7) */
const LUCKY: SectionSpec = {
  key: 'lucky',
  title: '나의 행운 색과 방위',
  source: 'calc+ai',
  brief:
    '약한 오행에서 나온 색·방위·시간대·숫자를 어디에 어떻게 쓸지 씁니다. 옷 전체가 아니라 적용 위치(넥타이, 필기구, 손목)를 짚습니다. 무료에서 이미 본 숫자 하나와 피해야 할 색을 다시 설명하지 않습니다.',
  minChars: 400,
  basis: '약한 오행 색상, 방위, 시간대',
}

// ─── 필기 (PRD 8.3) ───

const W_PATTERN: SectionSpec = {
  key: 'pattern',
  title: '내 사주가 말하는 시험 패턴',
  source: 'fragment+ai',
  brief:
    '미리 쓴 십신 조각이 앞에 놓입니다. 조각의 판정을 뒤집지 말고, 실제 십신 분포 점수와 천간·지지 위치를 반영해 확장합니다. 관성(평가받는 자리), 식상(표현), 인성(학습) 세 가지를 반드시 다룹니다.',
  minChars: 550,
  basis: '십신 관계 (관성, 식상, 비겁)',
}

const W_STUDY_TYPE: SectionSpec = {
  key: 'studyType',
  title: '나의 학습 유형 진단',
  source: 'ai',
  brief:
    '집중 지속 시간, 최적 학습 시간대, 암기 방식, 취약 상황, 혼자 vs 함께 다섯 항목을 다룹니다. 시험 당일이 아니라 평소 준비 방식을 씁니다.',
  minChars: 550,
  basis: '강한 오행 + 약한 오행',
}

const W_DAY_TIMELINE: SectionSpec = {
  key: 'dayTimeline',
  title: '시험 당일 시간대별 운용',
  source: 'calc+ai',
  brief:
    'timeSlots 배열을 순서대로 다룹니다. 각 구간의 지지 오행과 일간의 십신 관계는 재료에 이미 판정돼 있으니 그대로 씁니다. 시작 이후는 종료 시각을 모르므로 "시작 직후 20분", "시작 후 40분 지점", "후반", "마지막 10분" 같은 상대 표현을 씁니다.',
  minChars: 900,
  basis: '12지지 오행 × 사용자 오행',
}

/** 시간을 모르면 시간대 없는 구성으로 대체합니다 (PRD 8.16) */
const W_DAY_NO_TIME: SectionSpec = {
  ...W_DAY_TIMELINE,
  source: 'ai',
  brief:
    '시작 시각을 받지 못해 timeSlots가 없습니다. 시각을 지어내지 말고 입실 전·시작 직후·중반·후반·종료 직전의 순서로만 씁니다. 시간이 정해지면 다시 확인해보시라는 안내를 한 번 넣습니다.',
  basis: '강한 오행 + 약한 오행 (시각 미상)',
}

const W_WEEK_PLAN: SectionSpec = {
  key: 'weekPlan',
  title: '시험 전 7일 데일리 플랜',
  source: 'calc+ai',
  brief:
    'weekFlow의 날짜별 점수와 일진 관계를 근거로 D-7부터 당일까지 하루씩 무엇을 할지 씁니다. 점수가 낮은 날에 무리한 분량을 배치하지 않습니다. 하루당 150자 이상으로 씁니다.',
  minChars: 1100,
  basis: '일별 일진 × 사용자 일간',
}

const W_REMAINING_PLAN: SectionSpec = {
  ...W_WEEK_PLAN,
  title: '남은 날짜 데일리 플랜',
  brief:
    'weekFlow 중 오늘 이후 날짜만 다룹니다. 7일 플랜을 전제로 쓰지 않습니다. 남은 날짜마다 점수를 근거로 무엇을 할지 씁니다.',
}

const W_EVE_TO_MORNING: SectionSpec = {
  ...W_WEEK_PLAN,
  title: '오늘 밤부터 내일 입실까지',
  brief:
    '날짜별이 아니라 시간 단위로 씁니다. 오늘(D-1) 기운 지수를 근거로 18시 이후 무엇을 할지, 22시에 책을 덮어야 하는 이유, 23시 취침을 쓰고, 이어서 내일(D-DAY) 기운 지수를 근거로 기상·아침·이동·입실을 씁니다.',
}

const W_NOW_TO_END: SectionSpec = {
  ...W_WEEK_PLAN,
  title: '지금부터 시험 종료까지',
  brief:
    'exam.now와 exam.hoursUntilStart를 기준으로 지금 이 시각부터 시험이 끝날 때까지를 씁니다. 남은 시간이 몇 시간인지 먼저 밝히고 그 안에서만 계획합니다. 남은 시간이 음수이면 시험이 이미 시작했거나 끝난 것이므로 준비 계획을 쓰지 말고 마무리와 이후로 톤을 바꿉니다. 섹션 8(남은 기간 배분)의 내용도 여기에 합쳐 씁니다.',
}

const W_CAUTIONS: SectionSpec = {
  key: 'cautions',
  title: '놓치기 쉬운 3가지',
  source: 'ai',
  brief:
    '약한 오행에서 도출한 실수 패턴 3가지와 각각의 대응을 씁니다. 한 가지당 160자 이상으로 씁니다.',
  minChars: 500,
  basis: '약한 오행이 만드는 취약점',
}

const W_EVE: SectionSpec = {
  key: 'eve',
  title: '시험 전날 상세 타임라인',
  source: 'ai',
  brief: '저녁부터 취침까지 시간대를 나눠 씁니다.',
  minChars: 500,
  basis: '강한 오행의 야간 특성',
}

/**
 * 섹션 8. PRD 8.12가 필기 검색을 없애면서 과목별 시간 배분이 사라진 자리입니다.
 * 과목명 대신 학습의 성격(암기, 이해, 반복)으로 배분을 제시합니다.
 */
const W_REMAINING_USE: SectionSpec = {
  key: 'remaining',
  title: '남은 기간 어떻게 쓸까',
  source: 'ai',
  brief:
    '과목명을 쓰지 않습니다. 암기·이해·반복 세 성격으로 나누고 약한 오행을 보완하는 순서로 배분합니다. 검색으로 확인한 과목 구성이 없으므로 특정 시험의 과목 수나 배점을 지어내지 않습니다.',
  minChars: 500,
  basis: '약한 오행 보완 순서',
}

const W_DISCARD: SectionSpec = {
  ...W_REMAINING_USE,
  title: '지금 무엇을 버릴까',
  brief:
    '남은 날짜가 짧습니다. 더할 것이 아니라 뺄 것을 씁니다. 암기·이해·반복 중 지금 손대면 손해인 것을 짚고, 약한 오행을 보완하는 최소한만 남깁니다. 과목명을 지어내지 않습니다.',
}

const W_TONIGHT_TABLE: SectionSpec = {
  ...W_REMAINING_USE,
  title: '오늘 밤 시간표',
  brief:
    '지금부터 취침까지를 1-2시간 단위로 나눠 씁니다. 새로 시작할 공부를 권하지 않습니다. 과목명을 지어내지 않습니다.',
}

const W_SEAT: SectionSpec = {
  key: 'seat',
  title: '좌석과 방위',
  source: 'calc+ai',
  brief:
    '약한 오행의 방위를 근거로 씁니다. 좌석을 고를 수 없는 시험이 많으므로 자리에서 할 수 있는 조정 위주로 씁니다.',
  minChars: 350,
  basis: '약한 오행 방위',
}

const W_AVOID: SectionSpec = {
  key: 'avoid',
  title: '이 기간 피해야 할 것',
  source: 'ai',
  brief: '강한 오행이 과하게 작용할 때 생기는 행동을 중심으로 씁니다.',
  minChars: 350,
  basis: '강한 오행을 더 키우는 요소',
}

const W_AFTER: SectionSpec = {
  key: 'after',
  title: '시험 이후와 다음 기회',
  source: 'ai',
  brief:
    '결과를 단정하지 않고 이후 준비 방향을 씁니다. 방식 궁합 점수와 월별 흐름을 근거로 다음 기회를 언제로 볼지 씁니다.',
  minChars: 450,
  basis: '방식 궁합 + 월별 흐름',
}

const W_STRATEGY: SectionSpec = {
  key: 'strategy',
  title: '내 사주로 본 시험 전략',
  source: 'fragment+ai',
  brief:
    '미리 쓴 반복 패턴 조각이 앞에 놓입니다. 조각이 짚은 패턴이 이 사람의 십신 분포에서 왜 나오는지 설명하고, 다음 시험에서 그 패턴을 끊는 방법을 씁니다. 섹션 2와 같은 말을 반복하지 않습니다.',
  minChars: 500,
  basis: '십신 관계에서 나오는 반복 패턴',
}

const W_NOW_THREE: SectionSpec = {
  key: 'nowThree',
  title: '지금 바로 할 3가지',
  source: 'ai',
  brief:
    '정확히 세 문장으로 씁니다. 한 문장을 80자 이상으로 써서 무엇을 왜 하는지까지 담습니다. 지금 즉시 할 수 있는 행동만 씁니다.',
  minChars: 250,
  basis: '약한 오행이 만드는 취약점',
  highlight: true,
}

// ─── 면접 (PRD 8.4) ───

const I_PATTERN: SectionSpec = {
  ...W_PATTERN,
  title: '내 사주가 말하는 면접 패턴',
}

const I_ANSWER_TYPE: SectionSpec = {
  key: 'answerType',
  title: '나의 답변 유형 진단',
  source: 'ai',
  brief:
    '답변 스타일, 말하기 속도, 강한 질문 유형, 약한 질문 유형, 연습 방식, 압박 대응 여섯 항목을 다룹니다.',
  minChars: 600,
  basis: '강한 오행 + 약한 오행',
}

const I_DAY_TIMELINE: SectionSpec = {
  ...W_DAY_TIMELINE,
  title: '면접 당일 시간대별 운용',
  brief:
    'timeSlots 배열을 순서대로 다룹니다. 각 구간의 지지 오행과 일간의 십신 관계는 재료에 판정돼 있으니 그대로 씁니다. 면접은 진행 시간을 알 수 없으므로 대기 시간 관리에 무게를 둡니다.',
}

const I_DAY_NO_TIME: SectionSpec = {
  ...I_DAY_TIMELINE,
  source: 'ai',
  brief:
    '면접 시각을 받지 못해 timeSlots가 없습니다. 시각을 지어내지 말고 대기·호명 직전·입장 직후·후반의 순서로만 씁니다. 시간이 정해지면 다시 확인해보시라는 안내를 한 번 넣습니다.',
  basis: '강한 오행 + 약한 오행 (시각 미상)',
}

const I_COMPANY: SectionSpec = {
  key: 'company',
  title: '이 기업은 어떤 곳인가',
  source: 'ai+search',
  brief:
    '검색 결과에 있는 내용만 씁니다. 확인되지 않으면 생략합니다. 부정적 평판은 쓰지 않습니다.',
  minChars: 450,
  basis: '기업 사주 + 검색 결과',
}

const I_COMPATIBILITY: SectionSpec = {
  key: 'compatibility',
  title: '기업과 나의 궁합',
  source: 'calc+fragment+ai',
  brief:
    '미리 쓴 관계 해석 조각이 앞에 놓이고, 기업 정보와 결합한 확장 해석만 씁니다. 조각의 판정을 뒤집지 않습니다.',
  minChars: 600,
  basis: '기업 일간 × 사용자 일간, 기업 오행 분포',
}

const I_POSITION: SectionSpec = {
  ...I_COMPATIBILITY,
  title: '이 조직에서 나의 위치',
  brief:
    '설립일을 확인하지 못했습니다. 궁합 대신 사용자 사주와 일의 성격, 직무명만으로 씁니다. 정보를 찾지 못했다는 말을 크게 쓰지 않습니다.',
  basis: '강한 오행 + 일의 성격',
}

const I_JOB: SectionSpec = {
  key: 'job',
  title: '이 직무와 나',
  source: 'ai',
  brief:
    '직무명에서 업무 성격이 파악되면 그 수준까지 씁니다. 파악되지 않으면 일의 성격 수준으로만 씁니다. 업무 내용을 구체적으로 지어내지 않습니다.',
  minChars: 600,
  basis: '강한 오행 + 직무 성격',
}

const I_QUESTIONS: SectionSpec = {
  key: 'questions',
  title: '들어올 가능성이 높은 질문',
  source: 'ai',
  brief:
    '기출 질문을 옮기지 않습니다. 사주가 알려주는 약점에서 질문 유형을 역산해 유형 3-4개를 쓰고, 각 유형마다 들어올 수 있는 형태와 대응을 붙입니다. 강점이 드러날 유형도 함께 넣어 균형을 맞춥니다. 유형당 250자 이상으로 씁니다.',
  minChars: 900,
  basis: '약한 오행 + 십신 관계',
}

const I_CAUTIONS: SectionSpec = {
  ...W_CAUTIONS,
  title: '내가 조심해야 할 3가지',
}

const I_OUTFIT: SectionSpec = {
  key: 'outfit',
  title: '복장과 소지품',
  source: 'ai',
  brief:
    '약한 오행의 색을 근거로 씁니다. 면접 복장 기본을 벗어나지 않습니다. 섹션 10과 겹치지 않도록 여기서는 복장과 소지품만 다룹니다.',
  minChars: 400,
  basis: '약한 오행 색상',
}

const I_EVE: SectionSpec = {
  key: 'eve',
  title: '면접 전날 밤',
  source: 'ai',
  brief: '저녁부터 취침까지를 씁니다.',
  minChars: 500,
  basis: '강한 오행의 야간 특성',
}

const I_TONIGHT: SectionSpec = {
  ...I_EVE,
  title: '오늘 밤부터 내일 입실까지',
  brief:
    '날짜가 아니라 시간 단위로 씁니다. 오늘 저녁부터 취침까지, 이어서 내일 기상·아침·이동·대기까지 시각을 붙여 씁니다.',
}

const I_NOW_TO_END: SectionSpec = {
  ...I_EVE,
  title: '지금부터 면접 종료까지',
  brief:
    'exam.now와 exam.hoursUntilStart를 기준으로 지금 이 시각부터 면접이 끝날 때까지를 씁니다. 남은 시간이 몇 시간인지 먼저 밝힙니다. 음수이면 이미 시작했거나 끝난 것이므로 마무리와 이후로 톤을 바꿉니다.',
}

const I_AFTER: SectionSpec = {
  ...W_AFTER,
  title: '면접 이후와 다음 기회',
}

const I_STRATEGY: SectionSpec = {
  ...W_STRATEGY,
  title: '내 사주로 본 면접 전략',
}

const I_NOW_THREE: SectionSpec = { ...W_NOW_THREE }

// ─── 구간별 구성 (PRD 8.8) ───

/**
 * PRD 8.8 표
 *
 * | 구간 | 섹션 5 | 섹션 8 |
 * | D-8 이상 | 시험 전 7일 데일리 플랜 | 남은 기간 어떻게 쓸까 |
 * | D-2~D-7 | 남은 날짜 데일리 플랜 | 지금 무엇을 버릴까 |
 * | D-1 | 오늘 밤부터 내일 입실까지 | 오늘 밤 시간표 |
 * | D-DAY | 지금부터 시험 종료까지 | 섹션 5에 통합 |
 *
 * 면접에는 7일 데일리 플랜이 없습니다 (PRD 8.4). 그래서 D-8 이상과 D-2~D-7
 * 구성이 같고, D-1과 D-DAY에서 섹션 12(전날 밤)만 바뀝니다.
 */
export interface SpecOptions {
  /** 시작 시각을 모르면 섹션 4를 시간대 없는 구성으로 대체합니다 (PRD 8.16) */
  hasStartTime?: boolean
}

export function getReportSpec(
  type: ReportType,
  ddayRange: ReportDdayRange,
  year: number,
  options: SpecOptions = {}
): ReportSpec {
  const hasStartTime = options.hasStartTime ?? true
  const word = type === '면접' ? '면접' : '시험'
  const calendar = CALENDAR(year, word)

  if (type === '필기') {
    const dayTimeline = hasStartTime ? W_DAY_TIMELINE : W_DAY_NO_TIME

    const title =
      ddayRange === 'dday'
        ? '오늘, 시험장에서'
        : ddayRange === 'eve'
          ? '오늘 밤과 내일 아침'
          : ddayRange === 'short'
            ? '남은 기간 집중 플랜'
            : '시험 전 상세 플랜'

    if (ddayRange === 'dday') {
      // 당일 아침 결제자는 읽을 시간이 없습니다. 긴 글을 앞에 두지 않습니다.
      return {
        type,
        ddayRange,
        title,
        sections: [
          W_NOW_THREE, W_NOW_TO_END, W_CAUTIONS, W_SEAT, LUCKY,
          SAJU, W_PATTERN, calendar, W_AFTER,
        ],
      }
    }

    const plan =
      ddayRange === 'eve'
        ? W_EVE_TO_MORNING
        : ddayRange === 'short'
          ? W_REMAINING_PLAN
          : W_WEEK_PLAN

    const useSection =
      ddayRange === 'eve'
        ? W_TONIGHT_TABLE
        : ddayRange === 'short'
          ? W_DISCARD
          : W_REMAINING_USE

    return {
      type,
      ddayRange,
      title,
      sections: [
        SAJU, W_PATTERN, W_STUDY_TYPE, dayTimeline, plan, W_CAUTIONS,
        W_EVE, useSection, W_SEAT, LUCKY, W_AVOID, calendar, W_AFTER, W_STRATEGY,
      ],
    }
  }

  const dayTimeline = hasStartTime ? I_DAY_TIMELINE : I_DAY_NO_TIME

  const title =
    ddayRange === 'dday'
      ? '오늘, 면접장에서'
      : ddayRange === 'eve'
        ? '오늘 밤과 내일 아침'
        : '면접 상세 리포트'

  if (ddayRange === 'dday') {
    return {
      type,
      ddayRange,
      title,
      sections: [
        I_NOW_THREE, I_NOW_TO_END, I_QUESTIONS, I_CAUTIONS, I_OUTFIT, LUCKY,
        SAJU, I_PATTERN, I_COMPATIBILITY, calendar, I_AFTER,
      ],
    }
  }

  const eve = ddayRange === 'eve' ? I_TONIGHT : I_EVE

  return {
    type,
    ddayRange,
    title,
    sections: [
      SAJU, I_PATTERN, I_ANSWER_TYPE, dayTimeline, I_COMPANY, I_COMPATIBILITY,
      I_JOB, I_QUESTIONS, I_CAUTIONS, LUCKY, I_OUTFIT, eve, calendar,
      I_AFTER, I_STRATEGY,
    ],
  }
}

/** 설립일을 확인하지 못한 경우 궁합 섹션을 대체 섹션으로 바꿉니다 (PRD 8.9) */
export function applyMissingFoundedDate(spec: ReportSpec): ReportSpec {
  return {
    ...spec,
    sections: spec.sections.map((s) =>
      s.key === 'compatibility' ? I_POSITION : s
    ),
  }
}

/**
 * 무료 결과의 방식을 유료 상품 종류로 바꿉니다 (PRD 8.2).
 * 실기와 오디션은 1차 출시에서 유료 상품이 없습니다.
 */
export function toReportType(examType: ExamType): ReportType | null {
  if (examType === '필기') return '필기'
  if (examType === '면접') return '면접'
  return null
}

/** PRD 8.8 결제 전 안내 */
export const DDAY_NOTICE: Record<ReportDdayRange, string[]> = {
  normal: [],
  short: [
    '시험이 얼마 남지 않았네요.',
    '남은 날짜에 맞춘 구성으로 만들어 드립니다.',
  ],
  eve: [
    '시험이 내일이네요.',
    '7일 플랜 대신 오늘 밤과 내일 아침에 집중한 내용으로 만들어 드립니다.',
  ],
  dday: [
    '오늘이 시험일이네요.',
    '지금부터 시험 종료까지에 집중한 내용으로 만들어 드립니다.',
  ],
}
