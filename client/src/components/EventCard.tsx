import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, MapPin, Tag } from "lucide-react";
import type { Event, Ticket } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  event: Event & { tickets: Ticket[] };
}

export function EventCard({ event }: EventCardProps) {
  const isPast = new Date(event.date) < new Date();
  // Find lowest price
  const minPrice = Math.min(...event.tickets.map((t) => Number(t.price)));
  const formattedPrice = minPrice === 0 ? "Free" : `${minPrice.toLocaleString()} Fcfa`;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Music: "bg-blue-100/80 text-blue-700",
      Technology: "bg-purple-100/80 text-purple-700",
      Sports: "bg-green-100/80 text-green-700",
      Arts: "bg-pink-100/80 text-pink-700",
      Business: "bg-slate-100/80 text-slate-700",
      Food: "bg-orange-100/80 text-orange-700",
      Workshop: "bg-yellow-100/80 text-yellow-700",
      Networking: "bg-cyan-100/80 text-cyan-700",
    };
    return colors[category] || "bg-white/80 text-foreground";
  };

  return (
    <Link
      href={`/event/${event.id}`}
      className={`group block bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isPast ? "border-2 border-red-600 bg-red-50/30 ring-1 ring-red-200/50" : "border border-border/50"}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className={`backdrop-blur-md font-bold ${getCategoryColor(event.category)}`}>
            {event.category}
          </Badge>
        </div>
        {event.isPromoted && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-white font-bold animate-pulse">
              Promoted
            </Badge>
          </div>
        )}
        {isPast && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-red-600 text-white font-bold">Terminated</Badge>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
          <p className="text-white font-bold text-lg flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            {formattedPrice}
            <span className="text-xs font-normal text-white/80 ml-1">starts at</span>
          </p>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        
        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{format(new Date(event.date), "EEE, MMM d, yyyy • h:mm a")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{event.location}</span>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </p>
      </div>
    </Link>
  );
}
