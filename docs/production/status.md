# 현재 상태와 다음 작업

기준일: 2026-09-07. G001–G003 첫 패스는 main에 통합했고 Pages는 활성화되어 있습니다. **현재 작업은 0석 창업과 실사 기반 재질입니다.** 아래 과거 결과와 이번 결과를 구분합니다.

## 현재: 0석 창업 / Z001

- [작업 계약](../tasks/004-zero-seat-opening.md): 카운터·좌석·재고 없이 시작 → N 구매 → B 설치 → 카운터 개점 → 첫 매출.
- 설치한 것만 렌더링·충돌·고객 배정에 반영합니다. 구매는 재고만 늘리며, 영업 중/고객 잔류/사장과 겹치는 설치는 차단합니다.
- 시험 창업 자금 400만원, 카운터 40만원, 기본 좌석 세트 120만원, 이용료 1,500원. 기준일 실가격 검증값이 아닙니다.
- 목재·콘크리트·벽에 Poly Haven CC0 1K PBR 9장(총 3,963,365 bytes), 공유 환경 반사, 실내 조명 조정. 런타임 외부 CDN 없음.
- 코드 `42f67ba`에서 규칙 18개·브라우저 5개·lint·타입 포함 빌드·문서 검사 통과. [성공 실행](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34097694026), [실패와 개선을 포함한 검증 기록](../quality/evidence/zero-start.md).
- 빈 공간·구매·설치·첫 착석·첫 결제 화면을 직접 검토했습니다. 큰 바닥 얼룩을 차분한 회색 CC0 재질로 바꿨습니다. 정지 장면은 필요할 때만 그리며 낮음 품질은 DPR 0.75/그림자 끄기입니다.
- 이번 변경은 [PR #16](https://github.com/dm-choo/pc-cafe-simulator/pull/16)으로 통합합니다. main의 필수 검사 뒤 Pages 게시·공개 URL 브라우저 검사를 실행하며, 해당 PR에 최종 배포 SHA/결과를 기록합니다.
- 미완료: 자유 배치/회전/철거, 저장, 실존 SKU/가격 근거, 두 투자안의 고객 반응, 최종 인물, 실제 GPU 성능·사람 재미 검증.

## 이전 완료 기록

## 구현한 것

- TypeScript/Vite/Three.js WebGL2 + React DOM UI, 12석 매장·카운터·작은 주방.
- Rapier 캐릭터 충돌, WASD 이동, 포인터 잠금/드래그/방향키 시선, E 좌석·카운터 확인.
- 배치 미리보기, 일시정지, 품질·감도 설정. 배치는 아직 적용하지 않습니다.
- 50ms sim 고정 스텝, UI/숨김 정지, 읽기 전용 개발 진단과 초기화.
- 로컬 생성 임시 형상·재질과 공유 인스턴싱. 최종 현실풍 GLB·인물은 G003 범위입니다.

## G001 검증

- Node 24.19.0, npm 11.9.0. 정확한 패키지 버전은 package-lock.json.
- 로컬 타입 검사·빌드·lint와 Vitest 6개 통과.
- 로컬 Chromium 다운로드 지연 및 대체 Chromium 149 실행 SIGSEGV. 브라우저 통과로 처리하지 않았습니다.
- GitHub Actions에서 production `/pc-cafe-simulator/` 경로의 Playwright 3개 모두 통과. 이동·벽 충돌·카운터·배치 미리보기·설정·새로고침·포인터 잠금·숨김 신호를 확인했습니다.
- [성공 실행 #34087700101](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34087700101), 검사 코드 커밋 `0cd9070`. 이후 문서 변경의 CI는 해당 head에서 별도로 확인합니다.
- 입구·좌석 통로·카운터·배치·작은 설정 화면을 다운로드해 시각 검토했습니다. 자산 HTTP 오류·처리되지 않은 오류는 0개였습니다.
- [화면·리포트](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34087700101/artifacts/10005800568), [실행 빌드](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34087700101/artifacts/10005800942), artifact 14일 보관.
- 자세한 환경·발견한 결함·제한은 [G001 검증 기록](../quality/evidence/g001.md).
- 이 G001 검증 시점의 사람 재미, RTX 3060 실측, 공개 Pages 배포는 미완료였습니다. 현재 배포 결과는 아래를 확인합니다.

## G002 진행

- 카운터 개점/신규 입장 중지, 주기적 고객 입장, 빈자리 예약, 장애물 회피 경로, 착석·이용·종료 결제·퇴장.
- 현금·점유 좌석·최근 결제 표시. 1/4배속은 사업 진행만 조절하며 사장 이동 속도는 유지합니다.
- 1시간 이용을 sim 40초로 압축하고 1,500원을 받는 개발용 가정입니다. 2026-01-01 실제 요금 검증값이 아닙니다.
- 사용한 좌석은 종료 시 바로 가용 상태로 돌아갑니다. 더러움·청소는 G006에서 추가합니다.
- 임시 인물은 코드 생성 형상과 걷기/앉기 동작입니다. 최종 아트·접촉 자세·NPC끼리 회피·사장과의 충돌은 아직 없습니다.
- G002 코드 `8183e4b`에서 규칙 12개·브라우저 4개, lint·타입 검사·빌드 통과. 착석·첫 매출·카운터 화면을 직접 검토했습니다. [G002 검증 기록](../quality/evidence/g002.md), [PR #12](https://github.com/dm-choo/pc-cafe-simulator/pull/12).

## G003 첫 아트 패스·배포

- [작업 계약](../tasks/003-first-art-and-deploy.md): 자체 제작 GLB 좌석, 공유 인스턴싱, 무릎·팔꿈치 관절과 앉기 전환.
- 코드 `ec9f6e8`에서 lint·타입 검사·빌드·규칙 12개·브라우저 4개 통과. 입구·통로·고객 착석 눈높이 화면을 직접 확인했습니다. [검증 기록](../quality/evidence/g003-first-art.md).
- main에서 검증한 동일 빌드를 Pages에 배포하고 release.json SHA 확인 후 공개 URL에서 브라우저 검사를 실행하도록 구성했습니다. 최초 실패 후 사용자 설정을 반영해 공개 배포에 성공했습니다.
- 사용자가 Pages Source를 GitHub Actions로 변경했고 configure-pages·deploy-pages가 성공했습니다.
- 최종 재질·조명·자연스러운 동작·실제 GPU 성능 등 G003 잔여 작업은 유지합니다.

## 첫 배포 실제 결과

- main 코드 `7cc3db3387ac85285df8651bbf634994550f68c2`.
- [배포 실행 #34090461881](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34090461881): basic-12 job 성공(규칙 12개·브라우저 4개 포함), Pages artifact 생성 완료.
- [deploy job #101643585884](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34090461881/job/101643585884): configure-pages가 `Get Pages site failed` / `HttpError: Not Found`로 실패했습니다. 로그는 Pages 활성화 및 GitHub Actions 빌드 소스를 확인하도록 안내합니다.
- public-smoke는 선행 배포 실패로 실행되지 않았습니다. 공개 URL 성공·공개 브라우저 통과를 주장하지 않습니다.
- 기본 GITHUB_TOKEN으로 최초 활성화를 할 수 없으며, 현재 연결 도구에도 Pages 설정 변경 기능이 없습니다. 토큰 추출·권한 변경을 시도하지 않았습니다.

## 공개 배포 성공

- [게임 실행](https://dm-choo.github.io/pc-cafe-simulator/).
- [성공한 배포 실행 #34090929121](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34090929121), 게시 코드 `3056e3a8cf00bc7f73a385c0e1f7766fb3181707`.
- deploy job은 Pages 게시 성공 후 공개 release.json의 SHA가 위 커밋과 일치함을 확인했습니다.
- 공개 URL에서 Chromium 브라우저 검사 4개 모두 통과했습니다. 이동·충돌·카운터·배치·설정·새로고침·포인터 잠금/숨김·첫 착석과 결제·마감을 확인했습니다. [공개 화면·리포트](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34090929121/artifacts/10007011059), artifact 14일 보관.
- 현재 PC 키보드·마우스용 개발 빌드이며 저장은 없습니다. 새로고침하면 초기화됩니다.

## 다음 행동

0석 창업의 기술·화면 검증은 완료했습니다. 다음은 저장·이어하기, 고객 요구에 따른 첫 투자 선택, 첫 20분의 투자 회수 대기 조정입니다. G003 인물·실 GPU 검증도 유지합니다. 최초 Pages 설정을 다시 요구하지 않습니다.
