/**
 * 클로젯 방명록 서버 (Google Apps Script)
 * 구글 시트 > 확장 프로그램 > Apps Script 에 이 파일 내용을 그대로 붙여 넣습니다.
 * 코드를 고친 뒤에는 "배포 > 배포 관리 > 편집 > 새 버전"으로 다시 배포해야 반영됩니다.
 */

// true: 시트의 "공개" 칸을 체크해야 사이트에 표시 / false: 등록 즉시 표시
const REQUIRE_APPROVAL = true;

// 등록을 막을 표현. 띄어쓰기를 지운 뒤 비교합니다. 필요한 단어를 추가하세요.
const BLOCKED_WORDS = ['씨발', '시발', '병신', '좆', '지랄', '개새끼', '존나'];

const SHEET_NAME = '방명록';
const MAX_NAME = 20;
const MAX_MESSAGE = 300;
const MAX_LIST = 100; // 사이트에 보내는 최신 글 수
const MAX_POSTS_PER_MINUTE = 20; // 사이트 전체 기준 분당 등록 한도
const CACHE_SECONDS = 30; // 시트에서 공개/숨김을 바꾸면 최대 이 시간 뒤에 사이트에 반영

function doGet() {
  return json_({ ok: true, notes: readNotes_() });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    // 사람에게 보이지 않는 칸이 채워져 있으면 스팸 봇으로 보고 저장하지 않는다
    if (body.website) return json_({ ok: true, pending: REQUIRE_APPROVAL });

    const name = String(body.name || '').trim().slice(0, MAX_NAME);
    const message = String(body.message || '').trim().slice(0, MAX_MESSAGE);
    if (!name || !message) return json_({ ok: false, error: '이름과 내용을 모두 적어 주세요.' });
    if (/https?:\/\/|www\./i.test(name + ' ' + message)) {
      return json_({ ok: false, error: '링크는 남길 수 없어요.' });
    }
    const squeezed = (name + message).replace(/\s/g, '');
    if (BLOCKED_WORDS.some(function (word) { return squeezed.includes(word); })) {
      return json_({ ok: false, error: '등록할 수 없는 표현이 포함되어 있어요.' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      if (!withinRateLimit_()) {
        return json_({ ok: false, error: '지금 글이 많이 몰리고 있어요. 잠시 후 다시 시도해 주세요.' });
      }
      appendNote_(name, message);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true, pending: REQUIRE_APPROVAL });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: '등록하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}

function appendNote_(name, message) {
  const sheet = getSheet_();
  // 앞의 ' 는 입력값을 수식이나 날짜로 해석하지 않고 글자 그대로 저장하게 한다
  sheet.appendRow([new Date(), "'" + name, "'" + message, false]);
  sheet.getRange(sheet.getLastRow(), 4).insertCheckboxes().setValue(!REQUIRE_APPROVAL);
  CacheService.getScriptCache().remove('notes');
}

function readNotes_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('notes');
  if (cached) return JSON.parse(cached);

  const sheet = getSheet_();
  const rowCount = sheet.getLastRow() - 1;
  const notes = [];
  if (rowCount > 0) {
    const range = sheet.getRange(2, 1, rowCount, 4);
    const values = range.getValues();
    const texts = range.getDisplayValues();
    for (let i = rowCount - 1; i >= 0 && notes.length < MAX_LIST; i--) {
      if (values[i][3] !== true) continue;
      const at = values[i][0];
      notes.push({
        name: texts[i][1],
        message: texts[i][2],
        at: at instanceof Date ? at.toISOString() : '',
      });
    }
  }
  try {
    cache.put('notes', JSON.stringify(notes), CACHE_SECONDS);
  } catch (err) {
    console.warn(err); // 캐시는 100KB 제한이 있다. 실패해도 응답은 정상
  }
  return notes;
}

function getSheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(['작성 시각', '이름', '메시지', '공개']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:D1').setFontWeight('bold');
    sheet.setColumnWidth(3, 480);
  }
  return sheet;
}

function withinRateLimit_() {
  const cache = CacheService.getScriptCache();
  const used = Number(cache.get('posts') || 0);
  if (used >= MAX_POSTS_PER_MINUTE) return false;
  cache.put('posts', String(used + 1), 60);
  return true;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
