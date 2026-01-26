import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    emailjs.send(
      "service_guw7w5b",
      "template_d7d00bo",
      {
        user_name: formData.name,
        user_email: formData.email,
        subject: "Message from BidStream",
        message: formData.message,
      },
      "cDpAN3cTIyHo04PwZ"
    ).then(() => {
      setIsSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 3000);
    }).catch((error) => console.error("EmailJS Error:", error));
  };

  return (
    <div className="w-full bg-slate-950 text-slate-200 pt-16 pb-20 transition-colors duration-300 min-h-screen flex flex-col">
      
      {/* Hero Section */}
      <section className="text-center mb-16 px-6 pt-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-white transition-colors">
          Get in <span className="text-indigo-400">Touch</span> With{" "}
          <span className="text-amber-400">Us</span>
        </h1>
        <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto transition-colors">
          Have questions about an upcoming auction, bidding rules, or just want to connect? We’d love to hear from you.  
          Reach out and our support team will get back to you immediately.
        </p>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-6 lg:px-20 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Left - Contact Info */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 transition-colors">
              Contact Information
            </h2>
            <p className="text-slate-400 mb-6 transition-colors leading-relaxed">
              Feel free to reach us through any of the following channels. We provide 24/7 support for live auction events.
            </p>
            <ul className="space-y-6">
              <li className="text-slate-300 transition-colors flex flex-col gap-1">
                <span className="font-bold text-indigo-400 uppercase text-xs tracking-wider">📍 Headquarters</span>
                <span className="font-medium">Sane Gruji Watchanalya, Kalwa West-400605</span>
              </li>
              <li className="text-slate-300 transition-colors flex flex-col gap-1">
                <span className="font-bold text-indigo-400 uppercase text-xs tracking-wider">📧 Email Support</span>
                <span className="font-medium">imtiyazahamad703@gmail.com</span>
              </li>
              <li className="text-slate-300 transition-colors flex flex-col gap-1">
                <span className="font-bold text-indigo-400 uppercase text-xs tracking-wider">📞 Phone</span>
                <span className="font-medium">+91 70391 65313</span>
              </li>
            </ul>
          </div>

          {/* Right - Contact Form */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 transition-colors">
              Send Us a Message
            </h2>
            {isSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl mb-6">
                Thank you! Your message has been sent successfully.
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5 transition-colors">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5 transition-colors">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5 transition-colors">
                  Message
                </label>
                <textarea
                  required
                  placeholder="Write your message..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md active:scale-[0.98]"
              >
                Send Message
              </button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
};

export default ContactPage;
