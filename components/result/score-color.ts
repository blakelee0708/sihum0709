/**
 * 점수 → 색 (PRD 21.2, 21.10)
 *
 * 'use client'가 없는 순수 모듈입니다. 이유가 있습니다.
 *
 * 원래 이 두 함수는 ScorePair.tsx 안에 있었습니다. ScorePair는 'use client'
 * 파일이라, 거기서 export한 함수를 서버 컴포넌트가 import하면 함수가 아니라
 * 클라이언트 참조가 넘어옵니다. 호출하면 이렇게 터집니다.
 *
 *   Attempted to call scoreColor() from the server but scoreColor is on
 *   the client. It's not possible to invoke a client function from the
 *   server, it can only be rendered as a Component or passed to props
 *   of a Client Component.
 *
 * 서버 컴포넌트인 ReportCover가 이 함수를 부르고 있었습니다. 완료된 유료
 * 리포트를 열면 표지에서 통째로 터져 "잠깐 문제가 생겼어요"가 떴습니다.
 * 생성은 정상이고 DB는 completed인데 화면만 실패로 보이는 상태였습니다.
 *
 * 타입 검사와 빌드는 통과합니다. 런타임에만 납니다. 완료된 리포트를 실제로
 * 브라우저에서 열어 보고서야 나왔습니다.
 *
 * 색만 돌려주는 순수 함수라 클라이언트 경계 안에 있을 이유가 없습니다.
 * 여기로 옮기고 양쪽에서 import합니다.
 *
 * 점수를 색으로만 구분하지 않고 숫자를 항상 함께 표시합니다 (PRD 21.10).
 * 낮은 점수에도 붉은 경고색을 쓰지 않고 주황 계열까지만 씁니다.
 */

export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--score-high)'
  if (score >= 50) return 'var(--score-mid)'
  return 'var(--score-low)'
}

/**
 * 발휘 지수는 70-120 범위라 0-100 기준 색을 그대로 쓸 수 없습니다.
 * 100을 기준으로 위아래를 나눕니다.
 */
export function potentialColor(score: number): string {
  if (score >= 105) return 'var(--score-high)'
  if (score >= 95) return 'var(--score-mid)'
  return 'var(--score-low)'
}
