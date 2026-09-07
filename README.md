# 한국 PC방 타이쿤

내 매장을 직접 돌보고, 손님을 이해하고, 투자와 직원 운영으로 성장시키는 1인칭 한국 PC방 경영 게임.

**현재 단계: 개발 준비 문서·저장소 구성·초기 이슈 등록 완료. 게임 실행 코드는 아직 없습니다.** 저장소는 [dm-choo/pc-cafe-simulator](https://github.com/dm-choo/pc-cafe-simulator)입니다. 등록·검증 상태와 다음 작업은 [현재 상태](docs/production/status.md)에 기록합니다.

## 개발 기준

- 재미: 관찰 → 선택 → 직접 행동/투자 → 눈에 보이는 변화 → 다음 개선.
- 현실감: 실제 PC방 사장이라면 납득할 판단. 실존 장비와 게임, 2026-01-01 국내 가격 참고.
- 표현: 한국 PC방의 비율·재질·조명·사람 움직임이 자연스러운 현실풍 3D.
- 성능: 웹에서 원활한 영업. GTA V는 현실감과 부드러운 움직임의 참고점이며 동등 품질을 보장한다는 뜻은 아닙니다.
- 범위: 같은 게임을 12→24석·7일 완성판으로 만든 뒤 60석으로 확장합니다.

## 바로 읽을 문서

| 목적 | 문서 |
| --- | --- |
| 전체 안내·어느 문서가 기준인가 | [문서 지도](docs/README.md) |
| 기존 합의된 게임 계획 v0.3 | [게임 계획](docs/product/plan.md) |
| 실제 개발자·전문가 조사와 적용 근거 | [조사 보고서](docs/research/agent-game-development.md) |
| 사람과 에이전트의 역할·작업·리뷰 | [협업 방식](docs/development/workflow.md) |
| 다음 에이전트에게 바로 줄 작업 | [첫 매장 작업서](docs/tasks/001-first-cafe.md) |
| 전체 순서와 기능별 완료 조건 | [로드맵과 백로그](docs/production/backlog.md) |
| 구조·데이터·시간·저장 | [아키텍처](docs/architecture/overview.md) |
| 현실풍 에셋 제작·최적화 | [아트 제작](docs/art/pipeline.md), [품질 검증](docs/quality/validation.md) |
| GitHub 협업·배포·복구 | [GitHub 운영](docs/development/github.md) |

## 현재 실행할 수 있는 검증

Python 3.10 이상, 외부 패키지 없이:

```bash
python3 scripts/check_docs.py
git diff --check
```

게임 개발 명령은 첫 작업 G001에서 구현합니다. 아직 `npm install`, `npm run dev`, `npm test`가 동작하는 프로젝트라고 보고하지 않습니다. 추후 기본 스택은 TypeScript + Vite + Three.js(WebGL2), React DOM UI, Blender GLB, IndexedDB입니다.

## 에이전트 시작 지시

```text
AGENTS.md와 docs/production/status.md를 읽고 G001을 진행해줘.
docs/tasks/001-first-cafe.md의 범위와 완료 조건을 적용해줘.
기존 변경을 확인한 뒤 구현하고, 브라우저에서 직접 실행해 검증해줘.
결과·재현 방법·실행한 검사·남은 문제를 PR과 상태 문서에 남겨줘.
현재 권한으로 가능한 작업은 끝까지 진행하고, 실행하지 못한 것은 구분해줘.
```

코드와 에셋에 대한 공개 라이선스는 아직 선택하지 않았습니다. 외부 자산의 사용 조건은 자산별로 기록합니다.
