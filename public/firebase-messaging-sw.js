/**
 * FCM 백그라운드 푸시 수신용 서비스 워커.
 *
 * 사용 방법:
 * 1. Firebase Console > 프로젝트 설정 > 일반 > 앱(웹) 에서 config 복사
 * 2. 아래 firebaseConfig 객체를 해당 값으로 채우고 저장
 * 3. 배포 후 로그인 시 브라우저에서 알림 권한 허용
 *
 * 수신 알림: 동아리 신청 승인/거절, Q&A 질문·답변, 관심동아리 모집시작·모집마감 D-1
 */
var firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');
  firebase.initializeApp(firebaseConfig);
  var messaging = firebase.messaging();
  messaging.onBackgroundMessage(function (payload) {
    var title = (payload && payload.notification && payload.notification.title) || (payload && payload.data && payload.data.title) || '알림';
    var options = {
      body: (payload && payload.notification && payload.notification.body) || (payload && payload.data && payload.data.message) || '',
      icon: '/icons/icon-192.png',
      data: { url: (payload && payload.data && payload.data.redirectUrl) || '/notifications' },
    };
    self.registration.showNotification(title, options);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw] init failed', e);
}
