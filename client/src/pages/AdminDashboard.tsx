import { Navbar } from "@/components/Navbar";
import { useBookings, useApproveBooking, useRejectBooking } from "@/hooks/use-bookings";
import { useAuth } from "@/hooks/use-auth";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const { user } = useAuth(); // In real app, check if admin
  const { data: bookings, isLoading } = useBookings();
  const approveMutation = useApproveBooking();
  const rejectMutation = useRejectBooking();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Filter only pending bookings for action, show all for history
  const pendingBookings = bookings?.filter(b => b.status === "pending_payment" || b.status === "pending_approval") || [];
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-orange-100 p-2 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage bookings and validate payments.</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold">Pending Approvals ({pendingBookings.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No pending bookings to review. Good job!
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">#{booking.id}</TableCell>
                      <TableCell className="font-medium">{booking.event.title}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs truncate max-w-[100px]" title={booking.userId}>
                        {booking.userId}
                      </TableCell>
                      <TableCell>${Number(booking.totalAmount).toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(booking.createdAt!), "MMM d, HH:mm")}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2">
                              <Eye className="w-3 h-3" /> View Proof
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Payment Proof</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 rounded-lg overflow-hidden border border-border">
                              {booking.paymentProofUrl ? (
                                <img 
                                  src={booking.paymentProofUrl} 
                                  alt="Payment Proof" 
                                  className="w-full h-auto"
                                />
                              ) : (
                                <div className="p-10 text-center text-muted-foreground">No proof uploaded</div>
                              )}
                            </div>
                            <div className="flex justify-end mt-4">
                              <a 
                                href={booking.paymentProofUrl || "#"} 
                                target="_blank" 
                                rel="noreferrer"
                              >
                                <Button variant="secondary" size="sm">
                                  <ExternalLink className="w-4 h-4 mr-2" /> Open Original
                                </Button>
                              </a>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                            onClick={() => approveMutation.mutate(booking.id)}
                            disabled={approveMutation.isPending}
                            title="Approve"
                          >
                            {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={() => rejectMutation.mutate(booking.id)}
                            disabled={rejectMutation.isPending}
                            title="Reject"
                          >
                            {rejectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
