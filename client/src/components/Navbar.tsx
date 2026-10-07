import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LogIn,
  LogOut,
  Plus,
  LayoutDashboard,
  ShieldCheck,
  Ticket,
  Menu,
  Home,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const drawerLinkClass =
  "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight whitespace-nowrap">
            TicketMaster
          </span>
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-center px-4">
          <Link href="/catalogue">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              Catalogue
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              {user?.isAdmin && (
                <Link href="/create-event">
                  <Button variant="default" size="sm" className="hidden md:flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Event
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-full sm:h-9 sm:w-9">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.firstName || "User"} />
                      <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.firstName || ""} {user?.lastName || ""}</p>
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
                    <DropdownMenuItem className="md:hidden cursor-pointer">
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create Event</span>
                    </DropdownMenuItem>
                  </Link>
                  {user?.isAdmin && (
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer text-orange-500 focus:text-orange-600">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/auth?mode=signup">
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
              <a href="/api/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
                <LogIn className="w-4 h-4" /> Sign In
              </a>
            </div>
          )}

          <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 sm:h-11 sm:w-11 md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              <DrawerHeader className="text-left">
                <DrawerTitle>Menu</DrawerTitle>
                <DrawerDescription>
                  {isAuthenticated
                    ? user?.email || "Signed in"
                    : "Sign in to book your tickets."}
                </DrawerDescription>
              </DrawerHeader>

              <nav className="flex flex-col gap-1 px-3 pb-4">
                <Link href="/" className={drawerLinkClass} onClick={closeMenu}>
                  <Home className="h-5 w-5 text-muted-foreground" />
                  Home
                </Link>
                <Link href="/catalogue" className={drawerLinkClass} onClick={closeMenu}>
                  <Search className="h-5 w-5 text-muted-foreground" />
                  Catalogue
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className={drawerLinkClass} onClick={closeMenu}>
                      <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                      My Dashboard
                    </Link>
                    {user?.isAdmin && (
                      <>
                        <Link href="/create-event" className={drawerLinkClass} onClick={closeMenu}>
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          Create Event
                        </Link>
                        <Link href="/admin" className={drawerLinkClass} onClick={closeMenu}>
                          <ShieldCheck className="h-5 w-5 text-orange-500" />
                          Admin Panel
                        </Link>
                      </>
                    )}
                    <div className="my-2 h-px bg-border" />
                    <button
                      type="button"
                      className={`${drawerLinkClass} text-destructive hover:bg-destructive/10 hover:text-destructive`}
                      onClick={() => {
                        closeMenu();
                        logout();
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <Link
                      href="/auth?mode=signup"
                      className="mt-1 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      onClick={closeMenu}
                    >
                      Get Started
                    </Link>
                    <a
                      href="/api/login"
                      className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <LogIn className="h-4 w-4" /> Sign In
                    </a>
                  </>
                )}
              </nav>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </nav>
  );
}
