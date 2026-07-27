import { forwardRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";
import apiClient from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";

interface Props {
  groupId: string;
}

const EMPTY = { firstName: "", lastName: "", email: "" };

const InviteByEmailModal = forwardRef<ModalHandle, Props>(({ groupId }, ref) => {
  const [form, setForm] = useState(EMPTY);

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`groups/${groupId}/email-invitations`, form),
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      setForm(EMPTY);
      (ref as React.RefObject<ModalHandle>).current?.close();
    },
    onError: (err: any) => toast.error(extract_message(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Modal ref={ref} title="Invite by Email">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">First Name</legend>
            <input
              type="text"
              className="input w-full"
              placeholder="Jane"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Last Name</legend>
            <input
              type="text"
              className="input w-full"
              placeholder="Doe"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </fieldset>
        </div>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Email Address</legend>
          <input
            type="email"
            className="input w-full"
            placeholder="contributor@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </fieldset>

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => (ref as React.RefObject<ModalHandle>).current?.close()}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Send Invitation
          </button>
        </div>
      </form>
    </Modal>
  );
});

InviteByEmailModal.displayName = "InviteByEmailModal";

export default InviteByEmailModal;
