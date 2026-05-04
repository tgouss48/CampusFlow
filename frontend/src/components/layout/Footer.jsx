import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="main-footer" className="relative mt-auto border-t border-slate-200 bg-slate-100">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 lg:items-stretch">
          {/* Brand */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:max-lg:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-1.5 group mb-4 w-fit">
              <Logo size="md" className="group-hover:scale-105 transition-transform duration-300" />
              <span className="text-xl font-bold gradient-text-hero leading-none">CampusFlow</span>
            </Link>
            <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
              Le réseau social d'entraide pour la vie étudiante. Annonces, événements et chat entre étudiants.
            </p>
          </div>

          {/* Services */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-slate-900 font-semibold mb-4 text-sm uppercase tracking-wider">
              Services
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2 min-h-[1.25rem]">
                <span className="text-base leading-none" aria-hidden>📢</span>
                <span>Publication d'annonces</span>
              </li>
              <li className="flex items-center gap-2 min-h-[1.25rem]">
                <span className="text-base leading-none" aria-hidden>🎉</span>
                <span>Événements étudiants</span>
              </li>
              <li className="flex items-center gap-2 min-h-[1.25rem]">
                <span className="text-base leading-none" aria-hidden>💬</span>
                <span>Chat entre étudiants</span>
              </li>
              <li className="flex items-center gap-2 min-h-[1.25rem]">
                <span className="text-base leading-none" aria-hidden>❤️</span>
                <span>Likes & commentaires</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-slate-900 font-semibold mb-4 text-sm uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-slate-600">
                <FiMapPin className="mt-0.5 text-primary-600 shrink-0" size={16} aria-hidden />
                <span className="leading-snug">Avenue Mohammed Ben Abdallah Regragui, Madinat Al Irfane, Rabat</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 min-h-[1.25rem]">
                <FiPhone className="text-primary-600 shrink-0" size={16} aria-hidden />
                <span>+212 5 37 77 85 79</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 min-h-[1.25rem]">
                <FiMail className="text-primary-600 shrink-0" size={16} aria-hidden />
                <a href="mailto:contact@ensias.ma" className="hover:text-primary-700 transition-colors">
                  contact@ensias.ma
                </a>
              </li>
            </ul>
          </div>

          {/* Google Maps */}
          <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:max-lg:col-span-2 lg:col-span-1">
            <h3 className="text-slate-900 font-semibold mb-4 text-sm uppercase tracking-wider">
              Localisation
            </h3>
            <div className="rounded-lg overflow-hidden border border-slate-200 flex-1 min-h-[200px]">
              <iframe
                id="ensias-map"
                title="ENSIAS Localisation"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3308.3200643833!2d-6.8676018999999995!3d33.98431179999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda76ce7f9462dd1%3A0x2e9c39cfa1d9e8d7!2s%C3%89cole%20Nationale%20Sup%C3%A9rieure%20d&#39;Informatique%20et%20d&#39;Analyse%20des%20Syst%C3%A8mes!5e0!3m2!1sfr!2sma!4v1776384957993!5m2!1sfr!2sma"
                width="100%"
                height="200"
                className="block w-full h-[200px]"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-8 border-t border-slate-200">
          <p className="text-slate-500 text-sm text-center sm:text-left">
            © {currentYear} CampusFlow — ENSIAS. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
