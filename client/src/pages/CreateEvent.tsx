import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useCreateEvent, useEvent, useUpdateEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
// We'll use a simple multipart upload for admin image uploads
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, MapPin, Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  "Music",
  "Technology",
  "Arts",
  "Sports",
  "Food",
  "Networking",
  "Workshop",
  "Other"
];

export default function CreateEvent() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  
  const [date, setDate] = useState<Date>();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "",
    organizerId: "current-user", // Backend handles this
  });

  const [tickets, setTickets] = useState([
    { name: "General Admission", price: "0", quantity: "100" }
  ]);

  // Edit mode: check query param ?id=
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const editingId = params?.get("id") ? Number(params.get("id")) : undefined;
  const { data: existingEvent, isLoading: existingLoading } = useEvent(editingId);

  // Populate form when editing event data loads
  useEffect(() => {
    if (!existingEvent || !editingId) return;
    setFormData({
      title: existingEvent.title,
      description: existingEvent.description,
      location: existingEvent.location,
      category: existingEvent.category,
      organizerId: existingEvent.organizerId ?? "current-user",
    });
    setDate(new Date(existingEvent.date));
    setImageUrl(existingEvent.imageUrl || "");
    setTickets((existingEvent.tickets || []).map((t: any) => ({ name: t.name, price: String(t.price), quantity: String(t.available || t.quantity || 0) })));
  }, [existingEvent, editingId]);

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  if (!user.isAdmin) {
    setLocation("/");
    return null;
  }

  const isEditing = typeof editingId === "number" && !isNaN(editingId);

  const addTicket = () => {
    setTickets([...tickets, { name: "", price: "0", quantity: "0" }]);
  };

  const removeTicket = (index: number) => {
    setTickets(tickets.filter((_, i) => i !== index));
  };

  const updateTicket = (index: number, field: string, value: string) => {
    const newTickets = [...tickets];
    newTickets[index] = { ...newTickets[index], [field]: value };
    setTickets(newTickets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !imageUrl) return;

    try {
      if (editingId) {
        await updateEvent.mutateAsync({ id: editingId, data: {
          ...formData,
          date: date.toISOString() as any,
          imageUrl,
          tickets: tickets.map(t => ({ name: t.name, price: t.price, quantity: parseInt(t.quantity), eventId: 0 }))
        } });
      } else {
        await createEvent.mutateAsync({
          ...formData,
          date: date.toISOString() as any,
          imageUrl,
          tickets: tickets.map(t => ({
            name: t.name,
            price: t.price, // API schema expects numeric string
            quantity: parseInt(t.quantity),
            eventId: 0 // placeholder
          }))
        });
      }
      if (editingId) {
        setLocation(`/event/${editingId}`);
      } else {
        setLocation("/");
      }
    } catch (err) {
      // Handled by hook
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">{isEditing ? "Edit Event" : "Create New Event"}</h1>
          <p className="text-muted-foreground">{isEditing ? "Modify the event details and save changes." : "Fill in the details to publish your event."}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Summer Music Festival 2024" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={value => setFormData({...formData, category: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="location" 
                    className="pl-9"
                    placeholder="Venue name or address" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Tell people what your event is about..." 
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Event Cover Image</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-secondary/10 transition-colors">
                  {imageUrl ? (
                    <div className="space-y-4">
                      <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden border border-border group">
                        <img src={imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" variant="destructive" size="sm" onClick={() => setImageUrl("")}>Remove Image</Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Image selected successfully</p>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">Upload a high quality image for your event page.</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploading(true);
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/uploads", {
                          method: "POST",
                          body: fd,
                          credentials: "include",
                        });
                        if (!res.ok) throw new Error("Upload failed");
                        const body = await res.json();
                        const publicUrl = body.url || body.objectPath;
                        if (publicUrl) setImageUrl(publicUrl);
                      } catch (err) {
                        console.error("Upload error:", err);
                      } finally {
                        setUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }
                    }}
                  />

                  {!imageUrl && (
                    <div>
                      <Button
                        type="button"
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                          {uploading ? "Uploading..." : "Choose Image"}
                        </div>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Ticket Types</h2>
            {tickets.map((ticket, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Ticket Name</Label>
                    <Input 
                      value={ticket.name}
                      onChange={e => updateTicket(index, "name", e.target.value)}
                      placeholder="e.g. VIP"
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Price (Fcfa)</Label>
                    <Input 
                      type="number"
                      value={ticket.price}
                      onChange={e => updateTicket(index, "price", e.target.value)}
                      placeholder="0"
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      type="number"
                      value={ticket.quantity}
                      onChange={e => updateTicket(index, "quantity", e.target.value)}
                      placeholder="100"
                      min="1"
                      required
                    />
                  </div>
                  {tickets.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10 mb-0.5"
                      onClick={() => removeTicket(index)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={addTicket} className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Add Ticket Type
            </Button>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={() => setLocation("/")}>Cancel</Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white min-w-[200px]"
              disabled={(isEditing ? updateEvent.isPending : createEvent.isPending) || !imageUrl}
            >
              {(isEditing ? updateEvent.isPending : createEvent.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditing ? "Save Changes" : "Publish Event"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
