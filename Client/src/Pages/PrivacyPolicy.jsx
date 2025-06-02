import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="w-full p-7 text-[20px] font-admeasy text-gray-800 max-w-5xl mx-auto">
         <section className="bg-white  p-8 rounded-2xl shadow-3d max-w-4xl mx-auto my-12 text-gray-800">
      <h2 className="text-center text-3xl font-admeasy-extrabold my-6">
        Privacy & Policy Of Admeasy✌️
      </h2>

      <p className="font-bold mb-4">Effective Date: <span className="text-gray-700">1 June 2025</span></p>

      <p className="mb-6">
        🤗 Welcome to <strong>Admeasy</strong>, a product of <span className="text-[#82a9e0] font-bold">Campii Admission Solutions LLP</span>.
        Your trust is important to us. This document outlines our Privacy Policy and Terms & Conditions,
        which govern your use of our website and services. By accessing or using our platform, you agree to these terms.
      </p>

      {/* 1. Company Overview */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold mb-2">📌 1. Company Overview</h3>
        <p>
          Admeasy is a student-driven educational startup based in Indore, India, operating under the motto
          <strong> "Made for Students, By Students"</strong>. We focus on enhancing the academic experience by providing
          tailored solutions and resources for students. With a small, dedicated team, we aim to bridge gaps in the
          higher education sector through innovation and student-centric services.
        </p>
      </section>

      {/* 2. Privacy Policy */}
      <section className="mb-8">
        <h3 className="text-2xl font-admeasy-extrabold mb-3">🔒 2. Privacy Policy</h3>

        <p className="font-semibold mb-1 ml-3">1. Information We Collect</p>
        <p className="mb-3 ml-3">We collect the following personal data during registration, subscription, or usage:</p>
        <ul className="list-disc pl-10 space-y-2">
          <li>👤 Full Name</li>
          <li>📧 Email Address</li>
          <li>📱 Mobile Number</li>
          <li>📍 Location (City/State)</li>
          <li>💳 Payment Details (for subscriptions)</li>
          <li>🖥️ Technical data (IP address, browser type) for analytics and security purposes</li>
        </ul>
      </section>

      {/* 3. How We Use Your Data */}
      <section className="mb-8">
        <h3 className="text-2xl font-admeasy-extrabold mb-3">📊 3. How We Use Your Data</h3>
        <p className="font-bold mb-2 ml-3">Your information is used strictly for:</p>
        <ul className="list-disc pl-10 space-y-2">
          <li>🆔 Account creation and user verification</li>
          <li>🎯 Providing personalized recommendations</li>
          <li>💳 Payment processing for subscriptions</li>
          <li>📞 Customer support and communication</li>
          <li>🚫 <strong>We do not sell, rent, or share your data</strong> with third parties.</li>
        </ul>
      </section>

      {/* 4. Data Security */}
      <section className="mb-8">
        <h3 className="text-2xl font-admeasy-extrabold mb-3">🔐 4. Data Security</h3>
        <p>
          We use encryption, secure servers, and regular audits to protect your data. However, no online platform can
          guarantee 100% security.
        </p>
      </section>

      {/* 5. Cookies */}
      <section className="mb-8">
        <h3 className="text-2xl font-admeasy-extrabold mb-3">🍪 5. Cookies & Tracking</h3>
        <p>
          Currently, we do not use cookies for tracking or advertising purposes. If this changes, we will update this
          policy and seek user consent.
        </p>
      </section>

      {/* 6. Children & Minors */}
      <section className="mb-8">
        <h3 className="text-2xl font-admeasy-extrabold mb-3">👶 6. Children & Minors</h3>
        <p>
          Minors (under 18) are allowed to use our platform with parental or guardian consent. We do not knowingly
          collect data from children without consent.
        </p>
      </section>

      {/* 7. Your Rights */}
      <section className="mb-8">
        <h3 className="text-2xl font-admeasy-extrabold mb-3">🛡️ 7. Your Rights</h3>
        <ul className="list-disc pl-10 space-y-2">
          <li>
            <strong>Access, update, or delete your data</strong> – You can request to view, modify, or remove the
            personal data we hold about you.
          </li>
          <li>
            <strong>Withdraw consent</strong> – You may revoke your consent to our data processing practices at any time.
          </li>
        </ul>
      </section>

      {/* Contact */}
      <div className="w-full text-center my-10">
        <p>
          📬 Contact us with any concerns at: <strong>support@admeasy.in</strong>
        </p>
        <p>🏢 Campii Admission Solutions LLP</p>
      </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
