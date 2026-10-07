import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/EventCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Calendar, Ticket } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { user } = useAuth();
  
  // Debounce search could be added here for optimization
  const { data: events, isLoading, error } = useEvents(search, category !== "all" ? category : undefined);

  // Next six upcoming events based on local machine time
  const upcomingEvents = (events || [])
    .map((e) => ({ ...e, _date: e.date ? new Date(e.date) : null }))
    .filter((e) => e._date instanceof Date && !Number.isNaN(e._date.getTime()) && e._date.getTime() > Date.now())
    .sort((a, b) => a._date!.getTime() - b._date!.getTime())
    .slice(0, 6);

  const categories = ["Music", "Technology", "Sports", "Arts", "Business", "Food", "Workshop", "Networking"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      {/* (Notice removed per request) */}
      
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-primary/5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-cover"
          style={{
            backgroundPosition: "center 40%",
            backgroundImage:
              "linear-gradient(180deg, hsl(var(--background) / 0.82) 0%, hsl(var(--background) / 0.88) 55%, hsl(var(--background) / 0.97) 100%), url('/hero-bg.jpg')",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_35%,black,transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-80 bg-primary/20 blur-3xl"
        />
        <div className="container relative mx-auto flex min-h-[70vh] items-center justify-center px-4 py-14 sm:py-20">
          <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <h1 className="text-balance text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
            Discover <span className="text-primary">Unforgettable</span> Experiences
          </h1>
          <p className="text-balance text-lg text-muted-foreground max-w-2xl mb-10">
            Book tickets for the hottest concerts, workshops, and events happening around you.
            Secure your spot today.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-2xl bg-card p-1.5 sm:p-2 rounded-2xl shadow-lg border border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search events..."
                className="pl-10 border-0 shadow-none focus-visible:ring-0 text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[180px]">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-secondary/30 hover:bg-secondary/50 h-full rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-8 flex w-full justify-center">
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg hover:scale-[1.01]"
            >
              Get Started
            </Link>
          </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h2 className="text-2xl font-display font-bold">Upcoming Events</h2>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{events?.length || 0} events found</span>
            <Link href="/catalogue" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading amazing events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">
            <p>Failed to load events. Please try again later.</p>
          </div>
        ) : events?.length === 0 ? (
          <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">No events found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
              ) : (
                // Fallback: show the most recent events if no upcoming future events
                (events || []).slice(0, 6).map((event) => <EventCard key={event.id} event={event} />)
              )}
            </div>
          </>
        )}

        {/* How to Use Section */}
        <section className="mt-24 pt-16 border-t border-border">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">How to Use TicketMaster</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Follow these simple steps to secure your spot at the most exciting events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Find Your Event</h3>
              <p className="text-muted-foreground">
                Browse our catalogue or use the search bar to find concerts, workshops, or festivals that interest you.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Book & Upload Proof</h3>
              <p className="text-muted-foreground">
                Select your ticket types and upload a screenshot of your payment receipt (Fcfa) to request a reservation.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Get Your Ticket</h3>
              <p className="text-muted-foreground">
                Once an admin verifies your payment, you'll receive a digital ticket with a unique QR code in your dashboard.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
