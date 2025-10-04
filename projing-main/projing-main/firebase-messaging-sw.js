importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyDj10H-KPaaIV0NnozhYgGZWl2KHr2jP-4",
  authDomain: "test-modull.firebaseapp.com",
  projectId: "test-modull",
  messagingSenderId: "134374783317",
  appId: "1:134374783317:web:2bb259c0627ec08e1697dc"
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
  console.log("Background notification: ", payload);
  return self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon.png"
    }
  );
});
