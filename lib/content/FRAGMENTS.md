# 문장 조각 사용 가이드

## 파일

```
fragments.json        무료 조각 167개
paid-fragments.json   유료 조각 10개
```

배치 위치는 PRD 16장을 따릅니다.

```
/lib/content/fragments.json
/lib/content/paid-fragments.json
```

---

## 조각 구조와 개수

### 무료 (167개)

| 키 | 개수 | 결정 기준 | 사용 위치 |
|---|---|---|---|
| speechBubble | 5 | D-day 구간 | 상단 말풍선 |
| typeDescription | 5 | 강한 오행 | 뱃지 모달 |
| dayStem | 10 | 일간 | 카드 1 |
| strongElement | 5 | 강한 오행 | 카드 1 |
| weakElement | 5 | 약한 오행 | 카드 1 |
| dayRelation | 5 | 시험일 일진 관계 | 카드 1 |
| verdict | 5 | 당일 운 지수 구간 | 카드 1 |
| methodIntro | 21 | 방식 3 × 변형 7 | 카드 2 |
| methodByStrong | 15 | 방식 3 × 강한 오행 5 | 카드 2 |
| methodByWeak | 15 | 방식 3 × 약한 오행 5 | 카드 2 |
| workTypeByStrong | 20 | 일의 성격 4 × 강한 오행 5 | 카드 2 (면접) |
| companyScale | 6 | 기업 규모 | 카드 2 (면접) |
| luckyNumberByWeak | 5 | 약한 오행 | 카드 3 |
| numberUseByMethod | 3 | 방식 | 카드 3 |
| luckyColorByWeak | 5 | 약한 오행 | 카드 4 |
| outfitByMethod | 3 | 방식 | 카드 4 |
| eveByStrong | 5 | 강한 오행 | 카드 5 |
| eveByWeak | 5 | 약한 오행 | 카드 5 |
| eveByMethod | 3 | 방식 | 카드 5 |
| flowLabel | 6 | 일별 기운 지수 구간 | 카드 6 |
| startTimeByRelation | 15 | 관계 5 × 방식 3 | 카드 8 |

### 유료 (10개)

| 키 | 개수 | 결정 기준 |
|---|---|---|
| compatibility | 5 | 기업 일간 관계 |
| positionByStrong | 5 | 강한 오행 (설립일 미확인 시 대체) |

---

## 변수

조각에 포함된 변수와 치환 규칙입니다.

| 변수 | 값 | 없을 때 |
|---|---|---|
| {name}님 | 사용자 이름 | 해당 부분 제거 |
| {exam} | 시험명 또는 기업명 | 필수 입력 |
| {jobPhrase} | 직무명 또는 일의 성격 라벨 | 일의 성격 라벨로 대체 |
| {examDate} | 시험 날짜 (예: 4월 11일) | 필수 |
| {examParticle} | examDate 뒤 조사 (은/는) | 받침 판정 |
| {startTime} | 시작 시각 (예: 오후 2시 30분) | 카드 8 미표시 |
| {branchName} | 시지 이름 (예: 미시) | 카드 8 미표시 |
| {branchHanja} | 시지 한자 (예: 未時) | 카드 8 미표시 |

### 치환 함수

```typescript
function render(
  template: string,
  vars: { name?: string; [key: string]: any }
): string {
  let t = template

  // 이름 처리
  if (vars.name) {
    t = t.replace(/\{name\}님/g, `${vars.name}님`)
  } else {
    t = t
      .replace(/\{name\}님은\s*/g, '')
      .replace(/\{name\}님에게\s*/g, '')
      .replace(/\{name\}님과\s*/g, '')
      .replace(/\{name\}님의\s*/g, '')
      .replace(/\{name\}님이\s*/g, '')
      .replace(/\{name\}님\s*/g, '')
  }

  // 나머지 변수
  for (const [k, v] of Object.entries(vars)) {
    if (k === 'name') continue
    t = t.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  }

  return t.replace(/\s+/g, ' ').trim()
}
```

### 조사 판정

examDate 뒤 조사는 날짜 표기에 따라 달라집니다.

```
"4월 11일" → 받침 있음 → 은
"4월 5일"  → 받침 없음 → 는  (일이 아닌 표기를 쓸 경우)
```

PRD 3.8의 attachParticle 함수로 판정한 결과를 examParticle에 넣습니다.

---

## 조립 규칙

### 카드 1

```typescript
[
  F.dayStem[saju.dayStemName],
  F.strongElement[saju.strong],
  F.weakElement[saju.weak],
  F.dayRelation[fortune.examDayRelation],
  F.verdict[getScoreRange(fortune.examDayScore)]
]
```

### 카드 2 (필기 / 실기)

```typescript
const v = saju.dayPillarIndex % 7
[
  F.methodIntro[type][v],
  F.methodByStrong[type][saju.strong],
  F.methodByWeak[type][saju.weak]
]
```

### 카드 2 (면접)

```typescript
const v = saju.dayPillarIndex % 7
[
  F.methodIntro['면접'][v],
  F.companyScale[input.companyScale],
  F.workTypeByStrong[input.workType][saju.strong],
  F.methodByWeak['면접'][saju.weak]
]
```

면접은 조각이 4개라 다른 카드보다 길어집니다. 화면에서 문단 사이 간격으로 조절합니다.

### 카드 3

```typescript
[
  F.luckyNumberByWeak[saju.weak],
  F.numberUseByMethod[type]
]
```

### 카드 4

```typescript
[
  F.luckyColorByWeak[saju.weak],
  F.outfitByMethod[type]
]
```

### 카드 5

```typescript
[
  F.eveByStrong[saju.strong],
  F.eveByWeak[saju.weak],
  F.eveByMethod[type]
]
```

### 카드 6

```typescript
weekFlow.map(d => ({
  ...d,
  label: F.flowLabel[getScoreRange(d.score)]
}))
```

### 카드 8

```typescript
F.startTimeByRelation[type][fortune.startTimeRelation]
```

시작 시간을 모르는 경우 이 카드를 표시하지 않습니다.

---

## 구간 매핑

```typescript
function getScoreRange(score: number): string {
  if (score >= 80) return '80-100'
  if (score >= 65) return '65-79'
  if (score >= 50) return '50-64'
  if (score >= 35) return '35-49'
  if (score >= 20) return '20-34'
  return '0-19'
}
```

verdict는 5구간이므로 20 미만도 '0-34'로 처리합니다.

```typescript
function getVerdictRange(score: number): string {
  if (score >= 80) return '80-100'
  if (score >= 65) return '65-79'
  if (score >= 50) return '50-64'
  if (score >= 35) return '35-49'
  return '0-34'
}
```

D-day 구간은 다음과 같습니다.

```typescript
function getDdayRange(dday: number): string {
  if (dday >= 30) return 'D30+'
  if (dday >= 8) return 'D8-29'
  if (dday >= 2) return 'D2-7'
  if (dday === 1) return 'D1'
  return 'D0'
}
```

---

## 일의 성격 키

workTypeByStrong의 키는 공백 없이 붙여 쓴 형태입니다.

```
사람을만나는일
분석하고만드는일
조율하고운영하는일
현장에서움직이는일
```

화면 표시용 라벨은 별도로 관리합니다.

```typescript
const WORK_TYPE_LABEL = {
  '사람을만나는일': '사람을 만나는 일',
  '분석하고만드는일': '분석하고 만드는 일',
  '조율하고운영하는일': '조율하고 운영하는 일',
  '현장에서움직이는일': '현장에서 움직이는 일'
}
```

jobPhrase가 비었을 때 이 라벨을 대신 넣습니다.

---

## 일간 키

dayStem의 키는 한글 표기입니다.

```
갑목 을목 병화 정화 무토 기토 경금 신금 임수 계수
```

---

## 작성 원칙

이 조각들은 PRD 3.6과 18장의 규칙을 따라 작성됐습니다. 수정하거나 추가하실 때 같은 기준을 지켜주시기 바랍니다.

1. 개별 조각에서 좋다, 유리하다, 불리하다 같은 단정을 쓰지 않습니다
2. 모든 조각은 "이런 면이 있고, 대신 이런 면이 있다" 구조로 씁니다
3. 판정은 verdict에서만 합니다
4. 낮은 점수 판정에는 반드시 행동 조언을 붙입니다
5. 합격을 보장하거나 암시하는 표현을 쓰지 않습니다
6. 최상급 수식을 쓰지 않습니다
7. 말풍선만 구어체이고 나머지는 격식체입니다

---

## 유료 조각 사용

```typescript
// 설립일 확인된 경우
[
  P.compatibility[fortune.compatibilityRelation],
  ...aiGenerated   // 기업 맥락 확장
]

// 설립일 미확인
[
  P.positionByStrong[saju.strong],
  ...aiGenerated   // 직무 맥락 확장
]
```

조각을 먼저 두고 AI 생성분을 뒤에 붙입니다. 순서를 바꾸면 사주 해석의 일관성이 무너집니다.
