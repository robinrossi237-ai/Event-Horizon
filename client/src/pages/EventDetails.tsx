import { useParams, Link } from "wouter";
import { useState } from "react";
import { useEvent } from "@/hooks/use-events";
import { Navbar } from "@/components/Navbar";
import { BookingModal } from "@/components/BookingModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Share2, 
  ArrowLeft, 
  Loader2, 
  Ticket, 
  Info,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function EventDetails() {
  const { id } = useParams();
  const { data: event, isLoading, error } = useEvent(Number(id));
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Music: "bg-blue-100 text-blue-700 border-blue-200",
      Technology: "bg-purple-100 text-purple-700 border-purple-200",
      Sports: "bg-green-100 text-green-700 border-green-200",
      Arts: "bg-pink-100 text-pink-700 border-pink-200",
      Business: "bg-slate-100 text-slate-700 border-slate-200",
      Food: "bg-orange-100 text-orange-700 border-orange-200",
      Workshop: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Networking: "bg-cyan-100 text-cyan-700 border-cyan-200",
    };
    return colors[category] || "bg-secondary text-secondary-foreground";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <Link href="/" className="absolute top-6 left-6">
          <Button variant="secondary" className="gap-2 backdrop-blur-md bg-white/50 hover:bg-white/80">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
        </Link>
      </div>

      <main className="container mx-auto px-4 -mt-32 relative z-10 pb-20">
        <div className="bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
          <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-10">
            
            {/* Left Column: Details */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={`px-3 py-1 text-sm font-medium ${getCategoryColor(event.category)}`}>{event.category}</Badge>
                {event.isPromoted && (
                  <Badge className="bg-primary text-primary-foreground">Featured Event</Badge>
                )}
                {isPast && (
                  <div className="ml-3 px-3 py-1 rounded-md bg-red-100 border-2 border-red-600 text-sm text-red-800 font-medium">This event has terminated</div>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                {event.title}
              </h1>

              <div className="flex flex-col gap-4 text-muted-foreground border-y border-border py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Date & Time</p>
                    <p>{format(new Date(event.date), "EEEE, MMMM d, yyyy • h:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Location</p>
                    <p>{event.location}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  About this Event
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Right Column: Tickets */}
            <div className="lg:w-[400px] shrink-0">
              <div className="bg-secondary/20 rounded-2xl p-6 border border-border sticky top-24">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  Select Tickets
                </h3>
                
                <div className="space-y-4 mb-8">
                  {event.tickets.map(ticket => {
                    const total = ticket.quantity || 1;
                    const pct = total > 0 ? ticket.available / total : 0;
                    let cardClass = "bg-background border-border";
                    let availTextClass = "text-muted-foreground";
                    if (pct <= 0.25) {
                      cardClass = "bg-red-50 border-red-200";
                      availTextClass = "text-red-700";
                    } else if (pct <= 0.5) {
                      cardClass = "bg-yellow-50 border-yellow-200";
                      availTextClass = "text-yellow-700";
                    } else {
                      cardClass = "bg-background border-border";
                      availTextClass = "text-muted-foreground";
                    }

                    return (
                      <div key={ticket.id} className={`flex justify-between items-center p-4 rounded-xl border shadow-sm ${cardClass}`}>
                        <div>
                          <p className="font-bold text-foreground">{ticket.name}</p>
                          <p className={`text-xs flex items-center gap-1 mt-1 ${availTextClass}`}>
                            <Clock className="w-3 h-3" />
                            {ticket.available} remaining
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">{Number(ticket.price).toLocaleString()} Fcfa</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isAuthenticated && !user?.isAdmin ? (
                  <Button 
                    className="w-full text-lg py-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" 
                    size="lg"
                    onClick={() => {
                      if (isPast) return;
                      setIsBookingOpen(true);
                    }}
                    disabled={isPast}
                  >
                    {isPast ? "Event Terminated" : "Book Tickets Now"}
                  </Button>
                ) : isAuthenticated && user?.isAdmin ? (
                  <div className="p-6">
                    <Link href={`/create-event?id=${event.id}`}>
                      <Button className="w-full text-lg py-6 font-bold shadow-lg bg-amber-500 hover:bg-amber-600 text-white">
                        Edit Event
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                    <p className="font-medium text-yellow-800 mb-3">You must create an account to reserve tickets.</p>
                    <a href="/auth?mode=signup" className="inline-block bg-primary text-white px-4 py-2 rounded-md">Create an account</a>
                    <p className="text-xs text-muted-foreground mt-3">After signing up, return here to complete your booking.</p>
                  </div>
                )}
                
                <div className="mt-6 flex justify-center">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Event
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BookingModal 
        event={event} 
        open={isBookingOpen} 
        onOpenChange={setIsBookingOpen} 
      />
    </div>
  );
}
