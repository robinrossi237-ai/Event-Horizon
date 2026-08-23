import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for offline image caching
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').then(reg => {
			console.log('ServiceWorker registered:', reg.scope);
		}).catch(err => {
			console.warn('ServiceWorker registration failed:', err);
		});
	});
}
