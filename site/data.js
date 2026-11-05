// 사이트에 올라가는 사진 목록 (3차)
// 사진을 바꾸거나 더할 때는 이 파일만 고치면 됩니다.

window.CLOSET_DATA={
  // 미니 매거진: assets/mini/c1-01.jpg 처럼 "아이디-쪽번호" 이름으로 넣고, pages에 쪽수를 적습니다.
  mini:[
    {id:'c1',title:'과거 유행했던 패션 아이템들',tag:'RETRO ITEMS',pages:6},
    {id:'c2',title:'25FW 트렌드 너무많아',tag:'25FW TREND',pages:6},
    {id:'c3',title:'애니메이션 주인공의 패션',tag:'ANIMATION',pages:6},
    {id:'c4',title:'음악가들의 패션은 왜 멋질까?',tag:'MUSIC',pages:8},
    {id:'c5',title:'스타일 소개 (feat. 스트릿)',tag:'STREET · 한별조',pages:6}
  ],

  // 반팔 디자인: assets/tees/t01.jpg ~ t26.jpg
  tees:26,

  // 2025 패션쇼: 사진을 assets/show2025/ 폴더에 넣고 파일 이름을 적습니다.
  // cover는 패션쇼 탭의 액자에 들어갈 단체 사진, photos는 눌렀을 때 나오는 사진들입니다.
  // 예) show2025:{cover:'group.jpg',photos:['01.jpg','02.jpg','03.jpg']}
  show2025:{cover:'',photos:[]}
};
