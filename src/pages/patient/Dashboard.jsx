import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cancelAppointment, requestCancellation } from "@/lib/appointments";
import { canCancelDirectly, canRequestCancel } from "@/lib/dates";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import AppointmentDetailsDialog from "@/components/AppointmentDetailsDialog";
import ImageLightbox from "@/components/ImageLightbox";
import { formatDate, formatTime } from "@/lib/format";

export default function Dashboard() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [appts, setAppts] = useState([]);
	const [records, setRecords] = useState([]);
	const [confirmAppt, setConfirmAppt] = useState(null);
	const [action, setAction] = useState(null);
	const [detailsAppt, setDetailsAppt] = useState(null);
	const [lightboxSrc, setLightboxSrc] = useState(null);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		if (!user) return;
		const q = query(
			collection(db, "appointments"),
			where("patientId", "==", user.uid),
		);
		const unsub = onSnapshot(q, (snap) => {
			setAppts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
			setLoading(false);
		});
		const rq = query(
			collection(db, "visitRecords"),
			where("patientId", "==", user.uid),
		);
		const unsub2 = onSnapshot(rq, (snap) => {
			setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
			setLoading(false);
		});
		return () => {
			unsub();
			unsub2();
		};
	}, [user]);

	const now = new Date();
	const upcoming = appts
		.filter(
			(a) =>
				a.startAt.toDate() > now &&
				(a.status === "confirmed" || a.status === "cancel_requested"),
		)
		.sort((a, b) => a.startAt.toDate() - b.startAt.toDate());
	const past = appts
		.filter((a) => a.startAt.toDate() <= now)
		.sort((a, b) => b.startAt.toDate() - a.startAt.toDate());

	const historyItems = (() => {
		const completed = past.filter((a) => a.status === "completed");
		const items = completed.map((a) => ({
			kind: "appt",
			appt: a,
			record: records.find((r) => r.appointmentId === a.id) || null,
		}));
		const orphanRecords = records.filter(
			(r) => !completed.some((a) => a.id === r.appointmentId),
		);
		orphanRecords.forEach((r) =>
			items.push({ kind: "record", record: r, appt: null }),
		);
		items.sort((x, y) => {
			const parseDate = (s) => {
				const [yy, mm, dd] = String(s).split("-").map(Number);
				return new Date(yy, mm - 1, dd);
			};
			const dx = x.appt ? x.appt.startAt.toDate() : parseDate(x.record.date);
			const dy = y.appt ? y.appt.startAt.toDate() : parseDate(y.record.date);
			return dy - dx;
		});
		return items;
	})();

	const doCancel = async () => {
		try {
			if (action === "cancel") await cancelAppointment(confirmAppt);
			else await requestCancellation(confirmAppt);
			toast.success("Done");
		} catch (e) {
			toast.error(e.message);
		}
		setConfirmAppt(null);
		setAction(null);
	};

	if (loading)
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		);

	return (
		<div className="space-y-6">
			<div>
				<p className="text-xs uppercase tracking-widest text-[#6b6b6b]">
					Patient dashboard
				</p>
				<h1 className="text-4xl font-medium">Welcome back</h1>
				<p className="text-[#6b6b6b]">
					{upcoming.length} upcoming appointments · {historyItems.length} past
					visits
				</p>
			</div>
			<Tabs defaultValue="upcoming">
				<TabsList>
					<TabsTrigger value="upcoming">
						Upcoming ({upcoming.length})
					</TabsTrigger>
					<TabsTrigger value="history">
						Visit history ({historyItems.length})
					</TabsTrigger>
				</TabsList>
				<TabsContent value="upcoming" className="space-y-3">
					{upcoming.length === 0 && (
						<Card>
							<CardContent className="p-6 text-center">
								<p>No upcoming appointments</p>
								<Button className="mt-3" onClick={() => navigate("/book")}>
									Book an appointment
								</Button>
							</CardContent>
						</Card>
					)}
					{upcoming.map((a) => (
						<Card key={a.id}>
							<CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0">
									<p className="font-semibold break-words">{a.serviceName}</p>
									<p className="text-sm text-[#6b6b6b]">
										{formatDate(a.date)} · {formatTime(a.time)}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2 justify-end">
									<StatusBadge status={a.status} />
									<div className="flex items-center gap-2 flex-nowrap">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setDetailsAppt(a)}
										>
											Details
										</Button>
										{a.status === "confirmed" && canCancelDirectly(a) && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setConfirmAppt(a);
													setAction("cancel");
												}}
											>
												Cancel
											</Button>
										)}
										{a.status === "confirmed" &&
											!canCancelDirectly(a) &&
											canRequestCancel(a) && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setConfirmAppt(a);
														setAction("request");
													}}
												>
													Request cancellation
												</Button>
											)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</TabsContent>
				<TabsContent value="history" className="space-y-3">
					{historyItems.length === 0 && (
						<Card>
							<CardContent className="p-6 text-center">
								<p>No past visits</p>
								<Button className="mt-3" onClick={() => navigate("/book")}>
									Book an appointment
								</Button>
							</CardContent>
						</Card>
					)}
					{historyItems.map((item) => {
						const a = item.appt;
						const r = item.record;
						const label = a ? a.serviceName : r?.procedure || "Visit";
						const dateStr = a
							? `${formatDate(a.date)} · ${formatTime(a.time)}`
							: r?.date
								? formatDate(r.date)
								: "";
						const showProcedure =
							r?.procedure &&
							r.procedure.trim().toLowerCase() !==
								String(label).trim().toLowerCase();
						const photos = r?.attachmentUrls || [];
						return (
							<Card key={item.kind === "appt" ? a.id : r.id}>
								<CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div className="min-w-0">
										<p className="font-semibold break-words">{label}</p>
										<p className="text-sm text-[#6b6b6b]">{dateStr}</p>
										{showProcedure && (
											<p className="text-sm mt-1 break-words">{r.procedure}</p>
										)}
										{r?.notes && (
											<p
												className={`text-sm mt-1 break-words ${a ? "line-clamp-2" : ""}`}
											>
												{r.notes}
											</p>
										)}
										{r?.nextVisitSuggestion && (
											<p className="text-sm text-[#6b6b6b] break-words">
												Next: {r.nextVisitSuggestion}
											</p>
										)}
										{photos.length > 0 && (
											<div className="flex flex-wrap items-center gap-2 mt-2">
												{photos.slice(0, 4).map((u, i) => (
													<img
														key={i}
														src={u}
														alt={`Attachment ${i + 1}`}
														className="w-12 h-12 object-cover rounded cursor-pointer"
														onClick={() => setLightboxSrc(u)}
													/>
												))}
												{photos.length > 4 && (
													<span className="text-xs text-[#6b6b6b]">
														+{photos.length - 4} more
													</span>
												)}
											</div>
										)}
									</div>
									<div className="flex flex-wrap items-center gap-2 sm:justify-end sm:shrink-0">
										<StatusBadge status="completed" />
										{a && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => setDetailsAppt(a)}
											>
												Details
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</TabsContent>
			</Tabs>
			<ImageLightbox
				src={lightboxSrc}
				open={!!lightboxSrc}
				onOpenChange={() => setLightboxSrc(null)}
			/>
			<AppointmentDetailsDialog
				open={!!detailsAppt}
				onOpenChange={() => setDetailsAppt(null)}
				appointment={detailsAppt}
				record={
					detailsAppt
						? records.find((r) => r.appointmentId === detailsAppt.id)
						: null
				}
			/>
			<Dialog open={!!confirmAppt} onOpenChange={() => setConfirmAppt(null)}>
				{" "}
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{action === "cancel"
								? "Cancel this appointment?"
								: "Request cancellation?"}
						</DialogTitle>
					</DialogHeader>
					{confirmAppt && (
						<p className="break-words text-[#6b6b6b]">
							{confirmAppt.serviceName} · {confirmAppt.date} {confirmAppt.time}
						</p>
					)}
					<p className="text-sm text-[#6b6b6b]">
						{action === "cancel"
							? "This will free up the time slot."
							: "The clinic will review your request."}
					</p>
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmAppt(null)}>
							No, keep it
						</Button>
						<Button variant="destructive" onClick={doCancel}>
							Yes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
