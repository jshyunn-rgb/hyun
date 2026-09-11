import { SensorProduct } from './types';

// ============================================================================
// 여기에 Google Apps Script Web App URL 입력
// 예: "https://script.google.com/macros/s/AKfycbx.../exec"
// ============================================================================
export const GOOGLE_APPS_SCRIPT_URL: string = "";

export const SENSOR_PRODUCTS: {
  id: SensorProduct;
  name: string;
  description: string;
  keyFactors: string[];
}[] = [
  {
    id: '압력센서',
    name: '압력센서',
    description: '배관 및 유체 라인의 게이지압/절대압 측정',
    keyFactors: ['압력 범위', '출력 방식 (4-20mA/0-10V)', '정확도', '접속 나사 규격', '사용 유체/환경'],
  },
  {
    id: '차압센서',
    name: '차압센서',
    description: '클린룸 차압, 필터 차압 모니터링 및 유량 감지',
    keyFactors: ['차압 범위 (Pa/bar)', '최대 정압 조건', '적용 공정', '출력 신호', '설치 조건'],
  },
  {
    id: '디지털 압력계',
    name: '디지털 압력계',
    description: '현장 시인성 및 테스트 벤치 고정밀 압력 지시',
    keyFactors: ['압력 범위', '측정 정확도', 'LCD 표시 방식', '전원(배터리/외부)', '설치 환경'],
  },
  {
    id: '진공센서',
    name: '진공센서',
    description: '진공 챔버, 증착기, 진공 배관의 진공도 감지',
    keyFactors: ['진공 범위 (Torr/mbar)', '적용 챔버 장비', '공정 가스 환경', '기존 게이지', '출력 방식'],
  },
  {
    id: '로드셀',
    name: '로드셀',
    description: '호퍼 스케일, 인장/압축 시험, 계량 하중 측정',
    keyFactors: ['측정 하중 (kg/ton)', '정확도', '외형 구조', '설치 브라켓 조건', '출력 방식'],
  },
];

export const QUESTION_GOALS = [
  {
    number: 1,
    title: '사용 목적 또는 적용 장비 확인',
    desc: '어떤 설비/공정에서 사용할 센서인지 파악',
  },
  {
    number: 2,
    title: '필요한 기술 사양 확인',
    desc: '측정 범위, 정밀도, 출력 신호, 취부 규격 등',
  },
  {
    number: 3,
    title: '현재 사용 제품 또는 제조사 확인',
    desc: '기존 사용 브랜드 및 규격 호환 여부 확인',
  },
  {
    number: 4,
    title: '현재 제품의 문제점 및 개선 요구 확인',
    desc: '기존 센서의 잦은 고장, 납기 지연, 가격 불만 등',
  },
  {
    number: 5,
    title: '구매 의향, 구매 시기 또는 예상 수량 확인',
    desc: '실제 발주 타임라인, 구매 예산, 초기 소요 수량',
  },
];
