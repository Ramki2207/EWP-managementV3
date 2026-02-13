import React, { useState } from 'react';
import { 
  HelpCircle, Mail, Phone, MapPin, Clock, MessageSquare, 
  FileText, Video, Book, ExternalLink, Send, User, 
  Building, Globe, Linkedin, CheckCircle, AlertCircle,
  Download, Search, ChevronRight, Star, Users, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import processLogo from '../assets/process-logo.png';

const Help = () => {
  const [activeSection, setActiveSection] = useState<'contact' | 'faq' | 'guides' | 'support'>('contact');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Vul alle verplichte velden in!');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success('Uw bericht is verzonden! We nemen binnen 24 uur contact met u op.');
      setContactForm({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const faqItems = [
    {
      question: "Hoe kan ik een nieuw project aanmaken?",
      answer: "Ga naar het dashboard en klik op 'Nieuw Project' of navigeer naar de Projecten pagina en klik op 'Project toevoegen'. Volg de stappen in de wizard om uw project in te stellen."
    },
    {
      question: "Hoe upload ik documenten voor een verdeler?",
      answer: "Ga naar de Uploads pagina, selecteer uw project en verdeler, kies de juiste map en sleep uw bestanden naar het upload gebied of klik om bestanden te selecteren."
    },
    {
      question: "Wat betekenen de verschillende project statussen?",
      answer: "Intake = Eerste fase, Offerte = Prijsopgave fase, Order = Bestelling geplaatst, Testen = Kwaliteitscontrole, Levering = Transport fase, Opgeleverd = Project voltooid."
    },
    {
      question: "Hoe kan ik toegangscodes genereren voor verdelers?",
      answer: "Ga naar Gebruikers → Toegangscodes, klik op 'Code aanmaken', selecteer de verdeler en stel de vervaldatum in. De code kan gebruikt worden voor QR-code toegang."
    },
    {
      question: "Kan ik rapporten exporteren?",
      answer: "Ja, ga naar de Inzichten pagina en klik op 'Rapport Genereren' om een PDF rapport te downloaden met alle belangrijke statistieken en grafieken."
    },
    {
      question: "Hoe werk ik samen met andere gebruikers?",
      answer: "Het systeem heeft automatische project vergrendeling. Wanneer iemand een project bewerkt, wordt dit aangegeven en kunnen anderen het niet tegelijkertijd bewerken."
    }
  ];

  const quickLinks = [
    { title: 'Gebruikershandleiding', icon: Book, description: 'Volledige handleiding voor het systeem', action: 'Download PDF' },
    { title: 'Video tutorials', icon: Video, description: 'Stap-voor-stap video uitleg', action: 'Bekijk videos' },
    { title: 'API Documentatie', icon: FileText, description: 'Voor technische integraties', action: 'Bekijk docs' },
    { title: 'Systeem status', icon: CheckCircle, description: 'Controleer systeembeschikbaarheid', action: 'Status pagina' }
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="card p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <HelpCircle size={32} className="text-white" />
            </div>
            <div>
              <h1 className="page-title bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent mb-2">
                Hulp & Ondersteuning
              </h1>
              <p className="text-gray-400 text-lg">
                We helpen u graag verder met het EWP Management Systeem
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <img 
              src={processLogo}
              alt="Process Improvement B.V." 
              className="h-12 object-contain"
            />
            <div className="text-right">
              <p className="text-lg font-semibold text-white">Process Improvement B.V.</p>
              <p className="text-sm text-gray-400">Uw technologie partner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card p-4 mb-6 sm:mb-8">
        <div className="button-group">
          {[
            { id: 'contact', label: 'Contact', icon: Phone },
            { id: 'faq', label: 'Veelgestelde vragen', icon: MessageSquare },
            { id: 'guides', label: 'Handleidingen', icon: Book },
            { id: 'support', label: 'Technische ondersteuning', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all min-h-[44px] ${
                  activeSection === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Sections */}
      {activeSection === 'contact' && (
        <div className="responsive-grid-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="card p-4 sm:p-6">
              <h2 className="section-title mb-6 text-blue-400">Contactgegevens</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Building size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Process Improvement B.V.</h3>
                    <p className="text-gray-400 text-sm">Uw partner in digitale transformatie</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-[#2A303C] rounded-lg hover:bg-[#374151] transition-colors">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Phone size={20} className="text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">+31 85 760 76 27</p>
                      <p className="text-sm text-gray-400">Maandag - Vrijdag, 09:00 - 17:00</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-[#2A303C] rounded-lg hover:bg-[#374151] transition-colors">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Mail size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">support@processimprovement.nl</p>
                      <p className="text-sm text-gray-400">Voor algemene vragen en ondersteuning</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-[#2A303C] rounded-lg hover:bg-[#374151] transition-colors">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <MapPin size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Hoofdkantoor</p>
                      <p className="text-sm text-gray-400">
                        Twentehaven 2<br />
                        3433 PT Nieuwegein<br />
                        Nederland
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-[#2A303C] rounded-lg hover:bg-[#374151] transition-colors">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Clock size={20} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Openingstijden</p>
                      <p className="text-sm text-gray-400">
                        Ma - Vr: 09:00 - 17:00<br />
                        Za - Zo: Gesloten<br />
                        24/7 Noodondersteuning beschikbaar
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-400">Waarom Process Improvement?</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl">
                  <div className="text-2xl font-bold text-green-400 mb-1">15+</div>
                  <div className="text-sm text-gray-400">Jaar ervaring</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl">
                  <div className="text-2xl font-bold text-blue-400 mb-1">500+</div>
                  <div className="text-sm text-gray-400">Tevreden klanten</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl">
                  <div className="text-2xl font-bold text-purple-400 mb-1">24/7</div>
                  <div className="text-sm text-gray-400">Ondersteuning</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl">
                  <div className="text-2xl font-bold text-orange-400 mb-1">99.9%</div>
                  <div className="text-sm text-gray-400">Uptime</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6 text-blue-400">Stuur ons een bericht</h2>
            
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Naam <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="input-field pl-10"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Uw volledige naam"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    E-mail <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      className="input-field pl-10"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="uw.email@bedrijf.nl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Bedrijf</label>
                  <div className="relative">
                    <Building size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="input-field pl-10"
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="Uw bedrijfsnaam"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Prioriteit</label>
                  <select
                    className="input-field"
                    value={contactForm.priority}
                    onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                  >
                    <option value="low">Laag - Algemene vraag</option>
                    <option value="medium">Gemiddeld - Ondersteuning</option>
                    <option value="high">Hoog - Urgent probleem</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Onderwerp</label>
                <input
                  type="text"
                  className="input-field"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="Korte beschrijving van uw vraag"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Bericht <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="input-field h-32"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Beschrijf uw vraag of probleem in detail..."
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn-primary w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Bericht verzenden...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Send size={20} />
                    <span>Bericht verzenden</span>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeSection === 'faq' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageSquare size={20} className="text-green-400" />
              </div>
              <h2 className="text-xl font-semibold">Veelgestelde vragen</h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="bg-[#2A303C] rounded-lg overflow-hidden">
                  <details className="group">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#374151] transition-colors">
                      <span className="font-medium text-white">{item.question}</span>
                      <ChevronRight size={20} className="text-gray-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="p-4 pt-0 border-t border-gray-700">
                      <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'guides' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Book size={20} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold">Handleidingen & Documentatie</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <div key={index} className="group bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 hover:border-gray-400/40 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg group-hover:shadow-gray-500/25 transition-all duration-300">
                        <Icon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-gray-300 transition-colors mb-2">
                          {link.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3">{link.description}</p>
                        <div className="flex items-center space-x-2 text-blue-400 text-sm font-medium">
                          <span>{link.action}</span>
                          <ExternalLink size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Getting Started Guide */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-orange-400">Snel aan de slag</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Maak uw eerste project aan', description: 'Ga naar Dashboard → Nieuw Project en volg de wizard' },
                { step: 2, title: 'Voeg verdelers toe', description: 'Configureer uw verdelers met alle technische specificaties' },
                { step: 3, title: 'Upload documenten', description: 'Organiseer uw documenten per verdeler en map' },
                { step: 4, title: 'Genereer toegangscodes', description: 'Maak QR-codes voor onderhoudsrapporten' },
                { step: 5, title: 'Bekijk inzichten', description: 'Analyseer uw projectdata en genereer rapporten' }
              ].map((step) => (
                <div key={step.step} className="flex items-start space-x-4 p-4 bg-[#2A303C] rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{step.step}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'support' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle size={20} className="text-red-400" />
              </div>
              <h2 className="text-xl font-semibold">Technische ondersteuning</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Emergency Support */}
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <Phone size={20} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-red-400">Noodondersteuning</h3>
                </div>
                <p className="text-gray-300 mb-4">Voor kritieke problemen die directe aandacht vereisen</p>
                <div className="space-y-2">
                  <p className="font-medium text-white">+31 (0)6 52 44 70 27</p>
                  <p className="text-sm text-gray-400">24/7 beschikbaar</p>
                  <p className="text-xs text-red-300">Alleen voor productie-kritieke problemen</p>
                </div>
              </div>

              {/* Regular Support */}
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Mail size={20} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-blue-400">Reguliere ondersteuning</h3>
                </div>
                <p className="text-gray-300 mb-4">Voor algemene vragen en ondersteuning</p>
                <div className="space-y-2">
                  <p className="font-medium text-white">tech@processimprovement.nl</p>
                  <p className="text-sm text-gray-400">Reactie binnen 4 uur</p>
                  <p className="text-xs text-blue-300">Maandag - Vrijdag, 09:00 - 17:00</p>
                </div>
              </div>
            </div>

            {/* Support Categories */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Ondersteuningscategorieën</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    title: 'Technische problemen', 
                    description: 'Bugs, fouten, prestatieproblemen',
                    icon: AlertCircle,
                    color: 'red'
                  },
                  { 
                    title: 'Functionaliteit vragen', 
                    description: 'Hoe gebruik ik bepaalde functies?',
                    icon: HelpCircle,
                    color: 'blue'
                  },
                  { 
                    title: 'Account & toegang', 
                    description: 'Inlogproblemen, gebruikersbeheer',
                    icon: Users,
                    color: 'green'
                  }
                ].map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <div key={index} className={`p-4 bg-gradient-to-br from-${category.color}-500/10 to-${category.color}-600/10 border border-${category.color}-500/20 rounded-lg`}>
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon size={20} className={`text-${category.color}-400`} />
                        <h4 className="font-medium text-white">{category.title}</h4>
                      </div>
                      <p className="text-sm text-gray-400">{category.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System Status */}
            <div className="mt-8 p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-green-400">Alle systemen operationeel</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Clock size={16} />
                  <span>Laatste update: {new Date().toLocaleTimeString('nl-NL')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Information Footer */}
      <div className="card p-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <img 
              src={processLogo}
              alt="Process Improvement B.V." 
              className="h-10 object-contain"
            />
            <div>
              <h3 className="font-semibold text-white">Process Improvement B.V.</h3>
              <p className="text-sm text-gray-400">Innovatie in digitale bedrijfsprocessen</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Globe size={16} className="text-gray-400" />
              <a href="https://processimprovement.nl" className="text-blue-400 hover:text-blue-300 transition-colors">
                processimprovement.nl
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Linkedin size={16} className="text-gray-400" />
              <a href="https://linkedin.com/company/process-improvement-bv" className="text-blue-400 hover:text-blue-300 transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-400">
            © 2025 Process Improvement B.V. Alle rechten voorbehouden. 
            <span className="mx-2">•</span>
            KvK: 87610477
            <span className="mx-2">•</span>
            BTW: NL8643.47.388.B01
          </p>
        </div>
      </div>
    </div>
  );
};

export default Help;