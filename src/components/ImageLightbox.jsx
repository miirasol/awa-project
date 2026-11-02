import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function ImageLightbox({ src, open, onOpenChange }) {
  if (!src) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-2">
        <img src={src} alt="Enlarged" className="w-full h-auto max-h-[85vh] object-contain rounded" />
      </DialogContent>
    </Dialog>
  );
}
