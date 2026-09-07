# 한국 PC방 타이쿤

내 매장을 직접 돌보고, 손님을 이해하고, 투자와 직원 운영으로 성장시키는 1인칭 한국 PC방 경영 게임.

**[웹에서 플레이하기](https://dm-choo.github.io/pc-cafe-simulator/)** — PC 키보드·마우스용 개발 빌드. 현재 첫 영업·첫 매출까지 플레이할 수 있으며 새로고침하면 초기화됩니다.

**현재 단계: G003 첫 아트 패스 — GLB 좌석과 고객 자세 개선.** 카운터에서 영업을 시작하면 고객이 빈자리를 찾아 이용하고 결제합니다. 저장은 아직 없으며 새로고침하면 초기화됩니다. 저장소는 [dm-choo/pc-cafe-simulator](https://github.com/dm-choo/pc-cafe-simulator)입니다. 등록·검증 상태와 다음 작업은 [현재 상태](docs/production/status.md)에 기록합니다.

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

## 실행

Node **24.19.0** (`nvm use`)과 npm을 사용합니다.

```bash
npm ci
npm run dev
```

개발 주소: `http://localhost:5173/pc-cafe-simulator/`.

```bash
npm run build
npm run preview
```

production preview: `http://localhost:4173/pc-cafe-simulator/`. GitHub Pages의 실제 저장소 하위 경로로 빌드합니다. 공개 배포 여부는 [현재 상태](docs/production/status.md)를 확인하세요.

| 조작 | 행동 |
| --- | --- |
| WASD | 이동 |
| 마우스 / 잠금 없이 드래그 / 방향키 | 둘러보기 |
| E | 가까이 바라보는 좌석·카운터 확인 |
| B | 위에서 보는 배치 미리보기 |
| ESC / P | 일시정지 |
| 1 / 4 또는 HUD 배속 버튼 | 영업 1/4배속, 사장 이동 속도 유지 |

배치 모드에서는 좌석을 선택한 뒤 마우스를 움직입니다. 벽·중앙 통로·다른 좌석과 겹치는 위치를 표시하며 **실제 배치는 바뀌지 않습니다**. 탭을 숨기거나 UI를 열면 시간이 멈춥니다. 현재는 PC 키보드·마우스용입니다.

## 검사

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
python3 scripts/check_docs.py
git diff --check
```

`test:e2e`는 production preview를 자동 실행합니다. 이미 설치된 Chromium으로 검사할 환경은 `PLAYWRIGHT_CHROMIUM_EXECUTABLE`에 실행 파일 경로를 지정할 수 있습니다. 브라우저 결과는 `test-results/`, `playwright-report/`에 생성됩니다. `?debug=1`에서는 읽기 전용 진단과 메뉴의 개발 장면 초기화를 사용할 수 있습니다.

첫 이용은 시험 밸런스 기준 1시간 1,500원이며 약 40 sim초 후 자동 결제됩니다. 실제 기준일 가격 데이터가 아닙니다. 카운터의 신규 입장 중지는 기존 손님의 이용·결제를 취소하지 않습니다.

좌석은 자체 제작 GLB를 12석 공유 인스턴싱하며, `npm run dev/build`가 원본 스크립트에서 GLB를 자동 생성합니다. 인물은 무릎·팔꿈치가 있는 임시 모델입니다. 최종 현실풍 재질·조명·자연스러운 동작은 G003 후속 작업입니다.

## 에이전트 시작 지시

```text
AGENTS.md와 docs/production/status.md를 읽고 다음 ready 작업을 진행해줘.
해당 이슈의 범위와 완료 조건을 적용해줘.
기존 변경을 확인한 뒤 구현하고, 브라우저에서 직접 실행해 검증해줘.
결과·재현 방법·실행한 검사·남은 문제를 PR과 상태 문서에 남겨줘.
현재 권한으로 가능한 작업은 끝까지 진행하고, 실행하지 못한 것은 구분해줘.
```

코드와 에셋에 대한 공개 라이선스는 아직 선택하지 않았습니다. 외부 자산의 사용 조건은 자산별로 기록합니다.
