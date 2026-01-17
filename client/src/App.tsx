import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Catalogue from "@/pages/Catalogue";
import EventDetails from "@/pages/EventDetails";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import CreateEvent from "@/pages/CreateEvent";
import TicketView from "@/pages/TicketView";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalogue" component={Catalogue} />
      <Route path="/event/:id" component={EventDetails} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/create-event" component={CreateEvent} />
      <Route path="/ticket/:id" component={TicketView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
