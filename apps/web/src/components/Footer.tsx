import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/joblensai.svg";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xs shadow-xl shadow-primary/20">
                <img src={logo} alt="JobLens AI" className="w-6 h-6 invert dark:invert-0" />
              </div>
              <span className="font-bold text-xl tracking-tight">JobLens AI</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The modern talent stack for high-signal recruitment. Swipe, match, and get hired.
            </p>
          </div>

          {/* Product Section */}
          <div>
            <h4 className="font-bold text-foreground mb-6 text-lg">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="#features"
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="#how-it-works"
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                >
                  How it Works
                </Link>
              </li>
              <li>
                <Link
                  to="#pricing"
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h4 className="font-bold text-foreground mb-6 text-lg">Company</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h4 className="font-bold text-foreground mb-6 text-lg">Legal</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm text-muted-foreground">
            © 2026 JobLens AI. Built for the modern talent stack.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-sm font-semibold" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button
              size="sm"
              className="font-semibold shadow-md hover:shadow-primary/20 active:scale-95 transition-all"
              asChild
            >
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
