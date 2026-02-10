import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Quadly',
  description: 'Quadly Privacy Policy - Learn how we collect, use, and protect your information on the Quadly campus community platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Last updated: February 9, 2025
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            1. Introduction
          </h2>
          <p>
            Quadly (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our campus community platform and related services. Please
            read this policy carefully.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            2. Information We Collect
          </h2>
          <p className="mb-3">We collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Account information:</strong> Email address (from your school domain),
              name, profile picture, and graduation year when you register or update your
              profile.
            </li>
            <li>
              <strong>Authentication data:</strong> When you sign in with Google, we receive
              your email, name, and profile picture from Google&apos;s OAuth service.
            </li>
            <li>
              <strong>User-generated content:</strong> Posts, comments, marketplace listings,
              schedule data, and messages you create on the platform.
            </li>
            <li>
              <strong>Usage data:</strong> Information about how you interact with the Service,
              such as pages viewed, features used, and timestamps.
            </li>
            <li>
              <strong>Device information:</strong> Device type, operating system, and app
              version for technical support and analytics.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            3. How We Use Your Information
          </h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Provide, operate, and improve the Service</li>
            <li>Authenticate your identity and verify university eligibility</li>
            <li>Display your profile and content to other users as intended by the Service</li>
            <li>Send you notifications (with your consent) about activity on the platform</li>
            <li>Respond to your feedback and support requests</li>
            <li>Detect, prevent, and address fraud, abuse, or security issues</li>
            <li>Comply with legal obligations and enforce our Terms of Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            4. Information Sharing and Disclosure
          </h2>
          <p>
            We do not sell your personal information. We may share your information in the
            following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>
              <strong>With other users:</strong> Your profile, posts, and marketplace listings
              may be visible to other Quadly users at your university, as designed by the
              Service.
            </li>
            <li>
              <strong>Service providers:</strong> We use third-party services (e.g., hosting,
              authentication, analytics) that may process your data under our instructions.
            </li>
            <li>
              <strong>Legal requirements:</strong> We may disclose information if required by
              law, court order, or to protect our rights and safety.
            </li>
            <li>
              <strong>Business transfers:</strong> In the event of a merger or acquisition,
              your information may be transferred as part of that transaction.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            5. Data Security
          </h2>
          <p>
            We implement appropriate technical and organizational measures to protect your
            personal information against unauthorized access, alteration, disclosure, or
            destruction. This includes encryption in transit (HTTPS/TLS) and secure
            authentication. However, no method of transmission over the Internet is 100% secure,
            and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            6. Data Retention
          </h2>
          <p>
            We retain your information for as long as your account is active or as needed to
            provide the Service. When you delete your account, we will delete or anonymize your
            personal information within a reasonable timeframe, except where we are required to
            retain it for legal, regulatory, or legitimate business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            7. Your Rights and Choices
          </h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Access and receive a copy of your personal data</li>
            <li>Correct or update your profile information</li>
            <li>Delete your account and associated data</li>
            <li>Object to or restrict certain processing</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="mt-3">
            You can update your profile and notification preferences in the app settings. To
            exercise other rights, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            8. Children&apos;s Privacy
          </h2>
          <p>
            The Service is not intended for children under 13. We do not knowingly collect
            personal information from children under 13. If we learn that we have collected
            such information, we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            9. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by posting the updated policy on this page and updating the &quot;Last
            updated&quot; date. Your continued use of the Service after changes constitutes
            acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            10. Contact Us
          </h2>
          <p>
            For questions about this Privacy Policy or our privacy practices, please contact us
            through our feedback form or support channels.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
        >
          ← Back to Quadly
        </Link>
      </div>
    </main>
  );
}
