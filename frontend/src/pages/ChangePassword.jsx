import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setApiError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.currentPassword) newErrors.currentPassword = "Current password is required";
    if (!form.newPassword) newErrors.newPassword = "New password is required";
    if (form.newPassword.length < 6) newErrors.newPassword = "Password must be at least 6 characters";
    if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      // Update local user state to reflect password change requirement is met
      if (user) {
        updateUser({ ...user, mustChangePassword: false });
      }

      navigate("/dashboard");
    } catch (error) {
      setApiError(
        error.response?.data?.message || "Could not update password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary-600/20 rounded-2xl flex items-center justify-center mb-4">
            <Lock size={32} className="text-primary-400" />
          </div>
          <h1 className="text-white font-bold text-2xl text-center">Update Password</h1>
          <p className="text-dark-400 text-sm text-center mt-2">
            For security reasons, you must change your default password before continuing.
          </p>
        </div>

        <div className="card p-8">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Current Password"
              name="currentPassword"
              type={showPassword ? "text" : "password"}
              value={form.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              icon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-dark-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <Input
              label="New Password"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              value={form.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
            />

            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            <Button type="submit" className="w-full py-3" loading={loading}>
              <Shield size={18} />
              Update & Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}