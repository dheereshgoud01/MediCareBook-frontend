import React from 'react';

function LandingPage({ onNavigate, sessionUser }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              M+
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                MediCareBook <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">AI</span>
              </h1>
              <p className="text-xs text-slate-500">Intelligent Healthcare & Doctor Appointment System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {sessionUser ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <span>Dashboard ({sessionUser.name})</span>
                <span className="text-xs">→</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-6 py-12">
        <div className="max-w-4xl w-full space-y-10">
          <section className="rounded-3xl bg-white/95 border border-slate-200 shadow-xl p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-100/60 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none"></div>

            <p className="uppercase text-xs font-bold tracking-[0.25em] text-emerald-700">
              Full Stack Java & Spring Boot Architecture
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
              AI-Powered Doctor Discovery & Seamless Appointments.
            </h2>
            <p className="mt-5 text-slate-600 text-base leading-7">
              MediCareBook AI connects patients with certified medical specialists. Features intelligent AI symptom-to-specialty guidance, real-time doctor availability checks, concurrent slot conflict safety, and role-based security.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              {sessionUser ? (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-colors"
                >
                  Enter Your Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('auth')}
                    className="rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-colors"
                  >
                    Patient Booking
                  </button>
                  <button
                    onClick={() => onNavigate('auth')}
                    className="rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    Medical Practitioner Portal
                  </button>
                </>
              )}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'AI Clinical Navigator',
                desc: 'Describe symptoms to receive grounded specialty recommendations and discover verified doctors in real-time.',
                badge: 'AI Powered',
              },
              {
                title: 'Conflict-Free Scheduling',
                desc: 'Spring Boot transactional booking layer with database-level double-booking prevention for doctor slots.',
                badge: 'MySQL & JPA',
              },
              {
                title: 'Role-Based Security',
                desc: 'Stateless JWT authentication with BCrypt hashing, role guards (Patient, Doctor, Admin), and OpenAPI docs.',
                badge: 'Spring Security 6',
              },
            ].map((item, idx) => (
              <div key={idx} className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {item.badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-3">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-slate-500 text-center">
          MediCareBook AI — Full Stack Java & React Capstone Project
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
