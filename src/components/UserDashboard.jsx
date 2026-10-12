import React, { useEffect, useState } from 'react';
import { doctorApi, appointmentApi } from '../api/client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = [
  '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'
];
const APPOINTMENT_TIMES = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
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

function UserDashboard({ user, onLogout }) {
  const [doctors, setDoctors] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00 AM');
  const [searchText, setSearchText] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [doctorName, setDoctorName] = useState('');
  const [specialization, setSpecialization] = useState('General Physician');
  const [bookingErrors, setBookingErrors] = useState({});
  const [applyErrors, setApplyErrors] = useState({});
  
  // Structured availability selectors for apply form
  const [applyStartDay, setApplyStartDay] = useState('Mon');
  const [applyEndDay, setApplyEndDay] = useState('Fri');
  const [applyStartTime, setApplyStartTime] = useState('9AM');
  const [applyEndTime, setApplyEndTime] = useState('5PM');

  const [fee, setFee] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    try {
      const [doctorResponse, historyResponse] = await Promise.all([
        doctorApi.list(),
        appointmentApi.getByUser(user.id || user._id),
      ]);
      setDoctors(doctorResponse.data);
      setHistory(historyResponse.data);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load dashboard data. Please try again.');
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredDoctors = doctors
    .filter((doctor) => doctor.status === 'approved')
    .filter((doctor) => {
      const matchesSearch = [doctor.name, doctor.specialization]
        .join(' ')
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesFilter = specializationFilter === 'all' || doctor.specialization === specializationFilter;
      return matchesSearch && matchesFilter;
    });

  const handleBooking = async (event) => {
    event.preventDefault();
    const bErrs = {};
    if (!selectedDoctor) bErrs.doctor = 'Please select a doctor to begin booking.';
    if (!appointmentDate) {
      bErrs.date = 'Appointment date is required.';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (appointmentDate < today) {
        bErrs.date = 'Appointment date cannot be in the past.';
      }
    }
    if (!appointmentTime) bErrs.time = 'Appointment time slot is required.';

    if (Object.keys(bErrs).length > 0) {
      setBookingErrors(bErrs);
      return;
    }

    setBookingErrors({});
    setLoading(true);
    setMessage('');

    try {
      await appointmentApi.book({
        userId: user.id || user._id,
        doctorId: selectedDoctor.id || selectedDoctor._id,
        userName: user.name,
        doctorName: selectedDoctor.name,
        date: appointmentDate,
        time: appointmentTime,
      });
      setMessage(`Appointment request sent to ${selectedDoctor.name}.`);
      setAppointmentDate('');
      setAppointmentTime('09:00 AM');
      setSelectedDoctor(null);
      refreshData();
    } catch (error) {
      console.error(error);
      const data = error.response?.data;
      if (data?.validationErrors) {
        setBookingErrors(data.validationErrors);
      }
      const msg = data?.message || 'Booking failed. Please check your connection and try again.';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    setMessage('');

    try {
      await appointmentApi.updateStatus(appointmentId, 'cancelled');
      setMessage('Appointment cancelled successfully.');
      refreshData();
    } catch (error) {
      console.error(error);
      setMessage('Unable to cancel appointment at this time.');
    }
  };

  const handleDoctorApplication = async (event) => {
    event.preventDefault();
    const aErrs = {};
    if (!doctorName.trim() && !user.name) {
      aErrs.name = 'Professional name is required.';
    }
    if (!fee || parseFloat(fee) <= 0) {
      aErrs.fee = 'Consultation fee must be greater than 0.';
    }

    if (Object.keys(aErrs).length > 0) {
      setApplyErrors(aErrs);
      return;
    }

    setApplyErrors({});
    setLoading(true);
    setMessage('');

    try {
      // Format availability from day/time selectors (e.g. "Mon-Fri 9AM-5PM")
      const combinedAvailability = `${applyStartDay}-${applyEndDay} ${applyStartTime}-${applyEndTime}`;
      
      await doctorApi.apply({
        userId: user.id || user._id,
        name: doctorName.trim() || user.name,
        specialization,
        availability: combinedAvailability,
        fees: parseFloat(fee),
      });
      setMessage('Doctor application submitted. Admin will review it soon.');
      setDoctorName('');
      setSpecialization('General Physician');
      setApplyStartDay('Mon');
      setApplyEndDay('Fri');
      setApplyStartTime('9AM');
      setApplyEndTime('5PM');
      setFee('');
      refreshData();
    } catch (error) {
      console.error(error);
      const data = error.response?.data;
      if (data?.validationErrors) {
        setApplyErrors(data.validationErrors);
      }
      setMessage(data?.message || 'Unable to submit doctor application.');
    } finally {
      setLoading(false);
    }
  };

  const upcomingAppointments = history.filter((entry) => entry.status === 'pending' || entry.status === 'approved');
  const specializations = [...new Set(doctors.filter((doctor) => doctor.status === 'approved').map((doctor) => doctor.specialization))];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">Patient dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold">Welcome back, {user.name}</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700">Patient access</span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {message && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm">
            {message}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Appointments</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{history.length}</p>
            <p className="mt-2 text-sm text-slate-500">Total appointments booked or requested.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active requests</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{upcomingAppointments.length}</p>
            <p className="mt-2 text-sm text-slate-500">Pending or approved visits.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Available specialists</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{filteredDoctors.length}</p>
            <p className="mt-2 text-sm text-slate-500">Doctors available for booking.</p>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Find a doctor</h2>
                  <p className="mt-2 text-sm text-slate-500">Search specialists and book the right care provider for your needs.</p>
                </div>
                <button
                  type="button"
                  onClick={refreshData}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Refresh list
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search by name or specialty"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                />
                <select
                  value={specializationFilter}
                  onChange={(event) => setSpecializationFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="all">All specialties</option>
                  {specializations.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Doctor directory</h2>
              <p className="mt-2 text-sm text-slate-500">Tap a card to open booking details.</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {filteredDoctors.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                    No doctors match your search.
                  </div>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <button
                      key={doctor._id}
                      type="button"
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`rounded-3xl border p-5 text-left transition ${selectedDoctor?._id === doctor._id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{doctor.name}</h3>
                          <p className="mt-2 text-sm text-slate-500">{doctor.specialization}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">{doctor.availability}</span>
                      </div>
                      <p className="mt-4 text-sm text-slate-500">Fee: ₹{doctor.fees}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Upcoming appointments</h2>
              <p className="mt-2 text-sm text-slate-500">Manage appointments before your visit.</p>

              <div className="mt-6 space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                    You have no upcoming appointments.
                  </div>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <div key={appointment._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{appointment.doctorName}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(appointment.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })} at {appointment.time} — <span className="capitalize font-semibold text-emerald-600">{appointment.status}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancel(appointment._id)}
                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Book an appointment</h2>
              <p className="mt-2 text-sm text-slate-500">Complete your booking once a doctor is selected.</p>

              {selectedDoctor ? (
                <form onSubmit={handleBooking} className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{selectedDoctor.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedDoctor.specialization}</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedDoctor.availability}</p>
                    <p className="mt-1 text-sm text-slate-600">Fee: ₹{selectedDoctor.fees}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Appointment date</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(event) => {
                        setAppointmentDate(event.target.value);
                        if (bookingErrors.date) setBookingErrors((prev) => ({ ...prev, date: null }));
                      }}
                      className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 outline-none transition-colors ${
                        bookingErrors.date
                          ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                    {bookingErrors.date && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                        <span>⚠️</span>
                        {bookingErrors.date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Appointment time</label>
                    <select
                      value={appointmentTime}
                      onChange={(event) => {
                        setAppointmentTime(event.target.value);
                        if (bookingErrors.time) setBookingErrors((prev) => ({ ...prev, time: null }));
                      }}
                      className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 outline-none transition-colors ${
                        bookingErrors.time
                          ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 text-slate-900 focus:border-emerald-500'
                      }`}
                    >
                      {APPOINTMENT_TIMES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {bookingErrors.time && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                        <span>⚠️</span>
                        {bookingErrors.time}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Confirm booking
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  Select a doctor to begin booking.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Apply as a doctor</h2>
              <p className="mt-2 text-sm text-slate-500">Submit your profile for admin approval.</p>
              <form onSubmit={handleDoctorApplication} noValidate className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Professional name</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(event) => {
                      setDoctorName(event.target.value);
                      if (applyErrors.name) setApplyErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="Dr. Priya Sharma"
                    className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition-colors ${
                      applyErrors.name
                        ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500'
                        : 'border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                  {applyErrors.name && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                      <span>⚠️</span>
                      {applyErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Specialization</label>
                  <select
                    value={specialization}
                    onChange={(event) => setSpecialization(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Availability Days</label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <select
                      value={applyStartDay}
                      onChange={(e) => setApplyStartDay(e.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                      value={applyEndDay}
                      onChange={(e) => setApplyEndDay(e.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Availability Hours</label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <select
                      value={applyStartTime}
                      onChange={(e) => setApplyStartTime(e.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                    >
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={applyEndTime}
                      onChange={(e) => setApplyEndTime(e.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                    >
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Consultation fee (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(event) => {
                      setFee(event.target.value);
                      if (applyErrors.fee) setApplyErrors((prev) => ({ ...prev, fee: null }));
                    }}
                    placeholder="500"
                    className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition-colors ${
                      applyErrors.fee
                        ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500'
                        : 'border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                  {applyErrors.fee && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                      <span>⚠️</span>
                      {applyErrors.fee}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Submit doctor application
                </button>
              </form>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Appointment history</h2>
          <p className="mt-2 text-sm text-slate-500">See completed and cancelled visits in one place.</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-[0.08em] text-xs">
                <tr>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-6 text-center text-slate-500">No appointment history yet.</td>
                  </tr>
                ) : (
                  history.map((appointment) => (
                    <tr key={appointment._id}>
                      <td className="p-3 font-semibold text-slate-900">{appointment.doctorName}</td>
                      <td className="p-3 font-mono">
                        {new Date(appointment.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} at {appointment.time}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${appointment.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : appointment.status === 'completed' ? 'bg-indigo-100 text-indigo-800' : appointment.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;
