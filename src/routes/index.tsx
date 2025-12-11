import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Users, Activity, QrCode, Trash2, Play } from "lucide-react";

export const Route = createFileRoute("/")({ component: AdminPanel });

function AdminPanel() {
	const queryClient = useQueryClient();

	// Auto-refresh state every 2 seconds
	const { data: state, isLoading } = useQuery({
		queryKey: ["admin-state"],
		queryFn: api.getState,
		refetchInterval: 2000,
	});

	const createSessionMutation = useMutation({
		mutationFn: api.createSession,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-state"] });
		},
	});

	const switchActivityMutation = useMutation({
		mutationFn: (activity: string) => api.switchActivity(activity),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-state"] });
		},
	});

	const endSessionMutation = useMutation({
		mutationFn: api.endSession,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-state"] });
		},
	});

	const session = state?.session;
	const players = state?.players || [];
	const clients = players.filter((p) => p.role === "client");

	// Generate QR code URL
	const clientUrl = session
		? `https://mikiwikipolvoron.github.io/wilco-client/?session=${session.id}`
		: "";
	const entertainerUrl = session
		? `https://mikiwikipolvoron.github.io/wilco-entertainer/?session=${session.id}`
		: "";
	const qrCodeUrl = clientUrl
		? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(clientUrl)}`
		: "";

	const activities = [
		{ id: "lobby", label: "Lobby", icon: Users },
		{ id: "beats", label: "Beats", icon: Activity },
		{ id: "ar", label: "AR", icon: QrCode },
		{ id: "instruments", label: "Instruments", icon: Play },
		{ id: "energizer", label: "Energizer", icon: Activity },
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-4xl font-bold text-white mb-8">
					WILCO Admin Panel
				</h1>

				{/* Session Control */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Session Control</CardTitle>
						<CardDescription>
							Create and manage your WILCO session
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!session ? (
							<Button
								onClick={() => createSessionMutation.mutate()}
								disabled={createSessionMutation.isPending}
								size="lg"
							>
								{createSessionMutation.isPending ? "Creating..." : "Create New Session"}
							</Button>
						) : (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-gray-400">Session ID</p>
										<p className="text-3xl font-mono font-bold text-cyan-400">
											{session.id}
										</p>
										<p className="text-xs text-gray-500 mt-1">
											Created:{" "}
											{new Date(session.createdAt).toLocaleString()}
										</p>
									</div>
									<Button
										variant="destructive"
										onClick={() => endSessionMutation.mutate()}
										disabled={endSessionMutation.isPending}
									>
										<Trash2 className="w-4 h-4 mr-2" />
										End Session
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* QR Code and URLs */}
				{session && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						<Card>
							<CardHeader>
								<CardTitle>Client Access</CardTitle>
								<CardDescription>
									Visitors scan this QR code to join
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col items-center">
								{qrCodeUrl && (
									<img
										src={qrCodeUrl}
										alt="QR Code for clients"
										className="mb-4 rounded-lg border border-slate-700"
									/>
								)}
								<code className="text-xs text-gray-400 break-all text-center">
									{clientUrl}
								</code>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Entertainer Access</CardTitle>
								<CardDescription>
									Open this on the performer's device
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div>
										<p className="text-sm text-gray-400 mb-2">Entertainer URL:</p>
										<code className="text-xs text-cyan-400 break-all block bg-slate-900 p-3 rounded">
											{entertainerUrl}
										</code>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-sm text-gray-400">Status:</span>
										{session.entertainerConnected ? (
											<span className="text-green-400 font-semibold">● Connected</span>
										) : (
											<span className="text-red-400 font-semibold">● Disconnected</span>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Activity Control */}
				{session && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Activity Control</CardTitle>
							<CardDescription>
								Current activity: <span className="text-cyan-400 font-semibold">{session.activity}</span>
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
								{activities.map((act) => {
									const Icon = act.icon;
									const isActive = session.activity === act.id;
									return (
										<Button
											key={act.id}
											variant={isActive ? "default" : "outline"}
											onClick={() => switchActivityMutation.mutate(act.id)}
											disabled={switchActivityMutation.isPending || isActive}
											className="flex flex-col h-auto py-4"
										>
											<Icon className="w-6 h-6 mb-2" />
											{act.label}
										</Button>
									);
								})}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Player List */}
				{session && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="w-5 h-5" />
								Connected Players ({clients.length})
							</CardTitle>
							<CardDescription>
								Real-time list of participants
							</CardDescription>
						</CardHeader>
						<CardContent>
							{clients.length === 0 ? (
								<p className="text-gray-500 text-center py-8">
									No players connected yet
								</p>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
									{clients.map((player) => (
										<div
											key={player.id}
											className="bg-slate-900/50 border border-slate-700 rounded px-3 py-2"
										>
											<p className="font-medium text-gray-200">
												{player.nickname}
											</p>
											<p className="text-xs text-gray-500 font-mono">
												{player.id.slice(0, 8)}
											</p>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Loading State */}
				{isLoading && !state && (
					<div className="text-center text-gray-400 py-12">
						Loading admin panel...
					</div>
				)}
			</div>
		</div>
	);
}
