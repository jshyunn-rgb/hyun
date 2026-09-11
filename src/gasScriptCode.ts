/**
 * Google Sheet 연동용 Google Apps Script (GAS) 전체 소스 코드
 * 
 * [배포 방법]
 * 1. Google Drive에서 새 'Google 스프레드시트'를 생성합니다.
 * 2. 상단 메뉴에서 [확장 프로그램] -> [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 아래 코드를 그대로 붙여넣습니다.
 * 4. 아래 [설정 1], [설정 2] 주석을 확인하여 시트 정보를 설정합니다.
 * 5. 우측 상단 [배포] -> [새 배포] 클릭:
 *    - 유형 선택: '웹 앱 (Web app)'
 *    - 설명: 센서 상담 기록 Web App
 *    - 다음 사용자로 실행: '나 (My account)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자 (Anyone)' (★ 중요!)
 * 6. [배포]를 누르고 발급된 '웹 앱 URL'을 복사하여 앱에 입력합니다.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * [마케팅 전화상담 질문 생성기 - Google Apps Script 백엔드]
 * 산업용 센서 상담 기록을 Google Sheet 마지막 행에 자동으로 추가합니다.
 */

// ============================================================================
// [설정 1] 여기에 Spreadsheet ID를 입력하세요.
// 예: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
// (스프레드시트 주소창 https://docs.google.com/spreadsheets/d/[여기가_ID]/edit 에서 확인)
// 비워둘 경우("") 이 스크립트와 연결된 컨테이너 바인딩 시트를 자동으로 사용합니다.
// ============================================================================
var SPREADSHEET_ID = "";

// ============================================================================
// [설정 2] 여기에 상담 기록을 저장할 Sheet(탭) 이름을 입력하세요.
// ============================================================================
var SHEET_NAME = "센서 마케팅 상담 기록";

/**
 * 웹앱 POST 요청 처리기
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // 동시 요청 데이터 충돌 방지 락 (최대 30초 대기)
  lock.tryLock(30000);

  try {
    var rawContent = e && e.postData ? e.postData.contents : "{}";
    var data = {};
    try {
      data = JSON.parse(rawContent);
    } catch (parseErr) {
      data = (e && e.parameter) ? e.parameter : {};
    }

    // fallback to query parameters if fields are missing
    if (!data.product && e && e.parameter) {
      data = e.parameter;
    }

    var product = data.product || "미지정 제품";
    var questions = data.questions || "";
    var memo = data.memo || "";
    var date = data.date || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");

    // 스프레드시트 열기
    var ss;
    if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!ss) {
      throw new Error("스프레드시트를 찾을 수 없습니다. SPREADSHEET_ID 설정을 확인해주세요.");
    }

    // 대상 시트 가져오기 (없으면 자동 생성)
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // 첫 행 헤더가 비어있는 경우 표준 헤더 자동 생성
    if (sheet.getLastRow() === 0) {
      var headers = ["제품명", "상담 질문", "견적/가격 메모", "저장 날짜"];
      sheet.appendRow(headers);

      // 헤더 스타일링 (B2B 전문 네이비 컬러)
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1E293B");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // A열: 제품명
    // B열: 상담 질문 (줄바꿈 포함)
    // C열: 견적/가격 메모
    // D열: 저장 날짜 (YYYY-MM-DD)
    var newRow = [product, questions, memo, date];
    sheet.appendRow(newRow);

    // B열 텍스트 자동 줄바꿈 활성화
    var lastRowIndex = sheet.getLastRow();
    sheet.getRange(lastRowIndex, 2).setWrap(true);
    sheet.getRange(lastRowIndex, 1).setHorizontalAlignment("center");
    sheet.getRange(lastRowIndex, 4).setHorizontalAlignment("center");

    var result = {
      status: "success",
      message: "✓ 저장 완료",
      row: lastRowIndex,
      date: date
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errorResult = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * 웹앱 GET 요청 처리기 (테스트 및 연결 상태 확인용)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "센서 마케팅 상담 기록 Apps Script Web App",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
