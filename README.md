# FORME Studio — immersive fashion collection

배포하지 않은 로컬 Three.js 홈페이지입니다.

실행: `node server.mjs` → http://127.0.0.1:3000

Unseen의 화면을 참고하여 아치, 계단, 진주빛 구체, 수면 반사 장면을 Three.js 지오메트리로 새로 구현했습니다. 원본 모델·셰이더를 복사한 것이 아니므로 세부 형상과 움직임은 차이가 있습니다.

- Enter / Enter without audio: 진입 전환 및 앰비언트 사운드 선택
- 마우스 이동: 감속이 있는 카메라 시차, 글자 시차, 지연 추적 원형 커서
- 드래그 / 터치 / 방향키: 공간 시점 변경
- 길게 누르기 또는 Space: 카메라 접근, 굴절 및 색수차 반응. 놓으면 부드럽게 복귀
- 버튼: 자석처럼 따라오는 이동과 텍스트 전환
- 메뉴: 화면 덮기 전환, 순차 등장, Escape 닫기
- Collections: 필터, 화보 호버 기울기, 상세 화면
- OS 동작 줄이기 설정: 자동 움직임 및 주요 효과 축소

브랜드명·설명·연락처 화면은 시안 콘텐츠입니다. 사진은 디자인 검토용 참고 이미지이며 상용 이용 허락은 확인하지 않았습니다. 공개 전에 보유한 컬렉션 이미지로 교체하세요.

사진 출처:
- assets/look-01.jpg: https://www.yumengci.com/portfolio-yumengciphotography/41
- assets/look-02.jpg: https://www.belaborsodi.com/
- assets/look-03.jpg: https://anthonyhuus.com/fashion
- 디자인 참고: https://unseen.co/
- Three.js 0.169.0 (MIT): https://github.com/mrdoob/three.js

Three.js 및 사진은 로컬에 포함되며, 글꼴은 Google Fonts에서 로드합니다.

## Liquid flow interaction

마우스 이동 기록 20개를 셰이더에 전달해 물결이 겹쳐 퍼지고 사라지도록 했습니다. 메인 타이틀을 별도 텍스처로 그린 후 같은 굴절 패스에 합성하여 글자 자체가 일렁이며 청록·보라색으로 바뀝니다. 접근성용 HTML 제목은 유지됩니다.

홈 화면에서 스크롤하면 세 화보가 순서대로 등장합니다. 각 화보는 수면을 향해 뒤집히며 잠기고, 실제 반사 및 파문이 함께 움직입니다. 위로 스크롤하면 역방향으로 되돌아옵니다. `liquid.js`에서 물결 강도, 스크롤 구간 및 화보의 움직임을 조절할 수 있습니다.
컬렉션 목록에서도 스크롤 위치에 따라 각 카드의 회전·침수 색상·투명도가 달라집니다. 목록 제목은 커서와 가까운 글자가 개별적으로 따라오고 색이 바뀝니다.

## Collection surface revision

컬렉션 사진을 10장으로 확장했습니다. `collection.js`가 사진·제목·분류·설명의 공통 목록이며 상세 화면과 필터도 이 목록을 사용합니다. 추가 사진의 원본 URL은 `assets/additional-photo-sources.txt`에 기록했습니다.

기존 카드 전체의 CSS 회전 및 침수 변형은 제거했습니다. `gallery-flow.js`의 화면 좌표 기반 Three.js 메시가 정면의 사진과 캡션을 표시합니다. 스크롤 속도와 화면 경계에 따라 가장자리가 휘고 서서히 사라지며, 화면 안에 있는 카드는 스크롤을 멈추면 평면으로 돌아옵니다. 원본 이미지 비율은 잘라 맞추며 기하학적으로 늘리지 않습니다.

검증: 10개 이미지 로딩, 정지 상태 CSS transform 없음, 스크롤 변형, Structure 4 필터, 브라우저 오류 없음.
