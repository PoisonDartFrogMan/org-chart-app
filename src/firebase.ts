import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase設定（マスターの提供データ）
const firebaseConfig = {
    apiKey: "AIzaSyBWo3RgEwLycrvfR1qvniHsh1yJp5ZEyGw",
    authDomain: "org-chart-app-3de0c.firebaseapp.com",
    projectId: "org-chart-app-3de0c",
    storageBucket: "org-chart-app-3de0c.firebasestorage.app",
    messagingSenderId: "790762111600",
    appId: "1:790762111600:web:280597bc21772caac96ab5",
    measurementId: "G-JVNE9CNH8K"
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
