import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-[#737373]">Page not found</p>
      <Button render={<Link to="/" />}>Go home</Button>
    </div>
  );
}