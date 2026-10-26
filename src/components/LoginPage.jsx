import React, { useState } from 'react';
import { BookOpen, LogIn } from 'lucide-react';

export const LoginPage = ({ onLogin, setupRequired = false, connectionError = '' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onLogin({ email, password });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-brand-50/70 flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
        <div className="mx-auto mb-4 flex items-center justify-center gap-2 text-brand-800">
          <div className="brand-mark grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <BookOpen className="h-7 w-7" strokeWidth={2.2} />
          </div>
        </div>
        <p className="text-center text-xs font-bold tracking-[0.18em] text-brand-700">TRI THỨC VIỆT</p>
        <h1 className="text-center text-xl font-bold text-slate-900">Đăng nhập quản trị thiết bị</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Hệ thống quản lý tài sản nội bộ</p>

        {connectionError && !error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{connectionError}</p>
        )}

        {setupRequired ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Chưa tạo tài khoản admin. Cấu hình <code>AUTH_ADMIN_EMAIL</code> và <code>AUTH_ADMIN_PASSWORD</code> (tối thiểu 12 ký tự) trong Cloudflare Pages secrets; khi chạy local, đặt chúng trong <code>.dev.vars</code>.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Email admin
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Mật khẩu
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-brand-800 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};
