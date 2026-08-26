/**
 * 리포트 섹션 정의 (PRD 8.3, 8.4, 8.5, 8.6)
 *
 * 구간 판정과 구성 선택은 코드가 합니다.
 * AI가 D-day를 보고 알아서 판단하게 두면 구성이 흔들립니다 (PRD 8.6).
 */

import type { ExamType } from '../saju/constants'
import type { ReportDdayRange } from '../saju/fortune'

export type ReportType = '필기' | '면접'

export type SectionSource = 'calc' | 'calc+ai' | 'ai' | 'ai+search' | 'calc+fragment+ai'

export interface SectionSpec {
  key: string
  title: string
  source: SectionSource
  /** AI에 줄 지시 한 줄. 계산 섹션은 비어 있습니다 */
  brief?: string
  /**
   * 이 섹션에 요구하는 최소 글자 수 (PRD 8.3, 8.4).
   *
   * 문장 수로 지시하면("5-6문장") 모델이 짧은 문장으로 개수만 채웁니다.
   * 실측 분량이 목표의 60%에 그친 원인이 여기 있어 글자 수로 바꿨습니다.
   */
  minChars: number
  /** 최상단 강조 배치 (PRD 8.6 D-DAY) */
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
 * 명식과 오행 분포는 표와 막대로 그립니다. 그림만 두면 무료 결과와 다를 것이 없어
 * 짧은 해설을 붙입니다. 해석은 섹션 2가 맡으므로 여기서는 읽는 법만 씁니다.
 */
const SAJU: SectionSpec = {
  key: 'saju',
  title: '내 사주 명식과 오행 분포',
  source: 'calc+ai',
  brief:
    '표와 막대는 화면이 그립니다. 네 기둥이 각각 무엇을 뜻하는지, 강한 오행과 약한 오행의 점수 차가 어느 정도인지 읽는 법만 씁니다. 학습·답변 유형 해석은 다음 섹션이 맡으므로 여기서 하지 않습니다.',
  minChars: 200,
}

const CALENDAR = (year: number, word: string): SectionSpec => ({
  key: 'calendar',
  title: `${year}년 ${word}운 캘린더`,
  source: 'calc+ai',
  brief:
    'monthFlow의 월별 점수를 근거로 한 해의 흐름을 씁니다. 점수가 높은 달과 낮은 달을 짚고, 낮은 달에는 반드시 대응 행동을 붙입니다. 재료에 없는 달의 점수를 만들지 않습니다.',
  minChars: 250,
})

// ─── 필기 (PRD 8.3) ───

const W_STUDY_TYPE: SectionSpec = {
  key: 'studyType',
  title: '나의 학습 유형 진단',
  source: 'ai',
  brief:
    '집중 지속 시간, 최적 학습 시간대, 암기 방식, 취약 상황, 혼자 vs 함께 다섯 항목을 다룬다. 시험 당일이 아니라 평소 준비 방식을 쓴다.',
  minChars: 500,
}

const W_WEEK_PLAN: SectionSpec = {
  key: 'weekPlan',
  title: '시험 전 7일 데일리 플랜',
  source: 'ai',
  brief:
    'weekFlow의 날짜별 점수를 근거로 D-7부터 당일까지 하루씩 무엇을 할지 쓴다. 점수가 낮은 날에 무리한 분량을 배치하지 않는다. 하루당 130자 이상으로 쓴다.',
  minChars: 900,
}

const W_REMAINING_PLAN: SectionSpec = {
  key: 'weekPlan',
  title: '남은 기간 집중 배분',
  source: 'ai',
  brief:
    '시험까지 남은 날짜만 다룬다. 7일 플랜을 전제로 쓰지 않는다. 남은 일수를 앞/중간/마지막으로 나눠 배분한다.',
  minChars: 700,
}

const W_DAY_TIMELINE: SectionSpec = {
  key: 'dayTimeline',
  title: '시험 당일 시간대별 운용',
  source: 'ai',
  brief:
    '시작 시각을 기준으로 입실 전, 시작 직후, 중반, 후반, 종료 직전을 나눠 쓴다.',
  minChars: 600,
}

const W_CAUTIONS: SectionSpec = {
  key: 'cautions',
  title: '놓치기 쉬운 3가지',
  source: 'ai',
  brief: '약한 오행에서 도출한 실수 패턴 3가지와 각각의 대응을 쓴다. 한 가지당 150자 이상으로 쓴다.',
  minChars: 450,
}

const W_EVE: SectionSpec = {
  key: 'eve',
  title: '시험 전날 상세 타임라인',
  source: 'ai',
  brief: '저녁부터 취침까지 시간대를 나눠 쓴다.',
  minChars: 450,
}

const W_TONIGHT: SectionSpec = {
  key: 'tonight',
  title: '오늘 밤 시간대별 행동',
  source: 'ai',
  brief:
    '지금부터 취침까지를 1-2시간 단위로 나눠 쓴다. 새로 시작할 공부를 권하지 않는다.',
  minChars: 700,
}

const W_MORNING: SectionSpec = {
  key: 'morning',
  title: '내일 아침 기상부터 입실까지',
  source: 'ai',
  brief: '기상, 식사, 이동, 입실까지 시각을 붙여 쓴다.',
  minChars: 500,
}

const W_SUBJECTS: SectionSpec = {
  key: 'subjects',
  title: '과목별 시간 배분 전략',
  source: 'ai+search',
  brief:
    '검색으로 확인된 과목 구성이 있으면 그 범위 안에서만 쓴다. 확인되지 않으면 일반 배분 원칙으로 대체하고 과목명을 지어내지 않는다.',
  minChars: 450,
}

const W_SUBJECT_ORDER: SectionSpec = {
  key: 'subjects',
  title: '과목별 마지막 점검 순서',
  source: 'ai+search',
  brief:
    '남은 시간에 어떤 순서로 훑을지 쓴다. 배분이 아니라 순서다. 과목명을 지어내지 않는다.',
  minChars: 400,
}

const W_SEAT: SectionSpec = {
  key: 'seat',
  title: '좌석과 방위',
  source: 'ai',
  brief:
    '약한 오행의 방위를 근거로 쓴다. 좌석을 고를 수 없는 시험이 많으므로 자리에서 할 수 있는 조정 위주로 쓴다.',
  minChars: 300,
}

const W_AVOID: SectionSpec = {
  key: 'avoid',
  title: '이 기간 피해야 할 것',
  source: 'ai',
  brief: '강한 오행이 과하게 작용할 때 생기는 행동을 중심으로 쓴다.',
  minChars: 300,
}

const W_AVOID_TONIGHT: SectionSpec = {
  ...W_AVOID,
  title: '오늘 밤 피해야 할 것',
}

const W_AFTER: SectionSpec = {
  key: 'after',
  title: '시험 이후와 다음 기회',
  source: 'ai',
  brief: '결과를 단정하지 않고 이후 준비 방향을 쓴다.',
  minChars: 400,
}

const W_NOW_THREE: SectionSpec = {
  key: 'nowThree',
  title: '지금 바로 할 3가지',
  source: 'ai',
  brief:
    '정확히 세 문장으로 쓴다. 한 문장을 80자 이상으로 써서 무엇을 왜 하는지까지 담는다. 지금 즉시 할 수 있는 행동만 쓴다.',
  highlight: true,
  minChars: 250,
}

// ─── 면접 (PRD 8.4) ───

const I_ANSWER_TYPE: SectionSpec = {
  key: 'answerType',
  title: '나의 답변 유형 진단',
  source: 'ai',
  brief:
    '답변 스타일, 말하기 속도, 강한 질문 유형, 약한 질문 유형, 연습 방식, 압박 대응 여섯 항목을 다룬다.',
  minChars: 600,
}

const I_COMPANY: SectionSpec = {
  key: 'company',
  title: '이 기업은 어떤 곳인가',
  source: 'ai+search',
  brief:
    '검색 결과에 있는 내용만 쓴다. 확인되지 않으면 생략한다. 부정적 평판은 쓰지 않는다.',
  minChars: 450,
}

const I_COMPATIBILITY: SectionSpec = {
  key: 'compatibility',
  title: '기업과 나의 궁합',
  source: 'calc+fragment+ai',
  brief:
    '미리 쓴 관계 해석 조각이 앞에 놓이고, 기업 정보와 결합한 확장 해석만 쓴다. 조각의 판정을 뒤집지 않는다.',
  minChars: 600,
}

const I_POSITION: SectionSpec = {
  key: 'compatibility',
  title: '이 조직에서 나의 위치',
  source: 'calc+fragment+ai',
  brief:
    '설립일을 확인하지 못했다. 궁합 대신 사용자 사주와 일의 성격, 직무명만으로 쓴다. 정보를 찾지 못했다는 말을 크게 쓰지 않는다.',
  minChars: 600,
}

const I_JOB: SectionSpec = {
  key: 'job',
  title: '이 직무와 나',
  source: 'ai',
  brief:
    '직무명에서 업무 성격이 파악되면 그 수준까지 쓴다. 파악되지 않으면 일의 성격 수준으로만 쓴다. 업무 내용을 구체적으로 지어내지 않는다.',
  minChars: 600,
}

const I_QUESTIONS: SectionSpec = {
  key: 'questions',
  title: '나에게 들어올 가능성이 높은 질문',
  source: 'ai',
  brief:
    '기출 질문을 옮기지 않는다. 사주가 알려주는 약점에서 질문 유형을 역산해 유형 3-4개를 쓰고, 각 유형마다 들어올 수 있는 형태와 대응을 붙인다. 강점이 드러날 유형도 함께 넣어 균형을 맞춘다. 유형당 250자 이상으로 쓴다.',
  minChars: 900,
}

const I_CAUTIONS: SectionSpec = {
  key: 'cautions',
  title: '내가 조심해야 할 3가지',
  source: 'ai',
  brief: '약한 오행에서 도출한 실수 패턴 3가지와 각각의 대응을 쓴다. 한 가지당 150자 이상으로 쓴다.',
  minChars: 450,
}

const I_OUTFIT: SectionSpec = {
  key: 'outfit',
  title: '복장과 소지품',
  source: 'ai',
  brief: '약한 오행의 색을 근거로 쓴다. 면접 복장 기본을 벗어나지 않는다.',
  minChars: 300,
}

const I_EVE: SectionSpec = {
  key: 'eve',
  title: '면접 전날 밤',
  source: 'ai',
  brief: '저녁부터 취침까지를 쓴다.',
  minChars: 400,
}

const I_TONIGHT: SectionSpec = {
  key: 'tonight',
  title: '오늘 밤 시간대별 행동',
  source: 'ai',
  brief: '지금부터 취침까지를 1-2시간 단위로 나눠 쓴다.',
  minChars: 600,
}

const I_MORNING: SectionSpec = {
  key: 'morning',
  title: '내일 아침 기상부터 입실까지',
  source: 'ai',
  brief: '기상, 식사, 이동, 대기까지 시각을 붙여 쓴다.',
  minChars: 500,
}

const I_AFTER: SectionSpec = {
  key: 'after',
  title: '면접 이후와 다음 기회',
  source: 'ai',
  brief: '결과를 단정하지 않고 이후 준비 방향을 쓴다.',
  minChars: 400,
}

const I_NOW_THREE: SectionSpec = {
  ...W_NOW_THREE,
}

// ─── 구간별 구성 (PRD 8.6) ───

/**
 * 면접 리포트에는 7일 플랜 섹션이 없습니다 (PRD 8.4).
 * 그래서 D-8 이상과 D-2~D-7 구성이 같고, D-1과 D-DAY만 달라집니다.
 * PRD 8.6은 필기 예시만 제시하고 있어 같은 원칙으로 맞췄습니다.
 */
export function getReportSpec(
  type: ReportType,
  ddayRange: ReportDdayRange,
  year: number
): ReportSpec {
  const word = type === '면접' ? '면접' : '시험'
  const calendar = CALENDAR(year, word)

  if (type === '필기') {
    const title =
      ddayRange === 'dday'
        ? '오늘, 시험장에서'
        : ddayRange === 'eve'
          ? '오늘 밤과 내일 아침'
          : ddayRange === 'short'
            ? '남은 기간 집중 플랜'
            : '시험 전 7일 상세 플랜'

    const sections: SectionSpec[] = (() => {
      switch (ddayRange) {
        case 'normal':
          return [
            SAJU, W_STUDY_TYPE, W_WEEK_PLAN, W_DAY_TIMELINE, W_CAUTIONS,
            W_EVE, W_SUBJECTS, W_SEAT, W_AVOID, calendar, W_AFTER,
          ]
        case 'short':
          return [
            SAJU, W_STUDY_TYPE, W_REMAINING_PLAN, W_DAY_TIMELINE, W_CAUTIONS,
            W_EVE, W_SUBJECTS, W_SEAT, W_AVOID, calendar, W_AFTER,
          ]
        case 'eve':
          return [
            SAJU, W_STUDY_TYPE, W_TONIGHT, W_MORNING, W_DAY_TIMELINE,
            W_CAUTIONS, W_SUBJECT_ORDER, W_SEAT, W_AVOID_TONIGHT, calendar, W_AFTER,
          ]
        case 'dday':
          return [
            W_NOW_THREE, W_DAY_TIMELINE, W_CAUTIONS, W_SEAT,
            SAJU, W_STUDY_TYPE, calendar, W_AFTER,
          ]
      }
    })()

    return { type, ddayRange, title, sections }
  }

  const title =
    ddayRange === 'dday'
      ? '오늘, 면접장에서'
      : ddayRange === 'eve'
        ? '오늘 밤과 내일 아침'
        : '면접 상세 리포트'

  const sections: SectionSpec[] = (() => {
    switch (ddayRange) {
      case 'normal':
      case 'short':
        return [
          SAJU, I_ANSWER_TYPE, I_COMPANY, I_COMPATIBILITY, I_JOB,
          I_QUESTIONS, I_CAUTIONS, I_OUTFIT, I_EVE, calendar, I_AFTER,
        ]
      case 'eve':
        return [
          SAJU, I_ANSWER_TYPE, I_COMPANY, I_COMPATIBILITY, I_JOB,
          I_QUESTIONS, I_CAUTIONS, I_OUTFIT, I_TONIGHT, I_MORNING, calendar, I_AFTER,
        ]
      case 'dday':
        return [
          I_NOW_THREE, I_QUESTIONS, I_CAUTIONS, I_OUTFIT,
          SAJU, I_COMPATIBILITY, calendar, I_AFTER,
        ]
    }
  })()

  return { type, ddayRange, title, sections }
}

/** 설립일을 확인하지 못한 경우 궁합 섹션을 대체 섹션으로 바꿉니다 (PRD 8.7) */
export function applyMissingFoundedDate(spec: ReportSpec): ReportSpec {
  return {
    ...spec,
    sections: spec.sections.map((s) =>
      s.key === 'compatibility' ? I_POSITION : s
    ),
  }
}

/** 무료 결과의 방식을 유료 상품 종류로 바꿉니다. 실기는 상품이 없습니다 (PRD 8.2) */
export function toReportType(examType: ExamType): ReportType | null {
  if (examType === '필기') return '필기'
  if (examType === '면접') return '면접'
  return null
}

/** PRD 8.6 결제 전 안내 */
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
