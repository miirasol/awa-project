import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
	approveCancellation,
	rejectCancellation,
	markCompleted,
	markNoShow,
	cancelAppointment,
} from "@/lib/appointments";
import {
	buildViews,
	groupByDate,
	dayLabel,
	filterHistory,
} from "@/lib/appointmentViews";
import { statusLabel, formatDate, formatTime } from "@/lib/format";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import AppointmentDetailsDialog from "@/components/AppointmentDetailsDialog";
import StatusBadge from "@/components/StatusBadge";
import { useLastDefined } from "@/lib/useLastDefined";

const HISTORY_PAGE = 25;

function StatCard({ label, value, hint, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="text-left rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
		>
			<Card className="h-full transition-colors hover:bg-muted/50">
				<CardContent className="p-4">
					<p className="text-xs text-[#6b6b6b] break-words">{label}</p>
					<p className="text-2xl font-semibold">{value}</p>
					{hint && <p className="text-xs text-[#6b6b6b] mt-1">{hint}</p>}
				</CardContent>
			</Card>
		</button>
	);
}

function Row({ a, name, phone, now, showDate, onDetails, onConfirm }) {
	const past = a.startAt.toDate() < now;
	return (
		<div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex min-w-0 gap-4">
				<div className="w-20 shrink-0 text-sm font-semibold">
					{formatTime(a.time)}
				</div>
				<div className="min-w-0 break-words">
					<p className="font-medium">
						<Link
							to={`/admin/patients/${a.patientId}`}
							className="hover:underline"
						>
							{name}
						</Link>
						{phone && (
							<span className="font-normal text-[#6b6b6b]"> · {phone}</span>
						)}
					</p>
					<p className="text-sm text-[#6b6b6b]">
						{showDate && `${formatDate(a.date)} · `}
						{a.serviceName}
					</p>
					{a.reason && (
						<p className="text-sm text-[#6b6b6b] line-clamp-2">
							Reason: {a.reason}
						</p>
					)}
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 sm:justify-end sm:shrink-0">
				<StatusBadge status={a.status} />
				<Button size="sm" variant="outline" onClick={() => onDetails(a)}>
					Details
				</Button>
				{a.status === "cancel_requested" && (
					<>
						<Button
							size="sm"
							onClick={() =>
								onConfirm({
									fn: approveCancellation,
									appt: a,
									title: "Approve cancellation?",
								})
							}
						>
							Approve
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() =>
								onConfirm({
									fn: rejectCancellation,
									appt: a,
									title: "Reject cancellation request?",
								})
							}
						>
							Reject
						</Button>
					</>
				)}
				{a.status === "confirmed" && past && (
					<>
						<Button
							size="sm"
							onClick={() =>
								onConfirm({
									fn: markCompleted,
									appt: a,
									title: "Mark as completed?",
								})
							}
						>
							Complete
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() =>
								onConfirm({
									fn: markNoShow,
									appt: a,
									title: "Mark as no-show?",
								})
							}
						>
							No-show
						</Button>
					</>
				)}
				{a.status === "confirmed" && !past && (
					<Button
						size="sm"
						variant="outline"
						onClick={() =>
							onConfirm({
								fn: cancelAppointment,
								appt: a,
								title: "Cancel this appointment?",
							})
						}
					>
						Cancel
					</Button>
				)}
			</div>
		</div>
	);
}

function Empty({ children }) {
	return (
		<p className="rounded-lg border border-dashed p-6 text-center text-[#6b6b6b]">
			{children}
		</p>
	);
}

export default function Appointments() {
	const [appts, setAppts] = useState([]);
	const [users, setUsers] = useState({});
	const [loading, setLoading] = useState(true);
	const [now, setNow] = useState(() => new Date());
	const [tab, setTab] = useState("today");
	const [statusFilter, setStatusFilter] = useState("all");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [search, setSearch] = useState("");
	const [shown, setShown] = useState(HISTORY_PAGE);
	const [confirm, setConfirm] = useState(null);
	const shownConfirm = useLastDefined(confirm);
	const [detailsAppt, setDetailsAppt] = useState(null);

	useEffect(() => {
		const unsubAppts = onSnapshot(collection(db, "appointments"), (snap) => {
			setAppts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
			setLoading(false);
		});
		const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
			const map = {};
			snap.docs.forEach((d) => {
				map[d.id] = d.data();
			});
			setUsers(map);
		});
		// keep "past" / "today" correct while the page stays open
		const tick = setInterval(() => setNow(new Date()), 60000);
		return () => {
			unsubAppts();
			unsubUsers();
			clearInterval(tick);
		};
	}, []);

	const nameOf = (uid) =>
		users[uid]?.fullName?.trim() || users[uid]?.email || "Unnamed patient";
	const phoneOf = (uid) => users[uid]?.phone || "";
	const textOf = (a) =>
		[
			nameOf(a.patientId),
			users[a.patientId]?.email,
			phoneOf(a.patientId),
			a.serviceName,
		]
			.filter(Boolean)
			.join(" ");

	const views = useMemo(() => buildViews(appts, now), [appts, now]);
	const historyFiltered = useMemo(
		() =>
			filterHistory(
				views.history,
				{ status: statusFilter, from: dateFrom, to: dateTo, search },
				textOf,
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[views.history, statusFilter, dateFrom, dateTo, search, users],
	);

	const run = async (fn, appt) => {
		try {
			await fn(appt);
			toast.success("Done");
		} catch (e) {
			toast.error(e.message);
		}
		setConfirm(null);
	};

	const rowProps = (a, extra = {}) => ({
		a,
		now,
		name: nameOf(a.patientId),
		phone: phoneOf(a.patientId),
		onDetails: setDetailsAppt,
		onConfirm: setConfirm,
		...extra,
	});

	const upcomingGroups = groupByDate(views.upcoming);

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
			<h1 className="text-2xl font-semibold">Appointments</h1>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4">
				<StatCard
					label="Cancellation requests"
					value={views.requests.length}
					hint={views.requests.length ? "Needs your decision" : ""}
					onClick={() => setTab("needs")}
				/>
				<StatCard
					label="Today's appointments"
					value={views.today.length}
					onClick={() => setTab("today")}
				/>
				<StatCard
					label="Upcoming"
					value={views.upcoming.length}
					hint="After today"
					onClick={() => setTab("upcoming")}
				/>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList className="max-w-full overflow-x-auto">
					<TabsTrigger value="today">Today ({views.today.length})</TabsTrigger>
					<TabsTrigger value="upcoming">
						Upcoming ({views.upcoming.length})
					</TabsTrigger>
					<TabsTrigger value="needs">
						Needs action
						{views.needsActionCount > 0 && (
							<span className="rounded-full bg-amber-100 px-1.5 text-xs text-amber-700">
								{views.needsActionCount}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="history">History</TabsTrigger>
				</TabsList>

				<TabsContent value="today" className="space-y-3">
					<p className="text-sm font-medium">
						{dayLabel(views.todayStr, views.todayStr)} ·{" "}
						{formatDate(views.todayStr)}
					</p>
					{views.today.length === 0 && <Empty>No appointments today.</Empty>}
					{views.today.map((a) => (
						<Row key={a.id} {...rowProps(a)} />
					))}
				</TabsContent>

				<TabsContent value="upcoming" className="space-y-5">
					{upcomingGroups.length === 0 && (
						<Empty>No upcoming appointments.</Empty>
					)}
					{upcomingGroups.map((g) => (
						<section key={g.date} className="space-y-2">
							<h2 className="text-sm font-medium">
								{dayLabel(g.date, views.todayStr)}{" "}
								<span className="font-normal text-[#6b6b6b]">
									· {g.items.length}{" "}
									{g.items.length === 1 ? "appointment" : "appointments"}
								</span>
							</h2>
							{g.items.map((a) => (
								<Row key={a.id} {...rowProps(a)} />
							))}
						</section>
					))}
				</TabsContent>

				<TabsContent value="needs" className="space-y-6">
					{views.needsActionCount === 0 && <Empty>You're all caught up.</Empty>}
					{views.requests.length > 0 && (
						<section className="space-y-2">
							<h2 className="text-sm font-medium">
								Cancellation requests ({views.requests.length})
							</h2>
							{views.requests.map((a) => (
								<Row key={a.id} {...rowProps(a, { showDate: true })} />
							))}
						</section>
					)}
					{views.unmarked.length > 0 && (
						<section className="space-y-2">
							<h2 className="text-sm font-medium">
								Past appointments to mark ({views.unmarked.length})
							</h2>
							<p className="text-xs text-[#6b6b6b]">
								These are still "Confirmed". Mark each one as completed or
								no-show.
							</p>
							{views.unmarked.map((a) => (
								<Row key={a.id} {...rowProps(a, { showDate: true })} />
							))}
						</section>
					)}
				</TabsContent>

				<TabsContent value="history" className="space-y-4">
					<div className="grid grid-cols-1 sm:flex sm:flex-wrap items-end gap-3">
						<div className="space-y-1">
							<label className="text-xs text-[#6b6b6b]">Search</label>
							<Input
								placeholder="Name, email, phone or service"
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setShown(HISTORY_PAGE);
								}}
								className="w-full sm:w-64"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs text-[#6b6b6b]">Status</label>
							<Select
								value={statusFilter}
								onValueChange={(v) => {
									setStatusFilter(v);
									setShown(HISTORY_PAGE);
								}}
							>
								<SelectTrigger className="w-full sm:w-48">
									<SelectValue>
										{statusFilter === "all"
											? "All statuses"
											: statusLabel(statusFilter)}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All statuses</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="no_show">No show</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<label className="text-xs text-[#6b6b6b]">From</label>
							<Input
								type="date"
								value={dateFrom}
								onChange={(e) => {
									setDateFrom(e.target.value);
									setShown(HISTORY_PAGE);
								}}
								className="w-full sm:w-44"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs text-[#6b6b6b]">To</label>
							<Input
								type="date"
								value={dateTo}
								onChange={(e) => {
									setDateTo(e.target.value);
									setShown(HISTORY_PAGE);
								}}
								className="w-full sm:w-44"
							/>
						</div>
					</div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Time</TableHead>
								<TableHead>Patient</TableHead>
								<TableHead>Service</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{historyFiltered.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className="text-center text-[#6b6b6b]">
										No appointments found.
									</TableCell>
								</TableRow>
							)}
							{historyFiltered.slice(0, shown).map((a) => (
								<TableRow key={a.id}>
									<TableCell>{formatDate(a.date)}</TableCell>
									<TableCell>{formatTime(a.time)}</TableCell>
									<TableCell
										className="max-w-[14rem] truncate"
										title={nameOf(a.patientId)}
									>
										<Link
											to={`/admin/patients/${a.patientId}`}
											className="hover:underline"
										>
											{nameOf(a.patientId)}
										</Link>
									</TableCell>
									<TableCell
										className="max-w-[14rem] truncate"
										title={a.serviceName}
									>
										{a.serviceName}
									</TableCell>
									<TableCell>
										<StatusBadge status={a.status} />
									</TableCell>
									<TableCell>
										<Button
											size="sm"
											variant="outline"
											onClick={() => setDetailsAppt(a)}
										>
											Details
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					{historyFiltered.length > shown && (
						<div className="flex items-center justify-center gap-3 text-sm text-[#6b6b6b]">
							<span>
								Showing {shown} of {historyFiltered.length}
							</span>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setShown((n) => n + HISTORY_PAGE)}
							>
								Show more
							</Button>
						</div>
					)}
				</TabsContent>
			</Tabs>

			<AppointmentDetailsDialog
				open={!!detailsAppt}
				onOpenChange={() => setDetailsAppt(null)}
				appointment={detailsAppt}
				patientName={detailsAppt ? nameOf(detailsAppt.patientId) : ""}
			/>

			<Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{shownConfirm?.title || "Confirm action"}</DialogTitle>
					</DialogHeader>
					{shownConfirm && (
						<>
							<p className="break-words text-[#6b6b6b]">
								{nameOf(shownConfirm.appt.patientId)} · {shownConfirm.appt.serviceName} ·{" "}
								{formatDate(shownConfirm.appt.date)} {formatTime(shownConfirm.appt.time)}
							</p>
							<p className="text-sm text-[#6b6b6b]">
								{shownConfirm.fn === cancelAppointment
									? "This will free up the time slot."
									: shownConfirm.fn === markCompleted
										? "Mark this appointment as completed."
										: shownConfirm.fn === markNoShow
											? "Mark this appointment as no-show."
											: shownConfirm.fn === rejectCancellation
												? "Return this appointment to confirmed."
												: "Confirm this action."}
							</p>
						</>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirm(null)}>
							No, keep it
						</Button>
						<Button
							variant={
								shownConfirm?.fn === markCompleted ? "default" : "destructive"
							}
							onClick={() => run(confirm.fn, confirm.appt)}
						>
							{shownConfirm?.fn === cancelAppointment
								? "Cancel Appointment"
								: shownConfirm?.fn === markCompleted
									? "Complete"
									: shownConfirm?.fn === markNoShow
										? "No-show"
										: shownConfirm?.fn === approveCancellation
											? "Approve"
											: shownConfirm?.fn === rejectCancellation
												? "Reject"
												: "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
