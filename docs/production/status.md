# 현재 상태와 다음 작업

기준일: 2026-09-07. **G001 구현·기술 검증 완료. [PR #11](https://github.com/dm-choo/pc-cafe-simulator/pull/11)에서 검토할 수 있습니다.**

## 구현한 것

- TypeScript/Vite/Three.js WebGL2 + React DOM UI, 12석 매장·카운터·작은 주방.
- Rapier 캐릭터 충돌, WASD 이동, 포인터 잠금/드래그/방향키 시선, E 좌석·카운터 확인.
- 배치 미리보기, 일시정지, 품질·감도 설정. 배치는 아직 적용하지 않습니다.
- 50ms sim 고정 스텝, UI/숨김 정지, 읽기 전용 개발 진단과 초기화.
- 로컬 생성 임시 형상·재질과 공유 인스턴싱. 최종 현실풍 GLB·인물은 G003 범위입니다.

## 검증

- Node 24.19.0, npm 11.9.0. 정확한 패키지 버전은 package-lock.json.
- 로컬 타입 검사·빌드·lint와 Vitest 6개 통과.
- 로컬 Chromium 다운로드 지연 및 대체 Chromium 149 실행 SIGSEGV. 브라우저 통과로 처리하지 않았습니다.
- GitHub Actions에서 production `/pc-cafe-simulator/` 경로의 Playwright 3개 모두 통과. 이동·벽 충돌·카운터·배치 미리보기·설정·새로고침·포인터 잠금·숨김 신호를 확인했습니다.
- [성공 실행 #34087700101](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34087700101), 검사 코드 커밋 `0cd9070`. 이후 문서 변경의 CI는 해당 head에서 별도로 확인합니다.
- 입구·좌석 통로·카운터·배치·작은 설정 화면을 다운로드해 시각 검토했습니다. 자산 HTTP 오류·처리되지 않은 오류는 0개였습니다.
- [화면·리포트](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34087700101/artifacts/10005800568), [실행 빌드](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34087700101/artifacts/10005800942), artifact 14일 보관.
- 자세한 환경·발견한 결함·제한은 [G001 검증 기록](../quality/evidence/g001.md).
- 사람 재미, RTX 3060 실측, 공개 Pages 배포는 미완료입니다.

## 다음 행동

1. G001은 검증된 PR 상태입니다. main 통합·공개 Pages 배포는 아직 하지 않았습니다.
2. G001 통합 후 [G002 첫 손님과 첫 매출](https://github.com/dm-choo/pc-cafe-simulator/issues/2)을 같은 프로젝트에서 진행합니다.

## G002 시작 위치

`src/sim/game.ts`의 상태·명령·step에 고객/좌석 이용을 추가하고 `src/content/cafe.ts`의 좌석 ID를 재사용합니다. `src/runtime/engine.ts`는 규칙을 직접 계산하지 않고 sim을 호출합니다. 렌더 표현은 `src/render/`, 경영 화면은 `src/ui/`입니다.

현재 실제 제품·2026-01-01 가격 데이터, 고객·경제·음식 규칙·세이브는 없습니다. 초기 이슈 #1~#9와 원래 제품 계획은 유지합니다.
