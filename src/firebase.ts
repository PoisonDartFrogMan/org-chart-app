import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// TODO: マスターからのfirebaseConfigをここに設定してください
// 現在はマスターが入力するまでのプレースホルダーです
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// initializeAppは設定が有効な時だけ実行するようにガードを入れるか、
// エラーを無視するような構成にしますが、今回は単純化のためにtry-catchで囲みます。
let app;
let db: Firestore | null = null;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.warn("Firebase config is not valid yet. Please update firebaseConfig.");
}

export { db };
