import { Link } from "wouter";
import { Ticket } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto flex flex-col items-center gap-5 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Ticket className="w-4 h-4" />
          </div>
          <span className="font-display font-bold tracking-tight">TicketMaster</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/catalogue" className="transition-colors hover:text-primary">
            Catalogue
          </Link>
          <Link href="/auth?mode=signup" className="transition-colors hover:text-primary">
            Sign Up
          </Link>
          <a href="/api/login" className="transition-colors hover:text-primary">
            Sign In
          </a>
        </nav>

        <p className="text-sm text-muted-foreground">© 2024 TicketMaster. All rights reserved.</p>
      </div>
    </footer>
  );
}
