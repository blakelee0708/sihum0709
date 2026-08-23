/**
 * 대화 질문 문구 (PRD 21.10)
 *
 * 공통 10 + 면접 6 + 유료 3 + 생성 중 8 = 27개
 *
 * 말풍선 안에 들어가므로 두 줄을 넘기지 않습니다.
 * 배열의 각 원소가 한 줄입니다.
 */

export type ChatScript = string[]

/** 공통 10개 */
export const COMMON_SCRIPTS = {
  /** 대분류 */
  category: ['안녕하세요, 운이예요.', '어떤 시험 준비하세요?'],

  /** 시험명 (대분류 선택 후). {category} 치환 */
  examName: ['{category}시군요!', '어떤 시험이에요?'],

  /** 시험명 직접 입력 */
  examNameFree: ['시험 이름을 알려주세요.'],

  /** 방식 확인 */
  examType: ['필기 시험 맞으시죠?'],

  /** 시험 날짜 */
  examDate: ['시험 날짜가 언제예요?'],

  /** 시작 시간 */
  startTime: ['몇 시에 시작해요?'],

  /** 생년월일 */
  birthDate: ['이제 사주를 볼게요.', '생년월일이 어떻게 되세요?'],

  /** 태어난 시간 */
  birthTime: ['태어난 시간도 아세요?', '모르셔도 결과는 나와요.'],

  /** 이름 */
  name: ['결과에 이름을 넣어드릴까요?'],

  /** 완료. {name} 치환 */
  done: ['다 됐어요!', '{name}님 결과를 보여드릴게요.'],
} as const satisfies Record<string, ChatScript>

/** 이름을 건너뛴 경우의 완료 문구 (PRD 21.10) */
export const DONE_WITHOUT_NAME: ChatScript = [
  '다 됐어요!',
  '결과를 보여드릴게요.',
]

/** 면접 전용 6개 */
export const INTERVIEW_SCRIPTS = {
  /** 기업 규모 */
  companyScale: ['면접이시군요!', '어떤 회사예요?'],

  /** 일의 성격 */
  workType: ['어떤 일에 가까워요?'],

  /** 직무명 */
  jobTitle: ['직무 이름을 알려주실래요?', '반도체 공정기술처럼요.'],

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
 * 리포트 생성 중 8개 (필기 4 + 면접 4)
 * 3-4초 간격으로 순차 표시합니다 (PRD 14.11).
 */
export const GENERATING_SCRIPTS = {
  필기: [
    '잠깐만요, 사주를 보고 있어요',
    '{examDate} 기운을 계산하는 중이에요',
    '시험 정보를 확인하는 중이에요',
    '거의 다 됐어요!',
  ],
  면접: [
    '잠깐만요, 사주를 보고 있어요',
    '{company} 설립일을 확인하는 중이에요',
    '기업과의 궁합을 계산하는 중이에요',
    '거의 다 됐어요!',
  ],
} as const

/** 생성 중 메시지 간격 (PRD 14.11 — 3-4초) */
export const GENERATING_INTERVAL_MS = 3500

/** 문구 총 개수 확인용 (PRD 21.10 기준 27개) */
export const SCRIPT_COUNT =
  Object.keys(COMMON_SCRIPTS).length +
  Object.keys(INTERVIEW_SCRIPTS).length +
  Object.keys(PAID_SCRIPTS).length +
  GENERATING_SCRIPTS.필기.length +
  GENERATING_SCRIPTS.면접.length
