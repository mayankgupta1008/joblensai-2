import { ModeToggle } from "./mode-toggle";

const NavBar = () => {
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="font-bold text-xl">JobLens AI</div>
      <div className="flex items-center gap-4">
        <ModeToggle />
      </div>
    </nav>
  );
};

export default NavBar;
