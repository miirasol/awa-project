import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App.jsx";

window.addEventListener("vite:preloadError", () => {
	if (!sessionStorage.getItem("reloaded-after-deploy")) {
		sessionStorage.setItem("reloaded-after-deploy", "1");
		window.location.reload();
	}
});

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<App />
				<Toaster />
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
);
