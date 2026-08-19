import React from 'react';
import { Rocket, Code, Plug, Layers, BarChart3, ShieldCheck, Mail, MessageCircle } from 'lucide-react';

export const DocsView: React.FC = () => {
  const docCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Quick setup guide, onboarding flow, and basics.',
      icon: <Rocket className="w-6 h-6 text-white" />,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      description: 'REST API endpoints, authentication, and webhooks.',
      icon: <Code className="w-6 h-6 text-white" />,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'integration-guides',
      title: 'Integration Guides',
      description: 'CoreSync, Publishing Engine API, Cloudinary setup instructions.',
      icon: <Plug className="w-6 h-6 text-white" />,
      color: 'from-orange-500 to-amber-600'
    },
    {
      id: 'multi-tenant',
      title: 'Multi-Tenant Architecture',
      description: 'Workspace isolation, API slot management.',
      icon: <Layers className="w-6 h-6 text-white" />,
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      description: 'Dashboard metrics, post analytics, and exports.',
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      description: 'RLS policies, data isolation, Clerk auth.',
      icon: <ShieldCheck className="w-6 h-6 text-white" />,
      color: 'from-slate-700 to-slate-900'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-white to-purple-50/20 font-['Inter'] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-purple-100 border border-purple-200">
            <span className="text-xs font-black tracking-wider text-[#5D3FD3]">DEVELOPER DOCUMENTATION</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            SocialSpree Documentation Hub
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to integrate, customize, and scale your social media automation with SocialSpree.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {docCategories.map((cat) => (
            <div 
              key={cat.id} 
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-600">
                  Coming Soon
                </span>
              </div>

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-6 shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300`}>
                {cat.icon}
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#5D3FD3] transition-colors">
                {cat.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {cat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Support */}
        <div className="max-w-3xl mx-auto bg-slate-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#5D3FD3] blur-3xl opacity-30 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#0066FF] blur-3xl opacity-30 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Need Help Now?</h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Our engineering team is ready to assist you with custom integrations and priority support.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="mailto:leadspree24x7@gmail.com" 
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors py-3 px-6 rounded-xl w-full sm:w-auto font-medium"
              >
                <Mail className="w-5 h-5" />
                leadspree24x7@gmail.com
              </a>
              <a 
                href="https://wa.me/919051822558" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] transition-colors py-3 px-6 rounded-xl w-full sm:w-auto font-medium text-white shadow-lg shadow-[#25D366]/20"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Support
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
