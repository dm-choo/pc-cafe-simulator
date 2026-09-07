# G003 — 첫 아트 개선과 첫 배포

G002 PR #12를 main에 통합한 후 같은 매장을 개선합니다. G003 전체 완료가 아닌 첫 아트 패스이며 이슈 #3은 유지합니다.

- 자체 코드 제작 좌석을 GLB로 내보내고 GLTFLoader로 한 번 읽어 12석 인스턴싱합니다.
- 책상 모서리, 의자 쿠션·오발 베이스·팔걸이, 키보드·마우스·헤드셋 실루엣을 개선합니다.
- 고객은 공유 형상·재질에 무릎/팔꿈치 관절과 앉기 전환을 적용합니다. 고급 리그·발 IK는 아직 없습니다.
- `npm run assets:build`로 172,156바이트·4,080삼각형·5재질 GLB와 해시/예산 JSON을 재생성합니다. 파일은 빌드 출력이며 원본은 scripts/assets/build-seat.mjs입니다. Blender/glTF Transform 실행을 주장하지 않습니다.
- 좌석은 1m 단위 Y-up, 정면 +Z, 착석 원점 (0, 0.55, 0.8). 기존 충돌·접근 좌표를 유지합니다.
- 12/24/60석의 기하 예산은 48,960/97,920/244,800삼각형, 좌석 GLB 본체의 기본 pass는 각각 5 draw입니다. 이는 수학적 예산이며 실제 GPU 성능 측정이 아닙니다. 화면·표지·그림자·고객 비용은 별도입니다.
- 최종 PBR 재질·베이크·자연스러운 동작·LOD·두 번째 변형 제작 시간과 실제 GPU 검증은 후속 G003 작업입니다.

## 첫 배포

사용자 요청에 따라 main의 Game checks가 lint·규칙·빌드·브라우저 검사 후 해당 dist를 Pages artifact로 업로드합니다. deploy job만 pages:write/id-token:write를 사용합니다. PR은 배포하지 않습니다. 공개 release.json으로 배포 SHA를 확인합니다.

최초 Pages 활성화는 저장소 Settings → Pages → Source: GitHub Actions 설정이 필요합니다. 현재 연결된 GitHub 도구에는 Pages 설정 변경 기능이 없습니다. 활성화 여부와 실제 배포 성공/실패는 실행 로그로 확인한 후 현재 상태에 기록합니다. 활성화 토큰을 새로 요구하거나 권한을 우회하지 않습니다.

공식 참조: [configure-pages 입력 계약](https://github.com/actions/configure-pages/blob/main/action.yml), [deploy-pages](https://github.com/actions/deploy-pages).
