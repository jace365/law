/* 법과사회 데이터 코어 — 반드시 가장 먼저 로드 */
var LAS = { units: [], theory: {}, blanks: [], qs: [] };
LAS.units = [
  { u: 1, big: 'Ⅰ. 개인 생활과 법', name: '01. 가족생활과 법', short: '가족생활' },
  { u: 2, big: 'Ⅰ. 개인 생활과 법', name: '02. 계약과 불법 행위', short: '계약·불법행위' },
  { u: 3, big: 'Ⅰ. 개인 생활과 법', name: '03. 재산 관계와 법', short: '재산 관계' },
  { u: 4, big: 'Ⅱ. 국가 생활과 법', name: '01. 국가 운영 원리', short: '국가 운영 원리' },
  { u: 5, big: 'Ⅱ. 국가 생활과 법', name: '02. 우리나라 헌법', short: '헌법·기본권' }
];
/* 문제 추가: addQ(단원, [[문제, [보기5], 정답번호(1~5), 해설, 자료(선택), 보기섞기금지(선택)], ...])
   단원마다 n번째 문제(1~20)는 모의고사 Math.floor((n-1)/4)+1 회에 자동 배정
   → 5개 단원 × 4문항 = 회당 20문항, 5회분. 21번째 이후 문제는 문제풀이 전용 */
function addQ(u, rows) {
  rows.forEach(function (r) {
    var n = LAS.qs.filter(function (q) { return q.u === u; }).length + 1;
    LAS.qs.push({ id: 'u' + u + '-' + (n < 10 ? '0' : '') + n, u: u, n: n,
      m: n <= 20 ? Math.floor((n - 1) / 4) + 1 : 0,
      q: r[0], c: r[1], a: r[2], e: r[3], bx: r[4] || '', ns: !!r[5] });
  });
}
/* 빈칸: addB(단원, ['문장 {정답} 문장', ...]) — {} 안이 가려지는 부분 */
function addB(u, rows) {
  rows.forEach(function (s) {
    var n = LAS.blanks.filter(function (b) { return b.u === u; }).length + 1;
    LAS.blanks.push({ id: 'b' + u + '-' + (n < 10 ? '0' : '') + n, u: u, s: s });
  });
}
