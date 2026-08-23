import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, Ticket as TicketIcon, UploadCloud, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// Using native multipart upload for payment proof
import { useCreateBooking } from "@/hooks/use-bookings";
import { usePaymentSettings } from "@/hooks/use-payment-settings";
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
  const { data: paymentSettings } = usePaymentSettings(open);
  
  const [ticketQuantities, setTicketQuantities] = useState<Record<number, number>>({});
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const mobileMoneyNumber = paymentSettings?.mobileMoneyNumber || "+237 677420606";
  const orangeMoneyNumber = paymentSettings?.orangeMoneyNumber || "659106128";

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
                      {Number(ticket.price).toLocaleString()} Fcfa • {ticket.available} left
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
            <div className="mt-2 text-sm text-muted-foreground">
              {/* Show adjusted remaining counts as user selects quantities */}
              {event.tickets.map((ticket) => {
                const selected = ticketQuantities[ticket.id] || 0;
                const remaining = Math.max(0, ticket.available - selected);
                return (
                  <div key={ticket.id} className="flex justify-between items-center">
                    <div>{ticket.name}</div>
                    <div className={remaining <= 0 ? 'text-destructive' : remaining <= Math.ceil((ticket.quantity || 1) * 0.25) ? 'text-red-600' : remaining <= Math.ceil((ticket.quantity || 1) * 0.5) ? 'text-yellow-600' : 'text-muted-foreground'}>
                      {remaining} left
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-primary">{totalAmount.toLocaleString()} Fcfa</span>
            </div>
          </div>

          {/* Payment Proof Upload */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              Payment Proof
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                <div className="flex items-center gap-3">
                  <img src="/mobile-money-logo.jpeg" alt="Mobile Money" className="h-10 w-10 rounded-md object-cover border border-yellow-200 bg-white" />
                  <p className="font-semibold text-yellow-900">Mobile Money</p>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-yellow-800/80">Transfer To</p>
                <p className="mt-1 text-lg font-bold text-blue-700">{mobileMoneyNumber}</p>
              </div>

              <div className="rounded-xl border border-orange-300 bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <img src="/orange-money-logo.jpeg" alt="Orange Money" className="h-10 w-10 rounded-md object-cover border border-orange-200 bg-white" />
                  <p className="font-semibold text-orange-900">Orange Money</p>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-orange-800/80">Transfer To</p>
                <p className="mt-1 text-lg font-bold text-orange-700">{orangeMoneyNumber}</p>
              </div>
            </div>
            
            {!paymentProofUrl ? (
              <div className="bg-secondary/20 p-6 rounded-xl border border-dashed border-primary/20 text-center">
                 <p className="text-sm text-muted-foreground mb-4">
                   Please upload a screenshot of your payment receipt.
                 </p>
                 <div className="flex flex-col items-center gap-3">
                   <input
                     id="payment-proof"
                     type="file"
                     accept="image/*"
                     onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (!file) return;
                       try {
                         const fd = new FormData();
                         fd.append("file", file);
                         const resp = await fetch("/api/uploads", {
                           method: "POST",
                           body: fd,
                           credentials: "include",
                         });
                         if (!resp.ok) {
                           const body = await resp.json().catch(() => ({}));
                           console.error("Upload failed:", body);
                           return;
                         }
                         const { objectPath, url } = await resp.json();
                         // prefer absolute url if provided, otherwise use objectPath
                         const publicUrl = url ?? objectPath;
                         if (publicUrl) setPaymentProofUrl(publicUrl as string);
                       } catch (err) {
                         console.error("Upload error:", err);
                       }
                     }}
                   />
                   <label htmlFor="payment-proof" className="cursor-pointer bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md">
                     <div className="flex items-center justify-center gap-2">
                       <UploadCloud className="w-4 h-4" />
                       Upload Receipt
                     </div>
                   </label>
                 </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border group">
                  <img src={paymentProofUrl} alt="Payment Proof Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button type="button" variant="destructive" size="sm" onClick={() => setPaymentProofUrl(null)}>Remove Proof</Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Proof uploaded successfully!</span>
                </div>
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
