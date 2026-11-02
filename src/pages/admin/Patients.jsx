import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [appts, setAppts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await getDocs(collection(db, "users"));
        setPatients(u.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.role === "patient"));
        const a = await getDocs(collection(db, "appointments"));
        setAppts(a.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = patients.filter(
    (p) =>
      (p.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  const visitsCount = (uid) => appts.filter((a) => a.patientId === uid && a.status === "completed").length;
  const lastVisit = (uid) => {
    const list = appts
      .filter((a) => a.patientId === uid && a.status === "completed")
      .map((a) => a.date)
      .sort();
    return list.length ? list[list.length - 1] : "-";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Patients</h1>
      <Input
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-64"
      />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Last visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[#6b6b6b]">
                  No patients found.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/admin/patients/${p.id}`)}>
                  <TableCell className="max-w-[14rem] truncate" title={p.fullName}>
                    {p.fullName || "Unnamed patient"}
                  </TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell className="max-w-[18rem] truncate" title={p.email}>
                    {p.email}
                  </TableCell>
                  <TableCell>{visitsCount(p.id)}</TableCell>
                  <TableCell>{lastVisit(p.id)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
