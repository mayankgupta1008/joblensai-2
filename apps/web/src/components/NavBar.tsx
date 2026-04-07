import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/joblensai.svg";

const NavBar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-border bg-background transition-colors sticky top-0 z-50">
      {/* Left: Brand */}
      <div className="flex items-center gap-4 py-1">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-xs transition-transform group-hover:scale-105">
            <img src={logo} alt="" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden md:block">JobLens AI</span>
        </Link>
      </div>

      {/* Center: Navigation Links (Desktop) */}
      <div className="hidden xl:flex items-center gap-1 text-[13px] font-medium">
        <NavItem label="Design resources" hasDropdown />
        <NavItem label="Websites" hasDropdown />
        <NavItem label="Figma Make" />
        <NavItem label="Extensions" hasDropdown />
        <NavItem label="Whiteboarding" hasDropdown />
        <NavItem label="Presentations" hasDropdown />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Auth & Theme */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-semibold px-4 hidden sm:inline-flex"
            asChild
          >
            <Link to="/login">Log in</Link>
          </Button>
          <Button
            size="sm"
            className="text-xs font-semibold px-5 rounded-md hidden lg:inline-flex"
            asChild
          >
            <Link to="/signup">Sign up</Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ label, hasDropdown }: { label: string; hasDropdown?: boolean }) => (
  <Button
    variant="ghost"
    size="sm"
    className="h-9 px-3 text-[13px] font-medium text-foreground/80 hover:text-foreground hover:bg-transparent flex items-center gap-1 transition-colors"
  >
    {label}
    {hasDropdown && <ChevronDown className="w-3 h-3 opacity-50" />}
  </Button>
);

export default NavBar;
