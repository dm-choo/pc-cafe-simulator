# G003 첫 아트 패스 검증

2026-09-07, 코드 `ec9f6e84013f08b1074f0df49a4fc254f17387e4`, PR #13. G003 전체 완료·독립 리뷰·사람 재미 검증을 뜻하지 않습니다.

- [성공 실행](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34090014800): lint·타입 포함 빌드·규칙 12개·브라우저 4개 통과. FIRST-SALE 59초, 브라우저 전체 2.3분.
- [화면과 리포트](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34090014800/artifacts/10006562727), [실행 빌드](https://github.com/dm-choo/pc-cafe-simulator/actions/runs/34090014800/artifacts/10006563230). 14일 보관 후 같은 코드로 재생성합니다.
- Ubuntu / Chromium 153 / software WebGL. 실제 GPU 성능 결과가 아닙니다.
- 입구 standard 품질, 통로 low 품질, 고객 착석 눈높이 화면을 내려받아 직접 확인했습니다. GLB 좌석 크기·방향, 의자 쿠션·오발 베이스, 팔꿈치·무릎의 굽힘과 모니터를 보는 방향이 화면에 나타납니다.
- 착석 눈높이 캡처는 43 draw calls / 50,682 triangles, 빈 통로는 23 / 49,274입니다. 특정 구도·low 품질의 단일 프레임이며 전체 성능 합격선이나 최대치가 아닙니다.
- 기존 이동·충돌·상호작용·새로고침·작은 설정 화면과 첫 매출 회귀 검사를 유지했습니다. BASIC-12 자산 HTTP 오류 및 페이지 오류 0개.
- GLB는 172,156바이트, 4,080삼각형, 재질 5개. 원본 생성 스크립트·착석점·충돌·반복 기하 예산은 [작업 계약](../../tasks/003-first-art-and-deploy.md)에 기록했습니다.

실제 공간은 여전히 넓고 단순한 임시 매장입니다. 최종 현실풍 PBR/환경 반사/조명과 자연스러운 인물·발 미끄러짐/진입 전환·LOD·24/60석 실측·두 번째 제품 변형 제작은 미완료입니다. 공개 배포 결과는 [현재 상태](../../production/status.md)에서 별도로 추적합니다.
