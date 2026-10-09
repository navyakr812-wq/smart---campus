import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Zap,
  GraduationCap,
  Users,
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, loginDemo, isLoading } = useAuth();
  const { addToast } = useToast();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isRegisterMode) {
        if (!name.trim() || !email.trim() || !password.trim()) {
          addToast('Missing Fields', 'Please complete all required fields.', 'warning');
          return;
        }
        await register({
          name,
          email,
          password,
          studentId: studentId.trim() || undefined,
          department,
        });
      } else {
        if (!email.trim() || !password.trim()) {
          addToast('Missing Fields', 'Please enter your email and password.', 'warning');
          return;
        }
        await login(email, password);
      }
    } catch (err) {
      // Error is toasted in context
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-slate-950">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-xl shadow-teal-500/25 mb-2">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CAMPUS<span className="text-teal-400">NOW</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Real-Time Campus Decision Engine • What to do right now
          </p>
        </div>

        {/* 1-Tap Demo Personas Card */}
        <div className="glass-card rounded-2xl p-4 border border-teal-500/30 bg-teal-950/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 1-Tap Demo Accounts (Hackathon Evaluators)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Password: CampusNow2026!</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => loginDemo('student')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-slate-800 hover:border-teal-500/50 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student 1</span>
              </div>
              <p className="text-[10px] text-slate-300 font-semibold truncate mt-0.5">Alex Rivera</p>
              <p className="text-[9px] text-slate-500">Full Schedule & Now Engine</p>
            </button>

            <button
              type="button"
              onClick={() => loginDemo('student2')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-slate-800 hover:border-teal-500/50 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Student 2</span>
              </div>
              <p className="text-[10px] text-slate-300 font-semibold truncate mt-0.5">Jordan Lee</p>
              <p className="text-[9px] text-slate-500">"Me Too" Demo Participant</p>
            </button>

            <button
              type="button"
              onClick={() => loginDemo('faculty')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-slate-800 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Faculty</span>
              </div>
              <p className="text-[10px] text-slate-300 font-semibold truncate mt-0.5">Dr. Evelyn Reed</p>
              <p className="text-[9px] text-slate-500">Post Notices & Timetables</p>
            </button>

            <button
              type="button"
              onClick={() => loginDemo('admin')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-slate-800 hover:border-rose-500/50 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </div>
              <p className="text-[10px] text-slate-300 font-semibold truncate mt-0.5">Campus Admin</p>
              <p className="text-[9px] text-slate-500">Issue Workflow & Analytics</p>
            </button>
          </div>
        </div>

        {/* Main Authentication Box */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
          
          {/* Tabs: Sign In / Create Account */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                !isRegisterMode
                  ? 'bg-teal-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                isRegisterMode
                  ? 'bg-teal-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Student Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID</label>
                    <input
                      type="text"
                      placeholder="CS-2026-001"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="Computer Science"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="student@campus.test"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {isRegisterMode && (
              <p className="text-[10px] text-slate-400">
                🔒 Public sign-ups automatically create verified STUDENT accounts.
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>{isRegisterMode ? 'Create Student Account' : 'Sign In to CampusNow'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
