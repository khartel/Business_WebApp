import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "../services/team.service";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  User,
  Phone,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";

export default function Team() {
  const { businessId } = useParams();
  const { user, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newMemberCredentials, setNewMemberCredentials] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    email: "",
    role: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  // ─────────────────────────────────────────
  // FETCH TEAM
  // ─────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["team", businessId],
    queryFn: () => teamService.getAll(businessId),
  });

  const members = data?.data || [];

  // ─────────────────────────────────────────
  // ADD MEMBER
  // ─────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (data) => teamService.add(businessId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["team", businessId]);
      setShowAdd(false);

      // Show credentials modal
      const defaultPassword = `${form.username}123`;
      setNewMemberCredentials({
        username: form.username,
        password: res.data?.defaultPassword || defaultPassword,
        fullName: form.fullName,
        role: form.role,
      });
      setShowCredentials(true);
      resetForm();
    },
    onError: (error) => {
      setApiError(
        error.response?.data?.message || "Could not add team member"
      );
    },
  });

  // ─────────────────────────────────────────
  // UPDATE ROLE
  // ─────────────────────────────────────────
  const updateRoleMutation = useMutation({
    mutationFn: ({ businessUserId, role }) =>
      teamService.updateRole(businessId, businessUserId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(["team", businessId]);
      setShowEdit(false);
      resetForm();
    },
    onError: (error) => {
      setApiError(
        error.response?.data?.message || "Could not update role"
      );
    },
  });

  // ─────────────────────────────────────────
  // REMOVE MEMBER
  // ─────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (businessUserId) =>
      teamService.remove(businessId, businessUserId),
    onSuccess: () => {
      queryClient.invalidateQueries(["team", businessId]);
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Could not remove member");
    },
  });

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  const resetForm = () => {
    setForm({ fullName: "", username: "", phone: "", email: "", role: "" });
    setErrors({});
    setApiError("");
    setSelectedMember(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.username.trim()) newErrors.username = "Username is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    if (!form.role) newErrors.role = "Role is required";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    addMutation.mutate(form);
  };

  const handleCopyCredentials = () => {
    const text = `Username: ${newMemberCredentials.username}\nPassword: ${newMemberCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = (role) => {
    if (role === "SUPERADMIN")
      return <span className="badge-blue">SuperAdmin</span>;
    if (role === "ADMIN")
      return <span className="badge-yellow">Admin</span>;
    return <span className="badge-green">Employee</span>;
  };

  const roleOptions = [
    { value: "ADMIN", label: "Admin" },
    { value: "EMPLOYEE", label: "Employee" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage your business team members"
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={18} />
            Add Member
          </Button>
        }
      />

      {/* Empty State */}
      {members.length === 0 && (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Add admins and employees to your business"
          action={
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={18} />
              Add Member
            </Button>
          }
        />
      )}

      {/* Team Grid */}
      {members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member.id} className="card p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-600/20 rounded-xl
                                  flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-400 font-bold text-lg">
                      {member.user.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {member.user.fullName}
                    </h3>
                    <p className="text-dark-400 text-sm">
                      @{member.user.username}
                    </p>
                  </div>
                </div>

                {/* Menu — only show for non-owner members */}
                {member.role !== "SUPERADMIN" &&
                  member.user.id !== user.id && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === member.id ? null : member.id
                          )
                        }
                        className="text-dark-400 hover:text-white p-1
                                   transition-colors rounded-lg hover:bg-dark-700"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenu === member.id && (
                        <div className="absolute right-0 top-8 bg-dark-800
                                        border border-dark-600 rounded-xl
                                        shadow-xl z-10 min-w-44 overflow-hidden">
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setForm({
                                ...form,
                                role: member.role,
                              });
                              setShowEdit(true);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2.5
                                       text-sm text-dark-300 hover:text-white
                                       hover:bg-dark-700 transition-colors"
                          >
                            <Edit size={15} />
                            Change Role
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Remove ${member.user.fullName} from this business?`
                                )
                              ) {
                                removeMutation.mutate(member.id);
                              }
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2.5
                                       text-sm text-red-400 hover:text-red-300
                                       hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={15} />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Role Badge */}
              <div className="mb-4">{getRoleBadge(member.role)}</div>

              {/* Contact Info */}
              <div className="space-y-2">
                {member.user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-dark-500" />
                    <span className="text-dark-400 text-sm">
                      {member.user.phone}
                    </span>
                  </div>
                )}
                {member.user.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-dark-500" />
                    <span className="text-dark-400 text-sm truncate">
                      {member.user.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => {
          setShowAdd(false);
          resetForm();
        }}
        title="Add Team Member"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          <Input
            label="Full Name"
            name="fullName"
            placeholder="Enter full name"
            value={form.fullName}
            onChange={(e) => {
              setForm({ ...form, fullName: e.target.value });
              setErrors({ ...errors, fullName: "" });
            }}
            error={errors.fullName}
          />

          <Input
            label="Username"
            name="username"
            placeholder="Enter username"
            value={form.username}
            onChange={(e) => {
              setForm({ ...form, username: e.target.value });
              setErrors({ ...errors, username: "" });
            }}
            error={errors.username}
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="Enter phone number"
            value={form.phone}
            onChange={(e) => {
              setForm({ ...form, phone: e.target.value });
              setErrors({ ...errors, phone: "" });
            }}
            error={errors.phone}
          />

          <Input
            label="Email (Optional)"
            name="email"
            type="email"
            placeholder="Enter email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Select
            label="Role"
            name="role"
            value={form.role}
            onChange={(e) => {
              setForm({ ...form, role: e.target.value });
              setErrors({ ...errors, role: "" });
            }}
            options={roleOptions}
            placeholder="Select role"
            error={errors.role}
          />

          <div className="bg-dark-800 rounded-lg p-3">
            <p className="text-dark-400 text-xs">
              🔑 A default password will be generated as{" "}
              <span className="text-white font-mono">username123</span>.
              Share it with the team member so they can log in.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAdd(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={addMutation.isPending}
            >
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false);
          resetForm();
        }}
        title="Change Role"
      >
        <div className="space-y-4">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          <Select
            label="New Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={roleOptions}
            placeholder="Select role"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowEdit(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={updateRoleMutation.isPending}
              onClick={() => {
                if (selectedMember && form.role) {
                  updateRoleMutation.mutate({
                    businessUserId: selectedMember.id,
                    role: form.role,
                  });
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Credentials Modal */}
      <Modal
        isOpen={showCredentials}
        onClose={() => setShowCredentials(false)}
        title="Team Member Added ✅"
      >
        <div className="space-y-4">
          <p className="text-dark-400 text-sm">
            Share these login credentials with{" "}
            <span className="text-white font-medium">
              {newMemberCredentials?.fullName}
            </span>
          </p>

          <div className="bg-dark-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-dark-400 text-sm">Username</span>
              <span className="text-white font-mono font-medium">
                {newMemberCredentials?.username}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400 text-sm">Password</span>
              <span className="text-white font-mono font-medium">
                {newMemberCredentials?.password}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400 text-sm">Role</span>
              {newMemberCredentials?.role === "ADMIN" ? (
                <span className="badge-yellow">Admin</span>
              ) : (
                <span className="badge-green">Employee</span>
              )}
            </div>
          </div>

          <button
            onClick={handleCopyCredentials}
            className="w-full flex items-center justify-center gap-2
                       bg-dark-700 hover:bg-dark-600 text-white
                       py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Credentials
              </>
            )}
          </button>

          <Button
            className="w-full"
            onClick={() => setShowCredentials(false)}
          >
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}