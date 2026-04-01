import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Hotel, Mail, Lock, Eye, EyeOff, User, Phone, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Sign Up Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { authServices, settingsServices } = await import('../lib/firebaseServices');

      if (isSignUp) {
        // SIGN UP FLOW
        const userData = { name, email, phone, address };
        const result = await authServices.registerUser(userData, password);

        if (result.success) {
          // Prevent auto-login by signing out immediately
          await authServices.logoutUser();

          setSuccess('Registration successful! You can now register another user.');
          // Stay on Sign Up view and reset fields
          setName('');
          setPhone('');
          setAddress('');
          setEmail('');
          setPassword('');
        } else {
          setError(result.error || 'Registration failed.');
        }
      } else {
        // LOGIN FLOW
        const result = await authServices.loginUser(email, password);

        if (result.success && result.user) {
          // Check User Status
          const profileRes = await settingsServices.getUserProfile(result.user.uid);

          if (profileRes.success && profileRes.data) {
            const status = profileRes.data.status;
            if (status === 'pending') {
              setError('Your account is pending admin approval.');
              // Optionally sign out immediately to prevent "logged in" state in Firebase Auth SDK
              // auth.signOut(); 
            } else if (status === 'rejected') {
              setError('Access denied. Please contact the administrator.');
            } else {
              onLogin();
            }
          } else {
            // If no profile found (e.g. legacy admin), allow access or block. 
            // For now, assuming legacy admin is fine.
            onLogin();
          }
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Hotel className="w-9 h-9 text-white" />
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-['Playfair_Display']">AR Hotels</CardTitle>
              <CardDescription className="mt-2">
                {isSignUp ? 'Create a new account' : 'Sign in to your account'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  {success}
                </div>
              )}

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required={isSignUp}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="phone"
                        placeholder="+1 234 567 8900"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required={isSignUp}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                      <Textarea
                        id="address"
                        placeholder="123 Main St"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="pl-10"
                        required={isSignUp}
                        disabled={loading}
                        rows={2}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@arhotels.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300" disabled={loading} />
                    <span className="text-slate-600">Remember me</span>
                  </label>
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (isSignUp ? 'Registering...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  disabled={loading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

          </CardContent>
        </Card>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-white text-sm"
        >
          © 2025 AR Hotels. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
