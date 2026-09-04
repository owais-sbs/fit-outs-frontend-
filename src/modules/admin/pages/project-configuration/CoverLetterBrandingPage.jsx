import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import {
  deleteCoverLetterSignature,
  deleteCoverLetterStamp,
  fetchCoverLetterBranding,
  uploadCoverLetterSignature,
  uploadCoverLetterStamp,
} from "../../api/cover-letter-branding.api";

function AssetCard({
  title,
  description,
  imageUrl,
  acceptHint,
  uploading,
  onUpload,
  onRemove,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-4">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="max-h-full max-w-full object-contain" />
          ) : (
            <p className="text-sm text-muted-foreground">No image uploaded</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex">
            <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
              <span>
                <ImagePlus className="mr-1.5 h-4 w-4" />
                {uploading ? "Uploading…" : imageUrl ? "Replace" : "Upload PNG or JPG"}
              </span>
            </Button>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onUpload(file);
              }}
            />
          </label>
          {imageUrl ? (
            <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={onRemove}>
              <Trash2 className="mr-1.5 h-4 w-4 text-destructive" />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-[11px] text-muted-foreground">{acceptHint}</p>
      </CardContent>
    </Card>
  );
}

export default function CoverLetterBrandingPage() {
  const [branding, setBranding] = useState({ stampUrl: "", signatureUrl: "" });
  const [loading, setLoading] = useState(true);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetchCoverLetterBranding()
      .then(setBranding)
      .catch((e) => setError(e.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleStamp = async (file) => {
    setUploadingStamp(true);
    setError("");
    try {
      setBranding(await uploadCoverLetterStamp(file));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload stamp");
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleSignature = async (file) => {
    setUploadingSignature(true);
    setError("");
    try {
      setBranding(await uploadCoverLetterSignature(file));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload signature");
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleRemoveStamp = async () => {
    if (!window.confirm("Remove the company stamp from cover letters?")) return;
    setError("");
    try {
      setBranding(await deleteCoverLetterStamp());
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove stamp");
    }
  };

  const handleRemoveSignature = async () => {
    if (!window.confirm("Remove the company signature from cover letters?")) return;
    setError("");
    try {
      setBranding(await deleteCoverLetterSignature());
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove signature");
    }
  };

  return (
    <PageShell className="p-6">
      <PageTitle
        title="Cover letter"
        subtitle="Company stamp and signature used on site-visit quotation cover letters. Each visit can still hide or replace them."
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AssetCard
            title="Company stamp"
            description="Rubber-stamp image, usually placed to the right of the signatory."
            imageUrl={branding.stampUrl}
            acceptHint="Transparent PNG works best."
            uploading={uploadingStamp}
            onUpload={handleStamp}
            onRemove={handleRemoveStamp}
          />
          <AssetCard
            title="Digital signature"
            description="Handwritten signature image placed above Grigoris Georgiou on the letter."
            imageUrl={branding.signatureUrl}
            acceptHint="Transparent PNG on a white or empty background works best."
            uploading={uploadingSignature}
            onUpload={handleSignature}
            onRemove={handleRemoveSignature}
          />
        </div>
      )}
    </PageShell>
  );
}
