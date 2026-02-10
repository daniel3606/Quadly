import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Quadly',
  description: 'Quadly Terms of Service - Read our terms and conditions for using the Quadly campus community platform.',
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Last updated: February 9, 2025
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Quadly (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use
            the Service. Quadly reserves the right to modify these Terms at any time. Your
            continued use of the Service after any changes constitutes acceptance of the revised
            Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            2. Description of Service
          </h2>
          <p>
            Quadly is a campus community platform that provides university students with tools for
            class scheduling, community discussion boards, marketplace listings, and related
            campus-life features. The Service is designed for verified university students and
            requires a valid school-issued email address for access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            3. Eligibility and Account Registration
          </h2>
          <p>
            You must be at least 13 years of age to use the Service. If you are under 18, you
            represent that you have your parent or guardian&apos;s permission to use the Service. You
            must register using a valid email address from a supported university domain. You are
            responsible for maintaining the confidentiality of your account credentials and for
            all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            4. User Conduct
          </h2>
          <p className="mb-3">
            You agree to use the Service only for lawful purposes and in accordance with these
            Terms. You agree not to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Post content that is defamatory, harassing, hateful, or discriminatory</li>
            <li>Impersonate any person or entity or misrepresent your affiliation</li>
            <li>Violate any applicable laws or university policies</li>
            <li>Upload malware, spam, or engage in unauthorized data collection</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Use the Service for commercial purposes without authorization</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            5. Content Ownership and Licensing
          </h2>
          <p>
            You retain ownership of content you post to the Service. By posting content, you
            grant Quadly a non-exclusive, royalty-free, worldwide license to use, store, display,
            and distribute your content in connection with operating and providing the Service.
            You represent that you have the right to post your content and that it does not
            infringe any third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            6. Marketplace and Third-Party Transactions
          </h2>
          <p>
            Quadly provides a platform for users to list and browse marketplace items. Quadly is
            not a party to any transactions between users. You are solely responsible for your
            marketplace interactions. We do not guarantee the quality, safety, or legality of
            listed items or the accuracy of user-provided information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            7. Disclaimer of Warranties
          </h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY
            KIND, EITHER EXPRESS OR IMPLIED. QUADLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT
            LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
            AND NON-INFRINGEMENT.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            8. Limitation of Liability
          </h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, QUADLY SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
            DATA, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY
            SHALL NOT EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100) OR THE AMOUNT YOU PAID
            US, IF ANY, IN THE TWELVE MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            9. Termination
          </h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without
            cause or notice. You may terminate your account at any time by discontinuing use.
            Upon termination, your right to use the Service ceases immediately. Provisions that
            by their nature should survive termination shall survive.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            10. Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            State of Michigan, without regard to its conflict of law provisions. Any disputes
            arising under these Terms shall be resolved in the state or federal courts located
            in Michigan.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            11. Contact
          </h2>
          <p>
            For questions about these Terms of Service, please contact us through our feedback
            form or at our support email.
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
