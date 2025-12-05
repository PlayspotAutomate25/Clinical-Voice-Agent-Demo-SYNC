import React, { useState } from 'react';
import { AgentType } from './types';
import VoiceDemo from './components/VoiceDemo';
import { Phone, Calendar, ShieldCheck, Play, ArrowRight } from 'lucide-react';

function App() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(AgentType.FRONT_DESK);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://mature-cyan-tapir.myfilebase.com/ipfs/QmZJCp9StiThjXMSmL5iaPUhVYj5tNZEdAFn8ieLCByn66" alt="PlaySpotSync" className="h-10 w-auto object-contain" />
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#demo" className="hover:text-rose-500 transition-colors">Live Demo</a>
            <a href="https://playspotsync.com/services" className="hover:text-rose-500 transition-colors">Solutions</a>
            <a href="https://playspotsync.com/about" className="hover:text-rose-500 transition-colors">About</a>
          </nav>
          <a href="https://links.playspotsync.com/widget/booking/ko0gd05AtmMGuzItWhfF" className="bg-rose-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-rose-600 transition-colors shadow-md hover:shadow-lg">
            Get Started
          </a>
        </div>
      </header>

      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-50 to-white pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Medical Voice AI that <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">never misses a patient call.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Empower your practice with 24/7 intelligent voice assistants. From scheduling routine appointments to triaging urgent concerns, PlaySpotSync ensures every patient is heard instantly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#demo" className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-500/30 flex items-center justify-center gap-2">
                Try the Demo <ArrowRight className="w-5 h-5" />
              </a>
              <a href="https://playspotsync.com/" className="bg-white text-slate-700 border border-slate-300 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-colors hover:text-rose-500 hover:border-rose-200 flex items-center justify-center">
                View Pricing
              </a>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-base font-semibold text-rose-500 uppercase tracking-wide">Interactive Showcase</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">Experience Our Agents</p>
              <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
                Select a persona below to interact with our Gemini-powered voice assistants. 
                They are trained on ClearPath Medical Clinic's protocols.
              </p>
            </div>

            {/* Agent Selection Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-100 p-1 rounded-full inline-flex">
                <button
                  onClick={() => setSelectedAgent(AgentType.FRONT_DESK)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedAgent === AgentType.FRONT_DESK
                      ? 'bg-white text-rose-500 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Front Desk Assistant
                </button>
                <button
                  onClick={() => setSelectedAgent(AgentType.TRIAGE)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedAgent === AgentType.TRIAGE
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Urgent Triage Nurse
                </button>
              </div>
            </div>

            {/* Demo Component */}
            <div className="max-w-5xl mx-auto">
              <VoiceDemo selectedAgent={selectedAgent} />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Why Modern Clinics Choose PlaySpotSync</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 group hover:border-rose-100 transition-colors">
                <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-rose-100 transition-colors">
                  <Phone className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Zero Missed Calls</h3>
                <p className="text-slate-600 leading-relaxed">
                  Capture 100% of patient inquiries even during lunch breaks, busy Monday mornings, or after hours. Never let a patient go to voicemail again.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 group hover:border-rose-100 transition-colors">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-slate-200 transition-colors">
                  <Calendar className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Automated Scheduling</h3>
                <p className="text-slate-600 leading-relaxed">
                  Integrates directly with your EHR. Patients can book, reschedule, or cancel appointments naturally without staff intervention.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 group hover:border-rose-100 transition-colors">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Safe Triage Protocols</h3>
                <p className="text-slate-600 leading-relaxed">
                  Advanced AI detects urgency keywords. Routine requests are handled automatically, while urgent cases are escalated to your on-call staff immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust/Footer Section */}
        <section className="bg-slate-900 py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-4">
                 <img src="https://mature-cyan-tapir.myfilebase.com/ipfs/QmZJCp9StiThjXMSmL5iaPUhVYj5tNZEdAFn8ieLCByn66" alt="PlaySpotSync" className="h-8 w-auto object-contain" />
              </div>
              <p className="text-slate-400 max-w-sm">
                Revolutionizing healthcare communication with empathy-driven AI. Built for compliance, security, and patient satisfaction.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Solutions</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">Private Practice</a></li>
                <li><a href="#" className="hover:text-white">Dental Clinics</a></li>
                <li><a href="#" className="hover:text-white">Urgent Care</a></li>
                <li><a href="#" className="hover:text-white">EHR Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Security & HIPAA</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            © 2024 PlaySpotSync. All rights reserved.
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;