"""
24절기 시각 테이블 생성 (PRD 4.1.1)

범위      1940 - 2030
항목      연당 절기 12개 (중기 제외)
출력      lib/saju/solarterms.json
시간대    KST (UTC+9), 분 단위

태양의 겉보기 황경이 지정 각도에 도달하는 순간을 이분법으로 찾습니다.
skyfield 1.55에는 almanac.solar_terms가 없으므로 교차 시각을 직접 계산합니다.

런타임에는 조회만 하므로 이 스크립트는 1회만 실행합니다.
"""

import datetime as _dt
import json
import os
import sys

from skyfield.api import load
from skyfield.framelib import ecliptic_frame

# 절입 12개. (절기명, 태양황경, 대략적인 양력 월일)
# 중기(우수, 춘분, 곡우 ...)는 월주 결정에 쓰이지 않으므로 제외합니다.
TERMS = [
    ("소한", 285, (1, 6)),
    ("입춘", 315, (2, 4)),
    ("경칩", 345, (3, 6)),
    ("청명", 15, (4, 5)),
    ("입하", 45, (5, 6)),
    ("망종", 75, (6, 6)),
    ("소서", 105, (7, 7)),
    ("입추", 135, (8, 8)),
    ("백로", 165, (9, 8)),
    ("한로", 195, (10, 8)),
    ("입동", 225, (11, 7)),
    ("대설", 255, (12, 7)),
]

START_YEAR = 1940
END_YEAR = 2030

KST_HOURS = 9.0

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(ROOT, "lib", "saju", "solarterms.json")


def make_longitude_fn(ts, eph):
    earth, sun = eph["earth"], eph["sun"]

    def solar_longitude(tt_jd):
        """주어진 TT 율리우스일에서 태양의 겉보기 황경(도)"""
        t = ts.tt_jd(tt_jd)
        astrometric = earth.at(t).observe(sun).apparent()
        _, lon, _ = astrometric.frame_latlon(ecliptic_frame)
        return lon.degrees % 360.0

    return solar_longitude


def find_crossing(solar_longitude, target, jd_guess, window=20.0):
    """
    태양황경이 target에 도달하는 TT 율리우스일을 이분법으로 찾습니다.
    태양은 하루 약 1도 움직이므로 ±window일이면 교차점을 한 번만 포함합니다.
    """

    def signed_diff(jd):
        # target 기준 -180 ~ +180 으로 펼쳐 단조 증가하게 만듭니다
        return ((solar_longitude(jd) - target + 180.0) % 360.0) - 180.0

    lo = jd_guess - window
    hi = jd_guess + window

    f_lo = signed_diff(lo)
    f_hi = signed_diff(hi)

    if f_lo > 0 or f_hi < 0:
        # 창 안에 교차점이 없습니다. 창을 넓혀 재시도합니다.
        if window > 60:
            raise RuntimeError("교차점을 찾지 못했습니다 target=%s" % target)
        return find_crossing(solar_longitude, target, jd_guess, window * 2)

    # 1초(= 1/86400일) 미만까지 좁힙니다
    for _ in range(60):
        mid = (lo + hi) / 2.0
        if signed_diff(mid) < 0:
            lo = mid
        else:
            hi = mid
        if hi - lo < 1.0 / 86400.0:
            break

    return (lo + hi) / 2.0


def main():
    ts = load.timescale()
    eph = load("de421.bsp")
    solar_longitude = make_longitude_fn(ts, eph)

    table = {}

    for year in range(START_YEAR, END_YEAR + 1):
        year_table = {}
        for name, lon, (m, d) in TERMS:
            guess = ts.utc(year, m, d, 12).tt
            jd = find_crossing(solar_longitude, lon, guess)

            # TT -> UTC -> KST
            t = ts.tt_jd(jd)
            dt_utc = t.utc_datetime().replace(tzinfo=None)
            dt_kst = dt_utc + _dt.timedelta(hours=KST_HOURS)
            # 초는 버립니다(반올림하지 않습니다).
            #
            # 국내에 공표되는 절기표가 초를 버린 값을 씁니다. 반올림하면
            # 절입 초가 30초를 넘는 절기마다 1분씩 늦게 나와 다른 만세력과
            # 어긋납니다. 실제로 2026년 12개 중 6개가 1분씩 밀렸습니다.
            dt_kst = dt_kst.replace(second=0, microsecond=0)

            # 절기가 예상 연도에 들어왔는지 확인
            if dt_kst.year != year:
                print(
                    "경고: %d년 %s 가 %s 로 계산됨" % (year, name, dt_kst),
                    file=sys.stderr,
                )

            year_table[name] = dt_kst.strftime("%Y-%m-%d %H:%M")

        table[str(year)] = year_table
        if year % 10 == 0:
            print("  %d년 완료" % year, file=sys.stderr)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(table, f, ensure_ascii=False, separators=(",", ":"))

    size = os.path.getsize(OUT_PATH)
    print("생성 완료 %s (%d년, %.1fKB)" % (OUT_PATH, len(table), size / 1024))

    for y in ("2024", "2025", "2026"):
        if y in table:
            print("%s 입춘  %s" % (y, table[y]["입춘"]))


if __name__ == "__main__":
    main()
