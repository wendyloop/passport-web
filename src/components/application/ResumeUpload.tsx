import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, CheckCircle2 } from "lucide-react";

interface ResumeUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

export function ResumeUpload({ value, onChange }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const okTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!okTypes.includes(file.type) && !/\.(pdf|docx)$/i.test(file.name)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setError(null);
    onChange(file);
  }

  if (value) {
    return (
      <Card className="p-4 flex items-center gap-3 border-2">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium truncate">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{value.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{(value.size / 1024).toFixed(0)} KB</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)}>
          <X className="w-4 h-4" />
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`p-6 border-2 border-dashed cursor-pointer transition-colors text-center ${
          dragOver ? "border-primary bg-primary/5" : "hover:border-primary/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Click to upload or drag & drop</p>
        <p className="text-xs text-muted-foreground mt-1">PDF or DOCX, up to 10MB</p>
      </Card>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </>
  );
}
