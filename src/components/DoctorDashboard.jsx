import React, { useState, useEffect } from 'react';
import { doctorApi, appointmentApi } from '../api/client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = [
  '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'
];
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

export default function DoctorDashboard({ user, onLogout }) {
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [editMode, setEditMode] = useState(false);
  const [fees, setFees] = useState('');
  const [feeError, setFeeError] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('General Physician');
  const [specializationForm, setSpecializationForm] = useState('General Physician');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Availability selector states
  const [startDay, setStartDay] = useState('Mon');
  const [endDay, setEndDay] = useState('Fri');
  const [startTime, setStartTime] = useState('9AM');
  const [endTime, setEndTime] = useState('5PM');

  useEffect(() => {
    refreshDoctorData();
  }, []);

  const refreshDoctorData = async () => {
    setLoading(true);
    try {
      const profileRes = await doctorApi.getProfileByUser(user.id || user._id);
      const myProfile = profileRes.data;
      setDoctorProfile(myProfile);
      setFees(myProfile.fees);
      setFeeError('');
      setEditSpecialization(myProfile.specialization || 'General Physician');

      // Parse loaded availability (e.g. "Mon-Fri 9AM-5PM" or "Mon-Fri, 9AM-5PM")
      if (myProfile.availability) {
        const parts = myProfile.availability.split(/[\s,]+/);
        if (parts.length >= 2) {
          const daysPart = parts[0]; // e.g. "Mon-Fri"
          const hoursPart = parts[1]; // e.g. "9AM-5PM"
          
          const days = daysPart.split('-');
          if (days.length === 2) {
            setStartDay(days[0]);
            setEndDay(days[1]);
          }
          
          const hours = hoursPart.split('-');
          if (hours.length === 2) {
            setStartTime(hours[0]);
            setEndTime(hours[1]);
          }
        }
      }

      const appointmentsRes = await appointmentApi.getByDoctor(myProfile.id || myProfile._id);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setDoctorProfile(null);
        setAppointments([]);
      } else {
        console.error(error);
        setMessage('Unable to load profile data. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!doctorProfile) {
      setMessage('Doctor profile not found.');
      return;
    }

    if (!fees || parseFloat(fees) <= 0) {
      setFeeError('Consultation fee must be greater than 0.');
      return;
    }
    setFeeError('');

    setLoading(true);
    setMessage('');
    try {
      const combinedAvailability = `${startDay}-${endDay} ${startTime}-${endTime}`;

      const updatedDoctor = await doctorApi.updateProfile(
        doctorProfile.id || doctorProfile._id,
        {
          availability: combinedAvailability,
          fees: parseFloat(fees),
          specialization: editSpecialization,
        }
      );

      setDoctorProfile(updatedDoctor.data);
      setEditMode(false);
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 3000);
      refreshDoctorData();
    } catch (error) {
      console.error(error);
      setMessage('Unable to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAsDoctor = async (e) => {
    e.preventDefault();
    if (!specializationForm || !fees) {
      setMessage('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const combinedAvailability = `${startDay}-${endDay} ${startTime}-${endTime}`;

      const res = await doctorApi.apply({
        userId: user.id || user._id,
        name: user.name,
        specialization: specializationForm.trim(),
        availability: combinedAvailability,
        fees: parseFloat(fees),
      });

      setDoctorProfile(res.data);
      setShowApplicationForm(false);
      setMessage('Application submitted successfully. Awaiting admin approval.');
      setTimeout(() => setMessage(''), 3000);
      setSpecializationForm('');
      setStartDay('Mon');
      setEndDay('Fri');
      setStartTime('9AM');
      setEndTime('5PM');
      setFees('');
      refreshDoctorData();
    } catch (error) {
      console.error(error);
      setMessage('Unable to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    setLoading(true);
    setMessage('');
    try {
      await appointmentApi.updateStatus(appointmentId, newStatus);
      setMessage(`Appointment ${newStatus} successfully.`);
      refreshDoctorData();
    } catch (error) {
      console.error(error);
      setMessage('Unable to update appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !doctorProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Statistics
  const stats = {
    pending: appointments.filter((a) => a.status === 'pending').length,
    approved: appointments.filter((a) => a.status === 'approved').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  // Upcoming appointments
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'approved' || a.status === 'pending'
  );

  // Status badge styling
  const statusStyles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Doctor Dashboard</h1>
            <p className="text-slate-600 text-sm">Welcome, Dr. {user.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div
          className={`max-w-6xl mx-auto mt-4 px-6 py-3 rounded-2xl border ${
            message.includes('successfully')
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {message}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm font-medium">Pending Requests</p>
            <p className="text-4xl font-bold text-amber-600 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm font-medium">Approved</p>
            <p className="text-4xl font-bold text-emerald-600 mt-2">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm font-medium">Completed</p>
            <p className="text-4xl font-bold text-indigo-600 mt-2">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm font-medium">Consultation Fee</p>
            <p className="text-4xl font-bold text-slate-700 mt-2">₹{doctorProfile?.fees || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200 mb-6">
          {['appointments', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition ${
                activeTab === tab
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab === 'appointments' ? 'Appointments' : 'Profile'}
            </button>
          ))}
        </div>

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Pending Requests */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Appointment Requests</h2>
              {appointments.filter((a) => a.status === 'pending').length === 0 ? (
                <p className="text-slate-600">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {appointments
                    .filter((a) => a.status === 'pending')
                    .map((appt) => (
                      <div
                        key={appt._id}
                        className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold text-slate-800">{appt.userName}</p>
                            <p className="text-sm text-slate-600">
                              Requested: {new Date(appt.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })} at {appt.time}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appt._id, 'approved')}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appt._id, 'cancelled')}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Upcoming Appointments */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Upcoming Appointments</h2>
              {upcomingAppointments.filter((a) => a.status === 'approved').length === 0 ? (
                <p className="text-slate-600">No upcoming appointments.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments
                    .filter((a) => a.status === 'approved')
                    .map((appt) => (
                      <div
                        key={appt._id}
                        className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold text-slate-800">{appt.userName}</p>
                            <p className="text-sm text-slate-600">
                              {new Date(appt.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })} at {appt.time}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                            Approved
                          </span>
                        </div>
                        <button
                          onClick={() => handleUpdateAppointmentStatus(appt._id, 'completed')}
                          disabled={loading}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          Mark as Completed
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* All Appointments Table */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Appointment History</h2>
              {appointments.length === 0 ? (
                <p className="text-slate-600">No appointments yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Patient</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {appointments.map((appt) => (
                        <tr key={appt._id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">{appt.userName}</td>
                          <td className="px-6 py-4">
                            {new Date(appt.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })} at {appt.time}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                statusStyles[appt.status]
                              }`}
                            >
                              {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            {!doctorProfile ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Create Your Professional Profile</h2>
                <p className="text-slate-600 mb-6">
                  Complete your profile to start receiving patient appointments. Admin approval is required before you appear in the patient directory.
                </p>

                {showApplicationForm ? (
                  <form onSubmit={handleApplyAsDoctor} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Specialization
                      </label>
                      <select
                        value={specializationForm}
                        onChange={(e) => setSpecializationForm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {SPECIALIZATIONS.map((spec) => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Availability Days
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          value={startDay}
                          onChange={(e) => setStartDay(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select
                          value={endDay}
                          onChange={(e) => setEndDay(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Availability Hours
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Consultation Fee (₹)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={fees}
                        onChange={(e) => setFees(e.target.value)}
                        placeholder="Enter consultation fee"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        Submit Application
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowApplicationForm(false)}
                        className="flex-1 px-4 py-2 bg-slate-300 text-slate-800 rounded-lg hover:bg-slate-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowApplicationForm(true)}
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                  >
                    Start Application
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Info */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Professional Profile</h2>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Full Name</p>
                      <p className="text-lg text-slate-800 mt-1">{doctorProfile.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Specialization</p>
                      <p className="text-lg text-slate-800 mt-1">{doctorProfile.specialization}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Status</p>
                      <p className="mt-1">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            doctorProfile.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {doctorProfile.status === 'approved' ? 'Approved' : 'Pending Approval'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {editMode ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Specialization
                        </label>
                        <select
                          value={editSpecialization}
                          onChange={(e) => setEditSpecialization(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {SPECIALIZATIONS.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Availability Days
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <select
                            value={startDay}
                            onChange={(e) => setStartDay(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <select
                            value={endDay}
                            onChange={(e) => setEndDay(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Availability Hours
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Consultation Fee (₹)
                        </label>
                        <input
                          type="number"
                          value={fees}
                          onChange={(e) => {
                            setFees(e.target.value);
                            if (feeError) setFeeError('');
                          }}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none transition-colors ${
                            feeError
                              ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-500'
                              : 'border-slate-300 focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                        {feeError && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                            <span>⚠️</span>
                            {feeError}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="flex-1 px-4 py-2 bg-slate-300 text-slate-800 rounded-lg hover:bg-slate-400 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Availability</p>
                        <p className="text-lg text-slate-800 mt-1">{doctorProfile.availability}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Consultation Fee</p>
                        <p className="text-lg text-slate-800 mt-1">₹{doctorProfile.fees}</p>
                      </div>
                      <button
                        onClick={() => setEditMode(true)}
                        className="w-full mt-6 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
