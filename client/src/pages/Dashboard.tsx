import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useBookings } from "@/hooks/use-bookings";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link } from "wouter";
import { 
  Loader2, 
  Ticket, 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useBookings();

  function BookingCard({ booking }: { booking: any }) {
    const [idx, setIdx] = useState(0);
    const items = booking.items || [];
    const hasMultiple = items.length > 1;

    const prev = () => setIdx((i: number) => (i - 1 + items.length) % items.length);
    const next = () => setIdx((i: number) => (i + 1) % items.length);

    return (
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-secondary">
          <img src={booking.event.imageUrl} alt={booking.event.title} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {getStatusBadge(booking.status)}
            <span className="text-xs text-muted-foreground">Booked on {format(new Date(booking.createdAt!), "MMM d, yyyy")}</span>
          </div>
          <h3 className="text-xl font-bold truncate">{booking.event.title}</h3>
          <p className="text-muted-foreground text-sm mt-1">{format(new Date(booking.event.date), "EEEE, MMMM d • h:mm a")}</p>
          <p className="text-muted-foreground text-sm mt-1">{booking.event.location}</p>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto items-stretch md:items-end">
          <div className="flex items-center gap-2">
            {hasMultiple && (
              <>
                <Button size="sm" variant="outline" onClick={prev} className="h-11 px-3 sm:h-8">◀</Button>
                <div className="text-sm px-3 py-2 bg-muted rounded">{items[idx]?.ticket?.name || `Ticket ${idx+1}`} x{items[idx]?.quantity}</div>
                <Button size="sm" variant="outline" onClick={next} className="h-11 px-3 sm:h-8">▶</Button>
              </>
            )}
          </div>

          {booking.status === "approved" ? (
            <Link href={`/ticket/${booking.id}?item=${idx}`}>
              <Button className="w-full md:w-auto bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" /> Download Ticket
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="w-full md:w-auto opacity-50 cursor-not-allowed">Ticket Pending</Button>
          )}

          <Link href={`/event/${booking.event.id}`}>
            <Button variant="ghost" className="w-full md:w-auto">View Event</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If the current user is an admin, redirect them to the admin dashboard
  if (user?.isAdmin) {
    if (typeof window !== "undefined") {
      window.location.href = "/admin";
    }
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h1 className="text-3xl font-display font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}. Here are your upcoming events.</p>
          <Link href="/catalogue" className="block w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Make Booking</Button>
          </Link>
        </div>

        {bookings?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border shadow-sm">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-6">Explore events and book your first ticket!</p>
            <Link href="/">
              <Button>Browse Events</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Your Bookings
            </h2>
            
            <div className="grid gap-6">
              {bookings?.map((booking) => (
                <BookingCard booking={booking} key={booking.id} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
