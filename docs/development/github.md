# GitHub 저장소·작업·배포 운영

## 1. 연결된 저장소

2026-09-07 사용자가 [dm-choo/pc-cafe-simulator](https://github.com/dm-choo/pc-cafe-simulator)를 생성했습니다. 저장소는 public이며 연결 앱의 접근 설정을 반영한 뒤 README 쓰기와 이슈 생성에 성공했습니다. 다른 저장소는 변경하지 않습니다.

문서·이슈·CI의 실제 등록 결과는 [현재 상태](../production/status.md)에 기록합니다. 이전 403 오류는 새 저장소가 앱 접근 목록에 없어서 발생했고, 사용자 설정 변경 후 해결됐습니다. Pages는 게임 빌드가 준비된 뒤 설정합니다.

GitHub Free에서도 public 저장소로 Pages를 사용할 수 있습니다. 공개 여부를 다시 바꾸거나 유료 서비스를 활성화하는 것은 이번 등록 작업에 포함하지 않습니다. [Pages 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## 2. 개발 컴퓨터에서 시작

저장소의 main을 복제한 뒤 문서와 현재 상태를 확인합니다. 처음 등록하는 동안에는 문서 등록 PR의 상태도 확인합니다.

```bash
git clone https://github.com/dm-choo/pc-cafe-simulator.git
cd pc-cafe-simulator
python3 scripts/check_docs.py
git log -1 --oneline
```

게임 코드는 G001에서 시작합니다. package와 실제 명령이 추가되기 전에는 npm 실행을 가정하지 않습니다. 필요한 쓰기 인증은 개발 환경에서 설정하며 토큰을 문서·채팅에 붙여 넣지 않습니다.

이전에 제공한 `pcbang-tycoon-starter.zip`과 번들은 원격 등록 전의 준비본입니다. 앞으로는 이 GitHub 저장소의 최신 문서와 Git 기록을 기준으로 작업합니다. 과거 번들의 서로 다른 커밋 이력을 원격 main에 강제로 덮어쓰지 않습니다.

## 3. 이슈와 변경 통합

[백로그](../production/backlog.md)에 내부 G번호와 실제 GitHub 이슈를 연결합니다. G001부터 순서대로 진행하며, G010은 G009의 플레이 결과에 따라 나중에 나눕니다. 이슈가 등록됐다는 것과 개발 에이전트가 실행 중이라는 것은 다릅니다.

기능은 작업 브랜치에서 구현하고 실제 결과를 확인해 PR로 통합합니다. 이슈/PR 템플릿과 AGENTS를 공통 기준으로 사용합니다. 최초 문서 등록도 작업 브랜치와 PR을 사용합니다. 자동 개발 실행·자동 할당·자동 병합·보호 규칙은 이 문서만으로 활성화되지 않습니다. 승인된 등록 범위의 작업은 반복 확인 없이 완료합니다.

GitHub Copilot을 사용할 경우 AGENTS 지원과 실제 계정 기능을 확인합니다. 현재 문서는 특정 구독이나 추가 에이전트를 필수로 하지 않습니다. [GitHub AGENTS 지원 안내](https://github.blog/changelog/2025-08-28-copilot-coding-agent-now-supports-agents-md-custom-instructions/)

## 4. CI를 늘리는 순서

현재 `.github/workflows/docs.yml`은 로컬 문서 링크·JSON 구조·공백을 검사하는 실제 설정 파일입니다. 실제 실행 결과는 현재 상태 문서와 Actions에서 확인합니다. 체크아웃 Action 버전은 확인한 공식 예시의 commit으로 고정했습니다. [Vite 배포 예시](https://vite.dev/guide/static-deploy)

G001에서 package와 lockfile을 만든 뒤 npm 설치·타입·규칙 테스트·빌드·브라우저 스모크를 추가합니다. 그 전에는 존재하지 않는 npm 명령을 CI에 넣지 않습니다. PR에서는 검사와 빌드만 하고 검증되지 않은 변경이 공개 플레이 URL을 바꾸지 않도록 합니다. 실제 배포 권한은 배포 job에만 둡니다.

일반 문서 변경은 문서 검사로 충분합니다. 저장·경제 변경은 관련 시나리오를, renderer·인물·조명 변경은 화면과 성능 관련 검사를 수행합니다. 저장소의 필수 검사는 변경 범위와 무관하게 통과해야 합니다.

## 5. 게임 빌드와 Pages

Vite의 production 산출물 `dist/`만 게시합니다. 현재 저장소 사이트의 base는 `/pc-cafe-simulator/`이고 모델·텍스처·WASM·압축 디코더에도 반영합니다. 루트 절대경로 `/assets/...`를 무심코 쓰지 않습니다. GitHub Pages는 정적 호스팅이며 별도 게임 서버 프로세스를 실행하지 않습니다. [Vite 안내](https://vite.dev/guide/static-deploy)

첫 게임 빌드부터 production preview를 검증하고, Pages 설정과 실제 게임이 준비되면 GitHub Actions로 배포합니다. Pages의 게시 사이트 크기 제한 1GB와 월 100GB 소프트 대역폭 제한을 고려합니다. 첫 필수 전송량 30MB 수준은 호스팅 한도와 별개인 우리 사용자 경험 목표입니다. [Pages 제한](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

첫 배포는 수동 실행으로 경로와 저장·새로고침을 확인한 후, 승인된 `main` 변경에 자동 배포하는 흐름으로 전환할 수 있습니다. GitHub Pages에 PR별 독립 preview가 자동 생성된다고 가정하지 않습니다. PR에서는 로컬 production preview의 검증과 빌드 artifact를 사용하고 필요할 때 별도 preview 방식을 선택합니다.

## 6. 복구

배포 결함은 마지막 정상 커밋으로 되돌리는 새 커밋 또는 정상 artifact 재배포로 처리합니다. 공유 main의 이력을 강제로 덮어쓰지 않습니다. 코드 롤백이 새 세이브를 구버전으로 되돌리지 못할 수 있으므로 saveVersion과 마지막 정상 백업을 확인합니다. 실서버 연결 없이도 JSON 백업으로 플레이 데이터를 옮길 수 있게 만듭니다.
