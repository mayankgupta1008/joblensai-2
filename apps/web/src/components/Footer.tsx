import { Link } from "react-router-dom";
import logo from "@/assets/joblensai.svg";

import { Github, Twitter, Linkedin, Mail, ArrowRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative border-t border-brand-border bg-background/80 backdrop-blur-xl overflow-hidden selection:bg-emerald-500/30">
      {/* Decorative Blob */}
      <div className="absolute bottom-[-50%] left-[50%] -translate-x-1/2 w-full max-w-4xl h-125 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Section */}
          <div className="flex flex-col gap-6 max-w-sm">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full group-hover:bg-emerald-500/40 transition-all" />
                <img
                  src={logo}
                  alt="JobLens AI"
                  className="relative w-10 h-10 group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <span className="font-black text-2xl tracking-tighter">
                JobLens<span className="text-emerald-500">AI</span>
              </span>
            </div>
            <p className="text-muted-foreground text-base font-medium leading-relaxed opacity-80">
              The modern career companion for jobseekers. Swipe, match, and let AI handle the heavy
              lifting of your job search.
            </p>
            <div className="flex items-center gap-4">
              <SocialIcon icon={Twitter} />
              <SocialIcon icon={Linkedin} />
              <SocialIcon icon={Github} />
              <SocialIcon icon={Mail} />
            </div>
          </div>

          {/* Product Section */}
          <div>
            <h4 className="font-black text-foreground mb-8 uppercase tracking-widest text-[11px] opacity-50">
              Product
            </h4>
            <ul className="space-y-4">
              <FooterLink to="#features">Features</FooterLink>
              <FooterLink to="#how-it-works">How it Works</FooterLink>
              <FooterLink to="#pricing">Pricing</FooterLink>
              <FooterLink to="/dashboard">Dashboard</FooterLink>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h4 className="font-black text-foreground mb-8 uppercase tracking-widest text-[11px] opacity-50">
              Company
            </h4>
            <ul className="space-y-4">
              <FooterLink to="#">About Us</FooterLink>
              <FooterLink to="#">Careers</FooterLink>
              <FooterLink to="#">Blog</FooterLink>
              <FooterLink to="#">Contact</FooterLink>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="flex flex-col">
            <h4 className="font-black text-foreground mb-8 uppercase tracking-widest text-[11px] opacity-50">
              Stay Updated
            </h4>
            <div className="p-6 rounded-4xl bg-emerald-500/3 border border-brand-border space-y-4">
              <p className="text-sm font-bold text-emerald-600/80 leading-snug">
                Join 2,000+ jobseekers getting weekly AI career tips.
              </p>
              <div className="relative group/input">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full h-12 px-5 rounded-xl bg-background/50 border border-brand-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-medium text-sm"
                />
                <button className="absolute right-1 top-1 size-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-10 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-sm text-muted-foreground font-medium opacity-60">
              © 2026 JobLens AI. Built for the modern talent stack.
            </p>
            <div className="flex items-center gap-6">
              <FooterLink to="#" className="text-xs opacity-50">
                Privacy
              </FooterLink>
              <FooterLink to="#" className="text-xs opacity-50">
                Terms
              </FooterLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <li>
    <Link
      to={to}
      className={`text-muted-foreground hover:text-emerald-500 font-bold transition-all hover:translate-x-1 inline-block ${className}`}
    >
      {children}
    </Link>
  </li>
);

const SocialIcon = ({ icon: Icon }: { icon: any }) => (
  <a
    href="#"
    className="size-10 rounded-xl bg-emerald-500/3 border border-brand-border flex items-center justify-center text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-all group"
  >
    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
  </a>
);

export default Footer;
