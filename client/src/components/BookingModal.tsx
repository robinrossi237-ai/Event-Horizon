import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, Ticket as TicketIcon, UploadCloud, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useCreateBooking } from "@/hooks/use-bookings";
import type { Event, Ticket } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface BookingModalProps {
  event: Event & { tickets: Ticket[] };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ event, open, onOpenChange }: BookingModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const createBooking = useCreateBooking();
  
  const [ticketQuantities, setTicketQuantities] = useState<Record<number, number>>({});
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);

  const handleQuantityChange = (ticketId: number, qty: number) => {
    setTicketQuantities((prev) => ({
      ...prev,
      [ticketId]: Math.max(0, qty),
    }));
  };

  const totalAmount = event.tickets.reduce((acc, ticket) => {
    const qty = ticketQuantities[ticket.id] || 0;
    return acc + Number(ticket.price) * qty;
  }, 0);

  const hasSelectedTickets = Object.values(ticketQuantities).some((q) => q > 0);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    
    if (!hasSelectedTickets || !paymentProofUrl) return;

    const items = Object.entries(ticketQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ ticketId: Number(id), quantity: qty }));

    try {
      await createBooking.mutateAsync({
        eventId: event.id,
        items,
        paymentProofUrl,
      });
      onOpenChange(false);
      setLocation("/dashboard");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold">Book Tickets</DialogTitle>
          <DialogDescription>
            Reserve your spot for <span className="font-semibold text-primary">{event.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Ticket Selection */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-primary" />
              Select Tickets
            </h4>
            <div className="space-y-3">
              {event.tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                  <div>
                    <p className="font-medium">{ticket.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${Number(ticket.price).toFixed(2)} • {ticket.available} left
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleQuantityChange(ticket.id, (ticketQuantities[ticket.id] || 0) - 1)}
                      disabled={(ticketQuantities[ticket.id] || 0) <= 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-semibold">{ticketQuantities[ticket.id] || 0}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleQuantityChange(ticket.id, (ticketQuantities[ticket.id] || 0) + 1)}
                      disabled={(ticketQuantities[ticket.id] || 0) >= ticket.available}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Proof Upload */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              Payment Proof
            </h4>
            
            {!paymentProofUrl ? (
              <div className="bg-secondary/20 p-6 rounded-xl border border-dashed border-primary/20 text-center">
                 <p className="text-sm text-muted-foreground mb-4">
                   Please upload a screenshot of your payment receipt.
                 </p>
                 <ObjectUploader
                    onGetUploadParameters={async (file) => {
                      const res = await fetch("/api/uploads/request-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: file.name,
                          size: file.size,
                          contentType: file.type,
                        }),
                      });
                      const { uploadURL } = await res.json();
                      return {
                        method: "PUT",
                        url: uploadURL,
                        headers: { "Content-Type": file.type },
                      };
                    }}
                    onComplete={(result) => {
                      if (result.successful && result.successful.length > 0) {
                        setPaymentProofUrl(result.successful[0].uploadURL);
                      }
                    }}
                    buttonClassName="bg-primary hover:bg-primary/90 text-white"
                  >
                    Upload Receipt
                  </ObjectUploader>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Proof uploaded successfully!</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto text-green-700 hover:text-green-800 hover:bg-green-100"
                  onClick={() => setPaymentProofUrl(null)}
                >
                  Change
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!hasSelectedTickets || !paymentProofUrl || createBooking.isPending}
            className="bg-primary hover:bg-primary/90 text-white px-8"
          >
            {createBooking.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
