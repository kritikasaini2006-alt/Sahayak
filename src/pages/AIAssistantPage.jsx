import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  ShieldCheck,
  User,
  Bot,
  ExternalLink,
  Info,
  CornerDownLeft,
  FileText,
} from 'lucide-react';
import Badge from '../components/common/Badge';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      time: 'Just now',
      text: `Namaste! I am your Sahayak AI Civic Assistant. I can help you discover Central and State welfare schemes, understand eligibility rules, and prepare the necessary documents.\n\nHow can I assist you or your family today?`,
      sources: ['National Portal of India (india.gov.in)', 'myScheme Portal (myscheme.gov.in)'],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestionChips = [
    'I am a small farmer in UP with 2 acres. What benefits can I receive?',
    'How do I check if my family is eligible for Ayushman Bharat?',
    'What documents are required to open a Sukanya Samriddhi account?',
    'Are there government loans available to start a small tailoring unit?',
  ];

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputPrompt;
    if (!query.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      time: 'Just now',
      text: query.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsTyping(true);

    // Simulated responsive placeholder reply (AI backend to be integrated in future phases)
    setTimeout(() => {
      let replyText = '';
      let sources = ['india.gov.in'];

      if (query.toLowerCase().includes('farmer') || query.toLowerCase().includes('kisan')) {
        replyText = `Based on publicly available guidelines for landholding farmers:\n\n1. **PM-KISAN**: Eligible landholders can receive ₹6,000 annually in three installments of ₹2,000 directly via DBT. You will need an Aadhaar-seeded bank account and land ownership records (Khatauni).\n2. **Kisan Credit Card (KCC)**: Subsidized crop loan credit at 4% effective interest rate upon prompt repayment.\n\n*Action Step:* Verify your e-KYC status at pmkisan.gov.in or visit your local CSC.`;
        sources = ['pmkisan.gov.in', 'agricoop.gov.in'];
      } else if (query.toLowerCase().includes('ayushman') || query.toLowerCase().includes('health')) {
        replyText = `Under Ayushman Bharat (AB-PMJAY):\n\n• **Benefit:** Cashless health assurance up to ₹5,00,000 per family per year for secondary and tertiary hospitalization.\n• **Coverage:** Automatically covers eligible SECC families and all senior citizens aged 70+.\n• **Verification:** Check your name at beneficiary.nha.gov.in or visit any empanelled public or private hospital with your Aadhaar and Ration Card.`;
        sources = ['pmjay.gov.in', 'nha.gov.in'];
      } else if (query.toLowerCase().includes('sukanya') || query.toLowerCase().includes('girl')) {
        replyText = `For the Sukanya Samriddhi Yojana (SSY):\n\n• **Eligibility:** Girl child who is an Indian resident under 10 years of age.\n• **Current Interest Rate:** 8.2% p.a. (government-notified) with Triple Tax Exemption (EEE) under Section 80C.\n• **Documents Needed:** Girl child's birth certificate, parent/guardian identity proof (Aadhaar/PAN), and address proof.\n• **Where to Apply:** Nearest India Post Office branch or authorized commercial bank.`;
        sources = ['indiapost.gov.in', 'financialservices.gov.in'];
      } else {
        replyText = `Thank you for sharing your query. Based on government scheme catalogs, several central and state welfare initiatives may apply to your requirements.\n\nTo give you the most accurate criteria, check our **Discover Schemes** directory or use the **Eligibility Screener** to filter by state and household income.\n\n*Reminder:* Always submit official application forms through verified government portals or authorized Common Service Centres (CSCs).`;
        sources = ['myscheme.gov.in', 'india.gov.in'];
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        time: 'Just now',
        text: replyText,
        sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="py-6 md:py-8 flex-1 flex flex-col max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-navy-900">
                Sahayak Civic AI Assistant
              </h1>
              <Badge variant="teal">Beta Interface</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Guidance grounded in public government guidelines • No login required
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Independent Advisory Mode</span>
        </div>
      </div>

      {/* Chat Thread Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm mt-4 flex flex-col overflow-hidden min-h-[460px]">
        {/* Messages List */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-navy-800 text-white'
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-navy-800 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none space-y-3'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {msg.sources && (
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Referenced Portals:</span>
                    {msg.sources.map((src, i) => (
                      <span
                        key={i}
                        className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-teal-700"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
              <Bot className="w-4 h-4 text-teal-600 animate-spin" />
              <span>Sahayak AI is researching official scheme rules...</span>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Suggested Prompts:
          </span>
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="shrink-0 text-xs text-navy-800 bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 px-2.5 py-1.5 rounded-lg transition-colors text-left"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask a question about government schemes, eligibility, or documents..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/60"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim()}
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Sahayak AI synthesizes publicly published government scheme parameters. Always verify official notifications on designated government portals.
          </p>
        </div>
      </div>
    </div>
  );
}

