import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LogIn, 
  LogOut, 
  Plus, 
  LayoutDashboard, 
  ShieldCheck,
  Ticket
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">TicketMaster</span>
        </Link>

        <div className="flex-1 flex items-center justify-center px-4">
          <Link href="/catalogue">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              Catalogue
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/create-event">
                <Button variant="default" size="sm" className="hidden sm:flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                      <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>My Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/create-event">
                    <DropdownMenuItem className="sm:hidden cursor-pointer">
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create Event</span>
                    </DropdownMenuItem>
                  </Link>
                  {/* Admin link could be guarded by role if roles existed */}
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer text-orange-500 focus:text-orange-600">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
              <a href="/api/login">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </a>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
