import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  User,
  CheckCircle,
  AlertCircle,
  Shield,
  Upload,
  MapPin,
} from "lucide-react";
import { PageHeader } from "./-components/PageHeader";

export const Route = createFileRoute("/contributor/kyc/")({
  component: ContributorKYC,
});

type VerificationStatus = "pending" | "verified" | "rejected";

interface KYCData {
  nin: string;
  bvn: string;
  address: string;
  faceUploaded: boolean;
  selfieUploaded: boolean;
  addressProofUploaded: boolean;
  status: VerificationStatus;
}

const initial: KYCData = {
  nin: "12345678901",
  bvn: "22345678901",
  address: "",
  faceUploaded: true,
  selfieUploaded: false,
  addressProofUploaded: false,
  status: "pending",
};

const statusBadge: Record<
  VerificationStatus,
  { cls: string; label: string; icon: typeof CheckCircle }
> = {
  verified: { cls: "badge-success", label: "Verified", icon: CheckCircle },
  rejected: { cls: "badge-error", label: "Rejected", icon: AlertCircle },
  pending: { cls: "badge-warning", label: "Pending Review", icon: AlertCircle },
};

function UploadRow({
  label,
  hint,
  uploaded,
  uploading,
  onFile,
  accept = "image/*",
}: {
  label: string;
  hint: string;
  uploaded: boolean;
  uploading: boolean;
  onFile: (f: File) => void;
  accept?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-base-200">
      <div>
        <p className="font-medium text-base-content text-base">{label}</p>
        <p className="text-sm text-base-content mt-0.5">{hint}</p>
      </div>
      <label className="btn btn-sm btn-outline cursor-pointer gap-1.5">
        {uploading ? (
          <span className="loading loading-spinner loading-xs" />
        ) : uploaded ? (
          <>
            <CheckCircle className="w-4 h-4 text-success" /> Uploaded
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" /> Upload
          </>
        )}
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>
    </div>
  );
}

function ContributorKYC() {
  const [data, setData] = useState<KYCData>(initial);
  const [uploading, setUploading] = useState<string | null>(null);

  const fakeUpload = (field: keyof KYCData) => {
    setUploading(field);
    setTimeout(() => {
      setData((d) => ({ ...d, [field]: true }));
      setUploading(null);
    }, 1200);
  };

  const badge = statusBadge[data.status];
  const BadgeIcon = badge.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC Verification"
        subtitle="Complete your identity verification"
        action={
          <span className={`badge gap-1.5 py-3 px-3 ${badge.cls}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            {badge.label}
          </span>
        }
      />

      {data.status === "rejected" && (
        <div role="alert" className="alert alert-error">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">KYC Verification Rejected</p>
            <p className="text-base opacity-80">
              Please review and update your documents. Ensure all information is
              accurate and documents are clear.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity Documents */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body gap-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-base-content">
                  Identity Documents
                </h3>
                <p className="text-sm text-base-content">
                  Upload your verification documents
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  NIN (National ID Number)
                </legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Enter your 11-digit NIN"
                  maxLength={11}
                  value={data.nin}
                  onChange={(e) => setData({ ...data, nin: e.target.value })}
                />
                <p className="fieldset-label">
                  {data.nin
                    ? `****${data.nin.slice(-4)} — entered`
                    : "Not provided"}
                </p>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  BVN (Bank Verification Number)
                </legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Enter your 11-digit BVN"
                  maxLength={11}
                  value={data.bvn}
                  onChange={(e) => setData({ ...data, bvn: e.target.value })}
                />
                <p className="fieldset-label">
                  {data.bvn
                    ? `****${data.bvn.slice(-4)} — entered`
                    : "Not provided"}
                </p>
              </fieldset>
            </div>
          </div>
        </div>

        {/* Biometric */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body gap-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-success flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-base-content">
                  Biometric Verification
                </h3>
                <p className="text-sm text-base-content">
                  Upload face and selfie images
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <UploadRow
                label="Face Image"
                hint="Clear passport photograph"
                uploaded={data.faceUploaded}
                uploading={uploading === "faceUploaded"}
                onFile={() => fakeUpload("faceUploaded")}
              />
              <UploadRow
                label="Selfie Image"
                hint="Live selfie for liveness check"
                uploaded={data.selfieUploaded}
                uploading={uploading === "selfieUploaded"}
                onFile={() => fakeUpload("selfieUploaded")}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card bg-base-100 border border-base-200 shadow-sm lg:col-span-2">
          <div className="card-body gap-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-warning flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-base-content">
                  Address Verification
                </h3>
                <p className="text-sm text-base-content">
                  Confirm your residential address
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Residential Address</legend>
                <textarea
                  className="textarea w-full h-24"
                  placeholder="Enter your full address"
                  value={data.address}
                  onChange={(e) =>
                    setData({ ...data, address: e.target.value })
                  }
                />
              </fieldset>

              <div className="flex flex-col gap-2">
                <span className="fieldset-legend text-base font-medium">
                  Address Proof Document
                </span>
                <UploadRow
                  label="Utility bill or bank statement"
                  hint="PDF or image, max 5 MB"
                  uploaded={data.addressProofUploaded}
                  uploading={uploading === "addressProofUploaded"}
                  onFile={() => fakeUpload("addressProofUploaded")}
                  accept="image/*,.pdf"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress summary */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body">
          <h3 className="font-semibold text-base-content mb-3">
            Verification Progress
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "NIN", done: !!data.nin },
              { label: "BVN", done: !!data.bvn },
              { label: "Face photo", done: data.faceUploaded },
              { label: "Selfie", done: data.selfieUploaded },
              { label: "Address", done: !!data.address },
              { label: "Address proof", done: data.addressProofUploaded },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 p-3 rounded-xl border text-base ${
                  item.done
                    ? "border-success bg-success/5 text-success"
                    : "border-base-200 text-base-content"
                }`}
              >
                {item.done ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
