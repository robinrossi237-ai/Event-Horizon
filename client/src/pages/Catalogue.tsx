import { useState } from "react";
import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/EventCard";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Calendar, Tag, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export default function Catalogue() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000000]); // Max 1,000,000 Fcfa
  
  const { data: events, isLoading, error } = useEvents(search, category !== "all" ? category : undefined);

  const categories = ["Music", "Technology", "Sports", "Arts", "Business", "Food", "Workshop", "Networking"];

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
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const filteredEvents = events?.filter(event => {
    const minEventPrice = Math.min(...event.tickets.map(t => Number(t.price)));
    return minEventPrice >= priceRange[0] && minEventPrice <= priceRange[1];
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 space-y-8">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-primary" />
                Filters
              </h2>
              
              <div className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Event name..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Price Range</Label>
                    <span className="text-xs text-muted-foreground">Fcfa</span>
                  </div>
                  <Slider
                    defaultValue={[0, 1000000]}
                    max={1000000}
                    step={1000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs font-medium">
                    <span>{priceRange[0].toLocaleString()}</span>
                    <span>{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setPriceRange([0, 1000000]);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-display font-bold">Event Catalogue</h1>
              <span className="text-muted-foreground text-sm">{filteredEvents?.length || 0} events found</span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading amazing events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-destructive">
                <p>Failed to load events. Please try again later.</p>
              </div>
            ) : filteredEvents?.length === 0 ? (
              <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">No events match your filters</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter settings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEvents?.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
