import React, { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

export default function MentorForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");

    setLoading(true);
    try {
      const res = await fetch("/api/mentors/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Reset link sent to your email!");
        setEmail("");
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      toast.error("Network error. Try again later.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-2">
          Mentor Forgot Password
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your mentor email to receive a reset link
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Back to{" "}
          <Link
            to="/mentors/login"
            className="text-purple-600 font-semibold hover:underline"
          >
            Mentor Login
          </Link>
        </p>
      </div>
    </div>
  );
}