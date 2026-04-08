import { Link } from "react-router-dom";
import logo from "@/assets/joblensai.svg";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 group">
              <img src={logo} alt="JobLens AI" className="w-9 h-9" />
              <span className="font-bold text-xl tracking-tight">JobLens AI</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The modern career companion for jobseekers. Swipe, match, and let AI handle the
              outreach.
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
        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-center items-center gap-8">
          <p className="text-sm text-muted-foreground">
            © 2026 JobLens AI. Built for the modern talent stack.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
