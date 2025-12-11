// In production, this is accessed via kubectl port-forward
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = {
	async createSession(): Promise<{
		success: boolean;
		session: { id: string; createdAt: string };
	}> {
		const res = await fetch(`${API_BASE}/api/admin/session`, {
			method: "POST",
		});
		if (!res.ok) throw new Error("Failed to create session");
		return res.json();
	},

	async getState(): Promise<{
		session: {
			id: string;
			createdAt: string;
			isActive: boolean;
			activity: string;
			playerCount: number;
			entertainerConnected: boolean;
		} | null;
		players: Array<{ id: string; nickname: string; role: string }>;
	}> {
		const res = await fetch(`${API_BASE}/api/admin/state`);
		if (!res.ok) throw new Error("Failed to fetch state");
		return res.json();
	},

	async switchActivity(activity: string): Promise<void> {
		const res = await fetch(`${API_BASE}/api/admin/session/activity`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ activity }),
		});
		if (!res.ok) throw new Error("Failed to switch activity");
	},

	async endSession(): Promise<void> {
		const res = await fetch(`${API_BASE}/api/admin/session`, {
			method: "DELETE",
		});
		if (!res.ok) throw new Error("Failed to end session");
	},
};
