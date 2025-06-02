const TermsAndConditions = () => {
  return (
    <section className="bg-white  p-8 rounded-2xl shadow-3d max-w-4xl mx-auto my-12 text-gray-800">
      <h1 className="text-3xl  my-6 font-bold text-center">
        📜 Terms & Conditions Of Admeasy</h1>

      {/* Section 1 */}
      <div className="mb-6">
        <h2 className="text-2xl font-admeasy-extrabold mb-3">1. Use of Services</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide accurate and current information.</li>
          <li>Use the platform only for educational and career guidance purposes.</li>
          <li>Do not engage in any illegal, abusive, or harmful behavior on the site.</li>
        </ul>
      </div>

      {/* Section 2 */}
      <div className="mb-6">
        <h2 className="text-2xl font-admeasy-extrabold mb-3">2. Account Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>Notify us immediately of any unauthorized use.</li>
        </ul>
      </div>

      {/* Section 3 */}
      <div className="mb-6">
        <h2 className="text-2xl font-admeasy-extrabold mb-3">3. Subscriptions & Payments</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Our services may include paid subscription plans.</li>
          <li>All payments are handled securely.</li>
          <li>No refunds unless clearly stated in the subscription plan.</li>
        </ul>
      </div>

      {/* Section 4 */}
      <div className="mb-6">
        <h2 className="text-2xl font-admeasy-extrabold mb-3">4. Intellectual Property</h2>
        <p>
          All content on Admeasy, including design, text, graphics, and software, is the property of <strong>Campii Admission Solutions LLP</strong>. Unauthorized copying, reproduction, or distribution is prohibited.
        </p>
      </div>

      {/* Section 5 */}
      <div className="mb-6">
        <h2 className="text-2xl font-admeasy-extrabold mb-3">5. Disclaimer</h2>
        <p>
          We strive for accuracy but do not guarantee the availability, accuracy, or suitability of colleges listed. Final admission decisions rest with the institutions.
        </p>
      </div>

      {/* Section 6 */}
      <div className="mb-6">
        <h2 className="text-2xl font-admeasy-extrabold mb-3">6. Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate these terms or misuse the platform.
        </p>
      </div>

      {/* Contact Section */}
      <div className="mt-10 border-t pt-6">
        <h2 className="text-2xl font-admeasy-extrabold mb-3 flex items-center gap-2">📬 Contact Us</h2>
        <p className="mb-1">If you have any questions about this document, please contact:</p>
        <p className="mb-1">📬 Contact us with any concerns at: <strong>support@admeasy.in</strong></p>
        <p>🏢 <strong>Campii Admission Solutions LLP</strong></p>
      </div>
    </section>
  );
};

export default TermsAndConditions;
