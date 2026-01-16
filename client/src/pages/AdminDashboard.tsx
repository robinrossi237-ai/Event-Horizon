import { Navbar } from "@/components/Navbar";
import { useBookings, useApproveBooking, useRejectBooking } from "@/hooks/use-bookings";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ExternalLink,
  ShieldCheck,
  Users,
  Calendar,
  History,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDashboard() {
  const [historySearch, setHistorySearch] = useState("all");
  const { user, isLoading: authLoading } = useAuth();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const approveMutation = useApproveBooking();
  const rejectMutation = useRejectBooking();

  const { data: adminUsers, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  const { data: adminEvents, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/events"],
    enabled: !!user?.isAdmin,
  });

  if (authLoading || bookingsLoading || usersLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-10 text-center">
        <XCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have administrative privileges to access this page.</p>
        <Button className="mt-6" onClick={() => window.location.href = "/"}>Return Home</Button>
      </div>
    );
  }

  const pendingBookings = bookings?.filter(b => b.status === "pending_approval") || [];
  const processedBookings = (bookings?.filter(b => b.status === "approved" || b.status === "rejected") || [])
    .filter(b => historySearch === "all" || b.eventId === Number(historySearch));
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-orange-100 p-2 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, events, and bookings.</p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg gap-2">
              <Clock className="w-4 h-4" /> Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-2">
              <History className="w-4 h-4" /> History
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg gap-2">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg gap-2">
              <Calendar className="w-4 h-4" /> Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">Pending Approvals</h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
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
                          No pending bookings to review.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingBookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-xs">#{booking.id}</TableCell>
                          <TableCell className="font-medium">{booking.event?.title || "Unknown Event"}</TableCell>
                          <TableCell>{booking.user?.email || booking.userId}</TableCell>
                          <TableCell>{Number(booking.totalAmount).toLocaleString()} Fcfa</TableCell>
                          <TableCell>{booking.createdAt ? format(new Date(booking.createdAt), "MMM d, HH:mm") : "N/A"}</TableCell>
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
                                    <img src={booking.paymentProofUrl} alt="Proof" className="w-full h-auto" />
                                  ) : (
                                    <div className="p-10 text-center text-muted-foreground">No proof uploaded</div>
                                  )}
                                </div>
                                <div className="flex justify-end mt-4">
                                  <a href={booking.paymentProofUrl || "#"} target="_blank" rel="noreferrer">
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
                                className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                                onClick={() => approveMutation.mutate(booking.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={() => rejectMutation.mutate(booking.id)}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="w-4 h-4" />
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
          </TabsContent>

          <TabsContent value="history">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Processed Bookings</h2>
                <div className="w-full sm:w-64">
                  <Select value={historySearch} onValueChange={setHistorySearch}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {adminEvents?.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No booking history found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      processedBookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-xs">#{booking.id}</TableCell>
                          <TableCell className="font-medium">{booking.event?.title || "Unknown Event"}</TableCell>
                          <TableCell>{booking.user?.email || booking.userId}</TableCell>
                          <TableCell>{Number(booking.totalAmount).toLocaleString()} Fcfa</TableCell>
                          <TableCell>
                            <Badge variant={booking.status === "approved" ? "default" : "destructive"} className={booking.status === "approved" ? "bg-green-100 text-green-700 border-green-200" : ""}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{booking.createdAt ? format(new Date(booking.createdAt), "MMM d, HH:mm") : "N/A"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">System Users</h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs truncate max-w-[150px]">{u.id}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          {u.isAdmin ? (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">Admin</Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold">All Events</h2>
                <Button onClick={() => window.location.href = "/create-event"}>Create New</Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Tickets</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminEvents?.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.title}</TableCell>
                        <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                        <TableCell>{format(new Date(e.date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{e.tickets?.length || 0} types</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
