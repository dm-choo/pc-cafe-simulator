# Z001 — 0석 창업 검증 기록

2026-09-07, [PR #16](https://github.com/dm-choo/pc-cafe-simulator/pull/16). 자기 검토이며 독립 리뷰·사람 재미·최종 현실풍 품질의 완료를 뜻하지 않습니다.

## 범위와 환경

- 0석·카운터/재고 없음 → 실제 구매 UI → 지정 구역 설치 → 첫 영업과 결제.
- CI Ubuntu, Node 24.19.0, Playwright Chromium 153, SwiftShader software WebGL, DOM viewport 1440×900. 실제 GPU 성능의 증거가 아닙니다.
- standard 입구 화면과 low 품질 플레이를 확인합니다. 최신 low는 pixel ratio 0.75, 캔버스 1080×675이고 HTML UI는 1440×900입니다. 작은 화면의 메뉴 검사도 유지합니다.
- 로컬 규칙 18개·lint·타입 포함 build·문서 검사 통과. 소스 규칙에는 구매/설치 원자성, 부족 현금, 설치 한도, 개점 조건, 잔류 고객 중 설치 차단, 현금 보존, 유령 충돌 회귀가 포함됩니다.

## 첫 검사와 수정 근거

- 코드 `60e80ce`, [실행 #34096526769](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34096526769): 3개 통과, BASIC-12/FIRST-SALE 두 테스트가 전체 120초 제한 초과. [실패 화면·trace](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34096526769/artifacts/10009024516).
- trace에서 BASIC-12의 캡처 한 번은 30.94초, FIRST-SALE의 10단계 mouseMove는 최대 21.36초였습니다. 구매/설치 및 첫 착석까지 진행됐지만 전체 시나리오 성공으로 처리하지 않았습니다.
- 전체 검사 제한이나 통과 조건을 완화하지 않았습니다. 메뉴로 정지한 세계를 매 프레임 그리는 비용을 제거하고, low에서도 DPR 1 화면의 렌더 해상도를 실제로 낮췄습니다. 설치·모드·품질·창 크기 변경 때는 다시 그립니다. 시뮬레이션 규칙·고객 수·배속은 품질과 독립입니다.
- 빈 매장·구매 UI·첫 좌석 설치·착석 눈높이 화면을 다운로드해 직접 검토했습니다. 처음 바닥의 큰 얼룩 대비가 지나쳐 회색 Concrete Floor Worn 001로 바꿨습니다. 구매 후 재고와 설치 후 모델의 차이가 화면에 나타났고, 카운터가 없을 때의 설치 안내도 수정했습니다.

## 자산과 남은 검증

- 외부 CC0 PBR 9장: 3,963,365 bytes. 자체 GLB: 172,156 bytes / 4,080 triangles / 5재질. 설치한 좌석만 인스턴스 수에 반영합니다.
- 최신 로컬 dist 합계 11,481,011 bytes / 145 files. release.json 스탬프 전 파일 합계이며 실제 첫 네트워크 전송량이나 GPU 메모리가 아닙니다. 기존 Three/Rapier 큰 청크 경고는 남아 있습니다.
- 멈춘 장면을 한 번만 그리도록 바꾼 뒤에도 그 프레임의 진단 수치를 즉시 publish하도록 보완했습니다. 경제·입력·형상에는 영향이 없으며 main 배포 전 검사에서 다시 검증합니다.
- 미검증: 실제 RTX 3060/저사양 GPU 프레임 시간, 24/60석 부하, 자연스러운 인물·접촉 자세, 첫 20분의 재미와 투자 회수 대기. 현재 이용료/설비 가격은 경제 완성판이 아닙니다.

## 재검사 성공과 시각 확인

- 코드 `42f67ba200de4ead1f762c0883fe414a21bd433e`, [실행 #34097694026](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34097694026): 규칙 18개, 브라우저 5개, lint·타입 포함 build·문서 검사 통과.
- BASIC-12 53.2초, FIRST-SALE 약 84.8초, ZERO-START 32.8초, 브라우저 전체 3.3분. 이는 CI 실행 시간이며 실제 GPU FPS 전후 비교가 아닙니다.
- [화면·리포트](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34097694026/artifacts/10009348974), [실행 빌드](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34097694026/artifacts/10009349967). Artifact 보관 14일.
- 새 회색 바닥의 빈 매장, 첫 착석 눈높이, 설치 구역, 카운터 첫 결제 화면을 직접 검토했습니다. 바닥의 큰 얼룩은 사라지고 표면의 작은 흠집과 광택이 보입니다. 모델·인물은 여전히 단순한 첫 아트 패스입니다.
- UI와 상태 모두 0석 시작, 설치 1석, 설비 지출 160만원, 첫 매출 1,500원과 잔액 2,401,500원을 표시했습니다. BASIC-12의 HTTP 자산 오류/페이지 오류, FIRST-SALE 페이지 오류는 0개입니다.
- 공개 배포는 main workflow가 같은 핵심 검사 후 수행합니다. 최종 배포 실행·공개 URL 재검사 결과는 [PR #16](https://github.com/dm-choo/pc-cafe-simulator/pull/16)에 남깁니다.
