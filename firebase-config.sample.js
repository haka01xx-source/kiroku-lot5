// コピーして `firebase-config.js` にリネームし、下記の値を Firebase コンソールから取得して貼り付けてください。
// 使い方:
// 1. https://console.firebase.google.com/ でプロジェクトを作成
// 2. Authentication -> Sign-in method で Google を有効化
// 3. Firestore を有効化（ルールは初期はテスト用に緩めにしておく）
// 4. プロジェクトの設定 -> SDK の設定から以下の値をコピー
// 5. `firebase-config.sample.js` をコピーして `firebase-config.js` にリネームして値を貼り付ける

window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// 注意: このファイルは機密性の高い情報を含みます。公開リポジトリに置く場合は注意してください。
