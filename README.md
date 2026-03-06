# Songsim Campus Voxel Demo

가톨릭대학교 성심교정을 바탕으로 만든 브라우저 기반 3D voxel 데모입니다.  
정밀한 실측 복제보다는, 성심교정의 배치와 오르막 동선, 주요 랜드마크의 인상을 웹에서 자연스럽게 느끼게 하는 데 초점을 맞췄습니다.

## 프로젝트 소개

이 프로젝트는 `Vite + TypeScript + Three.js`로 만든 인터랙티브 캠퍼스 데모입니다.

- 브라우저에서 바로 실행되는 정적 웹 앱
- 코드 생성 중심의 voxel 스타일 지형과 건물
- 공식 성심교정 캠퍼스맵을 바탕으로 한 배치, 윤곽, 길망 해석
- 데스크톱과 모바일에서 모두 조작 가능한 카메라와 HUD
- 포트폴리오 데모로 바로 보여줄 수 있는 수준의 인터랙션

## 데모 특징

- 공식 캠퍼스맵 기준 주요 POI와 길망 반영
- 정문에서 상단 학사권역으로 이어지는 오르막 캠퍼스 동선
- 랜드마크 선택, 하이라이트, 정보 패널, fly-to 이동
- Safari 데스크톱 마우스 drag 대응
- 모바일 터치 조작 프로필 대응
- Three.js 기반 실시간 렌더링과 절제된 voxel 시각 언어

## 주요 캠퍼스 포인트와 구현 방향

현재 데모에는 성심교정 공식 지도 기준 주요 공간이 포함되어 있습니다.

- 정문, 후문
- 김수환관, 안드레아관, 마리아관, 니콜스관, 다솔관
- 학생미래인재관, 성모동산
- 미카엘관, 중앙도서관(베리타스관), 성심관, 정진석 약학관
- 콘서트홀, 아고라 운동장, 테니스장
- 예수성심성당, 예수성심광장, 예수성심 잔디밭
- 프란치스코관

구현 방향은 아래 기준을 따릅니다.

- 공식 평면 캠퍼스맵을 1차 기준으로 사용
- 입체 캠퍼스맵은 높이감과 실루엣 보정용으로만 사용
- survey-grade 디지털 트윈이 아니라, recognizably Songsim한 voxel 데모를 목표로 함
- 배치, 윤곽, 길망, 열린 공간 구조를 우선 보정

## 실행 방법

```bash
npm install
npm run dev
```

개발 서버 기본 주소:

- `http://localhost:5173`

## 빌드 / 테스트

빌드:

```bash
npm run build
```

테스트:

```bash
npm run test
```

현재 저장소는 `build`와 `test`가 모두 통과하는 상태를 기준으로 관리합니다.

## 조작법

데스크톱:

- 마우스 왼쪽 드래그: 시점 회전
- 마우스 휠: 확대/축소
- `W / A / S / D`: 현재 시점 기준 카메라 이동
- `R`: 카메라 리셋
- 클릭: 건물/광장/코트 등 POI 선택

모바일:

- 한 손가락 드래그: 시점 회전
- 두 손가락 제스처: 확대/축소 및 이동
- 탭: POI 선택

HUD:

- 카메라 리셋
- 시점 모드 전환
- 월드 장식 재생성
- 라벨 표시 전환

## 프로젝트 구조

```txt
src/
  app.ts
  boot.ts
  main.ts
  style.css
  build/
    viteBuildConfig.ts
  data/
    campus.ts
  interaction/
    cameraRig.ts
  scene/
    SongsimExperience.ts
  ui/
    hud.ts
  world/
    buildings.ts
    decorations.ts
    roads.ts
    terrain.ts
tests/
  *.spec.ts
docs/codex/
  CAMPUS_NOTES.md
  MASTER_PROMPT.md
  MULTI_AGENT_PROMPT.md
  MULTI_AGENT_PROMPT.ko.md
.codex/
  config.toml
  agents/
```

핵심 파일 역할:

- `src/data/campus.ts`: 공식 지도 기준 POI, 경로, footprint의 단일 소스
- `src/world/*`: 지형, 길, 건물, 장식 생성
- `src/interaction/cameraRig.ts`: 카메라 및 입력 처리
- `src/scene/SongsimExperience.ts`: 씬 구성과 런타임 orchestration
- `src/ui/hud.ts`: 정보 패널과 HUD

## 배포 방법 (Vercel)

이 프로젝트는 정적 출력 구조라 Vercel 기본 설정으로 배포할 수 있습니다.

기본 전제:

- GitHub 저장소를 Vercel에 Import
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

배포 순서:

1. GitHub에 이 저장소를 push합니다.
2. Vercel에서 `Add New Project`를 선택합니다.
3. GitHub 저장소를 import합니다.
4. Vercel이 `Vite`를 자동 감지하면 기본값을 확인합니다.
5. 필요하면 아래 값을 직접 지정합니다.

```txt
Build Command: npm run build
Output Directory: dist
```

6. Deploy를 실행합니다.

메모:

- 이 프로젝트는 `vercel.json` 없이도 배포 가능한 구조를 유지합니다.
- Vercel `Hobby` 플랜으로 무료 시작이 가능합니다.
- 다만 무료 플랜은 사용량 제한이 있으니, 실제 정책과 한도는 배포 시점의 Vercel 공식 문서를 확인하는 편이 안전합니다.

## 현재 한계와 다음 개선 포인트

현재 한계:

- 공식 성심교정을 정밀 측량 수준으로 복제한 것은 아닙니다.
- 번들 빌드 시 `three-vendor` 청크 크기 경고가 남아 있습니다.
- 최종 시각 정합성은 공식 캠퍼스맵 PDF와 나란히 두고 수동 비교할 여지가 있습니다.

다음 개선 포인트:

- 일부 상단 학사권역과 성당 precinct의 추가 미세 조정
- terrain과 roads 접점의 소규모 정리
- 번들 분할 추가 최적화
- 배포용 링크, 스크린샷, 짧은 시연 영상 추가

## Codex 메모

이 저장소는 Codex용 프로젝트 가이드를 포함합니다.

- `AGENTS.md`
- `docs/codex/CAMPUS_NOTES.md`
- `docs/codex/MULTI_AGENT_PROMPT.ko.md`

멀티 에이전트 구성은 `.codex/` 아래에 포함되어 있습니다.
