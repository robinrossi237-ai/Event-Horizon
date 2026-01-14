import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useCreateEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { ObjectUploader } from "@/components/ObjectUploader";
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

export default function CreateEvent() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const createEvent = useCreateEvent();
  
  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  const [date, setDate] = useState<Date>();
  const [imageUrl, setImageUrl] = useState<string>("");
  
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
      await createEvent.mutateAsync({
        ...formData,
        date: date.toISOString(),
        imageUrl,
        tickets: tickets.map(t => ({
          name: t.name,
          price: t.price, // API schema expects numeric string
          quantity: parseInt(t.quantity),
          eventId: 0 // placeholder
        }))
      });
      setLocation("/");
    } catch (err) {
      // Handled by hook
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Create New Event</h1>
          <p className="text-muted-foreground">Fill in the details to publish your event.</p>
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
                  <Input 
                    id="category" 
                    placeholder="e.g. Music, Tech, Art" 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    required
                  />
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
                {imageUrl ? (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border group">
                    <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="sm" onClick={() => setImageUrl("")}>Remove Image</Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:bg-secondary/10 transition-colors">
                    <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">Upload a high quality image for your event page.</p>
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
                          setImageUrl(result.successful[0].uploadURL);
                        }
                      }}
                      buttonClassName="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                      Choose Image
                    </ObjectUploader>
                  </div>
                )}
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
                    <Label>Price ($)</Label>
                    <Input 
                      type="number"
                      value={ticket.price}
                      onChange={e => updateTicket(index, "price", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
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
              disabled={createEvent.isPending || !imageUrl}
            >
              {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Publish Event
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
