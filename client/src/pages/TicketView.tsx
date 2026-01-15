import { useParams, Link } from "wouter";
import { useBookings } from "@/hooks/use-bookings";
import { Navbar } from "@/components/Navbar";
import { Loader2, Calendar, MapPin, Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react"; // Need to add this package if not present, or use simple placeholder

// Placeholder for QR code if package not available in env
const QRCode = ({ value }: { value: string }) => (
  <div className="w-48 h-48 bg-white p-2 flex items-center justify-center mx-auto">
    <QRCodeSVG value={value} size={180} />
  </div>
);

export default function TicketView() {
  const { id } = useParams();
  const { data: bookings, isLoading } = useBookings();
  
  const booking = bookings?.find(b => b.id === Number(id));

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!booking || booking.status !== "approved") return <div className="p-10">Ticket not found or not approved.</div>;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-10 flex flex-col items-center">
        <Link href="/dashboard" className="self-start mb-6">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="bg-white text-black w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Top colored band */}
          <div className="h-4 bg-primary w-full"></div>
          
          <div className="p-8 pb-0">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold font-display">{booking.event.title}</h1>
                <p className="text-sm text-gray-500 mt-1">{booking.event.category}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Date & Time</p>
                  <p className="font-semibold">{format(new Date(booking.event.date), "EEE, MMM d • h:mm a")}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-xl">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Location</p>
                  <p className="font-semibold">{booking.event.location}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative my-8">
            {/* Dashed line */}
            <div className="border-t-2 border-dashed border-gray-200 w-full"></div>
            {/* Semi-circles cutouts */}
            <div className="absolute -left-4 -top-4 w-8 h-8 bg-secondary/30 rounded-full"></div>
            <div className="absolute -right-4 -top-4 w-8 h-8 bg-secondary/30 rounded-full"></div>
          </div>

          <div className="p-8 pt-0 text-center">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100">
                <QRCode value={`booking:${booking.id}`} />
              </div>
            </div>
            
            <div className="bg-gray-100 py-3 px-6 rounded-xl inline-block mb-4 border border-gray-200">
              <p className="text-lg font-mono font-bold text-black">TICKET ID: #{booking.id}</p>
            </div>
            <p className="text-xs text-gray-400">Show this QR code at the entrance for validation</p>
          </div>

          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <Button className="w-full bg-black text-white hover:bg-gray-800 h-12 text-base font-bold" onClick={() => window.print()}>
              <Download className="w-5 h-5 mr-2" /> Download Ticket
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
