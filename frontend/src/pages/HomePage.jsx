import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiMessageCircle, FiCalendar, FiUsers,
  FiHeart, FiMapPin, FiPhone, FiMail, FiStar, FiZap, FiShield
} from 'react-icons/fi';
import { RiFlowChart } from 'react-icons/ri';
import { HiOutlineSpeakerphone } from 'react-icons/hi';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white border-b border-slate-200">
        {/* Background effects */}
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse-soft animate-delay-500" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-20">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
            <FiZap className="text-primary-400" size={14} />
            <span className="text-sm font-medium text-primary-700">Plateforme étudiante ENSIAS</span>
          </div>

          {/* Main Title */}
          <h1 className="animate-fade-in-up animate-delay-100 text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.1] sm:leading-[1.05] mb-6">
            <span className="gradient-text-hero">La vie étudiante,</span>
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              simplifiée.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up animate-delay-200 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Annonces, événements, chat — tout ce dont vous avez besoin pour une vie de campus
            connectée et dynamique.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0">
            <Link
              to="/register"
              id="hero-register-btn"
              className="btn-primary text-lg w-full sm:w-auto !px-8 !py-4 flex items-center justify-center gap-2 group"
            >
              Commencer gratuitement
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              id="hero-login-btn"
              className="btn-secondary text-lg w-full sm:w-auto !px-8 !py-4 flex items-center justify-center"
            >
              Se connecter
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up animate-delay-400 mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-16">
            {[
              { value: '500+', label: 'Étudiants' },
              { value: '1.2k', label: 'Annonces' },
              { value: '20+', label: 'Événements' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-primary-400 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section id="services" className="relative py-16 sm:py-24 lg:py-32 bg-slate-50 border-b border-slate-200">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-50 via-slate-100/40 to-slate-50" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 mb-4">
              <FiStar className="text-accent-400" size={12} />
              <span className="text-xs font-medium text-accent-700">Nos services</span>
            </div>
            <h2 className="section-title">Tout pour votre campus</h2>
            <p className="section-subtitle">
              Des outils pensés par et pour les étudiants, pour connecter, partager et s'entraider.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Service 1 — Annonces */}
            <div className="card group hover:-translate-y-2 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600/20 to-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6 group-hover:shadow-glow-primary transition-shadow duration-500">
                <HiOutlineSpeakerphone className="text-primary-400" size={26} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Publication d'Annonces</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Publiez et parcourez des annonces : vente de livres, recherche de colocataire,
                troc de compétences. Interagissez avec des likes et commentaires.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><FiHeart size={12} className="text-rose-400" /> Likes</span>
                <span className="flex items-center gap-1"><FiMessageCircle size={12} className="text-accent-400" /> Commentaires</span>
              </div>
            </div>

            {/* Service 2 — Événements */}
            <div className="card group hover:-translate-y-2 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-600/20 to-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-6 group-hover:shadow-glow-accent transition-shadow duration-500">
                <FiCalendar className="text-accent-400" size={26} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Événements Étudiants</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Créez et découvrez des événements : conférences, soirées, tournois sportifs,
                révisions en groupe. Inscrivez-vous en un clic pour participer.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><FiCalendar size={12} className="text-accent-400" /> Événements</span>
                <span className="flex items-center gap-1"><FiUsers size={12} className="text-emerald-400" /> Inscription</span>
              </div>
            </div>

            {/* Service 3 — Chat */}
            <div className="card group hover:-translate-y-2 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-shadow duration-500">
                <FiMessageCircle className="text-emerald-400" size={26} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Chat Étudiant</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Discutez en temps réel avec les autres étudiants du campus. Messagerie instantanée
                pour coordonner, s'entraider et socialiser.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><FiMessageCircle size={12} className="text-emerald-400" /> Temps réel</span>
                <span className="flex items-center gap-1"><FiShield size={12} className="text-primary-400" /> Sécurisé</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT / HOW IT WORKS ===== */}
      <section id="about" className="relative py-16 sm:py-24 lg:py-32 bg-white">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
                <RiFlowChart className="text-primary-400" size={12} />
                <span className="text-xs font-medium text-primary-700">À propos</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                Un campus <span className="gradient-text">connecté,</span>
                <br /> une communauté <span className="gradient-text">unie.</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                CampusFlow est né d'un constat simple : les étudiants ont besoin d'un espace dédié
                pour s'entraider, échanger et organiser leur vie quotidienne sur le campus.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8">
                Contrairement aux réseaux sociaux classiques, CampusFlow se concentre sur des
                services utiles et pratiques : petites annonces, événements universitaires et
                communication en temps réel entre étudiants.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: FiShield, label: 'Sécurisé', desc: 'Auth JWT + données protégées' },
                  { icon: FiZap, label: 'Rapide', desc: 'Architecture microservices' },
                  { icon: FiUsers, label: 'Social', desc: 'Pensé pour la communauté' },
                  { icon: FiStar, label: 'Gratuit', desc: 'Open source & libre' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="glass rounded-xl p-4 hover:border-slate-300 transition-all">
                    <Icon className="text-primary-600 mb-2" size={20} />
                    <h4 className="text-slate-900 font-semibold text-sm">{label}</h4>
                    <p className="text-slate-500 text-xs mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right visual — mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-3xl blur-3xl" />
              <div className="relative glass-strong rounded-3xl p-5 sm:p-8 space-y-4">
                {/* Mock annonce card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500" />
                    <span className="text-sm text-slate-900 font-medium">Marouane Elbadaoui</span>
                    <span className="badge text-[10px] !px-2 !py-0.5">Offre</span>
                  </div>
                  <h4 className="text-slate-900 text-sm font-semibold mb-1">Vends livres Java EE — bon état</h4>
                  <p className="text-slate-500 text-xs">3 livres d'occasion sur Spring Boot et JEE...</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><FiHeart size={11} className="text-rose-400" /> 12</span>
                    <span className="flex items-center gap-1"><FiMessageCircle size={11} className="text-accent-400" /> 5</span>
                  </div>
                </div>
                {/* Mock event card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-accent-500" />
                    <span className="text-sm text-slate-900 font-medium">ADEI ENSIAS</span>
                    <span className="badge-accent text-[10px] !px-2 !py-0.5">Événement</span>
                  </div>
                  <h4 className="text-slate-900 text-sm font-semibold mb-1">Afterwork dev — vendredi 18h</h4>
                  <p className="text-slate-500 text-xs">Networking entre devs, pizza offerte 🍕</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><FiUsers size={11} className="text-emerald-400" /> 42 inscrits</span>
                  </div>
                </div>
                {/* Mock chat bubble */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-orange-500" />
                    <span className="text-sm text-slate-900 font-medium">TAGA Oussama</span>
                  </div>
                  <div className="bg-primary-50 rounded-lg px-3 py-2 inline-block border border-primary-100">
                    <p className="text-primary-800 text-xs">Qui est partant pour des révisions en groupe ? 📚</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
