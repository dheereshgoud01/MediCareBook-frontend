import React, { useState } from 'react';
import { authApi } from '../api/client';

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Ophthalmology',
  'ENT (Ear, Nose & Throat)',
  'Psychiatry',
  'Gynecology',
  'Dentistry',
  'General Surgery'
];

function LoginRegister({ onAuthSuccess, onBack }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('user');
  const [specialization, setSpecialization] = useState('General Physician');
  const [alert, setAlert] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    if (isRegister) {
      if (!name.trim()) {
        errs.name = 'Full name is required.';
      } else if (name.trim().length < 2) {
        errs.name = 'Full name must be at least 2 characters long.';
      } else if (name.trim().length > 100) {
        errs.name = 'Full name cannot exceed 100 characters.';
      }
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please provide a valid email address (e.g., name@example.com).';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (isRegister && password.length < 6) {
      errs.password = 'Password must be at least 6 characters long.';
    }

    return errs;
  };

  const handleForm = async (e) => {
    e.preventDefault();
    setAlert('');

    // Pre-flight client-side per-field validation
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      if (isRegister) {
        const payload = { name: name.trim(), email: email.trim(), password, role };
        if (role === 'doctor') {
          payload.specialization = specialization;
        }
        const res = await authApi.register(payload);
        onAuthSuccess(res.data);
      } else {
        const res = await authApi.login({ email: email.trim(), password });
        onAuthSuccess(res.data);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.validationErrors && Object.keys(data.validationErrors).length > 0) {
        setFieldErrors(data.validationErrors);
        setAlert('Please check the highlighted sections below.');
      } else if (data?.message) {
        const lower = data.message.toLowerCase();
        if (lower.includes('email already exists') || lower.includes('user with this email')) {
          setFieldErrors({ email: data.message });
        } else if (lower.includes('invalid email or password') || lower.includes('bad credentials')) {
          setFieldErrors({
            email: 'Check your email address.',
            password: 'Check your password.',
          });
          setAlert('Invalid email or password. Please verify credentials.');
        } else if (lower.includes('password')) {
          setFieldErrors({ password: data.message });
        } else {
          setAlert(data.message);
        }
      } else {
        setAlert('Authentication failed. Please verify your credentials and network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsRegister(false);
    setFieldErrors({});
    setAlert('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          ← Back to Home
        </button>

        <div className="mt-4">
          <h2 className="text-3xl font-bold text-slate-900">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegister
              ? 'Register as a patient or medical practitioner.'
              : 'Login with your credentials or select a demo profile below.'}
          </p>
        </div>

        {/* Demo Fast-Login Helpers */}
        {!isRegister && (
          <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">Quick Viva Demo Logins:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => fillDemoCredentials('john@test.com', 'patient123')}
                className="text-xs bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-xl transition-all shadow-2xs font-medium"
              >
                👤 Patient (John)
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('priya@test.com', 'doctor123')}
                className="text-xs bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-xl transition-all shadow-2xs font-medium"
              >
                🩺 Doctor (Priya)
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin@test.com', 'admin123')}
                className="text-xs bg-white border border-slate-200 hover:border-purple-400 text-slate-700 hover:text-purple-700 px-2.5 py-1 rounded-xl transition-all shadow-2xs font-medium"
              >
                ⚡ Admin
              </button>
            </div>
          </div>
        )}

        {alert && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {alert}
          </div>
        )}

        <form onSubmit={handleForm} noValidate className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-slate-700">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError('name');
                }}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition-colors ${
                  fieldErrors.name
                    ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:bg-white'
                }`}
                placeholder="John Doe"
              />
              {fieldErrors.name && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <span aria-hidden="true">⚠️</span>
                  {fieldErrors.name}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition-colors ${
                fieldErrors.email
                  ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:bg-white'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:bg-white'
              }`}
              placeholder="name@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <span aria-hidden="true">⚠️</span>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                className={`w-full rounded-2xl border py-3 pl-4 pr-16 outline-none transition-colors ${
                  fieldErrors.password
                    ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:bg-white'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <span aria-hidden="true">⚠️</span>
                {fieldErrors.password}
              </p>
            ) : isRegister ? (
              <p className="mt-1.5 text-xs text-slate-400">
                Password must be at least 6 characters long.
              </p>
            ) : null}
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Account type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                >
                  <option value="user">Patient (Book Appointments)</option>
                  <option value="doctor">Medical Doctor (Provide Consultations)</option>
                  <option value="admin">Administrator (Manage Platform & Approvals)</option>
                </select>
              </div>

              {role === 'doctor' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Select Specialization</label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-400">
                    Your doctor profile will be listed with this medical specialty. You can also adjust this later in your profile.
                  </p>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-70 transition-colors"
          >
            {loading ? 'Processing...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setAlert('');
              setFieldErrors({});
            }}
            className="font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {isRegister ? 'Already have an account? Log in' : 'Need an account? Register now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginRegister;
