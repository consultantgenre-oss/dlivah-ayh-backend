import { useState } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Book from "@/pages/Book";
import DriverPortal from "@/pages/DriverPortal";
import Foundation from "@/pages/Foundation";
import Join from "@/pages/Join";
import Pricing from "@/pages/Pricing";
import CustomerThread from "@/pages/CustomerThread";
import MemberDashboard from "@/pages/MemberDashboard";
import NotFound from "@/pages/not-found";

function App() {
  // Auth state — driverId=null means owner (PIN auth), driverId=number means a registered partial driver
  const [driverAuthed, setDriverAuthed] = useState(false);
  const [authedDriverId, setAuthedDriverId] = useState<number | null>(null);

  const handleAuth = (driverId?: number) => {
    setDriverAuthed(true);
    setAuthedDriverId(driverId ?? null); // null = owner/PIN, number = partial driver
  };

  const handleLogout = () => {
    setDriverAuthed(false);
    setAuthedDriverId(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/book" component={Book} />
          <Route path="/join" component={Join} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/driver">
            {() => <DriverPortal authed={driverAuthed} driverId={authedDriverId} onAuth={handleAuth} onLogout={handleLogout} />}
          </Route>
          <Route path="/foundation" component={Foundation} />
          <Route path="/messages/:id" component={CustomerThread} />
          <Route path="/member/:id" component={MemberDashboard} />
          <Route path="/member" component={MemberDashboard} />
          <Route component={NotFound} />
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
