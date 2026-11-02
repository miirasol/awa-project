import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import ImageLightbox from "@/components/ImageLightbox";
import { Badge } from "@/components/ui/badge";
import { statusLabel, formatDate, formatTime } from "@/lib/format";

export default function AppointmentDetailsDialog({
	open,
	onOpenChange,
	appointment,
	patientName,
	record,
}) {
	const [last, setLast] = useState(null);
	if (
		appointment &&
		(last?.appointment !== appointment ||
			last?.patientName !== patientName ||
			last?.record !== record)
	) {
		setLast({ appointment, patientName, record });
	}
	const view = appointment ? { appointment, patientName, record } : last;
	const a = view?.appointment;
	patientName = view?.patientName;
	record = view?.record;

	const [lightboxSrc, setLightboxSrc] = useState(null);
	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Appointment details</DialogTitle>
					</DialogHeader>
					{a ? (
						<div className="space-y-2 text-sm break-words">
							<p>
								<span className="text-[#6b6b6b]">Date:</span>{" "}
								{formatDate(a.date)}
							</p>
							<p>
								<span className="text-[#6b6b6b]">Time:</span>{" "}
								{formatTime(a.time)}
							</p>
							<p>
								<span className="text-[#6b6b6b]">Service:</span> {a.serviceName}
							</p>
							<p>
								<span className="text-[#6b6b6b]">Status:</span>{" "}
								<Badge variant="outline">{statusLabel(a.status)}</Badge>
							</p>
							{patientName && (
								<p>
									<span className="text-[#6b6b6b]">Patient:</span> {patientName}
								</p>
							)}
							{a.reason && (
								<p>
									<span className="text-[#6b6b6b]">Reason:</span> {a.reason}
								</p>
							)}
							{a.photoUrl && (
								<img
									src={a.photoUrl}
									alt="Patient photo"
									className="w-32 h-32 object-cover rounded cursor-pointer"
									onClick={() => setLightboxSrc(a.photoUrl)}
								/>
							)}
							{record && (
								<div className="pt-2 border-t space-y-1">
									<p className="font-semibold">Visit record</p>
									<p>{record.procedure}</p>
									{record.notes && <p>{record.notes}</p>}
									{record.nextVisitSuggestion && (
										<p className="text-[#6b6b6b]">
											Next: {record.nextVisitSuggestion}
										</p>
									)}
									{record.attachmentUrls?.length > 0 && (
										<div className="flex gap-2 flex-wrap">
											{record.attachmentUrls.map((u, i) => (
												<img
													key={i}
													src={u}
													alt={`Attachment ${i + 1}`}
													className="w-16 h-16 object-cover rounded cursor-pointer"
													onClick={() => setLightboxSrc(u)}
												/>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					) : (
						<p className="text-[#6b6b6b]">No appointment selected.</p>
					)}
				</DialogContent>
			</Dialog>
			<ImageLightbox
				src={lightboxSrc}
				open={!!lightboxSrc}
				onOpenChange={() => setLightboxSrc(null)}
			/>
		</>
	);
}
