/**
 * FCM 백그라운드 푸시 수신용 서비스 워커.
 * 서버는 Data Message만 발송하므로 payload.data에서 title, body, redirectUrl을 추출해 알림을 띄움.
 *
 * 설정:
 * 1. Firebase Console > 프로젝트 설정 > 일반 > 앱(웹) 에서 config 복사
 * 2. 아래 firebaseConfig를 해당 값으로 채우거나, 빌드 시 주입
 * 3. 배포 후 로그인 시 브라우저 알림 권한 허용
 *
 * 수신 알림: 동아리 신청 승인/거절, Q&A 질문·답변, 관심동아리 모집시작·모집마감 D-1
 */
// 실제 값은 빌드 전 'npm run inject-sw'로 .env에서 주입. Git에는 키를 올리지 말 것.
var firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');
  firebase.initializeApp(firebaseConfig);
  var messaging = firebase.messaging();

  // Data Message: 서버가 notification 필드 없이 data만 보냄. 여기서 알림 생성.
  messaging.onBackgroundMessage(function (payload) {
    var data = (payload && payload.data) || {};
    var title = data.title || (payload.notification && payload.notification.title) || '알림';
    var body =
      data.body || data.message || (payload.notification && payload.notification.body) || '';
    var redirectUrl = data.redirectUrl || '/notifications';
    var options = {
      body: body,
      icon: '/icons/icon-192.png',
      tag: 'kookdonge-notification',
      renotify: true,
      data: { url: redirectUrl },
    };
    return self.registration.showNotification(title, options);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw] init failed', e);
}

// 알림 클릭 시 redirectUrl로 이동. 기존 창이 있으면 포커스 후 해당 URL로 이동, 없으면 새 창.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/notifications';
  var fullUrl =
    url.indexOf('http') === 0
      ? url
      : self.location.origin + (url.indexOf('/') === 0 ? url : '/' + url);

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
            client.navigate(fullUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(fullUrl);
      })
  );
});
